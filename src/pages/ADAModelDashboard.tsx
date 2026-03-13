/**
 * ADA Model Precision Dashboard
 * Closed-loop fine-tuning monitor: precision curve, training runs, dataset stats
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, TrendingUp, Database, Play, RefreshCw, Zap,
  CheckCircle2, Clock, AlertTriangle, ChevronRight,
  BarChart3, Target, FlaskConical, Layers, Cpu, Eye,
  Activity, XCircle
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from "recharts";
import { useADAModelMetrics, TrainingRun } from "@/hooks/useADAModelMetrics";
import UserLayout from "@/components/layout/UserLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ── Status helpers ─────────────────────────────────────────────────────────

const RUN_STATUS: Record<string, { label: string; color: string; icon: React.ElementType; pulse?: boolean }> = {
  pending:      { label: "En attente",   color: "hsl(var(--muted-foreground))", icon: Clock },
  pending_key:  { label: "Clé manquante", color: "hsl(38 95% 52%)",            icon: AlertTriangle },
  exporting:    { label: "Export JSONL", color: "hsl(210 88% 68%)",            icon: Database, pulse: true },
  submitted:    { label: "Soumis",       color: "hsl(210 88% 68%)",            icon: ChevronRight, pulse: true },
  training:     { label: "Entraînement", color: "hsl(270 80% 65%)",            icon: Brain, pulse: true },
  completed:    { label: "Terminé ✓",    color: "hsl(152 62% 52%)",            icon: CheckCircle2 },
  failed:       { label: "Échec",        color: "hsl(0 65% 55%)",              icon: XCircle },
};

// ── Custom Tooltip ─────────────────────────────────────────────────────────

function PrecisionTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "hsl(218 65% 8%)", border: "1px solid hsl(218 45% 20%)", backdropFilter: "blur(12px)" }}>
      <p style={{ color: "hsl(var(--muted-foreground))" }}>{label}</p>
      <p className="font-bold" style={{ color: "hsl(210 88% 68%)" }}>{payload[0].value.toFixed(1)}%</p>
    </div>
  );
}

// ── Precision Gauge ────────────────────────────────────────────────────────

function PrecisionGauge({ current, target }: { current: number; target: number }) {
  const pct     = Math.min(current / target, 1);
  const angle   = -135 + pct * 270;
  const r       = 60;
  const cx      = 80;
  const cy      = 80;
  const stroke  = 2 * Math.PI * r;
  const dashPct = (pct * 270) / 360;

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="100" viewBox="0 0 160 100">
        {/* Background arc */}
        <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={10}
          stroke="hsl(218 45% 18%)"
          strokeDasharray={`${(270/360)*stroke} ${stroke}`}
          strokeDashoffset={-stroke * (45/360)}
          strokeLinecap="round"
          transform={`rotate(-135, ${cx}, ${cy})`}
        />
        {/* Progress arc */}
        <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={10}
          stroke="url(#gaugeGrad)"
          strokeDasharray={`${dashPct * stroke} ${stroke}`}
          strokeDashoffset={-stroke * (45/360)}
          strokeLinecap="round"
          transform={`rotate(-135, ${cx}, ${cy})`}
        />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(210 88% 68%)" />
            <stop offset="100%" stopColor="hsl(152 62% 52%)" />
          </linearGradient>
        </defs>
        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={cx + 48 * Math.cos(((angle - 90) * Math.PI) / 180)}
          y2={cy + 48 * Math.sin(((angle - 90) * Math.PI) / 180)}
          stroke="white" strokeWidth={2} strokeLinecap="round"
          style={{ transition: "all 0.8s cubic-bezier(0.34,1.56,0.64,1)" }}
        />
        <circle cx={cx} cy={cy} r={5} fill="white" />
        {/* Labels */}
        <text x={12} y={90} fontSize={9} fill="hsl(var(--muted-foreground))">0%</text>
        <text x={133} y={90} fontSize={9} fill="hsl(var(--muted-foreground))">{target}%</text>
      </svg>
      <div className="text-center -mt-4">
        <span className="text-3xl font-black" style={{ color: "hsl(210 88% 68%)" }}>{current.toFixed(1)}%</span>
        <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Précision actuelle / {target}% cible</p>
      </div>
    </div>
  );
}

// ── Training Run Card ──────────────────────────────────────────────────────

function RunCard({ run, onPoll }: { run: TrainingRun; onPoll: (id: string) => void }) {
  const meta = RUN_STATUS[run.status] ?? RUN_STATUS["pending"];
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 rounded-xl p-3"
      style={{ background: "hsl(218 65% 7%)", border: "1px solid hsl(218 45% 16% / 0.6)" }}
    >
      <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${meta.color}15` }}>
        <Icon size={14} style={{ color: meta.color }} className={meta.pulse ? "animate-pulse" : ""} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-white truncate">
            Run #{run.id.slice(0, 8)} · {run.sample_count} samples
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{ color: meta.color, background: `${meta.color}18` }}>
            {meta.label}
          </span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          +{run.positive_count} positifs · −{run.negative_count} négatifs · LoRA r={run.lora_rank} · {run.epochs} epochs
        </p>
        {run.error_message && (
          <p className="text-xs mt-1 truncate" style={{ color: "hsl(0 65% 65%)" }}>{run.error_message}</p>
        )}
        {(run.status === "training" || run.status === "submitted") && (
          <button
            onClick={() => onPoll(run.id)}
            className="text-xs mt-1.5 flex items-center gap-1"
            style={{ color: "hsl(210 88% 68%)" }}
          >
            <RefreshCw size={10} /> Rafraîchir statut
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Dashboard
// ══════════════════════════════════════════════════════════════════════════════

export default function ADAModelDashboard() {
  const {
    activeModel, allModels, trainingRuns, precisionChartData,
    stats, loading, actionLoading,
    currentPrecision, targetPrecision, precisionProgress,
    refresh, triggerTraining, pollRun,
  } = useADAModelMetrics();

  const [activeTab, setActiveTab] = useState<"overview" | "runs" | "models" | "dataset">("overview");

  const TABS = [
    { key: "overview" as const, label: "Vue d'ensemble", icon: BarChart3 },
    { key: "runs"     as const, label: "Training Runs",  icon: Brain },
    { key: "models"   as const, label: "Modèles",        icon: Layers },
    { key: "dataset"  as const, label: "Dataset",        icon: Database },
  ];

  return (
    <UserLayout>
      <div className="min-h-screen p-4 lg:p-6" style={{ background: "hsl(220 70% 5%)" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: "linear-gradient(135deg, hsl(270 80% 40%), hsl(210 88% 40%))" }}>
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">ADA Model Precision</h1>
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                Closed-loop fine-tuning · LoRA Llama-3-70B · Target: 92%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={loading}
              className="p-2 rounded-lg transition-colors"
              style={{ background: "hsl(218 45% 12%)", color: "hsl(var(--muted-foreground))" }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            {stats?.should_retrain && (
              <Button
                onClick={triggerTraining}
                disabled={actionLoading === "trigger"}
                size="sm"
                className="text-xs font-bold gap-1.5"
                style={{ background: "linear-gradient(135deg, hsl(270 80% 45%), hsl(210 88% 50%))" }}
              >
                <Zap size={12} />
                {actionLoading === "trigger" ? "Lancement..." : "Lancer LoRA Training"}
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: "hsl(218 65% 7%)" }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium flex-1 justify-center transition-all"
                style={{
                  background: active ? "hsl(218 55% 18%)" : "transparent",
                  color: active ? "white" : "hsl(var(--muted-foreground))",
                }}
              >
                <Icon size={12} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Precision Gauge + Stats Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Gauge */}
                <div className="rounded-2xl p-5 flex flex-col items-center justify-center" style={{ background: "hsl(218 65% 8%)", border: "1px solid hsl(218 45% 18% / 0.6)" }}>
                  <PrecisionGauge current={currentPrecision} target={targetPrecision} />
                  <div className="w-full mt-3 rounded-lg overflow-hidden" style={{ background: "hsl(218 45% 12%)", height: 4 }}>
                    <motion.div
                      className="h-full rounded-lg"
                      style={{ background: "linear-gradient(90deg, hsl(210 88% 68%), hsl(152 62% 52%))" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${precisionProgress}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-xs mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {precisionProgress.toFixed(0)}% vers 92%
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Total Samples", value: stats?.total_samples ?? 0, icon: Database, color: "hsl(210 88% 68%)" },
                    { label: "Deals Closés", value: stats?.closed_total ?? 0, icon: CheckCircle2, color: "hsl(152 62% 52%)" },
                    { label: "Δ Depuis dernier run", value: stats?.delta_since_last_run ?? 0, icon: TrendingUp, color: "hsl(270 80% 65%)" },
                    { label: "Positifs",  value: stats?.positive_samples ?? 0, icon: Activity, color: "hsl(152 62% 52%)" },
                    { label: "Négatifs",  value: stats?.negative_samples ?? 0, icon: XCircle, color: "hsl(0 65% 55%)" },
                    { label: "Utilisés",  value: stats?.used_samples ?? 0, icon: Cpu, color: "hsl(38 95% 52%)" },
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <div key={s.label} className="rounded-xl p-3.5" style={{ background: "hsl(218 65% 8%)", border: "1px solid hsl(218 45% 18% / 0.5)" }}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon size={12} style={{ color: s.color }} />
                          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{s.label}</span>
                        </div>
                        <p className="text-2xl font-black text-white">{s.value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Precision Chart */}
              <div className="rounded-2xl p-5" style={{ background: "hsl(218 65% 8%)", border: "1px solid hsl(218 45% 18% / 0.6)" }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Courbe de précision</h3>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Évolution par training run · Objectif 92%
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <Target size={12} /> Cible: 92%
                  </div>
                </div>
                {precisionChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={precisionChartData}>
                      <defs>
                        <linearGradient id="precGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="hsl(210 88% 68%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(210 88% 68%)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(218 45% 16%)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215 15% 50%)" }} />
                      <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: "hsl(215 15% 50%)" }} unit="%" />
                      <Tooltip content={<PrecisionTooltip />} />
                      <ReferenceLine y={92} stroke="hsl(152 62% 52%)" strokeDasharray="5 5" strokeWidth={1.5} label={{ value: "92%", fill: "hsl(152 62% 52%)", fontSize: 10 }} />
                      <Area type="monotone" dataKey="precision" stroke="hsl(210 88% 68%)" fill="url(#precGrad)" strokeWidth={2.5} dot={{ fill: "hsl(210 88% 68%)", r: 3 }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center">
                    <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Précision baseline: 62% — Se met à jour après chaque training run
                    </p>
                  </div>
                )}
              </div>

              {/* Retraining Alert */}
              {stats?.should_retrain && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-4 flex items-center justify-between"
                  style={{ background: "hsl(270 80% 40% / 0.15)", border: "1px solid hsl(270 80% 55% / 0.4)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: "hsl(270 80% 40% / 0.3)" }}>
                      <FlaskConical size={16} style={{ color: "hsl(270 80% 70%)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        +{stats.delta_since_last_run} deals depuis le dernier run — Seuil 50 atteint
                      </p>
                      <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                        Le LoRA fine-tuning va améliorer la précision de +4-7%
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={triggerTraining}
                    disabled={actionLoading === "trigger"}
                    size="sm"
                    className="font-bold text-xs"
                    style={{ background: "hsl(270 80% 50%)" }}
                  >
                    <Play size={12} />
                    {actionLoading === "trigger" ? "Lancement..." : "Lancer"}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === "runs" && (
            <motion.div key="runs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white">Historique des runs</h3>
                <Button
                  onClick={triggerTraining}
                  disabled={actionLoading === "trigger"}
                  size="sm"
                  className="text-xs gap-1.5"
                  style={{ background: "hsl(270 80% 45%)" }}
                >
                  <Play size={11} />
                  {actionLoading === "trigger" ? "Lancement..." : "Nouveau Run"}
                </Button>
              </div>
              {trainingRuns.length === 0 ? (
                <div className="rounded-2xl p-8 text-center" style={{ background: "hsl(218 65% 8%)" }}>
                  <Brain size={32} className="mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
                  <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Aucun run pour l'instant — Le premier se déclenchera après 50 deals
                  </p>
                </div>
              ) : (
                trainingRuns.map(run => (
                  <RunCard key={run.id} run={run} onPoll={pollRun} />
                ))
              )}
            </motion.div>
          )}

          {activeTab === "models" && (
            <motion.div key="models" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {allModels.map(model => (
                <motion.div
                  key={model.id}
                  className="rounded-xl p-4"
                  style={{
                    background: model.is_active ? "hsl(218 65% 10%)" : "hsl(218 65% 7%)",
                    border: `1px solid ${model.is_active ? "hsl(210 88% 50% / 0.4)" : "hsl(218 45% 16% / 0.4)"}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{model.version_tag}</span>
                      {model.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "hsl(210 88% 50% / 0.2)", color: "hsl(210 88% 70%)" }}>
                          ● Actif
                        </span>
                      )}
                      {model.is_base && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "hsl(38 95% 52% / 0.15)", color: "hsl(38 95% 62%)" }}>
                          Base
                        </span>
                      )}
                    </div>
                    <span className="text-2xl font-black" style={{ color: "hsl(210 88% 68%)" }}>
                      {model.precision_score?.toFixed(1) ?? "—"}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <span>Provider: {model.model_provider}</span>
                    <span>Samples: {model.training_sample_count}</span>
                    <span>F1: {model.f1_score?.toFixed(2) ?? "—"}</span>
                  </div>
                  {model.notes && (
                    <p className="text-xs mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>{model.notes}</p>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "dataset" && (
            <motion.div key="dataset" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="rounded-2xl p-5 space-y-4" style={{ background: "hsl(218 65% 8%)", border: "1px solid hsl(218 45% 18% / 0.5)" }}>
                <h3 className="text-sm font-bold text-white">Dataset anonymisé</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Total samples",     value: stats?.total_samples ?? 0,      color: "hsl(210 88% 68%)" },
                    { label: "Positifs (closés)",  value: stats?.positive_samples ?? 0,  color: "hsl(152 62% 52%)" },
                    { label: "Négatifs (refus)",   value: stats?.negative_samples ?? 0,  color: "hsl(0 65% 55%)" },
                    { label: "Neutres",             value: stats?.neutral_samples ?? 0,  color: "hsl(38 95% 52%)" },
                    { label: "Utilisés en training", value: stats?.used_samples ?? 0,    color: "hsl(270 80% 65%)" },
                    { label: "Restant pour run",    value: (stats?.total_samples ?? 0) - (stats?.used_samples ?? 0), color: "hsl(210 88% 68%)" },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl p-3" style={{ background: "hsl(218 65% 6%)", border: "1px solid hsl(218 45% 14%)" }}>
                      <p className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>{item.label}</p>
                      <p className="text-xl font-black" style={{ color: item.color }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-3 text-xs space-y-1.5" style={{ background: "hsl(218 65% 6%)", color: "hsl(var(--muted-foreground))" }}>
                  <p className="font-bold text-white text-xs mb-2">Pipeline closed-loop</p>
                  <p>1. Chaque deal closé via ADA → collecte automatique (anonymisé SHA-256)</p>
                  <p>2. Curriculum learning : qualité pondérée par ROI + durée + montant</p>
                  <p>3. Format : JSONL OpenAI Chat (compatible Together AI / OpenAI)</p>
                  <p>4. Trigger automatique : +50 deals → LoRA fine-tune Llama-3-70B</p>
                  <p>5. Nouveau modèle promu → précision croissante jusqu'à 92%</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </UserLayout>
  );
}
