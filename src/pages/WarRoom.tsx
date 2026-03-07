/**
 * War Room OpenClaw — Centre de commandement opérationnel
 * Montre ce que le moteur a RÉELLEMENT produit + jobs réels
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import UserLayout from "@/components/layout/UserLayout";
import {
  Brain, Zap, Shield, Clock, CheckCircle2, AlertTriangle,
  Radio, Play, RefreshCw, ChevronRight, Activity,
  Wifi, WifiOff, AlertCircle, Lock, Database, TrendingUp, Flame,
  Target, Layers, BarChart3, Sparkles, XCircle
} from "lucide-react";
import { useOpenClawRuntime, CHANNEL_STATUS_META, JOB_TYPE_META } from "@/hooks/useOpenClawRuntime";
import { useOpenClawRuns, RUN_TYPE_LABELS, BRAIN_AGENTS } from "@/hooks/useOpenClawRuns";
import { useOpenClaw } from "@/hooks/useOpenClaw";
import { useOpenClawExecutions, JOB_TYPE_LIBRARY, EXEC_STATUS_META } from "@/hooks/useOpenClawExecutions";

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

export default function WarRoom() {
  const [launchingJob, setLaunchingJob] = useState<string | null>(null);

  const { channels, jobs, loading: runtimeLoading, readyChannels, blockedChannels, nextJob, healthScore, triggerJob } = useOpenClawRuntime();
  const { runs, memory, activeRun, loading: runsLoading } = useOpenClawRuns();
  const { config, pendingValidations, logs } = useOpenClaw();
  const {
    recentExecutions, failedExecutions, runningExecutions,
    totalOutputs, totalRecs, totalActions,
    lastExecutionByType, executeJob, loading: execLoading,
  } = useOpenClawExecutions();

  const loading = runtimeLoading || runsLoading || execLoading;

  // ── Trigger a real job execution ───────────────────────────────────────────
  const handleExecuteJob = async (jobType: string, jobId?: string) => {
    setLaunchingJob(jobType);
    const result = await executeJob(jobType, jobId);
    setLaunchingJob(null);
    if (result.success) {
      toast.success(result.summary || "Le cerveau a travaillé.", { description: result.outputCount ? `${result.outputCount} élément${result.outputCount > 1 ? "s" : ""} produit${result.outputCount > 1 ? "s" : ""}` : undefined });
    } else {
      toast.error("Le job a rencontré un problème.", { description: result.error });
    }
  };

  const noGateway = !config?.gateway_url;

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

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <Activity size={20} className="text-primary" />
              Centre de commandement
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ce que le moteur a réellement produit
            </p>
          </div>
          <Link to="/operations"
            className="text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 bg-muted hover:bg-secondary transition-colors">
            <Target size={12} className="text-primary" />
            Opérations
          </Link>
        </div>

        {/* ── Kill switch ──────────────────────────────────────────────────────── */}
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

        {/* ── Mode dégradé honnête ────────────────────────────────────────────── */}
        {noGateway && (
          <div className="rounded-2xl p-3 flex items-start gap-2.5"
            style={{ background: "hsl(38 80% 92%)", border: "1px solid hsl(38 80% 75%)" }}>
            <AlertTriangle size={13} style={{ color: "hsl(38 80% 30%)" }} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold" style={{ color: "hsl(38 80% 30%)" }}>Mode préparation</p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "hsl(38 80% 40%)" }}>
                Aucun gateway configuré. Les jobs peuvent être lancés manuellement. 
                L'exécution automatique (pendant que vous dormez) nécessite un gateway OpenClaw.
              </p>
            </div>
          </div>
        )}

        {/* ── Approvals urgentes ───────────────────────────────────────────────── */}
        {pendingValidations.length > 0 && (
          <Link to="/validations">
            <div className="rounded-2xl p-4 flex items-center justify-between cursor-pointer"
              style={{ background: "linear-gradient(135deg, hsl(38 80% 12%), hsl(38 65% 15%))", border: "1px solid hsl(38 80% 35% / 0.4)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(38 80% 40% / 0.2)" }}>
                  <Shield size={18} style={{ color: "hsl(38 80% 65%)" }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "hsl(38 80% 75%)" }}>
                    {pendingValidations.length} action{pendingValidations.length > 1 ? "s" : ""} attend{pendingValidations.length > 1 ? "ent" : ""} votre accord
                  </p>
                  <p className="text-xs" style={{ color: "hsl(38 80% 55% / 0.7)" }}>Le cerveau est en attente de votre décision</p>
                </div>
              </div>
              <ChevronRight size={16} style={{ color: "hsl(38 80% 65%)" }} />
            </div>
          </Link>
        )}

        {/* ── Hero cerveau + totaux produits ──────────────────────────────────── */}
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
                      : "Vos agents sont prêts à intervenir dès que vous le décidez."}
              </p>
              {(activeRun || runningExecutions.length > 0) && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Radio size={9} className="animate-pulse" style={{ color: "hsl(var(--success))" }} />
                  <span className="text-xs font-semibold" style={{ color: "hsl(var(--success))" }}>Exécution en cours</span>
                </div>
              )}
            </div>
          </div>

          {/* Ce que le moteur a RÉELLEMENT produit */}
          <div className="relative z-10 grid grid-cols-4 gap-2">
            {[
              { label: "Sorties totales",    value: totalOutputs,              ok: totalOutputs > 0 },
              { label: "Recommandations",    value: totalRecs,                  ok: totalRecs > 0 },
              { label: "Actions créées",     value: totalActions,               ok: totalActions > 0 },
              { label: "En attente",         value: pendingValidations.length,  ok: pendingValidations.length === 0 },
            ].map(({ label, value, ok }) => (
              <div key={label} className="text-center py-2.5 rounded-xl" style={{ background: "hsl(218 40% 13% / 0.8)" }}>
                <p className="text-sm font-bold" style={{ color: ok ? "hsl(var(--success))" : "hsl(38 80% 65%)" }}>
                  {value}
                </p>
                <p className="text-xs text-white/30">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Jobs réels — lancer maintenant ─────────────────────────────────── */}
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
                <button
                  key={type}
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

        {/* ── Exécutions récentes — vérité runtime ────────────────────────────── */}
        {recentExecutions.length > 0 && (
          <div className="card-surface p-4">
            <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
              <BarChart3 size={12} className="text-primary" /> Ce que le moteur a produit
            </p>
            <div className="space-y-2">
              {recentExecutions.map((exec) => {
                const meta = JOB_TYPE_LIBRARY[exec.job_type];
                const statusMeta = EXEC_STATUS_META[exec.status];
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
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{formatRelative(exec.created_at)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Jobs en échec ────────────────────────────────────────────────────── */}
        {failedExecutions.length > 0 && (
          <div className="card-surface p-4"
            style={{ border: "1px solid hsl(0 65% 85%)" }}>
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

        {/* ── État des canaux ─────────────────────────────────────────────────── */}
        <div className="card-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Wifi size={12} className="text-primary" /> Canaux disponibles
            </p>
            <Link to="/operations" className="text-xs text-primary hover:underline flex items-center gap-1">
              Tout voir <ChevronRight size={10} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {channels.slice(0, 6).map((ch) => {
              const meta = CHANNEL_STATUS_META[ch.status] ?? CHANNEL_STATUS_META.non_configure;
              const emoji = ch.channel_id === "email" ? "📧" : ch.channel_id === "whatsapp" ? "💬"
                : ch.channel_id === "telegram" ? "✈️" : ch.channel_id === "slack" ? "💼"
                : ch.channel_id === "introduction" ? "🤝" : ch.channel_id === "phone" ? "📞"
                : ch.channel_id === "discord" ? "🎮" : "📡";
              return (
                <div key={ch.id} className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
                  <span className="text-sm shrink-0">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{ch.channel_name}</p>
                    <p className="text-xs font-medium truncate" style={{ color: meta.color }}>{meta.label}</p>
                  </div>
                  {ch.is_ready
                    ? <Wifi size={9} style={{ color: "hsl(var(--success))" }} className="shrink-0" />
                    : <WifiOff size={9} className="shrink-0 text-muted-foreground" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Agents de l'essaim ───────────────────────────────────────────────── */}
        <div className="card-surface p-4">
          <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
            <Sparkles size={12} className="text-primary" /> Essaim d'agents
          </p>
          <div className="grid grid-cols-2 gap-2">
            {BRAIN_AGENTS.map((agent) => {
              const isInRun = runs.some(r => r.status === "en_cours" && r.agent_names?.includes(agent.id));
              const lastExec = Object.values(lastExecutionByType).find(e => {
                const jobMeta = JOB_TYPE_LIBRARY[e.job_type];
                return jobMeta?.agent === agent.id;
              });
              return (
                <div key={agent.id} className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
                  <span className="text-sm shrink-0">{agent.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{agent.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {isInRun ? "En cours…"
                        : lastExec?.output_summary
                          ? lastExec.output_summary.slice(0, 30) + "…"
                          : "En attente"}
                    </p>
                  </div>
                  <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${isInRun ? "animate-pulse" : ""}`}
                    style={{ background: isInRun ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Prochains cycles ─────────────────────────────────────────────────── */}
        <div className="card-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Clock size={12} className="text-primary" /> Prochains réveils
            </p>
          </div>
          {jobs.filter(j => j.enabled && j.next_run_at).length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              Aucun cycle planifié. <Link to="/operations" className="text-primary underline">Configurer</Link>
            </p>
          ) : (
            <div className="space-y-2">
              {jobs.filter(j => j.enabled && j.next_run_at).slice(0, 4).map((job) => {
                const meta = JOB_TYPE_META[job.job_type];
                const lastExec = lastExecutionByType[job.job_type];
                return (
                  <div key={job.id} className="flex items-center gap-3">
                    <span className="text-base shrink-0">{meta?.icon ?? "⚙️"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{meta?.label ?? job.job_name}</p>
                      {lastExec?.status === "termine" && (
                        <p className="text-xs" style={{ color: "hsl(var(--success))" }}>
                          Dernière exécution : {formatRelative(lastExec.created_at)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "hsl(218 72% 55%)" }}>
                      {formatFuture(job.next_run_at)}
                    </span>
                    <button
                      onClick={() => handleExecuteJob(job.job_type, job.id)}
                      disabled={launchingJob === job.job_type}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                      style={{ background: "hsl(var(--secondary))" }}>
                      {launchingJob === job.job_type
                        ? <RefreshCw size={11} className="animate-spin text-muted-foreground" />
                        : <Play size={11} className="text-primary" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Isolation / Sécurité ─────────────────────────────────────────────── */}
        <div className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: "hsl(218 65% 8%)", border: "1px solid hsl(218 40% 20% / 0.4)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "hsl(218 72% 40% / 0.15)" }}>
            <Lock size={16} style={{ color: "hsl(218 72% 60%)" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Isolation logique active</p>
            <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
              Vos sessions, exécutions, mémoire et validations sont entièrement isolées par RLS.
              Aucune donnée n'est partagée avec d'autres utilisateurs.
            </p>
          </div>
          <Link to="/operations" className="text-xs font-semibold px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-all"
            style={{ background: "hsl(218 40% 18%)", color: "hsl(218 72% 60%)" }}>
            Sécurité <ChevronRight size={10} className="inline" />
          </Link>
        </div>

        {/* ── Accès rapides ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { to: "/validations", label: "Approvals", desc: pendingValidations.length > 0 ? `${pendingValidations.length} en attente` : "À jour ✓", icon: Shield, bg: "hsl(38 80% 90%)", color: "hsl(38 80% 30%)" },
            { to: "/agents",      label: "Agent OS",  desc: "Gérer les agents",   icon: Brain,   bg: "hsl(var(--secondary))", color: "hsl(var(--primary))" },
            { to: "/operations",  label: "Opérations",desc: "Runtime complet",     icon: Target,  bg: "hsl(var(--secondary))", color: "hsl(var(--primary))" },
            { to: "/radar",       label: "Radar",     desc: "Opportunités chaudes",icon: TrendingUp, bg: "hsl(var(--success-light))", color: "hsl(var(--success))" },
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

      </div>
    </UserLayout>
  );
}
