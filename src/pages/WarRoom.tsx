/**
 * War Room OpenClaw — Centre de commandement opérationnel
 * TRUE UNATTENDED MODE: shows what ran while you were away,
 * channel actions backlog, auto/assisted/manual distinction,
 * honest scheduler health.
 * Real Channel Delivery + Receipts + Outcome Loop
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import UserLayout from "@/components/layout/UserLayout";
import {
  Brain, Zap, Shield, Clock, CheckCircle2, AlertTriangle,
  Radio, Play, RefreshCw, ChevronRight, Activity,
  Wifi, AlertCircle, Lock, TrendingUp,
  Target, BarChart3, XCircle,
  Moon, Send, MessageCircle, Package,
} from "lucide-react";
import { useOpenClawRuntime, CHANNEL_STATUS_META, JOB_TYPE_META } from "@/hooks/useOpenClawRuntime";
import { useOpenClawRuns, RUN_TYPE_LABELS, BRAIN_AGENTS } from "@/hooks/useOpenClawRuns";
import { useOpenClaw } from "@/hooks/useOpenClaw";
import { useOpenClawExecutions, JOB_TYPE_LIBRARY, EXEC_STATUS_META } from "@/hooks/useOpenClawExecutions";
import { useOpenClawScheduler, PRIORITY_META, TRIGGER_SOURCE_META, QUEUE_STATUS_META } from "@/hooks/useOpenClawScheduler";
import { useOpenClawChannelActions, CHANNEL_META, ACTION_TYPE_META, STATUS_META, TRIGGER_MODE_META } from "@/hooks/useOpenClawChannelActions";
import { useOpenClawScheduledRuns, SCHEDULE_PLAN, CRON_JOBS_PROOF } from "@/hooks/useOpenClawScheduledRuns";
import { useOpenClawCronDiagnostic } from "@/hooks/useOpenClawCronDiagnostic";
import { useOpenClawDeliveries, DELIVERY_STATUS_META, CHANNEL_CAPABILITY_MATRIX, getChannelCapability, getDispatchLabel } from "@/hooks/useOpenClawDeliveries";

function formatFuture(iso: string | null) {
  if (!iso) return "—";
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "bientôt";
  if (diff < 3600000) return `dans ${Math.floor(diff / 60000)}min`;
  if (diff < 86400000) return `dans ${Math.floor(diff / 3600000)}h`;
  return `dans ${Math.floor(diff / 86400000)}j`;
}

function formatRelative(iso: string | null) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "à l'instant";
  if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)}min`;
  if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)}h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function BrainScore({ score }: { score: number }) {
  const color = score >= 80 ? "hsl(var(--success))"
    : score >= 50 ? "hsl(218 72% 55%)"
    : "hsl(38 80% 45%)";
  const r = 36; const circ = 2 * Math.PI * r; const dash = (score / 100) * circ;
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg width="80" height="80" className="absolute inset-0 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(218 40% 20% / 0.5)" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div className="relative z-10 text-center">
        <p className="text-lg font-bold leading-none" style={{ color }}>{score}</p>
        <p className="text-xs text-white/40 leading-none mt-0.5">santé</p>
      </div>
    </div>
  );
}

function TriggerBadge({ mode }: { mode: "auto" | "assisted" | "manual" }) {
  const meta = TRIGGER_MODE_META[mode];
  return (
    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
      style={{ background: `${meta.color}22`, color: meta.color }}>
      {meta.badge} {mode === "auto" ? "Auto" : mode === "assisted" ? "Assisté" : "Manuel"}
    </span>
  );
}

export default function WarRoom() {
  const [launchingJob, setLaunchingJob] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"overview" | "canal" | "cycles">("overview");

  const { channels, jobs, loading: runtimeLoading, readyChannels, blockedChannels, nextJob, healthScore, triggerJob } = useOpenClawRuntime();
  const { runs, memory, activeRun, loading: runsLoading } = useOpenClawRuns();
  const { config, pendingValidations, logs } = useOpenClaw();
  const {
    recentExecutions, failedExecutions, runningExecutions,
    totalOutputs, totalRecs, totalActions,
    lastExecutionByType, executeJob, loading: execLoading,
  } = useOpenClawExecutions();
  const {
    pendingJobs, doneToday, overdueJobs, latestHeartbeat, engineHealthy,
    totalOutputToday, motor1Done, motor2Done,
    triggerScheduler, triggering: schedulerTriggering,
  } = useOpenClawScheduler();
  const {
    actions: channelActions, loading: channelLoading,
    preparedActions, pendingApprovals: chPendingApprovals, sentActions, failedActions: chFailedActions,
    whileYouSlept, byChannel,
    approveAction, cancelAction, loadAll: reloadChannelActions,
  } = useOpenClawChannelActions();
  const {
    isCronActive, lastTick, lastDailySweep, totalAutoToday, todayRuns,
    hasEverRun, cronRunStatus, smokeTesting, lastSmokeResult, runSmokeTest,
  } = useOpenClawScheduledRuns();
  const {
    diagnostics: cronDiagnostics, loading: cronDiagLoading,
    infraScore, allConfiguredInRepo, allConfiguredInDb, tickIsActive, lastChecked: cronCheckedAt,
    reload: reloadCronDiag,
  } = useOpenClawCronDiagnostic();

  const loading = runtimeLoading || runsLoading || execLoading;

  // ── Trigger a real job execution ──────────────────────────────────────────
  const handleExecuteJob = async (jobType: string, jobId?: string) => {
    setLaunchingJob(jobType);
    const result = await executeJob(jobType, jobId);
    setLaunchingJob(null);
    if (result.success) {
      toast.success(result.summary || "Le cerveau a travaillé.", {
        description: result.outputCount ? `${result.outputCount} élément${result.outputCount > 1 ? "s" : ""} produit${result.outputCount > 1 ? "s" : ""}` : undefined
      });
      reloadChannelActions();
    } else {
      toast.error("Le job a rencontré un problème.", { description: result.error });
    }
  };

  const handleSchedulerTick = async () => {
    const result = await triggerScheduler();
    if (result.ok) {
      toast.success("Cycle autonome exécuté.", {
        description: result.completed > 0 ? `${result.completed} job${result.completed > 1 ? "s" : ""} terminé${result.completed > 1 ? "s" : ""}` : "Aucun job en attente."
      });
      reloadChannelActions();
    } else {
      toast.error("Le scheduler a rencontré un problème.", { description: result.error });
    }
  };

  const noGateway = !config?.gateway_url;

  // "Pendant que tu dors" — real actions prepared while user was away
  const whileYouSleptCount = whileYouSlept.length;
  const hasSomethingHappened = whileYouSleptCount > 0 || totalOutputToday > 0 || doneToday.length > 0;

  if (loading) {
    return (
      <UserLayout jarvisContext="agents">
        <div className="max-w-2xl mx-auto flex items-center justify-center h-48">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Brain size={20} className="animate-pulse" />
            <span className="text-sm">Le cerveau se réveille…</span>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout jarvisContext="agents">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <Activity size={20} className="text-primary" />
              Centre de commandement
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              {isCronActive
                ? <><Radio size={9} className="animate-pulse" style={{ color: "hsl(var(--success))" }} /> Le moteur autonome travaille</>
                : <><Clock size={9} /> Autonomie — en attente de déclenchement</>}
            </p>
          </div>
          <Link to="/operations"
            className="text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 bg-muted hover:bg-secondary transition-colors">
            <Target size={12} className="text-primary" />
            Opérations
          </Link>
        </div>

        {/* ── Kill switch ───────────────────────────────────────────────── */}
        {config?.kill_switch_global && (
          <div className="rounded-2xl p-3 flex items-center gap-3"
            style={{ background: "hsl(0 65% 95%)", border: "1px solid hsl(0 65% 85%)" }}>
            <AlertCircle size={14} style={{ color: "hsl(0 65% 40%)" }} className="shrink-0" />
            <p className="text-xs font-semibold flex-1" style={{ color: "hsl(0 65% 40%)" }}>
              Kill Switch actif — tous les agents sont arrêtés.
            </p>
            <Link to="/agents" className="text-xs font-bold underline" style={{ color: "hsl(0 65% 40%)" }}>Réactiver</Link>
          </div>
        )}

        {/* ── Mode dégradé honnête ──────────────────────────────────────── */}
        {noGateway && (
          <div className="rounded-2xl p-3 flex items-start gap-2.5"
            style={{ background: "hsl(38 80% 92%)", border: "1px solid hsl(38 80% 75%)" }}>
            <AlertTriangle size={13} style={{ color: "hsl(38 80% 30%)" }} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold" style={{ color: "hsl(38 80% 30%)" }}>Mode préparation</p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "hsl(38 80% 40%)" }}>
                Aucun gateway configuré. Les jobs peuvent être lancés manuellement.
                Les cycles cron sont configurés mais l'exécution autonome reste limitée sans gateway.
              </p>
            </div>
          </div>
        )}

        {/* ── Approvals urgentes ────────────────────────────────────────── */}
        {(pendingValidations.length > 0 || chPendingApprovals.length > 0) && (
          <Link to="/validations">
            <div className="rounded-2xl p-4 flex items-center justify-between cursor-pointer"
              style={{ background: "linear-gradient(135deg, hsl(38 80% 12%), hsl(38 65% 15%))", border: "1px solid hsl(38 80% 35% / 0.4)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(38 80% 40% / 0.2)" }}>
                  <Shield size={18} style={{ color: "hsl(38 80% 65%)" }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "hsl(38 80% 75%)" }}>
                    {pendingValidations.length + chPendingApprovals.length} action{(pendingValidations.length + chPendingApprovals.length) > 1 ? "s" : ""} attend{(pendingValidations.length + chPendingApprovals.length) > 1 ? "ent" : ""} votre accord
                  </p>
                  <p className="text-xs" style={{ color: "hsl(38 80% 55% / 0.7)" }}>
                    {chPendingApprovals.length > 0 ? `${chPendingApprovals.length} action${chPendingApprovals.length > 1 ? "s" : ""} canal préparée${chPendingApprovals.length > 1 ? "s" : ""}` : "Le cerveau est en attente de votre décision"}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} style={{ color: "hsl(38 80% 65%)" }} />
            </div>
          </Link>
        )}

        {/* ── Pendant que tu dormais ────────────────────────────────────── */}
        {hasSomethingHappened && (
          <div className="rounded-2xl p-4"
            style={{ background: "linear-gradient(135deg, hsl(280 50% 8%), hsl(280 40% 11%))", border: "1px solid hsl(280 40% 22% / 0.5)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Moon size={14} style={{ color: "hsl(280 60% 70%)" }} />
              <p className="text-xs font-bold" style={{ color: "hsl(280 60% 75%)" }}>Pendant votre absence</p>
              <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "hsl(280 60% 25% / 0.5)", color: "hsl(280 60% 75%)" }}>
                {lastTick ? formatRelative(lastTick.started_at) : "récemment"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: "Jobs auto", value: totalAutoToday, icon: "⚡" },
                { label: "Sorties",   value: totalOutputToday || totalOutputs, icon: "📦" },
                { label: "Canal",     value: whileYouSleptCount, icon: "📡" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="text-center py-2 rounded-xl"
                  style={{ background: "hsl(280 40% 14% / 0.7)" }}>
                  <p className="text-base">{icon}</p>
                  <p className="text-sm font-bold text-white">{value}</p>
                  <p className="text-xs" style={{ color: "hsl(280 40% 60%)" }}>{label}</p>
                </div>
              ))}
            </div>
            {/* Most recent while-you-slept actions */}
            {whileYouSlept.slice(0, 3).map(a => {
              const chMeta = CHANNEL_META[a.channel] ?? { emoji: "📡", label: a.channel, color: "hsl(var(--muted-foreground))" };
              const stMeta = STATUS_META[a.status];
              return (
                <div key={a.id} className="flex items-center gap-2 py-1.5 border-t border-white/5">
                  <span className="text-sm shrink-0">{chMeta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white/80 truncate">{a.payload_summary}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <TriggerBadge mode={a.trigger_mode as "auto" | "assisted" | "manual"} />
                      <span className="text-xs font-semibold" style={{ color: stMeta.color }}>{stMeta.label}</span>
                    </div>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: "hsl(280 40% 55%)" }}>{formatRelative(a.created_at)}</span>
                </div>
              );
            })}
            {whileYouSlept.length === 0 && doneToday.length > 0 && (
              <p className="text-xs text-center" style={{ color: "hsl(280 40% 55%)" }}>
                {doneToday.length} job{doneToday.length > 1 ? "s" : ""} terminé{doneToday.length > 1 ? "s" : ""} aujourd'hui
              </p>
            )}
          </div>
        )}

        {/* ── Tabs: Overview / Canal / Cycles ──────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "hsl(var(--muted))" }}>
          {(["overview", "canal", "cycles"] as const).map(tab => (
            <button key={tab}
              onClick={() => setActiveSection(tab)}
              className="flex-1 text-xs font-semibold py-2 rounded-xl transition-all"
              style={{
                background: activeSection === tab ? "hsl(var(--background))" : "transparent",
                color: activeSection === tab ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              }}>
              {tab === "overview" ? "Vue d'ensemble" : tab === "canal" ? `Canal ${preparedActions.length + chPendingApprovals.length > 0 ? `(${preparedActions.length + chPendingApprovals.length})` : ""}` : "Cycles"}
            </button>
          ))}
        </div>

        {/* ══ TAB: OVERVIEW ════════════════════════════════════════════════ */}
        {activeSection === "overview" && (
          <>
            {/* Hero cerveau */}
            <div className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, hsl(218 65% 8%), hsl(218 55% 11%))", border: "1px solid hsl(218 40% 20% / 0.5)" }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse 80% 60% at 80% 40%, hsl(218 72% 35% / 0.12) 0%, transparent 70%)" }} />
              <div className="relative z-10 flex items-center gap-5 mb-5">
                <BrainScore score={healthScore} />
                <div className="flex-1">
                  <p className="text-white font-bold text-base mb-1">
                    {activeRun ? "Le moteur travaille en ce moment" : "Le cerveau continue de travailler"}
                  </p>
                  <p className="text-white/40 text-xs leading-relaxed">
                    {activeRun
                      ? `Cycle en cours : ${RUN_TYPE_LABELS[activeRun.run_type]?.label ?? activeRun.run_type}`
                      : runningExecutions.length > 0
                        ? `${runningExecutions.length} job${runningExecutions.length > 1 ? "s" : ""} en exécution…`
                        : nextJob
                          ? `Prochain réveil : ${JOB_TYPE_META[nextJob.job_type]?.label ?? nextJob.job_name} ${formatFuture(nextJob.next_run_at)}`
                          : "Vos agents sont prêts à intervenir."}
                  </p>
                  {(activeRun || runningExecutions.length > 0) && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Radio size={9} className="animate-pulse" style={{ color: "hsl(var(--success))" }} />
                      <span className="text-xs font-semibold" style={{ color: "hsl(var(--success))" }}>Exécution en cours</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-4 gap-2">
                {[
                  { label: "Sorties totales",  value: totalOutputs,              ok: totalOutputs > 0 },
                  { label: "Recommandations",  value: totalRecs,                  ok: totalRecs > 0 },
                  { label: "Actions créées",   value: totalActions,               ok: totalActions > 0 },
                  { label: "En attente",       value: pendingValidations.length,  ok: pendingValidations.length === 0 },
                ].map(({ label, value, ok }) => (
                  <div key={label} className="text-center py-2.5 rounded-xl" style={{ background: "hsl(218 40% 13% / 0.8)" }}>
                    <p className="text-sm font-bold" style={{ color: ok ? "hsl(var(--success))" : "hsl(38 80% 65%)" }}>{value}</p>
                    <p className="text-xs text-white/30">{label}</p>
                  </div>
                ))}
              </div>

              {/* Scheduler health */}
              <div className="relative z-10 mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isCronActive ? "animate-pulse" : ""}`}
                    style={{ background: isCronActive ? "hsl(var(--success))" : "hsl(38 80% 45%)" }} />
                  <p className="text-xs text-white/50">
                    {isCronActive
                      ? `Cron actif · dernier tick ${formatRelative(lastTick?.started_at || null)}`
                      : lastTick
                        ? `Dernier tick ${formatRelative(lastTick.started_at)} · cron inactif`
                        : "Aucun tick cron enregistré — mode manuel uniquement"}
                  </p>
                </div>
                <button
                  onClick={handleSchedulerTick}
                  disabled={schedulerTriggering}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
                  style={{ background: "hsl(218 40% 18%)", color: "hsl(218 72% 60%)" }}>
                  {schedulerTriggering ? <RefreshCw size={9} className="animate-spin" /> : <Zap size={9} />}
                  Cycle
                </button>
              </div>
            </div>

            {/* Lancer un job maintenant */}
            <div className="card-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Zap size={12} className="text-primary" /> Lancer un job maintenant
                </p>
                <Link to="/operations?tab=jobs" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Cycles planifiés <ChevronRight size={10} />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(JOB_TYPE_LIBRARY).slice(0, 6).map(([type, meta]) => {
                  const lastExec = lastExecutionByType[type];
                  const isRunning = launchingJob === type;
                  const correspondingJob = jobs.find(j => j.job_type === type);
                  return (
                    <button key={type}
                      onClick={() => handleExecuteJob(type, correspondingJob?.id)}
                      disabled={isRunning || config?.kill_switch_global === true}
                      className="text-left p-3 rounded-xl border transition-all disabled:opacity-50"
                      style={{
                        background: isRunning ? "hsl(218 72% 50% / 0.08)" : "hsl(var(--muted))",
                        borderColor: isRunning ? "hsl(218 72% 50% / 0.3)" : "transparent",
                      }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-base">{meta.icon}</span>
                        {isRunning
                          ? <RefreshCw size={9} className="animate-spin ml-auto text-primary" />
                          : lastExec?.status === "termine"
                            ? <CheckCircle2 size={9} className="ml-auto" style={{ color: "hsl(var(--success))" }} />
                            : lastExec?.status === "erreur"
                              ? <XCircle size={9} className="ml-auto" style={{ color: "hsl(0 65% 40%)" }} />
                              : null
                        }
                      </div>
                      <p className="text-xs font-semibold text-foreground leading-snug">{meta.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isRunning ? "En cours…"
                          : lastExec?.output_summary
                            ? lastExec.output_summary.slice(0, 42) + (lastExec.output_summary.length > 42 ? "…" : "")
                            : meta.desc}
                      </p>
                      {lastExec?.created_at && !isRunning && (
                        <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground) / 0.6)" }}>
                          {formatRelative(lastExec.created_at)}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exécutions récentes */}
            {recentExecutions.length > 0 && (
              <div className="card-surface p-4">
                <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                  <BarChart3 size={12} className="text-primary" /> Ce que le moteur a produit
                </p>
                <div className="space-y-2">
                  {recentExecutions.map((exec) => {
                    const meta = JOB_TYPE_LIBRARY[exec.job_type];
                    const statusMeta = EXEC_STATUS_META[exec.status];
                    const isAuto = exec.trigger_source === "scheduled" || exec.trigger_source === "event";
                    return (
                      <div key={exec.id} className="flex items-center gap-3 py-1.5">
                        <span className="text-base shrink-0">{meta?.icon ?? "⚙️"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {exec.output_summary || meta?.label || exec.job_type}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {exec.output_count > 0 && (
                              <span className="text-xs font-semibold" style={{ color: "hsl(var(--success))" }}>
                                +{exec.output_count} sortie{exec.output_count > 1 ? "s" : ""}
                              </span>
                            )}
                            <span className="text-xs font-semibold" style={{ color: statusMeta?.color }}>
                              {statusMeta?.label}
                            </span>
                            {isAuto && (
                              <span className="text-xs" style={{ color: "hsl(var(--success))" }}>⚡ Auto</span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{formatRelative(exec.created_at)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Jobs en échec */}
            {failedExecutions.length > 0 && (
              <div className="card-surface p-4" style={{ border: "1px solid hsl(0 65% 85%)" }}>
                <p className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: "hsl(0 65% 40%)" }}>
                  <AlertTriangle size={12} /> {failedExecutions.length} job{failedExecutions.length > 1 ? "s" : ""} en échec
                </p>
                <div className="space-y-2">
                  {failedExecutions.slice(0, 3).map((exec) => {
                    const meta = JOB_TYPE_LIBRARY[exec.job_type];
                    return (
                      <div key={exec.id} className="flex items-center gap-2.5">
                        <span className="text-sm shrink-0">{meta?.icon ?? "⚙️"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{meta?.label ?? exec.job_type}</p>
                          <p className="text-xs text-muted-foreground truncate">{exec.last_error || "Erreur inconnue"}</p>
                        </div>
                        <button
                          onClick={() => handleExecuteJob(exec.job_type)}
                          disabled={launchingJob === exec.job_type}
                          className="text-xs font-semibold px-2 py-1 rounded-lg transition-all"
                          style={{ background: "hsl(0 65% 95%)", color: "hsl(0 65% 40%)" }}>
                          {launchingJob === exec.job_type ? <RefreshCw size={9} className="animate-spin" /> : "Relancer"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Canaux */}
            <div className="card-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Wifi size={12} className="text-primary" /> Canaux disponibles
                </p>
                <button onClick={() => setActiveSection("canal")} className="text-xs text-primary hover:underline flex items-center gap-1">
                  Actions canal <ChevronRight size={10} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {channels.slice(0, 6).map((ch) => {
                  const meta = CHANNEL_STATUS_META[ch.status] ?? CHANNEL_STATUS_META.non_configure;
                  const chMeta = CHANNEL_META[ch.channel_id];
                  const pendingForChannel = channelActions.filter(a => a.channel === ch.channel_id && (a.status === "prepared" || a.status === "pending_approval")).length;
                  return (
                    <div key={ch.id} className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
                      <span className="text-sm shrink-0">{chMeta?.emoji ?? "📡"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{ch.channel_name}</p>
                        <p className="text-xs font-medium truncate" style={{ color: meta.color }}>{meta.label}</p>
                      </div>
                      {pendingForChannel > 0 && (
                        <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: "hsl(38 80% 40%)", color: "white", fontSize: "9px" }}>
                          {pendingForChannel}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Accès rapides */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { to: "/validations", label: "Approvals",  desc: pendingValidations.length > 0 ? `${pendingValidations.length} en attente` : "À jour ✓", icon: Shield,   bg: "hsl(38 80% 90%)", color: "hsl(38 80% 30%)" },
                { to: "/agents",      label: "Agent OS",   desc: "Gérer les agents",    icon: Brain,    bg: "hsl(var(--secondary))", color: "hsl(var(--primary))" },
                { to: "/operations",  label: "Opérations", desc: "Runtime complet",      icon: Target,   bg: "hsl(var(--secondary))", color: "hsl(var(--primary))" },
                { to: "/radar",       label: "Radar",      desc: "Opportunités chaudes", icon: TrendingUp, bg: "hsl(var(--success-light))", color: "hsl(var(--success))" },
              ].map(({ to, label, desc, icon: Icon, bg, color }) => (
                <Link key={to} to={to} className="card-surface p-4 flex items-center gap-3 hover:bg-secondary/80 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Isolation */}
            <div className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: "hsl(218 65% 8%)", border: "1px solid hsl(218 40% 20% / 0.4)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "hsl(218 72% 40% / 0.15)" }}>
                <Lock size={16} style={{ color: "hsl(218 72% 60%)" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Isolation logique active</p>
                <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                  Vos sessions, exécutions, mémoire et validations sont isolées par RLS.
                  Aucune donnée partagée avec d'autres utilisateurs.
                </p>
              </div>
            </div>
          </>
        )}

        {/* ══ TAB: CANAL ════════════════════════════════════════════════════ */}
        {activeSection === "canal" && (
          <div className="space-y-4">

            {/* Légende modes */}
            <div className="card-surface p-4">
              <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                <Send size={12} className="text-primary" /> Actions canal — états réels
              </p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(["auto", "assisted", "manual"] as const).map(mode => {
                  const meta = TRIGGER_MODE_META[mode];
                  const count = channelActions.filter(a => a.trigger_mode === mode).length;
                  return (
                    <div key={mode} className="text-center p-2.5 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
                      <p className="text-base">{meta.badge}</p>
                      <p className="text-sm font-bold text-foreground">{count}</p>
                      <p className="text-xs text-muted-foreground leading-tight">
                        {mode === "auto" ? "Auto" : mode === "assisted" ? "Assisté" : "Manuel"}
                      </p>
                    </div>
                  );
                })}
              </div>

              {channelActions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Aucune action canal encore. Lancez un job pour générer des actions.
                </p>
              ) : (
                <div className="space-y-2">
                  {channelActions.slice(0, 20).map(action => {
                    const chMeta = CHANNEL_META[action.channel] ?? { emoji: "📡", label: action.channel, color: "hsl(var(--muted-foreground))" };
                    const stMeta = STATUS_META[action.status];
                    return (
                      <div key={action.id}
                        className="flex items-start gap-3 p-3 rounded-xl"
                        style={{ background: "hsl(var(--muted))" }}>
                        <span className="text-lg shrink-0 mt-0.5">{chMeta.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-xs font-semibold text-foreground">{chMeta.label}</p>
                            <TriggerBadge mode={action.trigger_mode as "auto" | "assisted" | "manual"} />
                            <span className="text-xs font-semibold" style={{ color: stMeta.color }}>
                              {stMeta.badge} {stMeta.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{action.payload_summary}</p>
                          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground) / 0.6)" }}>
                            {formatRelative(action.created_at)}
                          </p>
                        </div>
                        {action.status === "pending_approval" && (
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              onClick={() => approveAction(action.id)}
                              className="text-xs font-semibold px-2 py-1 rounded-lg transition-all"
                              style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}>
                              Approuver
                            </button>
                            <button
                              onClick={() => cancelAction(action.id)}
                              className="text-xs font-semibold px-2 py-1 rounded-lg transition-all"
                              style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                              Annuler
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Channel breakdown */}
            {Object.keys(byChannel).length > 0 && (
              <div className="card-surface p-4">
                <p className="text-xs font-bold text-foreground mb-3">Par canal</p>
                <div className="space-y-2">
                  {Object.entries(byChannel).map(([ch, acts]) => {
                    const meta = CHANNEL_META[ch] ?? { emoji: "📡", label: ch, color: "hsl(var(--muted-foreground))" };
                    const prepared = acts.filter(a => a.status === "prepared").length;
                    const pending = acts.filter(a => a.status === "pending_approval").length;
                    const sent = acts.filter(a => a.status === "sent").length;
                    return (
                      <div key={ch} className="flex items-center gap-3">
                        <span className="text-base">{meta.emoji}</span>
                        <span className="text-xs font-semibold text-foreground flex-1">{meta.label}</span>
                        {prepared > 0 && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "hsl(218 72% 55% / 0.15)", color: "hsl(218 72% 55%)" }}>{prepared} prêt{prepared > 1 ? "s" : ""}</span>}
                        {pending > 0 && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "hsl(38 80% 45% / 0.15)", color: "hsl(38 80% 45%)" }}>{pending} accord</span>}
                        {sent > 0 && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}>{sent} envoyé{sent > 1 ? "s" : ""}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: CYCLES ═══════════════════════════════════════════════════ */}
        {activeSection === "cycles" && (
          <div className="space-y-4">

            {/* ── INFRA-AS-CODE: Cron Diagnostic ─────────────────────────── */}
            <div className="rounded-2xl p-4"
              style={{ background: "linear-gradient(135deg, hsl(218 65% 8%), hsl(218 55% 11%))", border: "1px solid hsl(218 40% 22% / 0.5)" }}>
              {/* Header + score */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Radio size={11} className={tickIsActive ? "animate-pulse" : ""} style={{ color: tickIsActive ? "hsl(var(--success))" : "hsl(38 80% 55%)" }} />
                    Infra-as-code — cron jobs
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "hsl(218 40% 50%)" }}>
                    Documenté dans <code className="font-mono text-xs" style={{ color: "hsl(218 72% 55%)" }}>supabase/infra/cron-jobs.md</code>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold px-2 py-1 rounded-xl"
                    style={{
                      background: infraScore >= 80 ? "hsl(var(--success-light))" : "hsl(38 80% 40% / 0.15)",
                      color: infraScore >= 80 ? "hsl(var(--success))" : "hsl(38 80% 60%)",
                    }}>
                    Infra {infraScore}%
                  </div>
                </div>
              </div>

              {/* Légende */}
              <div className="grid grid-cols-3 gap-1 mb-3 text-center">
                {[
                  { label: "Dans le repo", ok: allConfiguredInRepo, icon: "📁" },
                  { label: "En base (pg_cron)", ok: allConfiguredInDb, icon: "🗄️" },
                  { label: "Tick actif", ok: tickIsActive, icon: "⚡" },
                ].map(({ label, ok, icon }) => (
                  <div key={label} className="py-1.5 rounded-xl text-xs"
                    style={{ background: "hsl(218 40% 13% / 0.6)" }}>
                    <p>{icon}</p>
                    <p className="font-semibold mt-0.5" style={{ color: ok ? "hsl(var(--success))" : "hsl(38 80% 55%)" }}>
                      {ok ? "✓" : "✗"}
                    </p>
                    <p style={{ color: "hsl(218 40% 50%)", fontSize: "9px" }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Par cron job */}
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
                          {/* Ligne 1: nom + badges */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-semibold text-white">{cron.label}</p>
                            {/* Repo */}
                            <span className="px-1 py-0.5 rounded text-xs font-semibold"
                              style={{ background: cron.defined_in_repo ? "hsl(218 72% 50% / 0.15)" : "hsl(0 65% 50% / 0.15)", color: cron.defined_in_repo ? "hsl(218 72% 65%)" : "hsl(0 65% 55%)", fontSize: "9px" }}>
                              {cron.defined_in_repo ? "📁 Repo" : "✗ Absent repo"}
                            </span>
                            {/* Base */}
                            <span className="px-1 py-0.5 rounded text-xs font-semibold"
                              style={{ background: cron.configured_in_db ? "hsl(var(--success-light))" : "hsl(0 65% 50% / 0.15)", color: cron.configured_in_db ? "hsl(var(--success))" : "hsl(0 65% 55%)", fontSize: "9px" }}>
                              {cron.configured_in_db ? `✓ jobid:${cron.jobid}` : "✗ Absent base"}
                            </span>
                            {/* Statut observé */}
                            <span className="px-1 py-0.5 rounded text-xs font-semibold"
                              style={{ background: `${obsColor}18`, color: obsColor, fontSize: "9px" }}>
                              {obsLabel}
                            </span>
                          </div>
                          {/* Ligne 2: schedule + stats */}
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <code className="text-xs font-mono" style={{ color: "hsl(218 72% 45%)" }}>{cron.schedule}</code>
                            {cron.last_cron_run_at && (
                              <span className="text-xs" style={{ color: "hsl(218 40% 45%)" }}>
                                dernier : {formatRelative(cron.last_cron_run_at)}
                              </span>
                            )}
                            {cron.real_cron_runs > 0 && (
                              <span className="text-xs" style={{ color: "hsl(218 40% 45%)" }}>
                                {cron.real_cron_runs} run{cron.real_cron_runs > 1 ? "s" : ""} cron
                              </span>
                            )}
                          </div>
                          {/* Incohérence */}
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
                <p className="text-xs" style={{ color: "hsl(218 40% 38%)" }}>
                  pg_cron v1.6.4 · pg_net v0.19.5
                </p>
                {cronCheckedAt && (
                  <p className="text-xs" style={{ color: "hsl(218 40% 35%)" }}>
                    Vérifié {formatRelative(cronCheckedAt.toISOString())}
                  </p>
                )}
              </div>
            </div>

            {/* ── SMOKE TEST ──────────────────────────────────────────────── */}
            <div className="card-surface p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  🧪 Smoke test autonome
                </p>
                <button
                  onClick={async () => {
                    const result = await runSmokeTest();
                    if (result.ok) {
                      toast.success(`Test autonome réussi — ${result.passed} étapes`, {
                        description: `${result.scheduler_result?.run_id ? "run_id enregistré" : ""} · ${result.duration_ms}ms`
                      });
                    } else {
                      toast.error("Test autonome — erreurs détectées", { description: result.error });
                    }
                  }}
                  disabled={smokeTesting}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                  style={{ background: "hsl(218 72% 50% / 0.12)", color: "hsl(218 72% 65%)" }}>
                  {smokeTesting ? <RefreshCw size={10} className="animate-spin" /> : <Zap size={10} />}
                  {smokeTesting ? "Test en cours…" : "Lancer le test"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Force un cycle, écrit dans scheduled_runs et heartbeats, enqueue un job réel. Prouve l'autonomie de bout en bout.
              </p>
              {lastSmokeResult && (
                <div className="rounded-xl p-3 space-y-1.5"
                  style={{ background: lastSmokeResult.ok ? "hsl(var(--success-light))" : "hsl(38 80% 92%)" }}>
                  <p className="text-xs font-bold" style={{ color: lastSmokeResult.ok ? "hsl(var(--success))" : "hsl(38 80% 30%)" }}>
                    {lastSmokeResult.ok ? `✅ Test réussi — ${lastSmokeResult.passed} étapes` : `⚠️ ${lastSmokeResult.passed} étapes réussies`}
                    <span className="font-normal ml-2" style={{ opacity: 0.7 }}>{lastSmokeResult.duration_ms}ms</span>
                  </p>
                  {lastSmokeResult.proof.steps.map(s => (
                    <div key={s.step} className="flex items-center gap-2">
                      <span className="text-xs">{s.ok ? "✅" : "❌"}</span>
                      <span className="text-xs font-mono text-muted-foreground flex-1 truncate">{s.step}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">{s.detail}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── HISTORIQUE DES CYCLES ────────────────────────────────────── */}
            <div className="card-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <BarChart3 size={12} className="text-primary" />
                  {todayRuns.length > 0 ? `Aujourd'hui — ${todayRuns.length} cycle${todayRuns.length > 1 ? "s" : ""}` : "Historique des cycles"}
                </p>
                <button onClick={handleSchedulerTick} disabled={schedulerTriggering}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                  style={{ background: "hsl(var(--primary))", color: "white" }}>
                  {schedulerTriggering ? <RefreshCw size={9} className="animate-spin" /> : <Zap size={9} />}
                  Cycle manuel
                </button>
              </div>

              {todayRuns.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">Aucun cycle enregistré aujourd'hui.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Le prochain tick cron automatique écrira ici dans les 5 prochaines minutes.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayRuns.slice(0, 15).map(r => {
                    const keyMeta: Record<string, string> = { scheduler_tick: "⚡", daily_sweep: "🌅", weekly_sweep: "📅", manual_trigger: "👆", smoke_test: "🧪" };
                    const isAuto = r.trigger_source === "cron";
                    const isManual = r.trigger_source === "manual";
                    return (
                      <div key={r.id} className="flex items-center gap-3 py-1.5 border-b border-border/20 last:border-0">
                        <span className="text-sm shrink-0">{keyMeta[r.run_key] ?? "🔄"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-medium text-foreground">{r.run_key.replace(/_/g, " ")}</p>
                            {isAuto && (
                              <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                                style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))", fontSize: "9px" }}>
                                ⚡ Automatique
                              </span>
                            )}
                            {isManual && (
                              <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                                style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", fontSize: "9px" }}>
                                👆 Manuel
                              </span>
                            )}
                            <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                              style={{
                                background: r.status === "done" ? "hsl(var(--success-light))" : r.status === "running" ? "hsl(218 72% 50% / 0.15)" : "hsl(0 65% 92%)",
                                color: r.status === "done" ? "hsl(var(--success))" : r.status === "running" ? "hsl(218 72% 55%)" : "hsl(0 65% 40%)",
                                fontSize: "9px",
                              }}>
                              {r.status === "done" ? "✓ Terminé" : r.status === "running" ? "⏳ En cours" : "✗ Échoué"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {r.jobs_completed > 0 ? `${r.jobs_completed} job${r.jobs_completed > 1 ? "s" : ""} terminé${r.jobs_completed > 1 ? "s" : ""}` : "0 jobs"}
                            {r.jobs_failed > 0 ? ` · ${r.jobs_failed} échec${r.jobs_failed > 1 ? "s" : ""}` : ""}
                            {r.duration_ms ? ` · ${r.duration_ms}ms` : ""}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{formatRelative(r.started_at)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </UserLayout>
  );
}
