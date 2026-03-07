/**
 * useOpenClawScheduler
 * ────────────────────
 * Loads job queue state + scheduler heartbeats.
 * Exposes:
 *   - queue items (pending/running/failed/done)
 *   - heartbeats
 *   - triggerScheduler() — manual tick
 *   - enqueueEvent()     — fire an event bus event
 *   - engine health metrics
 */
import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type QueueStatus = "pending" | "locked" | "running" | "done" | "failed" | "cancelled" | "waiting_approval";
export type JobPriority  = "critique" | "haute" | "normale" | "basse";

export interface QueueJob {
  id: string;
  job_type: string;
  priority: JobPriority;
  trigger_source: string;
  source_event: string | null;
  source_entity_id: string | null;
  source_entity_type: string | null;
  status: QueueStatus;
  scheduled_at: string;
  locked_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  requires_approval: boolean;
  error_summary: string | null;
  output_summary: string | null;
  output_count: number;
  created_at: string;
}

export interface SchedulerHeartbeat {
  id: string;
  beat_at: string;
  jobs_claimed: number;
  jobs_completed: number;
  jobs_failed: number;
  jobs_due: number;
  engine_status: "ok" | "degraded" | "idle" | "error";
  note: string | null;
}

export const PRIORITY_META: Record<JobPriority, { label: string; color: string; badge: string }> = {
  critique: { label: "Critique",  color: "hsl(0 65% 40%)",              badge: "🔴" },
  haute:    { label: "Haute",     color: "hsl(24 100% 45%)",            badge: "🟠" },
  normale:  { label: "Normale",   color: "hsl(218 72% 55%)",            badge: "🔵" },
  basse:    { label: "Basse",     color: "hsl(var(--muted-foreground))", badge: "⚪" },
};

export const TRIGGER_SOURCE_META: Record<string, { label: string; icon: string }> = {
  scheduled: { label: "Planifié",              icon: "🕐" },
  event:     { label: "Déclenché automatiquement", icon: "⚡" },
  manual:    { label: "Manuel",               icon: "👆" },
  retry:     { label: "Relancé",              icon: "🔄" },
};

export const QUEUE_STATUS_META: Record<QueueStatus, { label: string; color: string }> = {
  pending:           { label: "En attente",         color: "hsl(218 72% 55%)" },
  locked:            { label: "Réclamé",             color: "hsl(38 80% 40%)" },
  running:           { label: "En cours",            color: "hsl(var(--success))" },
  done:              { label: "Terminé",             color: "hsl(var(--success))" },
  failed:            { label: "Échoué",              color: "hsl(0 65% 40%)" },
  cancelled:         { label: "Annulé",              color: "hsl(var(--muted-foreground))" },
  waiting_approval:  { label: "Attend accord",       color: "hsl(38 80% 40%)" },
};

export function useOpenClawScheduler() {
  const { user } = useAuth();
  const [queue, setQueue]           = useState<QueueJob[]>([]);
  const [heartbeats, setHeartbeats] = useState<SchedulerHeartbeat[]>([]);
  const [loading, setLoading]       = useState(true);
  const [triggering, setTriggering] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user) return;

    const [queueRes, beatsRes] = await Promise.all([
      db.from("openclaw_job_queue")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      db.from("openclaw_scheduler_heartbeats")
        .select("*")
        .eq("user_id", user.id)
        .order("beat_at", { ascending: false })
        .limit(20),
    ]);

    setQueue((queueRes.data as QueueJob[]) || []);
    setHeartbeats((beatsRes.data as SchedulerHeartbeat[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Manual scheduler tick ──────────────────────────────────────────────────
  const triggerScheduler = useCallback(async (dryRun = false): Promise<{
    ok: boolean; claimed: number; completed: number; failed: number; error?: string;
  }> => {
    if (!user) return { ok: false, claimed: 0, completed: 0, failed: 0, error: "Non authentifié" };

    setTriggering(true);
    try {
      const { data: sessionData } = await db.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { setTriggering(false); return { ok: false, claimed: 0, completed: 0, failed: 0, error: "Session expirée" }; }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/openclaw-scheduler`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ user_id: user.id, dry_run: dryRun }),
        }
      );

      const data = await res.json().catch(() => ({})) as {
        ok?: boolean; jobs_claimed?: number; jobs_completed?: number; jobs_failed?: number; error?: string;
      };
      await loadAll();
      setTriggering(false);
      return {
        ok: data.ok || false,
        claimed: data.jobs_claimed || 0,
        completed: data.jobs_completed || 0,
        failed: data.jobs_failed || 0,
        error: data.error,
      };
    } catch (err) {
      setTriggering(false);
      await loadAll();
      return { ok: false, claimed: 0, completed: 0, failed: 0, error: String(err) };
    }
  }, [user, loadAll]);

  // ── Fire an event bus event ───────────────────────────────────────────────
  const enqueueEvent = useCallback(async (
    eventType: string,
    entityId?: string,
    entityType?: string,
    context?: Record<string, unknown>
  ): Promise<{ ok: boolean; enqueued: number; error?: string }> => {
    if (!user) return { ok: false, enqueued: 0, error: "Non authentifié" };

    try {
      const { data: sessionData } = await db.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return { ok: false, enqueued: 0, error: "Session expirée" };

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/openclaw-event-bus`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            event_type: eventType,
            entity_id: entityId || null,
            entity_type: entityType || null,
            context: context || null,
          }),
        }
      );

      const data = await res.json().catch(() => ({})) as { ok?: boolean; enqueued?: number; error?: string };
      await loadAll();
      return { ok: data.ok || false, enqueued: data.enqueued || 0, error: data.error };
    } catch (err) {
      return { ok: false, enqueued: 0, error: String(err) };
    }
  }, [user, loadAll]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const pendingJobs     = queue.filter(j => j.status === "pending");
  const runningJobs     = queue.filter(j => j.status === "locked" || j.status === "running");
  const failedJobs      = queue.filter(j => j.status === "failed");
  const doneToday       = queue.filter(j => j.status === "done" && j.ended_at &&
    new Date(j.ended_at).toDateString() === new Date().toDateString());
  const overdueJobs     = queue.filter(j => j.status === "pending" &&
    new Date(j.scheduled_at) < new Date(Date.now() - 15 * 60 * 1000));

  const latestHeartbeat = heartbeats[0] || null;
  const engineHealthy   = !latestHeartbeat || latestHeartbeat.engine_status === "ok" || latestHeartbeat.engine_status === "idle";

  // Auto jobs (event-triggered or scheduled) vs manual
  const autoJobs   = queue.filter(j => j.trigger_source !== "manual");
  const manualJobs = queue.filter(j => j.trigger_source === "manual");

  const totalOutputToday = doneToday.reduce((s, j) => s + j.output_count, 0);

  // Motor split
  const motor1Types = new Set(["radar_scan", "hot_opportunity_rescore", "passive_offer_refresh", "next_best_action_generate", "daily_brief_generate", "passive_alert_digest"]);
  const motor2Types = new Set(["facilitator_match_refresh", "trust_recompute", "approval_reminder", "stuck_pipeline_recheck"]);
  const motor1Done  = doneToday.filter(j => motor1Types.has(j.job_type)).length;
  const motor2Done  = doneToday.filter(j => motor2Types.has(j.job_type)).length;

  return {
    queue, heartbeats, loading, triggering,
    pendingJobs, runningJobs, failedJobs, doneToday, overdueJobs,
    autoJobs, manualJobs,
    latestHeartbeat, engineHealthy,
    totalOutputToday, motor1Done, motor2Done,
    triggerScheduler, enqueueEvent, loadAll,
  };
}
