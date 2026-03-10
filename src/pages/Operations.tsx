/**
 * OpenClaw Operations — Vue runtime maximale
 * Health, channels, sessions, jobs, scheduler queue, heartbeats, boundary
 * Autonomous execution layer: real queue, real cron, real events
 * Real Channel Delivery + Receipts + Outcome Loop
 * Internationalized via useTranslation — formatLocale for dates/numbers
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import UserLayout from "@/components/layout/UserLayout";
import {
  Brain, Zap, Shield, Clock, CheckCircle2, AlertTriangle,
  Radio, Play, RefreshCw, ChevronRight, Activity,
  Layers, Cpu, Lock, Wifi, WifiOff, AlertCircle,
  Target, Settings2, Eye, BarChart3, XCircle, ListChecks,
  Send, CheckCheck, Package, MessageCircle, TrendingUp,
  Timer, CalendarClock, Stethoscope,
} from "lucide-react";
import { useOpenClawRuntime, CHANNEL_STATUS_META, JOB_STATUS_META, JOB_TYPE_META, TOOL_ACCESS_META } from "@/hooks/useOpenClawRuntime";
import { useOpenClawRuns, RUN_TYPE_LABELS, BRAIN_AGENTS } from "@/hooks/useOpenClawRuns";
import { useOpenClaw } from "@/hooks/useOpenClaw";
import { useOpenClawExecutions, JOB_TYPE_LIBRARY, EXEC_STATUS_META } from "@/hooks/useOpenClawExecutions";
import { useOpenClawScheduler, PRIORITY_META, TRIGGER_SOURCE_META, QUEUE_STATUS_META } from "@/hooks/useOpenClawScheduler";
import { useOpenClawChannelActions, CHANNEL_META, STATUS_META, TRIGGER_MODE_META } from "@/hooks/useOpenClawChannelActions";
import { useOpenClawScheduledRuns, SCHEDULE_PLAN, CRON_JOBS_PROOF } from "@/hooks/useOpenClawScheduledRuns";
import { useOpenClawCronDiagnostic } from "@/hooks/useOpenClawCronDiagnostic";
import { useOpenClawDeliveries, DELIVERY_STATUS_META, CHANNEL_CAPABILITY_MATRIX, getChannelCapability, getDispatchLabel } from "@/hooks/useOpenClawDeliveries";
import { formatDateRelative } from "@/lib/formatLocale";

type TabId = "runtime" | "channels" | "queue" | "jobs" | "executions" | "canal" | "sessions" | "tools" | "boundary" | "control";

function formatFuture(iso: string | null, lang: string) {
  if (!iso) return "—";
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) {
    return lang === "fr" ? "bientôt" : lang === "es" ? "pronto" : "soon";
  }
  if (diff < 3600000) {
    const m = Math.floor(diff / 60000);
    return lang === "fr" ? `dans ${m}min` : lang === "es" ? `en ${m}min` : `in ${m}min`;
  }
  if (diff < 86400000) {
    const h = Math.floor(diff / 3600000);
    return lang === "fr" ? `dans ${h}h` : lang === "es" ? `en ${h}h` : `in ${h}h`;
  }
  const d = Math.floor(diff / 86400000);
  return lang === "fr" ? `dans ${d}j` : lang === "es" ? `en ${d}d` : `in ${d}d`;
}

function HealthRing({ score }: { score: number }) {
  const color = score >= 80 ? "hsl(var(--success))"
    : score >= 50 ? "hsl(218 72% 50%)"
    : "hsl(38 80% 40%)";
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg width="64" height="64" className="absolute inset-0 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }} />
      </svg>
      <span className="text-sm font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

function StatusDot({ ok, pulse }: { ok: boolean; pulse?: boolean }) {
  const color = ok ? "hsl(var(--success))" : "hsl(var(--muted-foreground))";
  return (
    <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${pulse && ok ? "animate-pulse" : ""}`}
      style={{ background: color }} />
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CONTROL PANEL — pg_cron status + manual triggers + healthcheck + recent runs
───────────────────────────────────────────────────────────────────────────── */
import { supabase } from "@/integrations/supabase/client";
import type { SchedulerHeartbeat } from "@/hooks/useOpenClawScheduler";
import type { JobExecution } from "@/hooks/useOpenClawExecutions";

const CRON_JOBS_LIVE = [
  { name: "openclaw-scheduler-tick", schedule: "*/5 * * * *",  desc: "Tick rapide — jobs urgents & normaux",  jobid: 4 },
  { name: "openclaw-daily-sweep",    schedule: "0 7 * * *",    desc: "Sweep quotidien — brief + relances",     jobid: 5 },
  { name: "openclaw-weekly-sweep",   schedule: "0 6 * * 1",    desc: "Sweep hebdomadaire — trust + matching",  jobid: 6 },
];

function HeartbeatDot({ lastBeat }: { lastBeat: string | null }) {
  if (!lastBeat) return <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "hsl(var(--muted-foreground))" }} />;
  const ageMin = (Date.now() - new Date(lastBeat).getTime()) / 60000;
  const color = ageMin < 10 ? "hsl(var(--success))" : ageMin < 60 ? "hsl(38 80% 50%)" : "hsl(0 65% 45%)";
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${ageMin < 10 ? "animate-pulse" : ""}`} style={{ background: color }} />;
}

interface ControlPanelProps {
  latestHeartbeat: SchedulerHeartbeat | null;
  engineHealthy: boolean;
  heartbeats: SchedulerHeartbeat[];
  recentExecutions: JobExecution[];
  healthcheckResult: Record<string, unknown> | null;
  healthcheckLoading: boolean;
  setHealthcheckResult: (r: Record<string, unknown> | null) => void;
  setHealthcheckLoading: (v: boolean) => void;
}

function ControlPanel({
  latestHeartbeat, engineHealthy, heartbeats, recentExecutions,
  healthcheckResult, healthcheckLoading, setHealthcheckResult, setHealthcheckLoading,
}: ControlPanelProps) {
  const [triggeringType, setTriggeringType] = useState<string | null>(null);

  const lastBeatAt = latestHeartbeat?.beat_at ?? null;
  const ageMin = lastBeatAt ? (Date.now() - new Date(lastBeatAt).getTime()) / 60000 : null;
  const heartbeatStatus = ageMin === null ? "unknown" : ageMin < 10 ? "ok" : ageMin < 60 ? "degraded" : "critical";
  const heartbeatColor = heartbeatStatus === "ok" ? "hsl(var(--success))" : heartbeatStatus === "degraded" ? "hsl(38 80% 50%)" : "hsl(0 65% 45%)";
  const heartbeatLabel = heartbeatStatus === "ok" ? "Actif" : heartbeatStatus === "degraded" ? "Dégradé" : heartbeatStatus === "critical" ? "Inactif" : "Inconnu";

  const handleTrigger = async (tickType: string) => {
    setTriggeringType(tickType);
    try {
      const { data, error } = await supabase.functions.invoke("openclaw-scheduler", {
        body: { tick_type: tickType, source: "manual_ui" },
      });
      if (error) throw error;
      const result = data as { ok?: boolean; jobs_completed?: number; jobs_claimed?: number; error?: string };
      if (result.ok !== false) {
        toast.success(tickType === "manual_scan" ? "Scan lancé." : "Brief généré.", {
          description: (result.jobs_completed ?? 0) > 0 ? `${result.jobs_completed} job(s) terminé(s)` : "Aucun job en attente.",
        });
      } else {
        toast.error("Erreur scheduler.", { description: result.error });
      }
    } catch (e: unknown) {
      toast.error("Erreur scheduler.", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setTriggeringType(null);
    }
  };

  const handleHealthcheck = async () => {
    setHealthcheckLoading(true);
    setHealthcheckResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("openclaw-healthcheck", { body: {} });
      if (error) throw error;
      setHealthcheckResult(data as Record<string, unknown>);
      toast.success("Healthcheck OK");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      setHealthcheckResult({ error: msg });
      toast.error("Healthcheck échoué", { description: msg });
    } finally {
      setHealthcheckLoading(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* ── Heartbeat indicator ─────────────────────────────────────────── */}
      <div className="rounded-2xl p-4 relative overflow-hidden"
        style={{
          background: engineHealthy
            ? "linear-gradient(135deg, hsl(218 65% 8%), hsl(218 55% 11%))"
            : "linear-gradient(135deg, hsl(0 40% 9%), hsl(0 35% 12%))",
          border: `1px solid ${engineHealthy ? "hsl(218 40% 22% / 0.5)" : "hsl(0 40% 28% / 0.5)"}`,
        }}>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <HeartbeatDot lastBeat={lastBeatAt} />
              <p className="text-white font-bold text-sm">
                Heartbeat pg_cron — {heartbeatLabel}
              </p>
            </div>
            <p className="text-white/40 text-xs">
              {lastBeatAt
                ? `Dernier cycle : ${new Date(lastBeatAt).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` +
                  ` · ${ageMin !== null ? Math.round(ageMin) : "?"}min ago` +
                  (latestHeartbeat ? ` · ${latestHeartbeat.jobs_completed} terminé(s)` : "")
                : "Aucun heartbeat enregistré. Le scheduler tourne toutes les 5 min via pg_cron."}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: `${heartbeatColor}22`, color: heartbeatColor }}>
              {heartbeatLabel}
            </span>
          </div>
        </div>

        {/* Cron jobs status */}
        <div className="mt-4 space-y-2">
          {CRON_JOBS_LIVE.map((job) => (
            <div key={job.name} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "hsl(218 40% 14% / 0.7)" }}>
              <Timer size={12} className="text-white/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{job.name}</p>
                <p className="text-xs text-white/40">{job.desc}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-white/60 font-mono">{job.schedule}</span>
                <div className="flex items-center gap-1 justify-end mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(var(--success))" }} />
                  <span className="text-xs" style={{ color: "hsl(var(--success))" }}>Actif · job#{job.jobid}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Manual controls ─────────────────────────────────────────────── */}
      <div className="card-surface p-4">
        <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
          <Zap size={12} className="text-primary" /> Déclenchement manuel
        </p>
        <div className="grid grid-cols-1 gap-2">
          {[
            {
              id: "manual_scan",
              label: "Lancer un scan maintenant",
              desc: "Exécute un cycle complet : radar, opportunités, actions",
              icon: "📡",
            },
            {
              id: "daily_brief",
              label: "Générer le brief du jour",
              desc: "Produit le résumé quotidien immédiatement",
              icon: "📋",
            },
          ].map(({ id, label, desc, icon }) => (
            <button
              key={id}
              onClick={() => handleTrigger(id)}
              disabled={!!triggeringType}
              className="flex items-center gap-3 p-3 rounded-xl text-left transition-all disabled:opacity-50"
              style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
              <span className="text-xl shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              {triggeringType === id
                ? <RefreshCw size={14} className="animate-spin text-primary shrink-0" />
                : <Play size={14} className="text-primary shrink-0" />}
            </button>
          ))}

          {/* Healthcheck */}
          <button
            onClick={handleHealthcheck}
            disabled={healthcheckLoading}
            className="flex items-center gap-3 p-3 rounded-xl text-left transition-all disabled:opacity-50"
            style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <span className="text-xl shrink-0">🩺</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Vérifier le heartbeat</p>
              <p className="text-xs text-muted-foreground">Appelle openclaw-healthcheck et affiche le résultat</p>
            </div>
            {healthcheckLoading
              ? <RefreshCw size={14} className="animate-spin text-primary shrink-0" />
              : <Stethoscope size={14} className="text-primary shrink-0" />}
          </button>
        </div>

        {/* Healthcheck result */}
        {healthcheckResult && (
          <div className="mt-3 rounded-xl p-3 font-mono text-xs overflow-auto max-h-40"
            style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            {Object.entries(healthcheckResult).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="text-muted-foreground">{k}:</span>
                <span className="text-foreground">{JSON.stringify(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 10 derniers runs ────────────────────────────────────────────── */}
      <div className="card-surface p-4">
        <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
          <BarChart3 size={12} className="text-primary" /> 10 derniers runs
        </p>
        {recentExecutions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Aucun run enregistré.</p>
        ) : (
          <div className="space-y-2">
            {recentExecutions.slice(0, 10).map((ex) => {
              const meta = JOB_TYPE_LIBRARY[ex.job_type];
              const statusColor = ex.status === "termine" ? "hsl(var(--success))"
                : ex.status === "en_cours" ? "hsl(218 72% 55%)"
                : ex.status === "erreur" ? "hsl(0 65% 45%)"
                : "hsl(var(--muted-foreground))";
              const statusLabel = ex.status === "termine" ? "Terminé"
                : ex.status === "en_cours" ? "En cours"
                : ex.status === "erreur" ? "Erreur"
                : ex.status === "planifie" ? "Planifié" : ex.status;
              const durationLabel = ex.duration_ms
                ? ex.duration_ms < 1000 ? `${ex.duration_ms}ms` : `${(ex.duration_ms / 1000).toFixed(1)}s`
                : "—";

              return (
                <div key={ex.id} className="flex items-center gap-2.5 p-2.5 rounded-xl"
                  style={{ background: "hsl(var(--muted))" }}>
                  <span className="text-base shrink-0">{meta?.icon ?? "⚙️"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {meta?.label ?? ex.job_type}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {ex.output_summary ?? ex.last_error ?? "—"}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="text-xs font-bold" style={{ color: statusColor }}>{statusLabel}</p>
                    <p className="text-xs text-muted-foreground">{durationLabel}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Derniers heartbeats ─────────────────────────────────────────── */}
      {heartbeats.length > 0 && (
        <div className="card-surface p-4">
          <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
            <Activity size={11} className="text-primary" /> Heartbeats récents
          </p>
          <div className="space-y-1.5">
            {heartbeats.slice(0, 8).map((hb) => {
              const hbColor = hb.engine_status === "ok" ? "hsl(var(--success))"
                : hb.engine_status === "idle" ? "hsl(var(--muted-foreground))"
                : "hsl(38 80% 40%)";
              const hbAgeMin = (Date.now() - new Date(hb.beat_at).getTime()) / 60000;
              return (
                <div key={hb.id} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: hbColor }} />
                  <span className="text-muted-foreground w-12 shrink-0">
                    {Math.round(hbAgeMin) < 1 ? "< 1min" : `${Math.round(hbAgeMin)}min`}
                  </span>
                  <span className="flex-1 text-foreground">
                    {hb.engine_status === "idle" ? "Inactif (aucun job)" : `${hb.jobs_completed} terminé(s)`}
                    {hb.jobs_failed > 0 && ` · ⚠️ ${hb.jobs_failed} échoué(s)`}
                    {hb.jobs_claimed > 0 && ` · ${hb.jobs_claimed} traité(s)`}
                  </span>
                  <span className="text-muted-foreground/60 shrink-0">
                    {new Date(hb.beat_at).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Operations() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [activeTab, setActiveTab] = useState<TabId>("control");
  const [probingChannel, setProbingChannel] = useState<string | null>(null);
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);
  const [healthcheckResult, setHealthcheckResult] = useState<Record<string, unknown> | null>(null);
  const [healthcheckLoading, setHealthcheckLoading] = useState(false);

  const {
    actions: channelActions,
    preparedActions, pendingApprovals: chPendingApprovals,
    whileYouSlept, approveAction, cancelAction, loadAll: reloadChannelActions,
  } = useOpenClawChannelActions();
  const {
    isCronActive, lastTick, todayRuns, cronRunStatus,
    smokeTesting, lastSmokeResult, runSmokeTest,
  } = useOpenClawScheduledRuns();
  const {
    diagnostics: cronDiagnostics, loading: cronDiagLoading,
    infraScore, allConfiguredInRepo, allConfiguredInDb, tickIsActive, lastChecked: cronCheckedAt,
    reload: reloadCronDiag,
  } = useOpenClawCronDiagnostic();
  const {
    deliveries, dispatchedToday, failedToday, repliedToday, pendingApproval: deliveryPendingApproval,
    queued: deliveryQueued, allDispatched, allFailed: allDeliveryFailed, allReplied,
    byChannel: deliveriesByChannel, deliveryRate,
    dispatchAction, loadAll: reloadDeliveries, dispatching,
  } = useOpenClawDeliveries();

  const {
    channels, jobs, contextSessions, loading: runtimeLoading,
    readyChannels, blockedChannels, activeJobs, nextJob, healthScore,
    autonomieLevel, getEffectiveAccess, toggleJob, triggerJob, probeChannel,
  } = useOpenClawRuntime();

  const { runs, sessions, memory, activeRun, blockedRuns, loading: runsLoading } = useOpenClawRuns();
  const { config, pendingValidations } = useOpenClaw();
  const {
    recentExecutions, failedExecutions, runningExecutions,
    totalOutputs, totalRecs, totalActions, lastExecutionByType,
    executeJob, loading: execLoading,
  } = useOpenClawExecutions();

  const {
    queue, heartbeats, loading: schedulerLoading,
    pendingJobs, runningJobs: queueRunning, failedJobs: queueFailed, doneToday,
    overdueJobs, autoJobs, manualJobs,
    latestHeartbeat, engineHealthy,
    totalOutputToday, motor1Done, motor2Done,
    triggerScheduler, enqueueEvent, triggering: schedulerTriggering,
  } = useOpenClawScheduler();

  const loading = runtimeLoading || runsLoading;

  const handleProbe = async (channelId: string) => {
    setProbingChannel(channelId);
    await probeChannel(channelId);
    setProbingChannel(null);
  };

  const handleTriggerJob = async (job: Parameters<typeof triggerJob>[0]) => {
    setTriggeringJob(job.id);
    await triggerJob(job);
    setTriggeringJob(null);
  };

  const handleExecuteJob = async (jobType: string, jobId?: string) => {
    setTriggeringJob(jobId || jobType);
    const result = await executeJob(jobType, jobId);
    setTriggeringJob(null);
    if (result.success) {
      toast.success(result.summary || "Job exécuté.", { description: result.outputCount ? `${result.outputCount} sortie${result.outputCount > 1 ? "s" : ""} produite${result.outputCount > 1 ? "s" : ""}` : undefined });
    } else {
      toast.error("Le job a échoué.", { description: result.error });
    }
  };

  const handleSchedulerTick = async () => {
    const result = await triggerScheduler();
    if (result.ok) {
      toast.success(`Cycle autonome exécuté.`, {
        description: result.completed > 0
          ? `${result.completed} job${result.completed > 1 ? "s" : ""} terminé${result.completed > 1 ? "s" : ""}`
          : result.claimed === 0 ? "Aucun job en attente pour l'instant." : undefined,
      });
    } else {
      toast.error("Le scheduler a rencontré un problème.", { description: result.error });
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "control",    label: "Control",    icon: CalendarClock },
    { id: "runtime",    label: "Runtime",    icon: Brain },
    { id: "queue",      label: "File",       icon: ListChecks, badge: (pendingJobs.length + overdueJobs.length) || undefined },
    { id: "canal",      label: "Canal",      icon: Radio,      badge: (chPendingApprovals.length + preparedActions.length) || undefined },
    { id: "channels",   label: "Canaux",     icon: Wifi,       badge: blockedChannels.length || undefined },
    { id: "jobs",       label: "Cycles",     icon: Clock },
    { id: "executions", label: "Exécutions", icon: BarChart3,  badge: failedExecutions.length || undefined },
    { id: "sessions",   label: "Sessions",   icon: Layers },
    { id: "tools",      label: "Outils",     icon: Cpu },
    { id: "boundary",   label: "Sécurité",   icon: Lock },
  ];

  if (loading) {
    return (
      <UserLayout jarvisContext="agents">
        <div className="max-w-2xl mx-auto flex items-center justify-center h-48">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Brain size={20} className="animate-pulse" />
            <span className="text-sm">Initialisation du runtime…</span>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout jarvisContext="agents">
      <div className="max-w-2xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <Brain size={20} className="text-primary" />
              OpenClaw Operations
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Runtime complet — health, canaux, cycles, sessions, outils, sécurité
            </p>
          </div>
          <Link to="/agents"
            className="text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 bg-muted hover:bg-secondary transition-colors">
            <Settings2 size={12} className="text-primary" />
            Agent OS
          </Link>
        </div>

        {/* ── Kill switch banner ──────────────────────────────────────────── */}
        {config?.kill_switch_global && (
          <div className="rounded-2xl p-3 mb-4 flex items-center gap-3"
            style={{ background: "hsl(0 65% 95%)", border: "1px solid hsl(0 65% 85%)" }}>
            <AlertCircle size={14} style={{ color: "hsl(0 65% 40%)" }} className="shrink-0" />
            <p className="text-xs font-semibold" style={{ color: "hsl(0 65% 40%)" }}>
              Kill Switch global activé. Tous les agents sont stoppés.
            </p>
            <Link to="/agents" className="ml-auto text-xs underline" style={{ color: "hsl(0 65% 40%)" }}>
              Réactiver
            </Link>
          </div>
        )}

        {/* ── Validations urgentes ────────────────────────────────────────── */}
        {pendingValidations.length > 0 && (
          <Link to="/validations">
            <div className="rounded-2xl p-3 mb-4 flex items-center justify-between"
              style={{ background: "hsl(38 80% 90%)", border: "1px solid hsl(38 80% 75%)" }}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={13} style={{ color: "hsl(38 80% 30%)" }} />
                <p className="text-xs font-semibold" style={{ color: "hsl(38 80% 30%)" }}>
                  {pendingValidations.length} action{pendingValidations.length > 1 ? "s" : ""} attend{pendingValidations.length > 1 ? "ent" : ""} votre accord
                </p>
              </div>
              <ChevronRight size={13} style={{ color: "hsl(38 80% 30%)" }} />
            </div>
          </Link>
        )}

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-2xl mb-5 overflow-x-auto" style={{ background: "hsl(var(--muted))" }}>
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="relative flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2 px-2 rounded-xl transition-all whitespace-nowrap"
                style={{
                  background: activeTab === t.id ? "hsl(var(--background))" : "transparent",
                  color: activeTab === t.id ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  minWidth: "fit-content",
                }}>
                <Icon size={12} />
                <span className="hidden sm:inline">{t.label}</span>
                {t.badge ? (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-xs font-bold flex items-center justify-center"
                    style={{ background: "hsl(38 80% 40%)", color: "white", fontSize: "9px" }}>
                    {t.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB: RUNTIME
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "runtime" && (
          <div className="space-y-4">

            {/* Score global */}
            <div className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, hsl(218 65% 9%), hsl(218 55% 12%))", border: "1px solid hsl(218 40% 22% / 0.5)" }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse 60% 80% at 85% 50%, hsl(218 72% 40% / 0.1) 0%, transparent 70%)" }} />
              <div className="relative z-10 flex items-center gap-5">
                <HealthRing score={healthScore} />
                <div className="flex-1">
                  <p className="text-white font-bold text-base mb-0.5">Score de santé du cerveau</p>
                  <p className="text-white/40 text-xs">
                    {healthScore >= 80 ? "Le cerveau est en pleine forme. Vos agents travaillent efficacement."
                      : healthScore >= 50 ? "Le cerveau fonctionne. Quelques canaux ou cycles méritent attention."
                      : "Le cerveau a besoin de configuration pour atteindre son potentiel maximum."}
                  </p>
                </div>
              </div>

              <div className="relative z-10 mt-4 grid grid-cols-4 gap-2">
                {[
                  { label: "Canaux prêts", value: readyChannels.length, total: channels.length, ok: readyChannels.length > 0 },
                  { label: "Cycles actifs", value: jobs.filter(j => j.enabled).length, total: jobs.length, ok: jobs.filter(j => j.enabled).length > 0 },
                  { label: "Sessions", value: sessions.filter(s => s.status === "active").length, total: sessions.length, ok: sessions.filter(s => s.status === "active").length > 0 },
                  { label: "En attente", value: pendingValidations.length, total: undefined, ok: pendingValidations.length === 0 },
                ].map(({ label, value, total, ok }) => (
                  <div key={label} className="text-center py-2 rounded-xl" style={{ background: "hsl(218 40% 14% / 0.8)" }}>
                    <p className="text-xs font-bold" style={{ color: ok ? "hsl(var(--success))" : "hsl(38 80% 60%)" }}>
                      {value}{total !== undefined ? `/${total}` : ""}
                    </p>
                    <p className="text-xs text-white/30">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* État runtime rapide */}
            <div className="card-surface p-4 space-y-3">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Activity size={12} className="text-primary" /> État runtime
              </p>
              {[
                {
                  label: "Cerveau principal",
                  ok: !config?.kill_switch_global,
                  desc: config?.kill_switch_global ? "Kill switch actif" : "OpenClaw opérationnel",
                  pulse: !config?.kill_switch_global,
                },
                {
                  label: "Gateway connecté",
                  ok: !!config?.gateway_url && config?.is_connected !== false,
                  desc: config?.gateway_url
                    ? (config?.is_connected ? "Gateway joignable" : "Dernière sonde échouée")
                    : "Aucun gateway configuré",
                  pulse: !!config?.gateway_url && config?.is_connected !== false,
                },
                {
                  label: "Run actif",
                  ok: !!activeRun,
                  desc: activeRun ? `${RUN_TYPE_LABELS[activeRun.run_type]?.label} en cours` : "Aucun cycle en cours",
                  pulse: !!activeRun,
                },
                {
                  label: "Prochain réveil",
                  ok: !!nextJob,
                  desc: nextJob ? `${JOB_TYPE_META[nextJob.job_type]?.label ?? nextJob.job_name} ${formatFuture(nextJob.next_run_at, lang)}` : t("ops_no_job"),
                  pulse: false,
                },
                {
                  label: "Canaux opérationnels",
                  ok: readyChannels.length > 0,
                  desc: readyChannels.length > 0 ? `${readyChannels.map(c => c.channel_name).join(", ")}` : "Aucun canal prêt",
                  pulse: false,
                },
                {
                  label: "Mémoire active",
                  ok: memory.length > 0,
                  desc: memory.length > 0 ? `${memory.length} apprentissage${memory.length > 1 ? "s" : ""} stocké${memory.length > 1 ? "s" : ""}` : "Aucune mémoire encore",
                  pulse: false,
                },
              ].map(({ label, ok, desc, pulse }) => (
                <div key={label} className="flex items-center gap-3">
                  <StatusDot ok={ok} pulse={pulse} />
                  <span className="text-sm text-foreground flex-1">{label}</span>
                  <span className="text-xs text-muted-foreground text-right">{desc}</span>
                </div>
              ))}
            </div>

            {/* Agents actifs */}
            <div className="card-surface p-4">
              <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                <Zap size={12} className="text-primary" /> Essaim d'agents
              </p>
              <div className="grid grid-cols-2 gap-2">
                {BRAIN_AGENTS.map((agent) => {
                  const access = getEffectiveAccess(agent.id);
                  const accessMeta = TOOL_ACCESS_META[access];
                  const isInRun = runs.some(r => r.status === "en_cours" && r.agent_names?.includes(agent.id));
                  return (
                    <div key={agent.id} className="flex items-center gap-2 p-2.5 rounded-xl"
                      style={{ background: "hsl(var(--muted))" }}>
                      <span className="text-sm shrink-0">{agent.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{agent.label}</p>
                        <p className="text-xs font-medium" style={{ color: accessMeta?.color ?? "hsl(var(--muted-foreground))" }}>
                          {accessMeta?.icon} {accessMeta?.label ?? access}
                        </p>
                      </div>
                      {isInRun && <Radio size={8} className="shrink-0 animate-pulse text-primary" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activité récente */}
            {runs.length > 0 && (
              <div className="card-surface p-4">
                <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                  <RefreshCw size={11} className="text-primary" /> Activité récente
                </p>
                <div className="space-y-2">
                  {runs.slice(0, 5).map((run) => {
                    const meta = RUN_TYPE_LABELS[run.run_type];
                    return (
                      <div key={run.id} className="flex items-center gap-2.5">
                        <span className="text-sm shrink-0">{meta?.icon ?? "⚙️"}</span>
                        <p className="text-xs text-foreground flex-1 truncate">
                          {run.summary ?? meta?.label ?? run.run_type}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDateRelative(run.created_at, lang)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: QUEUE — File d'attente autonome réelle
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "queue" && (
          <div className="space-y-4">

            {/* Scheduler health + trigger */}
            <div className="rounded-2xl p-4 relative overflow-hidden"
              style={{
                background: engineHealthy
                  ? "linear-gradient(135deg, hsl(218 65% 8%), hsl(218 55% 11%))"
                  : "linear-gradient(135deg, hsl(38 80% 10%), hsl(38 65% 13%))",
                border: `1px solid ${engineHealthy ? "hsl(218 40% 22% / 0.5)" : "hsl(38 80% 35% / 0.5)"}`,
              }}>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${engineHealthy ? "animate-pulse" : ""}`}
                      style={{ background: engineHealthy ? "hsl(var(--success))" : "hsl(38 80% 60%)" }} />
                    <p className="text-white font-bold text-sm">
                      {latestHeartbeat
                        ? latestHeartbeat.engine_status === "idle" ? "Moteur autonome — en attente"
                          : latestHeartbeat.engine_status === "ok" ? "Moteur autonome — actif"
                          : latestHeartbeat.engine_status === "degraded" ? "Moteur autonome — dégradé"
                          : "Moteur autonome — erreur"
                        : "Moteur autonome — pas encore de heartbeat"}
                    </p>
                  </div>
                  <p className="text-white/40 text-xs">
                    {latestHeartbeat
                      ? `Dernier cycle : ${new Date(latestHeartbeat.beat_at).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · ${latestHeartbeat.jobs_completed} terminé${latestHeartbeat.jobs_completed !== 1 ? "s" : ""} · ${latestHeartbeat.jobs_failed} échoué${latestHeartbeat.jobs_failed !== 1 ? "s" : ""}`
                      : "Le scheduler tourne automatiquement toutes les 5 minutes via pg_cron."}
                  </p>
                </div>
                <button
                  onClick={handleSchedulerTick}
                  disabled={schedulerTriggering}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all whitespace-nowrap"
                  style={{ background: "hsl(218 72% 50% / 0.15)", color: "hsl(218 72% 65%)" }}>
                  {schedulerTriggering
                    ? <><RefreshCw size={11} className="animate-spin" /> En cours…</>
                    : <><Zap size={11} /> Cycle maintenant</>}
                </button>
              </div>

              {/* Moteur stats */}
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[
                  { label: "En attente",   value: pendingJobs.length,  color: "hsl(218 72% 55%)" },
                  { label: "En retard",    value: overdueJobs.length,  color: overdueJobs.length > 0 ? "hsl(38 80% 60%)" : "hsl(var(--success))" },
                  { label: "Terminés/j",   value: doneToday.length,    color: "hsl(var(--success))" },
                  { label: "Sorties/j",    value: totalOutputToday,    color: "hsl(var(--success))" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center py-2 rounded-xl" style={{ background: "hsl(218 40% 14% / 0.8)" }}>
                    <p className="text-xs font-bold" style={{ color }}>{value}</p>
                    <p className="text-xs text-white/30">{label}</p>
                  </div>
                ))}
              </div>

              {/* Motor split */}
              <div className="mt-2 flex gap-2">
                <div className="flex-1 rounded-xl px-3 py-2" style={{ background: "hsl(218 40% 14% / 0.6)" }}>
                  <p className="text-xs text-white/40">Moteur 1 — Prospection</p>
                  <p className="text-sm font-bold" style={{ color: "hsl(218 72% 55%)" }}>{motor1Done} jobs aujourd'hui</p>
                </div>
                <div className="flex-1 rounded-xl px-3 py-2" style={{ background: "hsl(218 40% 14% / 0.6)" }}>
                  <p className="text-xs text-white/40">Moteur 2 — Apport</p>
                  <p className="text-sm font-bold" style={{ color: "hsl(250 60% 60%)" }}>{motor2Done} jobs aujourd'hui</p>
                </div>
              </div>
            </div>

            {/* Overdue alert */}
            {overdueJobs.length > 0 && (
              <div className="rounded-2xl p-3 flex items-center gap-2"
                style={{ background: "hsl(38 80% 92%)", border: "1px solid hsl(38 80% 75%)" }}>
                <AlertTriangle size={13} style={{ color: "hsl(38 80% 30%)" }} />
                <p className="text-xs font-semibold flex-1" style={{ color: "hsl(38 80% 30%)" }}>
                  {overdueJobs.length} job{overdueJobs.length > 1 ? "s" : ""} en retard — le scheduler devrait les traiter dans le prochain cycle.
                </p>
              </div>
            )}

            {/* Queue items */}
            {queue.length === 0 ? (
              <div className="card-surface p-8 text-center">
                <ListChecks size={28} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm text-muted-foreground">File d'attente vide.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Les jobs se remplissent automatiquement via les événements métier et les cycles planifiés.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Active / pending first */}
                {[...queue]
                  .sort((a, b) => {
                    const order = { locked: 0, pending: 1, failed: 2, done: 3, cancelled: 4, waiting_approval: 1 };
                    return (order[a.status as keyof typeof order] ?? 5) - (order[b.status as keyof typeof order] ?? 5);
                  })
                  .slice(0, 30)
                  .map((job) => {
                    const jobMeta = JOB_TYPE_LIBRARY[job.job_type];
                    const statusMeta = QUEUE_STATUS_META[job.status] ?? { label: job.status, color: "hsl(var(--muted-foreground))" };
                    const priorityMeta = PRIORITY_META[job.priority] ?? PRIORITY_META.normale;
                    const triggerMeta = TRIGGER_SOURCE_META[job.trigger_source] ?? { label: job.trigger_source, icon: "⚙️" };
                    const isActive = job.status === "locked" || job.status === "pending";

                    return (
                      <div key={job.id} className="card-surface p-3">
                        <div className="flex items-start gap-2.5">
                          <span className="text-base shrink-0 mt-0.5">{jobMeta?.icon ?? "⚙️"}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <p className="text-xs font-semibold text-foreground truncate">
                                {jobMeta?.label ?? job.job_type}
                              </p>
                              <span className="text-xs font-bold whitespace-nowrap px-1.5 py-0.5 rounded-full"
                                style={{ background: `${statusMeta.color}18`, color: statusMeta.color }}>
                                {statusMeta.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs" style={{ color: priorityMeta.color }}>
                                {priorityMeta.badge} {priorityMeta.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {triggerMeta.icon} {triggerMeta.label}
                              </span>
                              {job.source_event && (
                                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                  {job.source_event}
                                </span>
                              )}
                            </div>
                            {job.error_summary && (
                              <p className="text-xs mt-1 truncate" style={{ color: "hsl(0 65% 45%)" }}>
                                ⚠️ {job.error_summary}
                              </p>
                            )}
                            {job.output_summary && job.status === "done" && (
                              <p className="text-xs mt-1 text-muted-foreground truncate">✓ {job.output_summary}</p>
                            )}
                            {job.retry_count > 0 && (
                              <p className="text-xs mt-0.5 text-muted-foreground">
                                Relancé {job.retry_count}× / max {job.max_retries}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">
                              {job.status === "pending"
                                ? new Date(job.scheduled_at) <= new Date()
                                  ? "Dû maintenant"
                                  : `Prévu ${new Date(job.scheduled_at).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                                : job.ended_at
                                  ? new Date(job.ended_at).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                                  : "—"}
                            </p>
                            {isActive && (
                              <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse mt-1"
                                style={{ background: "hsl(218 72% 55%)" }} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Heartbeat log */}
            {heartbeats.length > 0 && (
              <div className="card-surface p-4">
                <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                  <Activity size={11} className="text-primary" /> Derniers heartbeats scheduler
                </p>
                <div className="space-y-1.5">
                  {heartbeats.slice(0, 5).map((hb) => (
                    <div key={hb.id} className="flex items-center gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: hb.engine_status === "ok" ? "hsl(var(--success))" : hb.engine_status === "idle" ? "hsl(var(--muted-foreground))" : "hsl(38 80% 40%)" }} />
                      <span className="text-muted-foreground">
                        {new Date(hb.beat_at).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="flex-1 text-foreground">
                        {hb.engine_status === "idle" ? "Inactif" : `${hb.jobs_completed} terminé${hb.jobs_completed !== 1 ? "s" : ""}`}
                        {hb.jobs_failed > 0 && ` · ${hb.jobs_failed} échoué${hb.jobs_failed !== 1 ? "s" : ""}`}
                        {hb.jobs_due > 0 && hb.jobs_claimed === 0 && ` · ${hb.jobs_due} en attente`}
                      </span>
                      <span className="text-muted-foreground/60">{hb.note || ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: CHANNELS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "channels" && (
          <div className="space-y-3">
            <div className="rounded-2xl p-3 flex items-start gap-2"
              style={{ background: "hsl(var(--muted))" }}>
              <Wifi size={13} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                OpenClaw utilise les canaux prêts pour exécuter les actions. Un canal non configuré ne peut pas être utilisé par le cerveau.
              </p>
            </div>

            {channels.map((ch) => {
              const meta = CHANNEL_STATUS_META[ch.status] ?? CHANNEL_STATUS_META.non_configure;
              const isProbing = probingChannel === ch.channel_id;
              const probeSource: string = (ch as unknown as { config?: { probe_source?: string } }).config?.probe_source ?? "";
              const sourceLabel = probeSource === "live_gateway"
                ? { text: "Vérifié via gateway", color: "hsl(var(--success))" }
                : probeSource === "native_platform"
                  ? { text: "Intégré WIINUP", color: "hsl(218 72% 50%)" }
                  : ch.last_probe_at
                    ? { text: "Non encore sondé", color: "hsl(var(--muted-foreground))" }
                    : { text: "Non sondé", color: "hsl(var(--muted-foreground))" };

              const channelEmoji = ch.channel_id === "email" ? "📧"
                : ch.channel_id === "whatsapp" ? "💬"
                : ch.channel_id === "introduction" ? "🤝"
                : ch.channel_id === "phone" ? "📞"
                : ch.channel_id === "linkedin" ? "💼"
                : ch.channel_id === "telegram" ? "✈️"
                : ch.channel_id === "slack" ? "💼"
                : ch.channel_id === "discord" ? "🎮"
                : ch.channel_id === "webchat" ? "💬"
                : "📡";

              return (
                <div key={ch.id} className="card-surface p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: ch.is_ready ? "hsl(var(--success-light))" : "hsl(var(--muted))" }}>
                      {channelEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{ch.channel_name}</p>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: meta.bg, color: meta.color }}>
                          {meta.icon} {meta.label}
                        </span>
                      </div>
                      {/* Source du statut — honest */}
                      <p className="text-xs mt-0.5 font-medium" style={{ color: sourceLabel.color }}>
                        {sourceLabel.text}
                      </p>
                    </div>
                  </div>

                  {/* Probe detail — texte réel retourné par la fonction */}
                  {ch.probe_detail && (
                    <p className="text-xs text-muted-foreground mb-2 leading-relaxed italic">
                      {ch.probe_detail}
                    </p>
                  )}

                  {/* Latency & last probe */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {ch.probe_latency_ms != null && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {ch.probe_latency_ms}ms
                        </span>
                      )}
                      {ch.last_probe_at && (
                        <span className="text-xs text-muted-foreground">
                          Dernière sonde {formatDateRelative(ch.last_probe_at, lang)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {ch.is_openclaw_enabled ? (
                        <span className="text-xs font-medium flex items-center gap-1" style={{ color: "hsl(var(--success))" }}>
                          <Brain size={9} /> IA active
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">IA inactivée</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleProbe(ch.channel_id)}
                      disabled={isProbing}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl transition-all"
                      style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>
                      {isProbing ? <RefreshCw size={11} className="animate-spin" /> : <Eye size={11} />}
                      {isProbing ? "Sondage en cours…" : "Sonder maintenant"}
                    </button>
                    {(ch.status === "non_configure" || !ch.is_ready) && ch.channel_id !== "email" && ch.channel_id !== "introduction" && (
                      <Link to="/canaux"
                        className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl transition-all"
                        style={{ background: "hsl(218 72% 50% / 0.1)", color: "hsl(218 72% 50%)" }}>
                        <Settings2 size={11} /> Configurer
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: JOBS / CYCLES PLANIFIÉS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "jobs" && (
          <div className="space-y-3">

            {/* ── Infra-as-code: Cron diagnostic ─────────────────────────── */}
            <div className="rounded-2xl p-4"
              style={{ background: "linear-gradient(135deg, hsl(218 65% 8%), hsl(218 55% 11%))", border: "1px solid hsl(218 40% 22% / 0.5)" }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Radio size={11} className={tickIsActive ? "animate-pulse" : ""} style={{ color: tickIsActive ? "hsl(var(--success))" : "hsl(38 80% 55%)" }} />
                    Infra-as-code — schedules autonomes
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "hsl(218 40% 45%)" }}>
                    Source : <code className="font-mono" style={{ color: "hsl(218 72% 55%)", fontSize: "10px" }}>supabase/infra/cron-jobs.md</code>
                  </p>
                </div>
                <div className="text-xs font-bold px-2 py-1 rounded-xl"
                  style={{
                    background: infraScore >= 80 ? "hsl(var(--success-light))" : "hsl(38 80% 40% / 0.15)",
                    color: infraScore >= 80 ? "hsl(var(--success))" : "hsl(38 80% 60%)",
                  }}>
                  {infraScore}%
                </div>
              </div>

              <div className="space-y-2">
                {cronDiagnostics.map(cron => {
                  const obsStatus = cron.observed_status;
                  const obsColor =
                    obsStatus === "recently_active"             ? "hsl(var(--success))"
                    : obsStatus === "active"                    ? "hsl(218 72% 65%)"
                    : obsStatus === "seen_today"                ? "hsl(218 72% 55%)"
                    : obsStatus === "configured_never_run"      ? "hsl(38 80% 60%)"
                    : obsStatus === "configured_not_seen_recently" ? "hsl(0 65% 50%)"
                    : "hsl(var(--muted-foreground))";
                  const obsLabel =
                    obsStatus === "recently_active"             ? "⚡ Actif < 10min"
                    : obsStatus === "active"                    ? "✓ Actif < 1h"
                    : obsStatus === "seen_today"                ? "✓ Vu aujourd'hui"
                    : obsStatus === "configured_never_run"      ? "⏳ Pas encore observé"
                    : obsStatus === "configured_not_seen_recently" ? "⚠️ Pas vu récemment"
                    : "? Inconnu";

                  return (
                    <div key={cron.run_key} className="p-2.5 rounded-xl"
                      style={{ background: "hsl(218 40% 13% / 0.8)" }}>
                      <div className="flex items-start gap-2.5">
                        <span className="text-base shrink-0">{cron.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <p className="text-xs font-semibold text-white">{cron.label}</p>
                            <span className="px-1 py-0.5 rounded text-xs font-semibold"
                              style={{ background: cron.defined_in_repo ? "hsl(218 72% 50% / 0.15)" : "hsl(0 65% 50% / 0.15)", color: cron.defined_in_repo ? "hsl(218 72% 65%)" : "hsl(0 65% 55%)", fontSize: "9px" }}>
                              {cron.defined_in_repo ? "📁 Repo" : "✗ Absent repo"}
                            </span>
                            <span className="px-1 py-0.5 rounded text-xs font-semibold"
                              style={{ background: cron.configured_in_db ? "hsl(var(--success-light))" : "hsl(0 65% 50% / 0.15)", color: cron.configured_in_db ? "hsl(var(--success))" : "hsl(0 65% 55%)", fontSize: "9px" }}>
                              {cron.configured_in_db ? `✓ jobid:${cron.jobid}` : "✗ Absent base"}
                            </span>
                            <span className="px-1 py-0.5 rounded text-xs font-semibold"
                              style={{ background: `${obsColor}18`, color: obsColor, fontSize: "9px" }}>
                              {obsLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <code className="font-mono" style={{ color: "hsl(218 72% 45%)", fontSize: "10px" }}>{cron.schedule}</code>
                            <span className="text-xs" style={{ color: "hsl(218 40% 45%)" }}>{cron.schedule_label}</span>
                            {cron.last_cron_run_at && (
                              <span className="text-xs" style={{ color: "hsl(218 40% 40%)" }}>
                                · {formatDateRelative(cron.last_cron_run_at, lang)}
                              </span>
                            )}
                          </div>
                          {cron.real_cron_runs > 0 && (
                            <p className="text-xs mt-0.5" style={{ color: "hsl(218 40% 45%)" }}>
                              {cron.real_cron_runs} run{cron.real_cron_runs > 1 ? "s" : ""} cron · {cron.total_jobs_completed} jobs terminés
                            </p>
                          )}
                          {cron.inconsistency && (
                            <p className="text-xs mt-1 font-semibold" style={{ color: "hsl(0 65% 55%)" }}>
                              ⚠️ {cron.inconsistency}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-3">
                <p className="text-xs" style={{ color: "hsl(218 40% 35%)" }}>
                  pg_cron v1.6.4 · pg_net v0.19.5
                </p>
                <button onClick={reloadCronDiag}
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "hsl(218 40% 40%)" }}>
                  <RefreshCw size={9} /> Rafraîchir
                </button>
              </div>
            </div>

            {/* Honnêteté runtime */}
            <div className="rounded-2xl p-3 flex items-start gap-2"
              style={{ background: "hsl(var(--muted))" }}>
              <Clock size={13} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Les <strong>cycles planifiés</strong> ci-dessous sont votre plan de travail métier.
                  Ils sont exécutés par le scheduler autonome (5min tick) ou manuellement.
                </p>
              </div>
            </div>

            {jobs.map((job) => {
              const typeMeta = JOB_TYPE_META[job.job_type];
              const statusMeta = JOB_STATUS_META[job.status] ?? { label: job.status, color: "hsl(var(--muted-foreground))" };
              const isTriggering = triggeringJob === job.id;
              const everRan = job.run_count > 0;

              return (
                <div key={job.id} className="card-surface p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: job.enabled ? "hsl(var(--secondary))" : "hsl(var(--muted))" }}>
                      {typeMeta?.icon ?? "⚙️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{typeMeta?.label ?? job.job_name}</p>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1"
                          style={{ background: `${statusMeta.color}18`, color: statusMeta.color }}>
                          {statusMeta.pulse && <Radio size={8} className="animate-pulse" />}
                          {statusMeta.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{typeMeta?.desc ?? ""}</p>
                      <p className="text-xs mt-0.5 font-medium"
                        style={{ color: everRan ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }}>
                        {everRan ? `✓ A tourné ${job.run_count} fois` : "Plan de travail — pas encore déclenché"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center py-1.5 rounded-lg bg-muted">
                      <p className="text-xs font-bold text-foreground">{formatFuture(job.next_run_at, lang)}</p>
                      <p className="text-xs text-muted-foreground">Prochain</p>
                    </div>
                    <div className="text-center py-1.5 rounded-lg bg-muted">
                      <p className="text-xs font-bold text-foreground">{job.run_count}</p>
                      <p className="text-xs text-muted-foreground">Cycles</p>
                    </div>
                    <div className="text-center py-1.5 rounded-lg bg-muted">
                      <p className="text-xs font-bold" style={{ color: job.error_count > 0 ? "hsl(38 80% 40%)" : "hsl(var(--success))" }}>
                        {job.error_count > 0 ? job.error_count : "✓"}
                      </p>
                      <p className="text-xs text-muted-foreground">Erreurs</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTriggerJob(job)}
                      disabled={isTriggering || !job.enabled || !!config?.kill_switch_global}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl transition-all disabled:opacity-40"
                      style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))" }}>
                      {isTriggering ? <RefreshCw size={11} className="animate-spin" /> : <Play size={11} />}
                      {isTriggering ? "Lancement…" : "Lancer maintenant"}
                    </button>
                    <button
                      onClick={() => toggleJob(job.id, !job.enabled)}
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl transition-all"
                      style={{
                        background: job.enabled ? "hsl(0 65% 95%)" : "hsl(var(--success-light))",
                        color: job.enabled ? "hsl(0 65% 40%)" : "hsl(var(--success))",
                      }}>
                      {job.enabled ? <XCircle size={11} /> : <Play size={11} />}
                    </button>
                  </div>
                </div>
              );
            })}

            {jobs.length === 0 && (
              <div className="card-surface p-8 text-center">
                <Clock size={28} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm text-muted-foreground">Les cycles se chargent…</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: EXECUTIONS RÉELLES
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "executions" && (
          <div className="space-y-3">
            {/* Totaux réels */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Sorties totales",  value: totalOutputs,  ok: totalOutputs > 0 },
                { label: "Recommandations",  value: totalRecs,     ok: totalRecs > 0 },
                { label: "Actions créées",   value: totalActions,  ok: totalActions > 0 },
              ].map(({ label, value, ok }) => (
                <div key={label} className="card-surface p-3 text-center">
                  <p className="text-base font-bold" style={{ color: ok ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }}>{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Lancer des jobs réels */}
            <div className="card-surface p-4">
              <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                <Zap size={12} className="text-primary" /> Exécuter un job maintenant
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(JOB_TYPE_LIBRARY).map(([type, meta]) => {
                  const lastExec = lastExecutionByType[type];
                  const isRunning = triggeringJob === type;
                  const correspondingJob = jobs.find(j => j.job_type === type);
                  return (
                    <button key={type}
                      onClick={() => handleExecuteJob(type, correspondingJob?.id)}
                      disabled={isRunning || config?.kill_switch_global === true}
                      className="text-left p-3 rounded-xl transition-all disabled:opacity-50"
                      style={{ background: isRunning ? "hsl(218 72% 50% / 0.08)" : "hsl(var(--muted))" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{meta.icon}</span>
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full ml-auto"
                          style={{ background: meta.motor === "prospection" ? "hsl(218 72% 95%)" : "hsl(24 100% 95%)", color: meta.motor === "prospection" ? "hsl(218 72% 40%)" : "hsl(24 100% 40%)", fontSize: "9px" }}>
                          {meta.motor === "prospection" ? "Moteur 1" : "Moteur 2"}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-foreground">{meta.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isRunning ? "En cours…" : lastExec?.output_summary
                          ? lastExec.output_summary.slice(0, 38) + (lastExec.output_summary.length > 38 ? "…" : "")
                          : meta.desc}
                      </p>
                      {lastExec && !isRunning && (
                        <p className="text-xs mt-1 font-semibold" style={{ color: lastExec.status === "termine" ? "hsl(var(--success))" : "hsl(0 65% 40%)" }}>
                          {EXEC_STATUS_META[lastExec.status]?.label}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Historique exécutions */}
            {recentExecutions.length > 0 ? (
              <div className="card-surface p-4">
                <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                  <BarChart3 size={12} className="text-primary" /> Historique d'exécution
                </p>
                <div className="space-y-2">
                  {recentExecutions.map((exec) => {
                    const meta = JOB_TYPE_LIBRARY[exec.job_type];
                    const statusMeta = EXEC_STATUS_META[exec.status];
                    return (
                      <div key={exec.id} className="flex items-start gap-3 py-1.5 border-b border-border/30 last:border-0">
                        <span className="text-base shrink-0 mt-0.5">{meta?.icon ?? "⚙️"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{exec.output_summary || meta?.label}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {exec.recommendations_created > 0 && <span className="text-xs text-muted-foreground">+{exec.recommendations_created} reco.</span>}
                            {exec.actions_created > 0 && <span className="text-xs text-muted-foreground">+{exec.actions_created} action{exec.actions_created > 1 ? "s" : ""}</span>}
                            {exec.trust_updates > 0 && <span className="text-xs text-muted-foreground">trust ↑</span>}
                            <span className="text-xs font-semibold" style={{ color: statusMeta?.color }}>{statusMeta?.label}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">{new Date(exec.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                          {exec.duration_ms && <p className="text-xs text-muted-foreground">{exec.duration_ms}ms</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="card-surface p-8 text-center">
                <BarChart3 size={28} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium text-foreground mb-1">Aucune exécution encore</p>
                <p className="text-xs text-muted-foreground">Lancez un job pour voir les résultats ici.</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: CANAL — Real delivery + receipts + outcome loop
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "canal" && (
          <div className="space-y-4">

            {/* Delivery stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Préparées",   value: preparedActions.length + chPendingApprovals.length, color: "hsl(218 72% 55%)" },
                { label: "Envoyées",   value: allDispatched.length,    color: "hsl(var(--success))" },
                { label: "Réponses",   value: allReplied.length,       color: "hsl(280 60% 55%)" },
                { label: "Échecs",     value: allDeliveryFailed.length, color: "hsl(0 65% 45%)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="card-surface p-3 text-center">
                  <p className="text-base font-bold" style={{ color }}>{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Channel capability matrix */}
            <div className="card-surface p-4">
              <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                <Wifi size={12} className="text-primary" /> Matrice de dispatch par canal
              </p>
              <div className="space-y-2">
                {CHANNEL_CAPABILITY_MATRIX.map(cap => {
                  const dispatch = getDispatchLabel(cap);
                  const channelDeliveries = deliveriesByChannel[cap.channel] || [];
                  const sent = channelDeliveries.filter(d => d.dispatch_status === "dispatched" || d.dispatch_status === "delivered").length;
                  return (
                    <div key={cap.channel} className="flex items-center gap-3 py-1.5 border-b border-border/20 last:border-0">
                      <span className="text-base shrink-0">{cap.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">{cap.channel_name}</p>
                        <p className="text-xs mt-0.5" style={{ color: dispatch.color }}>
                          {dispatch.badge} {dispatch.label}
                        </p>
                      </div>
                      {sent > 0 && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}>
                          {sent} envoyé{sent > 1 ? "s" : ""}
                        </span>
                      )}
                      {!cap.can_send_validated && !cap.can_auto_send && (
                        <span className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                          {cap.availability === "export" ? "Export humain" : "Préparé"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resend status banner */}
            <div className="rounded-2xl p-3 flex items-center gap-2.5"
              style={{ background: "hsl(142 65% 97%)", border: "1px solid hsl(142 65% 85%)" }}>
              <span className="text-base shrink-0">📧</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold" style={{ color: "hsl(142 65% 35%)" }}>
                  Email via Resend — Actif
                </p>
                <p className="text-xs" style={{ color: "hsl(142 55% 45%)" }}>
                  Les actions email sont envoyées en réel via Resend. Adresse destinataire requise dans le payload.
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-lg shrink-0"
                style={{ background: "hsl(142 65% 88%)", color: "hsl(142 65% 30%)" }}>
                ✓ Configuré
              </span>
            </div>

            {/* Accord requis */}
            {chPendingApprovals.length > 0 && (
              <div>
                <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle size={11} style={{ color: "hsl(38 80% 45%)" }} />
                  Accord requis ({chPendingApprovals.length})
                </p>
                <div className="space-y-2">
                  {chPendingApprovals.map((a) => {
                    const chMeta = CHANNEL_META[a.channel] ?? { emoji: "📡", label: a.channel, color: "hsl(var(--muted-foreground))" };
                    const cap = getChannelCapability(a.channel);
                    const dispatch = getDispatchLabel(cap);
                    const isEmail = a.channel === "email";
                    return (
                      <div key={a.id} className="card-surface p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                            style={{ background: "hsl(38 80% 40% / 0.12)" }}>
                            {chMeta.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <p className="text-xs font-semibold text-foreground">{chMeta.label}</p>
                              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                                style={{ background: `${dispatch.color}22`, color: dispatch.color }}>
                                {dispatch.badge} {dispatch.label}
                              </span>
                              {isEmail && (
                                <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                                  style={{ background: "hsl(142 65% 88%)", color: "hsl(142 65% 30%)", fontSize: "9px" }}>
                                  ✉️ Resend
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              {a.payload_summary || `Action ${a.action_type} préparée`}
                            </p>
                            {cap.honest_note && (
                              <p className="text-xs mt-1 italic" style={{ color: "hsl(var(--muted-foreground) / 0.7)" }}>
                                {cap.honest_note}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {cap.can_send_validated && (
                            <button
                              onClick={async () => {
                                const r = await dispatchAction(a.id, "validated");
                                if (r.ok) {
                                  toast.success(isEmail ? "Email envoyé via Resend ✉️" : "Action envoyée après validation.", {
                                    description: isEmail ? "Livraison trackée dans l'historique." : undefined,
                                  });
                                } else {
                                  toast.error(r.error ?? "Erreur d'envoi", { description: isEmail ? "Vérifiez que le payload contient un email destinataire." : undefined });
                                }
                              }}
                              disabled={dispatching === a.id}
                              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl transition-all"
                              style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}>
                              {dispatching === a.id ? <RefreshCw size={11} className="animate-spin" /> : <Send size={11} />}
                              {isEmail ? "Envoyer via Resend" : cap.availability === "export" ? "Marquer envoyé" : "Envoyer"}
                            </button>
                          )}
                          {!cap.can_send_validated && (
                            <button
                              onClick={() => { approveAction(a.id); toast.success("Action approuvée pour export."); }}
                              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl transition-all"
                              style={{ background: "hsl(218 72% 50% / 0.12)", color: "hsl(218 72% 55%)" }}>
                              <Package size={11} /> Prêt à exporter
                            </button>
                          )}
                          <button
                            onClick={() => { cancelAction(a.id); toast("Action annulée."); }}
                            className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl transition-all"
                            style={{ background: "hsl(0 65% 95%)", color: "hsl(0 65% 40%)" }}>
                            <XCircle size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Prêtes à envoyer */}
            {preparedActions.length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Prêtes à envoyer</p>
                <div className="space-y-2">
                  {preparedActions.map((a) => {
                    const chMeta = CHANNEL_META[a.channel] ?? { emoji: "📡", label: a.channel, color: "hsl(var(--muted-foreground))" };
                    const cap = getChannelCapability(a.channel);
                    const dispatch = getDispatchLabel(cap);
                    const isEmail = a.channel === "email";
                    return (
                      <div key={a.id} className="card-surface p-3 flex items-start gap-3">
                        <span className="text-base shrink-0 mt-0.5">{chMeta.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="text-xs font-semibold text-foreground">{chMeta.label}</p>
                            <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                              style={{ background: `${dispatch.color}18`, color: dispatch.color }}>
                              {dispatch.badge} {dispatch.label}
                            </span>
                            {isEmail && (
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                                style={{ background: "hsl(142 65% 88%)", color: "hsl(142 65% 30%)", fontSize: "9px" }}>
                                ✉️ Resend
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{a.payload_summary || `Action ${a.action_type}`}</p>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          {cap.can_send_validated ? (
                            <button
                              onClick={async () => {
                                const r = await dispatchAction(a.id, "validated");
                                if (r.ok) {
                                  toast.success(isEmail ? "Email envoyé via Resend ✉️" : "Envoyé.", {
                                    description: isEmail ? `Provider ID: ${r.delivery_id?.slice(0, 8)}…` : undefined,
                                  });
                                } else {
                                  toast.error(r.error ?? "Erreur d'envoi");
                                }
                              }}
                              disabled={dispatching === a.id}
                              className="text-xs font-bold px-2 py-1 rounded-lg transition-all flex items-center gap-1"
                              style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}>
                              {dispatching === a.id ? <RefreshCw size={9} className="animate-spin" /> : <Send size={9} />}
                              {isEmail ? "Envoyer" : "Envoyer"}
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                await dispatchAction(a.id, "export");
                                toast.success("Marqué prêt à exporter.");
                              }}
                              disabled={dispatching === a.id}
                              className="text-xs font-bold px-2 py-1 rounded-lg transition-all flex items-center gap-1"
                              style={{ background: "hsl(218 72% 50% / 0.12)", color: "hsl(218 72% 55%)" }}>
                              <Package size={9} /> Exporter
                            </button>
                          )}
                          <button
                            onClick={() => { cancelAction(a.id); toast("Annulée."); }}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center">
                            <XCircle size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Historique deliveries */}
            {deliveries.length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Historique d'envois</p>
                <div className="space-y-1.5">
                  {deliveries.slice(0, 15).map((d) => {
                    const cap = getChannelCapability(d.channel);
                    const stMeta = DELIVERY_STATUS_META[d.dispatch_status as keyof typeof DELIVERY_STATUS_META] ?? DELIVERY_STATUS_META.prepared;
                    const isEmail = d.channel === "email";
                    return (
                      <div key={d.id} className="flex items-center gap-2.5 p-2.5 rounded-xl"
                        style={{ background: "hsl(var(--muted))" }}>
                        <span className="text-sm shrink-0">{cap.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{cap.channel_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-xs font-semibold" style={{ color: stMeta.color }}>
                              {stMeta.badge} {stMeta.label}
                            </span>
                            {d.dispatch_mode && (
                              <span className="text-xs text-muted-foreground">
                                {d.dispatch_mode === "auto" ? "⚡ Auto" : d.dispatch_mode === "validated" ? "✅ Validé" : "📋 Export"}
                              </span>
                            )}
                            {isEmail && d.dispatched_by === "resend" && (
                              <span className="text-xs font-bold px-1 py-0.5 rounded"
                                style={{ background: "hsl(142 65% 88%)", color: "hsl(142 65% 30%)", fontSize: "9px" }}>
                                Resend ✓
                              </span>
                            )}
                            {d.provider_message_id && (
                              <span className="text-xs text-muted-foreground font-mono" style={{ fontSize: "9px" }}>
                                id:{d.provider_message_id.slice(0, 12)}…
                              </span>
                            )}
                          </div>
                          {d.error_summary && (
                            <p className="text-xs mt-0.5 truncate" style={{ color: "hsl(0 65% 45%)" }}>{d.error_summary}</p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground shrink-0">
                          {new Date(d.created_at).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {channelActions.length === 0 && deliveries.length === 0 && (
              <div className="card-surface p-8 text-center">
                <Radio size={28} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium text-foreground mb-1">Aucune action canal encore</p>
                <p className="text-xs text-muted-foreground">
                  OpenClaw générera des actions canal lors des prochains cycles autonomes.
                </p>
              </div>
            )}

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: SESSIONS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "sessions" && (
          <div className="space-y-3">
            <div className="rounded-2xl p-3 flex items-start gap-2"
              style={{ background: "hsl(var(--muted))" }}>
              <Layers size={13} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Chaque session isole un contexte métier. OpenClaw garde l'historique séparé par mission, campagne, ou objectif.
              </p>
            </div>

            {/* Sessions actives */}
            {sessions.filter(s => s.status === "active").length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Sessions actives</p>
                {sessions.filter(s => s.status === "active").map((s) => (
                  <div key={s.id} className="card-surface p-4 mb-2">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "hsl(var(--success))" }} />
                      <p className="text-sm font-semibold text-foreground flex-1">{s.session_type}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}>
                        Active
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Cycles", value: s.runs_count },
                        { label: "Score",  value: `${s.session_score ?? 50}/100` },
                        { label: "Hôte",   value: s.node_host ?? "cloud" },
                      ].map(({ label, value }) => (
                        <div key={label} className="text-center py-1 rounded-lg bg-muted">
                          <p className="text-xs font-bold text-foreground">{value}</p>
                          <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                      ))}
                    </div>
                    {s.next_scheduled_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Prochain cycle {formatFuture(s.next_scheduled_at, lang)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Memory récente */}
            {memory.length > 0 && (
              <div className="card-surface p-4">
                <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                  <Brain size={11} className="text-primary" /> Ce que le cerveau a appris
                </p>
                <div className="space-y-2">
                  {memory.slice(0, 5).map((m) => (
                    <div key={m.id} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `hsl(218 72% ${50 + m.confidence / 5}% / 0.15)` }}>
                        <span className="text-xs font-bold" style={{ color: "hsl(218 72% 50%)" }}>
                          {m.confidence}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{m.key}</p>
                        <p className="text-xs text-muted-foreground">{m.memory_type} · {m.times_used} utilisations</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sessions.length === 0 && memory.length === 0 && (
              <div className="card-surface p-8 text-center">
                <Layers size={28} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm text-muted-foreground">Aucune session active.</p>
                <p className="text-xs text-muted-foreground mt-1">Lancez un cycle depuis l'onglet Cycles pour créer une session.</p>
                <Link to="/agents" className="mt-3 text-xs font-semibold text-primary flex items-center gap-1 justify-center">
                  Démarrer <ChevronRight size={10} />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: TOOL POLICY
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "tools" && (
          <div className="space-y-3">
            <div className="rounded-2xl p-3 flex items-start gap-2"
              style={{ background: "hsl(var(--muted))" }}>
              <Cpu size={13} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Chaque agent peut uniquement faire ce que son niveau d'accès autorise. Mode actuel : <strong>{autonomieLevel}</strong>.
              </p>
            </div>

            {BRAIN_AGENTS.map((agent) => {
              const access = getEffectiveAccess(agent.id);
              const accessMeta = TOOL_ACCESS_META[access];
              const matrix = Object.fromEntries(
                ["lecture","preparation","assiste","semi-auto","etendu"]
                  .map(level => [level, getEffectiveAccess(agent.id)])
              );

              return (
                <div key={agent.id} className="card-surface p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl shrink-0">{agent.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{agent.label}</p>
                      <p className="text-xs text-muted-foreground">{agent.desc}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{ background: `${accessMeta?.color}18`, color: accessMeta?.color }}>
                      {accessMeta?.icon} {accessMeta?.label}
                    </span>
                  </div>

                  {/* Progression par niveau */}
                  <div className="flex gap-1">
                    {["lecture", "preparation", "assiste", "semi-auto", "etendu"].map((lvl) => {
                      const lvlAccess = matrix[lvl] ?? "lecture";
                      const lvlMeta = TOOL_ACCESS_META[lvlAccess];
                      const isCurrent = lvl === autonomieLevel;
                      return (
                        <div key={lvl} className="flex-1 py-1 rounded-lg text-center transition-all"
                          style={{
                            background: isCurrent ? `${lvlMeta?.color}20` : "hsl(var(--muted))",
                            border: isCurrent ? `1px solid ${lvlMeta?.color}40` : "1px solid transparent",
                          }}>
                          <p className="text-xs" style={{ color: isCurrent ? lvlMeta?.color : "hsl(var(--muted-foreground))" }}>
                            {lvlMeta?.icon}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between mt-1">
                    {["Obs.", "Prép.", "Assisté", "Semi", "Intensif"].map((l) => (
                      <p key={l} className="text-xs text-muted-foreground flex-1 text-center">{l}</p>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="card-surface p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Changer le niveau d'autonomie</p>
                <p className="text-xs text-muted-foreground">Augmenter le niveau donne plus de pouvoir aux agents</p>
              </div>
              <Link to="/autonomie"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                Modifier <ChevronRight size={11} />
              </Link>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: SECURITY BOUNDARY
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "boundary" && (
          <div className="space-y-4">

            {/* Isolation — honnête : isolation logique RLS en base, pas matérielle */}
            <div className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, hsl(218 65% 9%), hsl(218 55% 12%))", border: "1px solid hsl(218 40% 22% / 0.5)" }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "hsl(218 72% 40% / 0.2)", border: "1px solid hsl(218 72% 50% / 0.3)" }}>
                  <Lock size={22} style={{ color: "hsl(218 72% 60%)" }} />
                </div>
                <div>
                  <p className="text-white font-bold">Séparation par espace activée</p>
                  <p className="text-white/40 text-xs mt-1 leading-relaxed">
                    Chaque espace est isolé par des règles de sécurité en base de données (RLS).
                    Vos données, sessions, runs, mémoire et validations ne sont accessibles qu'à vous.
                  </p>
                  <p className="text-xs mt-2 font-semibold" style={{ color: "hsl(218 72% 55%)" }}>
                    Isolation logique — pas de VPC dédié au niveau infrastructure (SaaS partagé).
                  </p>
                </div>
              </div>
            </div>

            {/* Boundary details */}
            <div className="card-surface p-4 space-y-3">
              <p className="text-xs font-bold text-foreground">Ce qui est protégé</p>
              {[
                { label: "Configuration OpenClaw",    icon: "⚙️", secured: true,  desc: "URL gateway, secret, niveau d'autonomie — règle RLS stricte" },
                { label: "Sessions actives",           icon: "🔄", secured: true,  desc: "Contextes métier filtrés par user_id" },
                { label: "Runs & historique",          icon: "📡", secured: true,  desc: "Cycles de travail isolés par user_id" },
                { label: "Mémoire agentique",          icon: "🧠", secured: true,  desc: "Apprentissages privés — accès restreint" },
                { label: "Validations",                icon: "✅", secured: true,  desc: "Boîte de décision privée — filtrée par user_id" },
                { label: "Canaux configurés",          icon: "📡", secured: true,  desc: "Config canal par utilisateur uniquement" },
                { label: "Politiques outils",          icon: "🔐", secured: true,  desc: "Matrice d'accès privée par espace" },
                { label: "Journaux d'activité",        icon: "📋", secured: true,  desc: "Logs non modifiables, accès exclusif" },
                { label: "Secret gateway",             icon: "🔑", secured: !!(config?.gateway_url), desc: config?.gateway_url ? "Secret stocké côté base sécurisée" : "Non configuré — gateway absent" },
              ].map(({ label, icon, secured, desc }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-base shrink-0">{icon}</span>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  {secured ? (
                    <CheckCircle2 size={14} style={{ color: "hsl(var(--success))" }} className="shrink-0" />
                  ) : (
                    <AlertTriangle size={14} style={{ color: "hsl(38 80% 40%)" }} className="shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Kill switch */}
            <div className="card-surface p-4">
              <div className="flex items-center gap-3 mb-2">
                <Shield size={16} className="text-primary" />
                <p className="text-sm font-semibold text-foreground">Arrêt d'urgence global</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Le Kill Switch bloque toutes les actions OpenClaw via le gateway. Aucune exécution possible tant qu'il est activé.
              </p>
              <Link to="/agents"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: config?.kill_switch_global ? "hsl(0 65% 40%)" : "hsl(var(--muted))",
                  color: config?.kill_switch_global ? "white" : "hsl(var(--foreground))",
                }}>
                <Shield size={12} />
                {config?.kill_switch_global ? "Kill Switch activé — Réactiver" : "Gérer le Kill Switch"}
              </Link>
            </div>

            {/* Node host info — honnête */}
            <div className="card-surface p-4">
              <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                <Target size={11} className="text-primary" /> Hôte d'exécution
              </p>
              <div className="space-y-2">
                {[
                  {
                    label: "Base de données & auth",
                    host: "Lovable Cloud",
                    active: true,
                    note: "Sessions, runs, mémoire, logs",
                  },
                  {
                    label: "Fonctions backend",
                    host: "Lovable Cloud",
                    active: true,
                    note: "Probe, gateway, healthcheck",
                  },
                  {
                    label: "Gateway OpenClaw",
                    host: config?.gateway_url ? "Votre serveur" : "Non configuré",
                    active: !!config?.gateway_url,
                    note: config?.gateway_url
                      ? `${config.gateway_url.slice(0, 40)}${config.gateway_url.length > 40 ? "…" : ""}`
                      : "Configurez un gateway pour activer l'exécution autonome",
                  },
                ].map(({ label, host, active, note }) => (
                  <div key={label} className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="text-sm text-foreground">{label}</span>
                      <p className="text-xs text-muted-foreground">{note}</p>
                    </div>
                    <span className="text-xs font-medium flex items-center gap-1 whitespace-nowrap mt-0.5"
                      style={{ color: active ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }}>
                      {active ? <Wifi size={10} /> : <WifiOff size={10} />}
                      {host}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: CONTROL — OpenClaw pg_cron Control Panel
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "control" && (
          <ControlPanel
            latestHeartbeat={latestHeartbeat}
            engineHealthy={engineHealthy}
            heartbeats={heartbeats}
            recentExecutions={recentExecutions}
            healthcheckResult={healthcheckResult}
            healthcheckLoading={healthcheckLoading}
            setHealthcheckResult={setHealthcheckResult}
            setHealthcheckLoading={setHealthcheckLoading}
          />
        )}

      </div>
    </UserLayout>
  );
}
