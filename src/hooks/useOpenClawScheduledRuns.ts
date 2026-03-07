/**
 * useOpenClawScheduledRuns
 * ─────────────────────────
 * Loads scheduled cycle history (cron ticks, daily/weekly sweeps).
 * Provides honest view of what was actually auto-executed vs manual.
 */
import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface ScheduledRun {
  id: string;
  user_id: string | null;
  run_key: string;
  trigger_source: string;
  status: "running" | "done" | "failed" | "skipped";
  jobs_enqueued: number;
  jobs_claimed: number;
  jobs_completed: number;
  jobs_failed: number;
  error_detail: string | null;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  next_run_at: string | null;
  created_at: string;
}

export const RUN_KEY_META: Record<string, { label: string; icon: string; cadence: string }> = {
  scheduler_tick: { label: "Tick autonome",      icon: "⚡", cadence: "Toutes les 5 min" },
  daily_sweep:    { label: "Sweep quotidien",    icon: "🌅", cadence: "Tous les jours à 7h" },
  weekly_sweep:   { label: "Sweep hebdomadaire", icon: "📅", cadence: "Chaque lundi à 6h" },
  manual_trigger: { label: "Déclenché manuellement", icon: "👆", cadence: "À la demande" },
};

export const SCHEDULE_PLAN = [
  {
    key: "scheduler_tick",
    label: "Tick autonome",
    icon: "⚡",
    cadence: "*/5 * * * *",
    description: "Réclame et exécute les jobs en attente",
    isRealCron: true,
  },
  {
    key: "daily_sweep",
    label: "Sweep quotidien",
    icon: "🌅",
    cadence: "0 7 * * *",
    description: "Brief quotidien, relances, radar, pipeline",
    isRealCron: true,
  },
  {
    key: "weekly_sweep",
    label: "Sweep hebdomadaire",
    icon: "📅",
    cadence: "0 6 * * 1",
    description: "Trust recompute, facilitateur match, passive refresh",
    isRealCron: true,
  },
];

export function useOpenClawScheduledRuns() {
  const { user } = useAuth();
  const [runs, setRuns]     = useState<ScheduledRun[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!user) return;
    const { data } = await db
      .from("openclaw_scheduled_runs")
      .select("*")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order("started_at", { ascending: false })
      .limit(50);
    setRuns((data as ScheduledRun[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const lastTick        = runs.find(r => r.run_key === "scheduler_tick" && r.status === "done");
  const lastDailySweep  = runs.find(r => r.run_key === "daily_sweep"    && r.status === "done");
  const failedRuns      = runs.filter(r => r.status === "failed");
  const todayRuns       = runs.filter(r => {
    const d = new Date(r.started_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const totalJobsToday  = todayRuns.reduce((s, r) => s + r.jobs_completed, 0);
  const totalAutoToday  = todayRuns.filter(r => r.trigger_source === "cron").reduce((s, r) => s + r.jobs_completed, 0);

  const isCronActive = !!lastTick && (Date.now() - new Date(lastTick.started_at).getTime()) < 15 * 60 * 1000; // seen in last 15min

  return {
    runs, loading, loadAll,
    lastTick, lastDailySweep, failedRuns, todayRuns,
    totalJobsToday, totalAutoToday, isCronActive,
  };
}
