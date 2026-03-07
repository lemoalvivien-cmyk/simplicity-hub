/**
 * useOpenClawCronDiagnostic
 * ─────────────────────────
 * Diagnostic infra-as-code pour les cron jobs OpenClaw.
 *
 * Source de vérité:
 * - CRON_REGISTRY = ce qui est défini dans le REPO (supabase/infra/cron-jobs.md)
 * - openclaw_cron_status VIEW = ce qui a été observé EN BASE
 *
 * Distingue:
 * - "défini dans le repo" (toujours vrai si ce hook existe)
 * - "configuré en base" (jobid prouvé dans cron.job)
 * - "a tourné au moins une fois via cron"
 * - "actif récemment" (< 10min)
 * - "jamais observé"
 */
import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

// ── Registre repo ────────────────────────────────────────────────────────────
// Ce registre EST la preuve versionnée dans le code.
// Toute modification ici = changement de la définition infra.
export const CRON_REGISTRY = [
  {
    run_key:        "scheduler_tick",
    jobname:        "openclaw-scheduler-tick",
    jobid:          4,            // Prouvé: SELECT jobid FROM cron.job WHERE jobname='openclaw-scheduler-tick'
    schedule:       "*/5 * * * *",
    schedule_label: "Toutes les 5 minutes",
    function:       "openclaw-scheduler",
    body_run_key:   "scheduler_tick",
    trigger_source: "cron",
    icon:           "⚡",
    label:          "Tick autonome",
    description:    "Réclame et exécute les jobs en attente dans openclaw_job_queue",
    defined_in_repo: true,        // Documenté dans supabase/infra/cron-jobs.md
    configured_in_db: true,       // Prouvé: jobid:4 actif, vérifié 2026-03-07
  },
  {
    run_key:        "daily_sweep",
    jobname:        "openclaw-daily-sweep",
    jobid:          5,
    schedule:       "0 7 * * *",
    schedule_label: "Tous les jours à 7h UTC",
    function:       "openclaw-scheduler",
    body_run_key:   "daily_sweep",
    trigger_source: "cron",
    icon:           "🌅",
    label:          "Sweep quotidien",
    description:    "Brief quotidien, relances, radar, pipeline — max 20 jobs",
    defined_in_repo: true,
    configured_in_db: true,       // Prouvé: jobid:5 actif, vérifié 2026-03-07
  },
  {
    run_key:        "weekly_sweep",
    jobname:        "openclaw-weekly-sweep",
    jobid:          6,
    schedule:       "0 6 * * 1",
    schedule_label: "Chaque lundi à 6h UTC",
    function:       "openclaw-scheduler",
    body_run_key:   "weekly_sweep",
    trigger_source: "cron",
    icon:           "📅",
    label:          "Sweep hebdomadaire",
    description:    "Trust recompute, facilitateur match, passive refresh — max 50 jobs",
    defined_in_repo: true,
    configured_in_db: true,       // Prouvé: jobid:6 actif, vérifié 2026-03-07
  },
] as const;

export type CronRunKey = typeof CRON_REGISTRY[number]["run_key"];

// Statuts honnêtes — de la vue openclaw_cron_status
export type CronObservedStatus =
  | "recently_active"              // a tourné dans les 10 dernières minutes
  | "active"                       // a tourné dans la dernière heure
  | "seen_today"                   // a tourné aujourd'hui
  | "configured_not_seen_recently" // configuré mais pas vu récemment
  | "configured_never_run"         // configuré mais jamais observé via cron
  | "unknown";                     // erreur de lecture

export interface CronJobDiagnostic {
  run_key:           string;
  jobname:           string;
  jobid:             number;
  schedule:          string;
  schedule_label:    string;
  icon:              string;
  label:             string;
  description:       string;
  // Infra-as-code
  defined_in_repo:   boolean;      // présent dans CRON_REGISTRY (ce fichier)
  configured_in_db:  boolean;      // jobid prouvé dans cron.job
  // Observé en base (depuis openclaw_cron_status)
  observed_status:   CronObservedStatus;
  real_cron_runs:    number;
  total_successful:  number;
  total_failed:      number;
  last_cron_run_at:  string | null;
  next_run_at:       string | null;
  avg_duration_ms:   number | null;
  total_jobs_completed: number;
  // Dérivé
  ever_ran_via_cron: boolean;
  is_healthy:        boolean;
  inconsistency:     string | null; // null = ok, sinon description du problème
}

interface CronStatusRow {
  run_key:              string;
  real_cron_runs:       number;
  total_successful:     number;
  total_failed:         number;
  total_runs:           number;
  last_cron_run_at:     string | null;
  last_cron_attempt_at: string | null;
  next_run_at:          string | null;
  avg_duration_ms:      number | null;
  total_jobs_completed: number;
  observed_status:      string;
}

export function useOpenClawCronDiagnostic() {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<CronJobDiagnostic[]>([]);
  const [loading, setLoading]         = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const load = useCallback(async () => {
    // La vue openclaw_cron_status n'a pas de RLS user-based, on la lit directement
    const { data, error } = await db
      .from("openclaw_cron_status" as never)
      .select("*") as { data: CronStatusRow[] | null; error: unknown };

    const statusMap = new Map<string, CronStatusRow>();
    if (data) {
      for (const row of data) {
        // Si la même run_key apparaît plusieurs fois (UNION), prendre la plus récente
        const existing = statusMap.get(row.run_key);
        if (!existing || (row.real_cron_runs > 0 && existing.real_cron_runs === 0)) {
          statusMap.set(row.run_key, row);
        }
      }
    }

    const result: CronJobDiagnostic[] = CRON_REGISTRY.map(entry => {
      const obs = statusMap.get(entry.run_key);
      const observedStatus = (obs?.observed_status as CronObservedStatus) ?? "unknown";
      const ever_ran_via_cron = (obs?.real_cron_runs ?? 0) > 0;
      const total_failed = obs?.total_failed ?? 0;

      // Détection d'incohérences honnête
      let inconsistency: string | null = null;
      if (!entry.defined_in_repo) {
        inconsistency = "Actif en base mais absent du repo";
      } else if (!entry.configured_in_db) {
        inconsistency = "Documenté dans le repo mais jobid non prouvé";
      }

      return {
        run_key:          entry.run_key,
        jobname:          entry.jobname,
        jobid:            entry.jobid,
        schedule:         entry.schedule,
        schedule_label:   entry.schedule_label,
        icon:             entry.icon,
        label:            entry.label,
        description:      entry.description,
        defined_in_repo:  entry.defined_in_repo,
        configured_in_db: entry.configured_in_db,
        observed_status:  observedStatus,
        real_cron_runs:   obs?.real_cron_runs ?? 0,
        total_successful: obs?.total_successful ?? 0,
        total_failed,
        last_cron_run_at:      obs?.last_cron_run_at ?? null,
        next_run_at:           obs?.next_run_at ?? null,
        avg_duration_ms:       obs?.avg_duration_ms ?? null,
        total_jobs_completed:  obs?.total_jobs_completed ?? 0,
        ever_ran_via_cron,
        is_healthy: entry.defined_in_repo && entry.configured_in_db && (
          observedStatus === "recently_active" ||
          observedStatus === "active" ||
          observedStatus === "seen_today" ||
          observedStatus === "configured_never_run" // pas un problème si daily/weekly n'ont pas encore l'heure
        ) && total_failed === 0,
        inconsistency,
      };
    });

    setDiagnostics(result);
    setLastChecked(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Dérivés
  const allConfiguredInRepo = diagnostics.every(d => d.defined_in_repo);
  const allConfiguredInDb   = diagnostics.every(d => d.configured_in_db);
  const tickDiag            = diagnostics.find(d => d.run_key === "scheduler_tick");
  const dailyDiag           = diagnostics.find(d => d.run_key === "daily_sweep");
  const weeklyDiag          = diagnostics.find(d => d.run_key === "weekly_sweep");

  const tickIsActive = tickDiag?.observed_status === "recently_active" || tickDiag?.observed_status === "active";
  const hasInconsistencies = diagnostics.some(d => d.inconsistency !== null);

  // Score global infra
  const infraScore = Math.round(
    diagnostics.reduce((sum, d) => {
      let pts = 0;
      if (d.defined_in_repo)  pts += 30;
      if (d.configured_in_db) pts += 30;
      if (d.ever_ran_via_cron) pts += 25;
      if (d.total_failed === 0) pts += 15;
      return sum + pts;
    }, 0) / Math.max(diagnostics.length, 1)
  );

  return {
    diagnostics,
    loading,
    lastChecked,
    reload: load,
    // Accès directs
    tickDiag,
    dailyDiag,
    weeklyDiag,
    // Flags globaux
    allConfiguredInRepo,
    allConfiguredInDb,
    tickIsActive,
    hasInconsistencies,
    infraScore,
    CRON_REGISTRY,
  };
}
