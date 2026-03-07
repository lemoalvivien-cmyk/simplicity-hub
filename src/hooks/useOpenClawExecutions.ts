/**
 * useOpenClawExecutions
 * ──────────────────────
 * Loads openclaw_job_executions from DB and exposes a
 * real executeJob() function that calls the edge function.
 */
import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface JobExecution {
  id: string;
  job_id: string | null;
  job_type: string;
  trigger_source: string;
  status: "planifie" | "en_cours" | "termine" | "erreur" | "bloque";
  output_summary: string | null;
  output_count: number;
  recommendations_created: number;
  actions_created: number;
  alerts_created: number;
  trust_updates: number;
  opportunities_rescored: number;
  started_at: string | null;
  ended_at: string | null;
  duration_ms: number | null;
  retry_count: number;
  last_error: string | null;
  requires_approval: boolean;
  created_at: string;
}

export const JOB_TYPE_LIBRARY: Record<string, {
  label: string;
  icon: string;
  desc: string;
  motor: "prospection" | "apport";
  agent: string;
}> = {
  radar_scan:                { label: "Scan radar",             icon: "📡", desc: "Détection des signaux d'opportunité",          motor: "prospection", agent: "signal_hunter" },
  hot_opportunity_rescore:   { label: "Reclassement opportunités", icon: "🔥", desc: "Reclasse les pistes les plus chaudes",     motor: "prospection", agent: "opportunity_builder" },
  passive_offer_refresh:     { label: "Vérif. offres passives",  icon: "🌐", desc: "Vérifie la visibilité des offres passives",   motor: "prospection", agent: "passive_distributor" },
  next_best_action_generate: { label: "Prochaines meilleures actions", icon: "⚡", desc: "Génère des actions de relance ciblées", motor: "prospection", agent: "matchmaker" },
  daily_brief_generate:      { label: "Brief quotidien",         icon: "📋", desc: "Prépare le résumé du jour",                  motor: "prospection", agent: "brief_writer" },
  facilitator_match_refresh: { label: "Match facilitateurs",     icon: "🤝", desc: "Identifie les missions sans apporteur",      motor: "apport",       agent: "matchmaker" },
  trust_recompute:           { label: "Réévaluation confiance",  icon: "🛡️", desc: "Recalcule les scores de réputation",         motor: "apport",       agent: "trust_sentinel" },
  approval_reminder:         { label: "Relance approbations",    icon: "🔔", desc: "Rappel des actions en attente d'accord",     motor: "apport",       agent: "validator" },
  stuck_pipeline_recheck:    { label: "Pipelines bloqués",       icon: "🔄", desc: "Détecte les introductions sans réponse",     motor: "apport",       agent: "validator" },
  passive_alert_digest:      { label: "Digest alertes passives", icon: "📢", desc: "Résume les signaux passifs non lus",         motor: "prospection", agent: "passive_distributor" },
};

export const EXEC_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  planifie:  { label: "Planifié",   color: "hsl(218 72% 55%)", bg: "hsl(218 72% 95%)" },
  en_cours:  { label: "En cours…",  color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
  termine:   { label: "Terminé",    color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
  erreur:    { label: "Échec",      color: "hsl(0 65% 40%)", bg: "hsl(0 65% 95%)" },
  bloque:    { label: "Bloqué",     color: "hsl(38 80% 40%)", bg: "hsl(38 80% 92%)" },
};

export function useOpenClawExecutions() {
  const { user } = useAuth();
  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);

  const loadExecutions = useCallback(async () => {
    if (!user) return;
    const { data } = await db
      .from("openclaw_job_executions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setExecutions(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadExecutions(); }, [loadExecutions]);

  // ── Execute a real job ─────────────────────────────────────────────────────
  const executeJob = useCallback(async (
    jobType: string,
    jobId?: string,
    sessionId?: string,
  ): Promise<{ success: boolean; summary?: string; outputCount?: number; error?: string }> => {
    if (!user) return { success: false, error: "Non authentifié" };

    setRunningJobId(jobType);

    try {
      const { data: sessionData } = await db.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        setRunningJobId(null);
        return { success: false, error: "Session expirée" };
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/openclaw-job-executor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            job_type: jobType,
            job_id: jobId || null,
            session_id: sessionId || null,
            trigger_source: "manual",
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setRunningJobId(null);
        await loadExecutions();
        return { success: false, error: errData.error || `HTTP ${response.status}` };
      }

      const result = await response.json();
      await loadExecutions();
      setRunningJobId(null);
      return {
        success: result.status === "termine",
        summary: result.output_summary,
        outputCount: result.output_count,
        error: result.status !== "termine" ? result.output_summary : undefined,
      };
    } catch (err) {
      setRunningJobId(null);
      await loadExecutions();
      return { success: false, error: String(err) };
    }
  }, [user, loadExecutions]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const recentExecutions     = executions.slice(0, 10);
  const failedExecutions     = executions.filter(e => e.status === "erreur");
  const runningExecutions    = executions.filter(e => e.status === "en_cours");
  const successfulExecutions = executions.filter(e => e.status === "termine");

  const totalOutputs = executions.reduce((acc, e) => acc + e.output_count, 0);
  const totalRecs    = executions.reduce((acc, e) => acc + e.recommendations_created, 0);
  const totalActions = executions.reduce((acc, e) => acc + e.actions_created, 0);

  // Last output by job type
  const lastExecutionByType: Record<string, JobExecution> = {};
  for (const exec of executions) {
    if (!lastExecutionByType[exec.job_type]) {
      lastExecutionByType[exec.job_type] = exec;
    }
  }

  return {
    executions,
    recentExecutions,
    failedExecutions,
    runningExecutions,
    successfulExecutions,
    lastExecutionByType,
    totalOutputs,
    totalRecs,
    totalActions,
    loading,
    runningJobId,
    executeJob,
    loadExecutions,
  };
}
