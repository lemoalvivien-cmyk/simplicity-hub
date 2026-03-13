/**
 * useADAModelMetrics — Closed-Loop Fine-Tuning Monitor
 * Real-time precision tracking, training run status, dataset stats
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export interface ModelVersion {
  id: string;
  version_tag: string;
  model_id: string;
  model_provider: string;
  is_active: boolean;
  is_base: boolean;
  precision_score: number | null;
  recall_score: number | null;
  f1_score: number | null;
  training_sample_count: number;
  deals_predicted_correctly: number;
  deals_predicted_total: number;
  promoted_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface TrainingRun {
  id: string;
  triggered_by: string;
  trigger_closing_count: number;
  sample_count: number;
  positive_count: number;
  negative_count: number;
  base_model: string;
  together_job_id: string | null;
  lora_rank: number;
  epochs: number;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  train_loss_final: number | null;
  created_at: string;
}

export interface PrecisionMetric {
  id: string;
  model_version_id: string | null;
  metric_date: string;
  precision_pct: number;
  sample_size: number;
  created_at: string;
}

export interface TrainingStats {
  total_samples: number;
  positive_samples: number;
  negative_samples: number;
  neutral_samples: number;
  used_samples: number;
  closed_total: number;
  delta_since_last_run: number;
  should_retrain: boolean;
}

async function callPipeline(body: Record<string, unknown>, token: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ada-training-pipeline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export function useADAModelMetrics() {
  const { user } = useAuth();

  const [activeModel, setActiveModel]       = useState<ModelVersion | null>(null);
  const [allModels, setAllModels]           = useState<ModelVersion[]>([]);
  const [trainingRuns, setTrainingRuns]     = useState<TrainingRun[]>([]);
  const [precisionHistory, setPrecisionHistory] = useState<PrecisionMetric[]>([]);
  const [stats, setStats]                   = useState<TrainingStats | null>(null);
  const [loading, setLoading]               = useState(false);
  const [actionLoading, setActionLoading]   = useState<string | null>(null);

  // ── Fetch all metrics ─────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [
        { data: models },
        { data: runs },
        { data: metrics },
        { data: samples },
      ] = await Promise.all([
        supabase
          .from("ada_model_versions" as never)
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("ada_training_runs" as never)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("ada_precision_metrics" as never)
          .select("*")
          .order("metric_date", { ascending: true })
          .limit(60),
        supabase
          .from("ada_training_samples" as never)
          .select("label, used_in_training"),
      ]);

      const modelList = (models ?? []) as unknown as ModelVersion[];
      setAllModels(modelList);
      setActiveModel(modelList.find(m => m.is_active) ?? null);
      setTrainingRuns((runs ?? []) as unknown as TrainingRun[]);
      setPrecisionHistory((metrics ?? []) as unknown as PrecisionMetric[]);

      // Compute stats
      const sampleRows = (samples ?? []) as Array<{ label: string; used_in_training: boolean }>;
      const positive = sampleRows.filter(s => s.label === "positive").length;
      const negative = sampleRows.filter(s => s.label === "negative").length;
      const neutral  = sampleRows.filter(s => s.label === "neutral").length;
      const used     = sampleRows.filter(s => s.used_in_training).length;

      // Check retrain status via RPC
      const { data: retrainCheck } = await supabase.rpc("ada_should_retrain" as never);
      const rc = retrainCheck as Record<string, unknown> | null;

      setStats({
        total_samples:         sampleRows.length,
        positive_samples:      positive,
        negative_samples:      negative,
        neutral_samples:       neutral,
        used_samples:          used,
        closed_total:          Number(rc?.closed_total ?? 0),
        delta_since_last_run:  Number(rc?.delta ?? 0),
        should_retrain:        Boolean(rc?.should_retrain),
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ── Real-time subscriptions ───────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    refresh();

    const channel = supabase
      .channel("ada_training_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "ada_model_versions" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "ada_training_runs" }, () => refresh())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ada_precision_metrics" }, () => refresh())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, refresh]);

  // ── Collect sample from closed session ───────────────────────────────────
  const collectSample = useCallback(async (sessionId: string) => {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    const token = authSession?.access_token ?? "";
    setActionLoading("collect");
    try {
      const result = await callPipeline({ action: "collect", session_id: sessionId }, token);
      if (result.success) {
        toast.success(`📊 Sample collecté — Label: ${result.label} | Qualité: ${result.quality_score?.toFixed(0)}/100`);
        if (result.retrain_check?.should_retrain) {
          toast.info("⚡ Seuil 50 deals atteint — Retraining disponible !");
        }
        await refresh();
      } else {
        toast.error(result.error ?? "Erreur collecte sample");
      }
      return result;
    } finally {
      setActionLoading(null);
    }
  }, [refresh]);

  // ── Trigger training run ──────────────────────────────────────────────────
  const triggerTraining = useCallback(async () => {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    const token = authSession?.access_token ?? "";
    setActionLoading("trigger");
    try {
      const result = await callPipeline({ action: "trigger", triggered_by: "manual" }, token);
      if (result.success) {
        toast.success(`🧠 LoRA Training lancé — ${result.sample_count} samples — Job: ${result.job_id}`);
      } else if (result.status === "pending_key") {
        toast.warning("🔑 Clé Together AI manquante — Training en attente de configuration");
      } else {
        toast.error(result.error ?? "Erreur démarrage training");
      }
      await refresh();
      return result;
    } finally {
      setActionLoading(null);
    }
  }, [refresh]);

  // ── Poll training run status ──────────────────────────────────────────────
  const pollRun = useCallback(async (runId: string) => {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    const token = authSession?.access_token ?? "";
    const result = await callPipeline({ action: "poll", run_id: runId }, token);
    if (result.mapped_status === "completed") {
      toast.success("🎉 Training terminé ! Nouveau modèle activé.");
    }
    await refresh();
    return result;
  }, [refresh]);

  // ── Predict via current best model ───────────────────────────────────────
  const predict = useCallback(async (context: Record<string, unknown>) => {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    const token = authSession?.access_token ?? "";
    setActionLoading("predict");
    try {
      return await callPipeline({ action: "predict", context }, token);
    } finally {
      setActionLoading(null);
    }
  }, []);

  // ── Computed: precision chart data ───────────────────────────────────────
  const precisionChartData = precisionHistory.map(m => ({
    date:      m.metric_date,
    precision: Number(m.precision_pct),
    label:     `${Number(m.precision_pct).toFixed(1)}%`,
  }));

  const currentPrecision = activeModel?.precision_score ?? 62;
  const targetPrecision  = 92;
  const precisionProgress = Math.min((currentPrecision / targetPrecision) * 100, 100);

  return {
    // State
    activeModel,
    allModels,
    trainingRuns,
    precisionHistory,
    precisionChartData,
    stats,
    loading,
    actionLoading,
    currentPrecision,
    targetPrecision,
    precisionProgress,
    // Actions
    refresh,
    collectSample,
    triggerTraining,
    pollRun,
    predict,
  };
}
