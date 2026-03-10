/**
 * openclaw-event-bus
 * ──────────────────
 * SECURITY HARDENED v2:
 *   - user JWT can ONLY enqueue jobs for its own user_id
 *   - service_role can pass body.user_id to target any user
 *   - body.user_id from a non-service-role call is SILENTLY IGNORED
 *   - daily_sweep / weekly_sweep broadcast only allowed for service_role
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

interface BusEvent {
  event_type: string;
  entity_id?: string;
  entity_type?: string;
  user_id?: string;
  context?: Record<string, unknown>;
}

const EVENT_JOB_MAP: Record<string, Array<{
  job_type: string;
  priority: "critique" | "haute" | "normale" | "basse";
  delay_minutes: number;
  dedup_minutes: number;
  requires_approval?: boolean;
}>> = {
  mission_created: [
    { job_type: "radar_scan",              priority: "haute",    delay_minutes: 5,  dedup_minutes: 60 },
    { job_type: "facilitator_match_refresh", priority: "normale", delay_minutes: 10, dedup_minutes: 60 },
    { job_type: "daily_brief_generate",    priority: "basse",   delay_minutes: 15, dedup_minutes: 120 },
  ],
  mission_updated: [
    { job_type: "radar_scan",              priority: "normale", delay_minutes: 5,  dedup_minutes: 60 },
  ],
  offer_created: [
    { job_type: "passive_offer_refresh",   priority: "haute",   delay_minutes: 5,  dedup_minutes: 60 },
    { job_type: "passive_alert_digest",    priority: "normale", delay_minutes: 20, dedup_minutes: 120 },
  ],
  offer_updated: [
    { job_type: "passive_offer_refresh",   priority: "normale", delay_minutes: 10, dedup_minutes: 60 },
  ],
  introduction_created: [
    { job_type: "next_best_action_generate", priority: "normale", delay_minutes: 2, dedup_minutes: 30 },
  ],
  introduction_stuck: [
    { job_type: "stuck_pipeline_recheck",  priority: "haute",   delay_minutes: 0,  dedup_minutes: 120 },
    { job_type: "approval_reminder",       priority: "haute",   delay_minutes: 5,  dedup_minutes: 120 },
  ],
  introduction_validee: [
    { job_type: "hot_opportunity_rescore", priority: "haute",   delay_minutes: 2,  dedup_minutes: 30 },
    { job_type: "trust_recompute",         priority: "normale", delay_minutes: 5,  dedup_minutes: 60 },
  ],
  gain_confirme: [
    { job_type: "trust_recompute",         priority: "haute",   delay_minutes: 1,  dedup_minutes: 30 },
    { job_type: "daily_brief_generate",    priority: "basse",   delay_minutes: 30, dedup_minutes: 120 },
  ],
  litige_ouvert: [
    { job_type: "trust_recompute",         priority: "critique", delay_minutes: 0,  dedup_minutes: 15 },
    { job_type: "approval_reminder",       priority: "critique", delay_minutes: 0,  dedup_minutes: 15 },
  ],
  opportunity_hot: [
    { job_type: "hot_opportunity_rescore", priority: "haute",   delay_minutes: 0,  dedup_minutes: 30 },
    { job_type: "next_best_action_generate", priority: "haute", delay_minutes: 2,  dedup_minutes: 30 },
  ],
  passive_signal: [
    { job_type: "passive_alert_digest",    priority: "normale", delay_minutes: 5,  dedup_minutes: 60 },
    { job_type: "passive_offer_refresh",   priority: "normale", delay_minutes: 10, dedup_minutes: 60 },
  ],
  validation_overdue: [
    { job_type: "approval_reminder",       priority: "haute",   delay_minutes: 0,  dedup_minutes: 60 },
  ],
  facilitator_missing: [
    { job_type: "facilitator_match_refresh", priority: "haute", delay_minutes: 0,  dedup_minutes: 60 },
  ],
  // Broadcast events — service_role ONLY
  daily_sweep: [
    { job_type: "radar_scan",              priority: "normale", delay_minutes: 0,  dedup_minutes: 60 },
    { job_type: "daily_brief_generate",    priority: "normale", delay_minutes: 5,  dedup_minutes: 180 },
    { job_type: "approval_reminder",       priority: "normale", delay_minutes: 10, dedup_minutes: 180 },
    { job_type: "passive_alert_digest",    priority: "basse",   delay_minutes: 15, dedup_minutes: 180 },
    { job_type: "stuck_pipeline_recheck",  priority: "basse",   delay_minutes: 20, dedup_minutes: 180 },
  ],
  weekly_sweep: [
    { job_type: "trust_recompute",         priority: "normale", delay_minutes: 0,   dedup_minutes: 10080 },
    { job_type: "facilitator_match_refresh", priority: "basse", delay_minutes: 30,  dedup_minutes: 10080 },
    { job_type: "hot_opportunity_rescore", priority: "normale", delay_minutes: 60,  dedup_minutes: 10080 },
  ],
};

// Broadcast events require service_role — user JWTs cannot trigger them
const BROADCAST_EVENTS = new Set(["daily_sweep", "weekly_sweep"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")!;

    const svc = createClient(supabaseUrl, serviceKey);

    // ── Resolve caller identity ───────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") || "";
    const isServiceRole = authHeader === `Bearer ${serviceKey}`;
    let jwtUserId: string | null = null;

    if (!isServiceRole && authHeader && authHeader !== `Bearer ${anonKey}`) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      jwtUserId = user?.id || null;
    }

    const body: BusEvent = await req.json();
    const { event_type, entity_id, entity_type, context } = body;

    // ── SECURITY GUARD: user_id spoofing prevention ───────────────────────────
    // Service_role: can pass body.user_id to target any user (pg_cron use case)
    // User JWT: body.user_id is IGNORED — only their own jwtUserId is used
    const targetUserId = isServiceRole ? (body.user_id || null) : jwtUserId;

    if (!event_type) {
      return new Response(
        JSON.stringify({ error: "Missing event_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Block broadcast events from user JWTs
    if (BROADCAST_EVENTS.has(event_type) && !isServiceRole) {
      return new Response(
        JSON.stringify({ error: "Broadcast events require service_role authorization" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jobDefs = EVENT_JOB_MAP[event_type];
    if (!jobDefs || jobDefs.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, enqueued: 0, note: "No jobs mapped for this event" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Resolve target users ──────────────────────────────────────────────────
    let userIds: string[] = [];
    if (targetUserId) {
      userIds = [targetUserId];
    } else if (BROADCAST_EVENTS.has(event_type)) {
      // Only reachable by service_role (checked above)
      const { data: configs } = await svc
        .from("openclaw_config")
        .select("user_id")
        .eq("kill_switch_global", false)
        .limit(200);
      userIds = (configs || []).map((c: { user_id: string }) => c.user_id);
    }

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, enqueued: 0, note: "No target users resolved" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalEnqueued = 0;
    const enqueuedJobs: unknown[] = [];

    for (const uid of userIds) {
      const { data: config } = await svc
        .from("openclaw_config")
        .select("kill_switch_global")
        .eq("user_id", uid)
        .maybeSingle();

      if (config?.kill_switch_global) continue;

      for (const jobDef of jobDefs) {
        const scheduledAt = new Date(Date.now() + jobDef.delay_minutes * 60 * 1000).toISOString();

        const { data: queueId, error: enqErr } = await svc.rpc("enqueue_job", {
          p_user_id: uid,
          p_job_type: jobDef.job_type,
          p_priority: jobDef.priority,
          p_trigger_source: "event",
          p_source_event: event_type,
          p_source_entity_id: entity_id || null,
          p_source_entity_type: entity_type || null,
          p_scheduled_at: scheduledAt,
          p_max_retries: 3,
          p_requires_approval: jobDef.requires_approval || false,
          p_dedup_minutes: jobDef.dedup_minutes,
        });

        if (!enqErr && queueId) {
          totalEnqueued++;
          enqueuedJobs.push({
            user_id: uid,
            job_type: jobDef.job_type,
            priority: jobDef.priority,
            scheduled_at: scheduledAt,
            queue_id: queueId,
          });
        }
      }
    }

    if (totalEnqueued > 0 && targetUserId) {
      await svc.from("openclaw_logs").insert({
        user_id: targetUserId,
        event_type: `event_bus_${event_type}`,
        summary: `${totalEnqueued} job${totalEnqueued > 1 ? "s" : ""} mis en file suite à l'événement "${event_type}".`,
        details: { event_type, entity_id, entity_type, context, jobs_enqueued: enqueuedJobs },
        risque: "faible",
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        event_type,
        users_targeted: userIds.length,
        enqueued: totalEnqueued,
        jobs: enqueuedJobs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Event bus error:", err);
    return new Response(
      JSON.stringify({ error: "Event bus error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
