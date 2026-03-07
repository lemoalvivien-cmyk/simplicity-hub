/**
 * openclaw-scheduler
 * ──────────────────
 * Autonomous scheduler: claims due jobs from openclaw_job_queue,
 * executes them via openclaw-job-executor, handles retries and backoff.
 *
 * Invoked by:
 *   - pg_cron every 5 minutes
 *   - Manual trigger from Operations UI
 *
 * Flow per tick:
 *   1. Expire stale locks
 *   2. Re-queue ready retries
 *   3. Claim up to N pending jobs (priority-ordered)
 *   4. Execute each via job-executor
 *   5. Mark done / failed with backoff
 *   6. Write heartbeat
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_JOBS_PER_TICK = 5;
const LOCK_OWNER = "scheduler-v1";
const LOCK_TIMEOUT_SECS = 300;

interface SchedulerRequest {
  user_id?: string;     // optional: restrict to one user (manual trigger)
  max_jobs?: number;    // optional override
  dry_run?: boolean;    // claim but don't execute
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl   = Deno.env.get("SUPABASE_URL")!;
    const serviceKey    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey       = Deno.env.get("SUPABASE_ANON_KEY")!;

    const svc = createClient(supabaseUrl, serviceKey);

    // Auth: accept both user JWT and service-role (cron) requests
    const authHeader = req.headers.get("Authorization") || "";
    let requestUserId: string | null = null;

    if (authHeader && authHeader !== `Bearer ${anonKey}`) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      requestUserId = user?.id || null;
    }

    let body: SchedulerRequest = {};
    try { body = await req.json(); } catch { /* cron may send empty body */ }

    const targetUserId = body.user_id || requestUserId;
    const maxJobs = body.max_jobs || MAX_JOBS_PER_TICK;
    const dryRun  = body.dry_run || false;

    // Determine which users to process
    let userIds: string[] = [];

    if (targetUserId) {
      userIds = [targetUserId];
    } else {
      // Service-role invocation (cron): get all users with pending jobs
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

    let totalClaimed = 0;
    let totalCompleted = 0;
    let totalFailed = 0;
    const results: unknown[] = [];

    for (const userId of userIds) {
      let claimed = 0;
      let completed = 0;
      let failed = 0;

      // Count due jobs for heartbeat
      const { count: dueCount } = await svc
        .from("openclaw_job_queue")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "pending")
        .lte("scheduled_at", new Date().toISOString());

      // Process up to maxJobs for this user
      for (let i = 0; i < maxJobs; i++) {
        // Claim one job atomically
        const { data: claimData, error: claimErr } = await svc.rpc("claim_next_job", {
          p_user_id: userId,
          p_lock_owner: LOCK_OWNER,
          p_lock_timeout: LOCK_TIMEOUT_SECS,
        });

        if (claimErr || !claimData || claimData.length === 0) {
          break; // No more due jobs
        }

        const job = claimData[0];
        claimed++;

        if (dryRun) {
          results.push({ job_id: job.job_id, job_type: job.job_type, status: "claimed_dry_run" });
          continue;
        }

        // ── Execute via job-executor ────────────────────────────────────
        try {
          // Build auth token: use service key for scheduled execution
          const execResponse = await fetch(
            `${supabaseUrl}/functions/v1/openclaw-job-executor`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${serviceKey}`,
                "x-scheduler-user-id": userId, // pass user_id explicitly for service-role exec
              },
              body: JSON.stringify({
                job_type: job.job_type,
                queue_job_id: job.job_id,
                session_id: (job.queue_row as Record<string, unknown>)?.session_id || null,
                trigger_source: job.trigger_source || "scheduled",
                source_event: job.source_event || null,
                _scheduled_user_id: userId,
              }),
            }
          );

          if (execResponse.ok) {
            const execResult = await execResponse.json() as {
              status?: string;
              output_summary?: string;
              output_count?: number;
              execution_id?: string;
            };

            await svc.rpc("complete_queue_job", {
              p_job_id: job.job_id,
              p_status: execResult.status === "termine" ? "done" : "failed",
              p_output_summary: execResult.output_summary || null,
              p_output_count: execResult.output_count || 0,
              p_error_summary: execResult.status !== "termine" ? (execResult.output_summary || "Échec d'exécution") : null,
              p_execution_id: execResult.execution_id || null,
              p_retry_backoff_mins: 15,
            });

            if (execResult.status === "termine") {
              completed++;
            } else {
              failed++;
            }

            results.push({
              job_id: job.job_id,
              job_type: job.job_type,
              status: execResult.status === "termine" ? "done" : "failed",
              output_count: execResult.output_count,
              trigger: job.trigger_source,
            });
          } else {
            const errText = await execResponse.text();
            await svc.rpc("complete_queue_job", {
              p_job_id: job.job_id,
              p_status: "failed",
              p_output_summary: null,
              p_output_count: 0,
              p_error_summary: `HTTP ${execResponse.status}: ${errText.slice(0, 200)}`,
              p_execution_id: null,
              p_retry_backoff_mins: 15,
            });
            failed++;
          }
        } catch (execErr) {
          await svc.rpc("complete_queue_job", {
            p_job_id: job.job_id,
            p_status: "failed",
            p_output_summary: null,
            p_output_count: 0,
            p_error_summary: String(execErr).slice(0, 500),
            p_execution_id: null,
            p_retry_backoff_mins: 15,
          });
          failed++;
        }
      }

      // Write heartbeat for this user
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
        note: dryRun ? "dry_run" : null,
      });

      // Clean up old heartbeats (keep 48h)
      await svc.from("openclaw_scheduler_heartbeats")
        .delete()
        .eq("user_id", userId)
        .lt("beat_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

      totalClaimed   += claimed;
      totalCompleted += completed;
      totalFailed    += failed;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        users_processed: userIds.length,
        jobs_claimed: totalClaimed,
        jobs_completed: totalCompleted,
        jobs_failed: totalFailed,
        dry_run: dryRun,
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
