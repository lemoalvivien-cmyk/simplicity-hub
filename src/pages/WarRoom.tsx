/**
 * War Room OpenClaw — Centre de commandement vivant
 * Vue temps réel : cerveau, canaux, approvals, cycles, agents, alertes
 * UX premium, sans jargon technique
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Brain, Zap, Shield, Clock, CheckCircle2, AlertTriangle,
  Radio, Play, RefreshCw, ChevronRight, Activity,
  Wifi, WifiOff, AlertCircle, ArrowRight, Sparkles, Target,
  Eye, Lock, Database, Layers, Bell, TrendingUp, Flame
} from "lucide-react";
import { useOpenClawRuntime, CHANNEL_STATUS_META, JOB_TYPE_META } from "@/hooks/useOpenClawRuntime";
import { useOpenClawRuns, RUN_TYPE_LABELS, BRAIN_AGENTS } from "@/hooks/useOpenClawRuns";
import { useOpenClaw } from "@/hooks/useOpenClaw";

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

function PulseDot({ active, color = "hsl(var(--success))" }: { active: boolean; color?: string }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${active ? "animate-pulse" : ""}`}
      style={{ background: active ? color : "hsl(var(--muted-foreground))" }}
    />
  );
}

function BrainScore({ score }: { score: number }) {
  const color = score >= 80 ? "hsl(var(--success))"
    : score >= 50 ? "hsl(218 72% 55%)"
    : "hsl(38 80% 45%)";
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
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
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);

  const {
    channels, jobs, loading: runtimeLoading,
    readyChannels, blockedChannels, nextJob, healthScore,
    triggerJob, probeChannel,
  } = useOpenClawRuntime();

  const { runs, sessions, memory, activeRun, loading: runsLoading } = useOpenClawRuns();
  const { config, pendingValidations, logs } = useOpenClaw();

  const loading = runtimeLoading || runsLoading;

  const handleTrigger = async (job: Parameters<typeof triggerJob>[0]) => {
    setTriggeringJob(job.id);
    await triggerJob(job);
    setTriggeringJob(null);
  };

  const recentLogs = logs.slice(0, 6);
  const hotOpportunities = memory.filter(m => m.memory_type === "opportunity" || m.memory_type === "signal").slice(0, 3);

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
              OpenClaw en temps réel — cerveau, canaux, approbations, cycles
            </p>
          </div>
          <Link to="/operations"
            className="text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 bg-muted hover:bg-secondary transition-colors">
            <Target size={12} className="text-primary" />
            Opérations
          </Link>
        </div>

        {/* ── Kill switch alerte ────────────────────────────────────────────── */}
        {config?.kill_switch_global && (
          <div className="rounded-2xl p-3 flex items-center gap-3"
            style={{ background: "hsl(0 65% 95%)", border: "1px solid hsl(0 65% 85%)" }}>
            <AlertCircle size={14} style={{ color: "hsl(0 65% 40%)" }} className="shrink-0" />
            <p className="text-xs font-semibold flex-1" style={{ color: "hsl(0 65% 40%)" }}>
              Kill Switch actif — tous les agents sont arrêtés.
            </p>
            <Link to="/agents" className="text-xs font-bold underline" style={{ color: "hsl(0 65% 40%)" }}>
              Réactiver
            </Link>
          </div>
        )}

        {/* ── Approvals urgentes ────────────────────────────────────────────── */}
        {pendingValidations.length > 0 && (
          <Link to="/validations">
            <div className="rounded-2xl p-4 flex items-center justify-between cursor-pointer"
              style={{ background: "linear-gradient(135deg, hsl(38 80% 12%), hsl(38 65% 15%))", border: "1px solid hsl(38 80% 35% / 0.4)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "hsl(38 80% 40% / 0.2)" }}>
                  <Shield size={18} style={{ color: "hsl(38 80% 65%)" }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "hsl(38 80% 75%)" }}>
                    {pendingValidations.length} action{pendingValidations.length > 1 ? "s" : ""} attendent votre accord
                  </p>
                  <p className="text-xs" style={{ color: "hsl(38 80% 55% / 0.7)" }}>
                    Le cerveau est en attente de votre décision
                  </p>
                </div>
              </div>
              <ChevronRight size={16} style={{ color: "hsl(38 80% 65%)" }} />
            </div>
          </Link>
        )}

        {/* ── Hero : Cerveau + Stats ────────────────────────────────────────── */}
        <div className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, hsl(218 65% 8%), hsl(218 55% 11%))", border: "1px solid hsl(218 40% 20% / 0.5)" }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 80% 60% at 80% 40%, hsl(218 72% 35% / 0.12) 0%, transparent 70%)" }} />
          
          <div className="relative z-10 flex items-center gap-5 mb-5">
            <BrainScore score={healthScore} />
            <div className="flex-1">
              <p className="text-white font-bold text-base mb-1">
                {!config?.kill_switch_global
                  ? "Le cerveau continue de travailler"
                  : "Le cerveau est en pause"}
              </p>
              <p className="text-white/40 text-xs leading-relaxed">
                {activeRun
                  ? `Cycle en cours : ${RUN_TYPE_LABELS[activeRun.run_type]?.label ?? activeRun.run_type}`
                  : nextJob
                    ? `Prochain réveil : ${JOB_TYPE_META[nextJob.job_type]?.label ?? nextJob.job_name} ${formatFuture(nextJob.next_run_at)}`
                    : "Vos agents sont prêts à intervenir dès que nécessaire."}
              </p>
              {activeRun && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Radio size={9} className="animate-pulse" style={{ color: "hsl(var(--success))" }} />
                  <span className="text-xs font-semibold" style={{ color: "hsl(var(--success))" }}>
                    Exécution en cours
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-4 gap-2">
            {[
              { label: "Canaux prêts", value: `${readyChannels.length}/${channels.length}`, ok: readyChannels.length > 0 },
              { label: "En attente", value: pendingValidations.length, ok: pendingValidations.length === 0 },
              { label: "Cycles actifs", value: jobs.filter(j => j.enabled).length, ok: jobs.filter(j => j.enabled).length > 0 },
              { label: "Mémoire", value: memory.length, ok: memory.length > 0 },
            ].map(({ label, value, ok }) => (
              <div key={label} className="text-center py-2.5 rounded-xl"
                style={{ background: "hsl(218 40% 13% / 0.8)" }}>
                <p className="text-sm font-bold" style={{ color: ok ? "hsl(var(--success))" : "hsl(38 80% 65%)" }}>
                  {value}
                </p>
                <p className="text-xs text-white/30">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Canaux (cards compactes) ──────────────────────────────────────── */}
        <div className="card-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Wifi size={12} className="text-primary" /> État des canaux
            </p>
            <Link to="/operations" className="text-xs text-primary hover:underline flex items-center gap-1">
              Détail <ChevronRight size={10} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {channels.slice(0, 6).map((ch) => {
              const meta = CHANNEL_STATUS_META[ch.status] ?? CHANNEL_STATUS_META.non_configure;
              const emoji = ch.channel_id === "email" ? "📧"
                : ch.channel_id === "whatsapp" ? "💬"
                : ch.channel_id === "telegram" ? "✈️"
                : ch.channel_id === "slack" ? "💼"
                : ch.channel_id === "introduction" ? "🤝"
                : ch.channel_id === "phone" ? "📞"
                : ch.channel_id === "discord" ? "🎮"
                : "📡";
              return (
                <div key={ch.id} className="flex items-center gap-2 p-2.5 rounded-xl"
                  style={{ background: "hsl(var(--muted))" }}>
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

        {/* ── Agents actifs ─────────────────────────────────────────────────── */}
        <div className="card-surface p-4">
          <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
            <Zap size={12} className="text-primary" /> Essaim d'agents
          </p>
          <div className="grid grid-cols-2 gap-2">
            {BRAIN_AGENTS.map((agent) => {
              const isInRun = runs.some(r => r.status === "en_cours" && r.agent_names?.includes(agent.id));
              const recentRun = runs.find(r => r.agent_names?.includes(agent.id));
              return (
                <div key={agent.id} className="flex items-center gap-2 p-2.5 rounded-xl"
                  style={{ background: "hsl(var(--muted))" }}>
                  <span className="text-sm shrink-0">{agent.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{agent.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {isInRun ? "En cours…" : recentRun ? formatRelative(recentRun.created_at) ?? "—" : "En attente"}
                    </p>
                  </div>
                  <PulseDot active={isInRun} />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Prochain réveil ───────────────────────────────────────────────── */}
        <div className="card-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Clock size={12} className="text-primary" /> Prochains réveils
            </p>
            <Link to="/operations" className="text-xs text-primary hover:underline flex items-center gap-1">
              Gérer <ChevronRight size={10} />
            </Link>
          </div>
          <div className="space-y-2">
            {jobs.filter(j => j.enabled && j.next_run_at).slice(0, 4).map((job) => {
              const meta = JOB_TYPE_META[job.job_type];
              return (
                <div key={job.id} className="flex items-center gap-3">
                  <span className="text-base shrink-0">{meta?.icon ?? "⚙️"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{meta?.label ?? job.job_name}</p>
                    <p className="text-xs text-muted-foreground">{meta?.desc}</p>
                  </div>
                  <span className="text-xs font-semibold whitespace-nowrap"
                    style={{ color: "hsl(218 72% 55%)" }}>
                    {formatFuture(job.next_run_at)}
                  </span>
                  <button
                    onClick={() => handleTrigger(job)}
                    disabled={!!triggeringJob}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: "hsl(var(--secondary))" }}
                    title="Lancer maintenant">
                    {triggeringJob === job.id
                      ? <RefreshCw size={11} className="animate-spin text-muted-foreground" />
                      : <Play size={11} className="text-primary" />}
                  </button>
                </div>
              );
            })}
            {jobs.filter(j => j.enabled).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Aucun cycle planifié.{" "}
                <Link to="/operations" className="text-primary underline">Configurer</Link>
              </p>
            )}
          </div>
        </div>

        {/* ── Sessions isolées ──────────────────────────────────────────────── */}
        {sessions.length > 0 && (
          <div className="card-surface p-4">
            <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
              <Layers size={12} className="text-primary" /> Sessions actives
            </p>
            <div className="space-y-2">
              {sessions.filter(s => s.status === "active").slice(0, 3).map((s) => (
                <div key={s.id} className="flex items-center gap-3 py-1.5">
                  <div className="w-2 h-2 rounded-full animate-pulse shrink-0"
                    style={{ background: "hsl(var(--success))" }} />
                  <p className="text-xs font-medium text-foreground flex-1">{s.session_type}</p>
                  <span className="text-xs text-muted-foreground">{s.context_type}</span>
                  {s.next_scheduled_at && (
                    <span className="text-xs font-semibold" style={{ color: "hsl(218 72% 55%)" }}>
                      {formatFuture(s.next_scheduled_at)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Mémoire récente du cerveau ────────────────────────────────────── */}
        {memory.length > 0 && (
          <div className="card-surface p-4">
            <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
              <Database size={12} className="text-primary" /> Ce que le cerveau a appris récemment
            </p>
            <div className="space-y-2">
              {memory.slice(0, 4).map((m) => (
                <div key={m.id} className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{
                      background: `hsl(218 72% ${40 + m.confidence / 8}% / 0.15)`,
                      color: "hsl(218 72% 55%)",
                    }}>
                    {m.confidence}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{m.key}</p>
                    <p className="text-xs text-muted-foreground">{m.memory_type}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{m.times_used}×</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Activité récente ─────────────────────────────────────────────── */}
        {recentLogs.length > 0 && (
          <div className="card-surface p-4">
            <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
              <Activity size={12} className="text-primary" /> Activité récente
            </p>
            <div className="space-y-2">
              {recentLogs.map((log) => {
                const riskColor = log.risque === "eleve" ? "hsl(0 65% 40%)"
                  : log.risque === "moyen" ? "hsl(38 80% 40%)"
                  : "hsl(var(--muted-foreground))";
                return (
                  <div key={log.id} className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: riskColor }} />
                    <p className="text-xs text-foreground flex-1 truncate">{log.summary}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatRelative(log.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Sécurité / Isolation ──────────────────────────────────────────── */}
        <div className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: "hsl(218 65% 8%)", border: "1px solid hsl(218 40% 20% / 0.4)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "hsl(218 72% 40% / 0.15)" }}>
            <Lock size={16} style={{ color: "hsl(218 72% 60%)" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Isolation active</p>
            <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
              Vos sessions, runs, mémoire et validations sont entièrement isolés.
              Aucune action n'est mutualisée avec d'autres utilisateurs.
            </p>
          </div>
          <Link to="/operations"
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-all"
            style={{ background: "hsl(218 40% 18%)", color: "hsl(218 72% 60%)" }}>
            Sécurité <ChevronRight size={10} className="inline" />
          </Link>
        </div>

        {/* ── Actions rapides ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/validations"
            className="card-surface p-4 flex items-center gap-3 hover:bg-secondary/80 transition-colors">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "hsl(38 80% 90%)" }}>
              <Shield size={16} style={{ color: "hsl(38 80% 30%)" }} />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Approvals</p>
              <p className="text-xs text-muted-foreground">
                {pendingValidations.length > 0 ? `${pendingValidations.length} en attente` : "À jour ✓"}
              </p>
            </div>
          </Link>
          <Link to="/agents"
            className="card-surface p-4 flex items-center gap-3 hover:bg-secondary/80 transition-colors">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "hsl(var(--secondary))" }}>
              <Brain size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Agent OS</p>
              <p className="text-xs text-muted-foreground">Gérer les agents</p>
            </div>
          </Link>
          <Link to="/operations"
            className="card-surface p-4 flex items-center gap-3 hover:bg-secondary/80 transition-colors">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "hsl(var(--secondary))" }}>
              <Target size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Opérations</p>
              <p className="text-xs text-muted-foreground">Runtime complet</p>
            </div>
          </Link>
          <Link to="/radar"
            className="card-surface p-4 flex items-center gap-3 hover:bg-secondary/80 transition-colors">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "hsl(var(--success-light))" }}>
              <TrendingUp size={16} style={{ color: "hsl(var(--success))" }} />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Deal Radar</p>
              <p className="text-xs text-muted-foreground">Opportunités chaudes</p>
            </div>
          </Link>
        </div>

      </div>
    </UserLayout>
  );
}
