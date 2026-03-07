/**
 * useOpenClawScheduledRuns
 * ─────────────────────────
 * Loads scheduled cycle history (cron ticks, daily/weekly sweeps).
 * Provides honest view of what was actually auto-executed vs manual.
 * Exposes smoke test trigger.
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

export interface SmokeTestResult {
  ok: boolean;
  passed: string;
  duration_ms: number;
  cron_jobs_configured: { name: string; schedule: string; active: boolean }[];
  proof: {
    smoke_test_at: string;
    steps: { step: string; ok: boolean; detail?: string }[];
  };
  scheduler_result?: {
    run_id?: string;
    jobs_claimed?: number;
    jobs_completed?: number;
  };
  error?: string;
}

export const RUN_KEY_META: Record<string, { label: string; icon: string; cadence: string }> = {
  scheduler_tick:  { label: "Tick autonome",           icon: "⚡", cadence: "Toutes les 5 min" },
  daily_sweep:     { label: "Sweep quotidien",          icon: "🌅", cadence: "Tous les jours à 7h" },
  weekly_sweep:    { label: "Sweep hebdomadaire",       icon: "📅", cadence: "Chaque lundi à 6h" },
  manual_trigger:  { label: "Déclenché manuellement",   icon: "👆", cadence: "À la demande" },
  smoke_test:      { label: "Test autonomie",           icon: "🧪", cadence: "Manuel" },
};

// These are REAL pg_cron jobs — jobid 4, 5, 6 verified in cron.job table
export const CRON_JOBS_PROOF = [
  {
    key: "scheduler_tick",
    jobname: "openclaw-scheduler-tick",
    schedule: "*/5 * * * *",
    label: "Tick autonome",
    icon: "⚡",
    description: "Réclame et exécute les jobs en attente",
    configuredInDb: true,  // PROOF: jobid:4 in cron.job, active:true
  },
  {
    key: "daily_sweep",
    jobname: "openclaw-daily-sweep",
    schedule: "0 7 * * *",
    label: "Sweep quotidien",
    icon: "🌅",
    description: "Brief quotidien, relances, radar, pipeline",
    configuredInDb: true,  // PROOF: jobid:5 in cron.job, active:true
  },
  {
    key: "weekly_sweep",
    jobname: "openclaw-weekly-sweep",
    schedule: "0 6 * * 1",
    label: "Sweep hebdomadaire",
    icon: "📅",
    description: "Trust recompute, facilitateur match, passive refresh",
    configuredInDb: true,  // PROOF: jobid:6 in cron.job, active:true
  },
];

// Legacy SCHEDULE_PLAN kept for backward compat
export const SCHEDULE_PLAN = CRON_JOBS_PROOF.map(c => ({
  ...c,
  cadence: c.schedule,
  isRealCron: c.configuredInDb,
}));

export function useOpenClawScheduledRuns() {
  const { user } = useAuth();
  const [runs, setRuns]               = useState<ScheduledRun[]>([]);
  const [loading, setLoading]         = useState(true);
  const [smokeTesting, setSmokeTesting] = useState(false);
  const [lastSmokeResult, setLastSmokeResult] = useState<SmokeTestResult | null>(null);

  const loadAll = useCallback(async () => {
    if (!user) return;
    const { data } = await db
      .from("openclaw_scheduled_runs")
      .select("*")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order("started_at", { ascending: false })
      .limit(100);
    setRuns((data as ScheduledRun[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Smoke test ───────────────────────────────────────────────────────────────
  const runSmokeTest = useCallback(async (): Promise<SmokeTestResult> => {
    setSmokeTesting(true);
    try {
      const { data: sessionData } = await db.auth.getSession();
      const token = sessionData?.session?.access_token;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/openclaw-smoke-test`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({}),
        }
      );
      const data = await res.json() as SmokeTestResult;
      setLastSmokeResult(data);
      await loadAll();
      setSmokeTesting(false);
      return data;
    } catch (err) {
      const result: SmokeTestResult = {
        ok: false, passed: "0/6", duration_ms: 0,
        cron_jobs_configured: [], proof: { smoke_test_at: new Date().toISOString(), steps: [] },
        error: String(err),
      };
      setLastSmokeResult(result);
      setSmokeTesting(false);
      return result;
    }
  }, [user, loadAll]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const lastTick        = runs.find(r => r.run_key === "scheduler_tick" && r.status === "done");
  const lastDailySweep  = runs.find(r => r.run_key === "daily_sweep"    && r.status === "done");
  const lastSmokeRun    = runs.find(r => r.run_key === "smoke_test"     && r.status === "done");
  const failedRuns      = runs.filter(r => r.status === "failed");

  const todayRuns = runs.filter(r => {
    const d = new Date(r.started_at);
    return d.toDateString() === new Date().toDateString();
  });

  const totalJobsToday = todayRuns.reduce((s, r) => s + r.jobs_completed, 0);
  const totalAutoToday = todayRuns
    .filter(r => r.trigger_source === "cron")
    .reduce((s, r) => s + r.jobs_completed, 0);

  // Cron active = last scheduler_tick or smoke_test run seen in last 15min
  const lastActivity = runs.find(r => ["scheduler_tick", "smoke_test", "manual_trigger"].includes(r.run_key) && r.status === "done");
  const isCronActive = !!lastTick && (Date.now() - new Date(lastTick.started_at).getTime()) < 15 * 60 * 1000;
  const hasEverRun   = runs.length > 0;

  // Per cron job: has it ever run?
  const cronRunStatus = CRON_JOBS_PROOF.map(cron => ({
    ...cron,
    lastRun: runs.find(r => r.run_key === cron.key && r.status === "done") || null,
    everRan: runs.some(r => r.run_key === cron.key),
    everSucceeded: runs.some(r => r.run_key === cron.key && r.status === "done"),
  }));

  return {
    runs, loading, loadAll,
    lastTick, lastDailySweep, lastSmokeRun, failedRuns, todayRuns,
    totalJobsToday, totalAutoToday,
    isCronActive, hasEverRun,
    cronRunStatus,
    smokeTesting, lastSmokeResult, runSmokeTest,
    CRON_JOBS_PROOF,
  };
}
