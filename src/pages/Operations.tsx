/**
 * OpenClaw Operations — Vue runtime maximale
 * Health, channels, sessions, runs, jobs, approvals, memory, tool policy, security boundary
 * UX premium, zéro jargon technique brut
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Brain, Zap, Shield, Clock, CheckCircle2, AlertTriangle,
  Radio, Play, Pause, RefreshCw, ChevronRight, Activity,
  Layers, Cpu, Database, Lock, Wifi, WifiOff, AlertCircle,
  ArrowRight, Sparkles, Target, Settings2, Eye,
} from "lucide-react";
import { useOpenClawRuntime, CHANNEL_STATUS_META, JOB_STATUS_META, JOB_TYPE_META, TOOL_ACCESS_META, DEFAULT_TOOL_MATRIX } from "@/hooks/useOpenClawRuntime";
import { useOpenClawRuns, RUN_TYPE_LABELS, BRAIN_AGENTS } from "@/hooks/useOpenClawRuns";
import { useOpenClaw } from "@/hooks/useOpenClaw";

type TabId = "runtime" | "channels" | "jobs" | "sessions" | "tools" | "boundary";

function formatRelative(iso: string | null) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "à l'instant";
  if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)}min`;
  if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)}h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function formatFuture(iso: string | null) {
  if (!iso) return "—";
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "bientôt";
  if (diff < 3600000) return `dans ${Math.floor(diff / 60000)}min`;
  if (diff < 86400000) return `dans ${Math.floor(diff / 3600000)}h`;
  return `dans ${Math.floor(diff / 86400000)}j`;
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

export default function Operations() {
  const [activeTab, setActiveTab] = useState<TabId>("runtime");
  const [probingChannel, setProbingChannel] = useState<string | null>(null);
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);

  const {
    channels, jobs, contextSessions, loading: runtimeLoading,
    readyChannels, blockedChannels, activeJobs, nextJob, healthScore,
    autonomieLevel, getEffectiveAccess, toggleJob, triggerJob, probeChannel,
  } = useOpenClawRuntime();

  const { runs, sessions, memory, activeRun, blockedRuns, loading: runsLoading } = useOpenClawRuns();
  const { config, pendingValidations } = useOpenClaw();

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

  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "runtime",   label: "Runtime",   icon: Brain },
    { id: "channels",  label: "Canaux",    icon: Wifi,       badge: blockedChannels.length || undefined },
    { id: "jobs",      label: "Cycles",    icon: Clock },
    { id: "sessions",  label: "Sessions",  icon: Layers },
    { id: "tools",     label: "Outils",    icon: Cpu },
    { id: "boundary",  label: "Sécurité",  icon: Lock },
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
                  label: "Exécution cloud",
                  ok: true,
                  desc: "Hôte cloud Lovable actif",
                  pulse: true,
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
                  desc: nextJob ? `${JOB_TYPE_META[nextJob.job_type]?.label ?? nextJob.job_name} ${formatFuture(nextJob.next_run_at)}` : "Aucun job planifié",
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
                          {formatRelative(run.created_at)}
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
                          Dernière sonde {formatRelative(ch.last_probe_at)}
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
            <div className="rounded-2xl p-3 flex items-start gap-2"
              style={{ background: "hsl(var(--muted))" }}>
              <Clock size={13} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                OpenClaw se réveille automatiquement selon ces cycles. Chaque réveil lance le bon agent au bon moment.
              </p>
            </div>

            {jobs.map((job) => {
              const typeMeta = JOB_TYPE_META[job.job_type];
              const statusMeta = JOB_STATUS_META[job.status] ?? { label: job.status, color: "hsl(var(--muted-foreground))" };
              const isTriggering = triggeringJob === job.id;

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
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center py-1.5 rounded-lg bg-muted">
                      <p className="text-xs font-bold text-foreground">{formatFuture(job.next_run_at)}</p>
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
                      {job.enabled ? <Pause size={11} /> : <Play size={11} />}
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
                        Prochain cycle {formatFuture(s.next_scheduled_at)}
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
                  <Database size={11} className="text-primary" /> Ce que le cerveau a appris
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
                  Démarrer <ArrowRight size={10} />
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
              const matrix = DEFAULT_TOOL_MATRIX[agent.id] ?? {};

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

            {/* Isolation badge */}
            <div className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, hsl(218 65% 9%), hsl(218 55% 12%))", border: "1px solid hsl(218 40% 22% / 0.5)" }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "hsl(218 72% 40% / 0.2)", border: "1px solid hsl(218 72% 50% / 0.3)" }}>
                  <Lock size={22} style={{ color: "hsl(218 72% 60%)" }} />
                </div>
                <div>
                  <p className="text-white font-bold">Isolation stricte activée</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    Vos données, sessions, runs, mémoire et validations sont entièrement isolées.
                    Aucun autre utilisateur ne peut accéder à votre espace OpenClaw.
                  </p>
                </div>
              </div>
            </div>

            {/* Boundary details */}
            <div className="card-surface p-4 space-y-3">
              <p className="text-xs font-bold text-foreground">Boundary par espace</p>
              {[
                { label: "Configuration OpenClaw",   icon: "⚙️", secured: true, desc: "URL gateway, secret, niveau" },
                { label: "Sessions actives",          icon: "🔄", secured: true, desc: "Contextes métier isolés" },
                { label: "Runs & historique",         icon: "📡", secured: true, desc: "Cycles de travail isolés" },
                { label: "Mémoire agentique",         icon: "🧠", secured: true, desc: "Apprentissages privés" },
                { label: "Validations",               icon: "✅", secured: true, desc: "Boîte de décision privée" },
                { label: "Canaux connectés",          icon: "📡", secured: true, desc: "Configuration par utilisateur" },
                { label: "Politiques d'accès outils", icon: "🔐", secured: true, desc: "Matrice d'accès privée" },
                { label: "Journaux d'activité",       icon: "📋", secured: true, desc: "Logs privés uniquement" },
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
                <p className="text-sm font-semibold text-foreground">Arrêt d'urgence</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Le Kill Switch stoppe instantanément tous vos agents. Aucune action ne peut être exécutée tant qu'il est activé.
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

            {/* Node host info */}
            <div className="card-surface p-4">
              <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                <Target size={11} className="text-primary" /> Hôte d'exécution
              </p>
              <div className="space-y-2">
                {[
                  { label: "Cerveau principal",   host: "Lovable Cloud",     active: true },
                  { label: "Exécution agents",    host: "Lovable Cloud",     active: true },
                  { label: "Gateway OpenClaw",    host: config?.gateway_url ? "Votre serveur" : "Non configuré", active: !!config?.gateway_url },
                ].map(({ label, host, active }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{label}</span>
                    <span className="text-xs font-medium flex items-center gap-1"
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

      </div>
    </UserLayout>
  );
}
