/**
 * openclaw-scheduler
 * ──────────────────
 * SECURITY HARDENED v2:
 *   - user JWT can ONLY target its own user_id
 *   - service_role (pg_cron) may pass body.user_id to target any user
 *   - body.user_id from a non-service-role call is SILENTLY IGNORED (uses JWT userId)
 *
 * Invoked by:
 *   - pg_cron every 5 minutes  (jobid:4 openclaw-scheduler-tick)
 *   - pg_cron daily at 07:00   (jobid:5 openclaw-daily-sweep)
 *   - pg_cron weekly monday 06 (jobid:6 openclaw-weekly-sweep)
 *   - Manual trigger from Operations UI (user JWT)
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const MAX_JOBS_PER_TICK = 5;
const LOCK_OWNER = "scheduler-v1";
const LOCK_TIMEOUT_SECS = 300;

interface SchedulerRequest {
  user_id?: string;
  max_jobs?: number;
  dry_run?: boolean;
  run_key?: string;
  trigger_source?: string;
}

function computeNextRun(runKey: string): string | null {
  const now = new Date();
  switch (runKey) {
    case "scheduler_tick": {
      const mins = now.getMinutes();
      const nextMins = Math.ceil((mins + 1) / 5) * 5;
      const next = new Date(now);
      next.setMinutes(nextMins, 0, 0);
      return next.toISOString();
    }
    case "daily_sweep": {
      const next = new Date(now);
      next.setUTCHours(7, 0, 0, 0);
      if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
      return next.toISOString();
    }
    case "weekly_sweep": {
      const next = new Date(now);
      const daysUntilMonday = (8 - next.getUTCDay()) % 7 || 7;
      next.setUTCDate(next.getUTCDate() + daysUntilMonday);
      next.setUTCHours(6, 0, 0, 0);
      return next.toISOString();
    }
    default:
      return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const tickStart = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")!;

    const svc = createClient(supabaseUrl, serviceKey);

    // ── Auth ─────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isServiceRole = authHeader === `Bearer ${serviceKey}`;
    let requestUserId: string | null = null;

    if (!isServiceRole) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authErr } = await userClient.auth.getUser();
      if (authErr || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      requestUserId = user.id;
    }

    let body: SchedulerRequest = {};
    try { body = await req.json(); } catch { /* cron may send empty body */ }

    // ── SECURITY GUARD: user_id override only allowed for service_role ────────
    // A non-service-role JWT CANNOT target another user's jobs via body.user_id.
    // If they attempt it, body.user_id is IGNORED — only their own ID is used.
    let targetUserId: string | null;
    if (isServiceRole) {
      // pg_cron / internal: may specify a target user_id or null (= all users)
      targetUserId = body.user_id || null;
    } else {
      // User JWT: ALWAYS their own user_id. body.user_id is IGNORED.
      targetUserId = requestUserId;
    }

    const maxJobs        = body.max_jobs || MAX_JOBS_PER_TICK;
    const dryRun         = body.dry_run || false;
    const runKey         = body.run_key || (targetUserId ? "manual_trigger" : "scheduler_tick");
    const triggerSource  = body.trigger_source || (targetUserId ? "manual" : "cron");

    // ── Write scheduled_run START row ─────────────────────────────────────────
    const { data: runRow } = await svc
      .from("openclaw_scheduled_runs")
      .insert({
        user_id: targetUserId || null,
        run_key: runKey,
        trigger_source: triggerSource,
        status: "running",
        jobs_enqueued: 0,
        jobs_claimed: 0,
        jobs_completed: 0,
        jobs_failed: 0,
        next_run_at: computeNextRun(runKey),
      })
      .select("id")
      .single();

    const scheduledRunId = runRow?.id || null;

    // ── Determine which users to process ─────────────────────────────────────
    let userIds: string[] = [];

    if (targetUserId) {
      userIds = [targetUserId];
    } else {
      // Service role only: fetch all pending users
      const { data: pendingUsers } = await svc
        .from("openclaw_job_queue")
        .select("user_id")
        .eq("status", "pending")
        .lte("scheduled_at", new Date().toISOString())
        .limit(50);

      if (pendingUsers) {
        userIds = [...new Set(pendingUsers.map((r: { user_id: string }) => r.user_id))];
      }
    }

    let totalClaimed   = 0;
    let totalCompleted = 0;
    let totalFailed    = 0;
    const results: unknown[] = [];

    for (const userId of userIds) {
      let claimed = 0, completed = 0, failed = 0;

      const { count: dueCount } = await svc
        .from("openclaw_job_queue")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "pending")
        .lte("scheduled_at", new Date().toISOString());

      for (let i = 0; i < maxJobs; i++) {
        const { data: claimData, error: claimErr } = await svc.rpc("claim_next_job", {
          p_user_id: userId,
          p_lock_owner: LOCK_OWNER,
          p_lock_timeout: LOCK_TIMEOUT_SECS,
        });

        if (claimErr || !claimData || claimData.length === 0) break;

        const job = claimData[0];
        claimed++;

        if (dryRun) {
          results.push({ job_id: job.job_id, job_type: job.job_type, status: "claimed_dry_run" });
          continue;
        }

        try {
          const execResponse = await fetch(
            `${supabaseUrl}/functions/v1/openclaw-job-executor`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${serviceKey}`,
                "x-scheduler-user-id": userId,
              },
              body: JSON.stringify({
                job_type: job.job_type,
                queue_job_id: job.job_id,
                session_id: (job.queue_row as Record<string, unknown>)?.session_id || null,
                trigger_source: triggerSource,
                source_event: job.source_event || null,
                _scheduled_user_id: userId,
              }),
            }
          );

          if (execResponse.ok) {
            const execResult = await execResponse.json() as {
              status?: string; output_summary?: string;
              output_count?: number; execution_id?: string;
            };
            await svc.rpc("complete_queue_job", {
              p_job_id: job.job_id,
              p_status: execResult.status === "termine" ? "done" : "failed",
              p_output_summary: execResult.output_summary || null,
              p_output_count: execResult.output_count || 0,
              p_error_summary: execResult.status !== "termine" ? (execResult.output_summary || "Échec") : null,
              p_execution_id: execResult.execution_id || null,
              p_retry_backoff_mins: 15,
            });
            if (execResult.status === "termine") { completed++; }
            else { failed++; }
            results.push({
              job_id: job.job_id, job_type: job.job_type,
              status: execResult.status === "termine" ? "done" : "failed",
              output_count: execResult.output_count,
            });
          } else {
            const errText = await execResponse.text();
            await svc.rpc("complete_queue_job", {
              p_job_id: job.job_id, p_status: "failed",
              p_output_summary: null, p_output_count: 0,
              p_error_summary: `HTTP ${execResponse.status}: ${errText.slice(0, 200)}`,
              p_execution_id: null, p_retry_backoff_mins: 15,
            });
            failed++;
          }
        } catch (execErr) {
          await svc.rpc("complete_queue_job", {
            p_job_id: job.job_id, p_status: "failed",
            p_output_summary: null, p_output_count: 0,
            p_error_summary: String(execErr).slice(0, 500),
            p_execution_id: null, p_retry_backoff_mins: 15,
          });
          failed++;
        }
      }

      const engineStatus =
        failed > 0 && completed === 0 ? "error"
        : failed > 0 ? "degraded"
        : claimed === 0 ? "idle"
        : "ok";

      await svc.from("openclaw_scheduler_heartbeats").insert({
        user_id: userId,
        jobs_claimed: claimed,
        jobs_completed: completed,
        jobs_failed: failed,
        jobs_due: dueCount || 0,
        engine_status: engineStatus,
        note: dryRun ? "dry_run" : `run_key:${runKey}`,
      });

      await svc.from("openclaw_scheduler_heartbeats")
        .delete()
        .eq("user_id", userId)
        .lt("beat_at", new Date(Date.now() - 48 * 3600 * 1000).toISOString());

      totalClaimed   += claimed;
      totalCompleted += completed;
      totalFailed    += failed;
    }

    if (triggerSource === "cron" || runKey === "smoke_test") {
      await svc.from("openclaw_scheduler_heartbeats").insert({
        user_id: null,
        jobs_claimed: totalClaimed,
        jobs_completed: totalCompleted,
        jobs_failed: totalFailed,
        jobs_due: userIds.length,
        engine_status: totalFailed > 0 && totalCompleted === 0 ? "error"
          : totalFailed > 0 ? "degraded"
          : "idle",
        note: `${runKey} | users:${userIds.length} | trigger:${triggerSource}`,
      });
    }

    if (scheduledRunId) {
      await svc.from("openclaw_scheduled_runs").update({
        status: totalFailed > 0 && totalCompleted === 0 ? "failed" : "done",
        jobs_claimed: totalClaimed,
        jobs_completed: totalCompleted,
        jobs_failed: totalFailed,
        ended_at: new Date().toISOString(),
        duration_ms: Date.now() - tickStart,
        error_detail: totalFailed > 0 ? `${totalFailed} job(s) failed` : null,
      }).eq("id", scheduledRunId);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        run_id: scheduledRunId,
        run_key: runKey,
        trigger_source: triggerSource,
        users_processed: userIds.length,
        jobs_claimed: totalClaimed,
        jobs_completed: totalCompleted,
        jobs_failed: totalFailed,
        dry_run: dryRun,
        duration_ms: Date.now() - tickStart,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Scheduler error:", err);
    return new Response(
      JSON.stringify({ error: "Scheduler error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
