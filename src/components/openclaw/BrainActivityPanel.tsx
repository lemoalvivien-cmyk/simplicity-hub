/**
 * BrainActivityPanel — Vue vivante du cerveau OpenClaw
 * Utilisé dans /agents et dashboards
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Brain, Zap, Clock, CheckCircle2, AlertTriangle,
  ChevronRight, Play, ArrowRight, Sparkles, RefreshCw,
  Radio
} from "lucide-react";
import {
  useOpenClawRuns,
  RUN_TYPE_LABELS, RUN_STATUS_LABELS,
  BRAIN_AGENTS, OPENCLAW_MODES,
} from "@/hooks/useOpenClawRuns";
import { useOpenClaw } from "@/hooks/useOpenClaw";

interface BrainActivityPanelProps {
  compact?: boolean;
  showModes?: boolean;
}

function RunStatusBadge({ status }: { status: string }) {
  const s = RUN_STATUS_LABELS[status] ?? { label: status, color: "hsl(var(--muted-foreground))" };
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${s.color}18`, color: s.color }}>
      {s.pulse && <Radio size={9} className="animate-pulse" />}
      {s.label}
    </span>
  );
}

function formatDuration(ms: number | null) {
  if (!ms) return null;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatRelative(iso: string | null) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "à l'instant";
  if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)}min`;
  if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)}h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function formatFuture(iso: string | null) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "bientôt";
  if (diff < 3600000) return `dans ${Math.floor(diff / 60000)}min`;
  if (diff < 86400000) return `dans ${Math.floor(diff / 3600000)}h`;
  return `dans ${Math.floor(diff / 86400000)}j`;
}

export default function BrainActivityPanel({ compact = false, showModes = false }: BrainActivityPanelProps) {
  const {
    runs, loading, activeRun, lastRun, blockedRuns, nextRun, activeSession,
    createRun,
  } = useOpenClawRuns();
  const { config } = useOpenClaw();
  const [launching, setLaunching] = useState<string | null>(null);

  const handleLaunchRun = async (type: string) => {
    setLaunching(type);
    await createRun(type, "manual", undefined, [
      type === "scan" ? "signal_hunter" : type === "brief" ? "brief_writer" : "matchmaker"
    ]);
    setLaunching(null);
  };

  const currentMode = OPENCLAW_MODES.find(m => m.id === (config?.autonomie_level ?? "preparation"))
    ?? OPENCLAW_MODES[1];

  if (loading && runs.length === 0) {
    return (
      <div className="card-surface p-4 flex items-center gap-2 text-muted-foreground text-sm">
        <Brain size={15} className="animate-pulse" />
        <span>Chargement du cerveau…</span>
      </div>
    );
  }

  // ── Mode compact (pour dashboards) ───────────────────────────────────────────
  if (compact) {
    return (
      <div className="card-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
              <Brain size={12} className="text-white" />
            </div>
            <span className="text-xs font-bold text-foreground">Cerveau OpenClaw</span>
            {activeRun && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "hsl(218 72% 50%)" }}>
                <Radio size={8} className="animate-pulse" /> En cours
              </span>
            )}
          </div>
          <Link to="/agents" className="text-xs text-primary hover:underline flex items-center gap-1">
            Voir tout <ChevronRight size={10} />
          </Link>
        </div>

        {/* État actuel */}
        {activeRun ? (
          <div className="px-3 py-2 rounded-xl mb-2 flex items-center gap-2"
            style={{ background: "hsl(218 72% 50% / 0.1)", border: "1px solid hsl(218 72% 50% / 0.2)" }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(218 72% 50%)" }} />
            <p className="text-xs font-medium text-foreground flex-1 truncate">
              {RUN_TYPE_LABELS[activeRun.run_type]?.icon} {activeRun.summary ?? RUN_TYPE_LABELS[activeRun.run_type]?.label}
            </p>
          </div>
        ) : lastRun ? (
          <div className="px-3 py-2 rounded-xl mb-2 flex items-center gap-2 bg-muted">
            <CheckCircle2 size={11} style={{ color: "hsl(var(--success))" }} className="shrink-0" />
            <p className="text-xs text-muted-foreground flex-1 truncate">
              {lastRun.summary ?? "Dernier cycle terminé"}
            </p>
            <span className="text-xs text-muted-foreground shrink-0">{formatRelative(lastRun.ended_at ?? lastRun.created_at)}</span>
          </div>
        ) : (
          <div className="px-3 py-2 rounded-xl mb-2 bg-muted">
            <p className="text-xs text-muted-foreground">Le cerveau est prêt. Lancez un premier cycle.</p>
          </div>
        )}

        {/* Prochain cycle */}
        {nextRun?.next_run_at && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock size={10} />
            <span>Prochain cycle {formatFuture(nextRun.next_run_at)}</span>
          </div>
        )}

        {/* Bloqués */}
        {blockedRuns.length > 0 && (
          <Link to="/validations" className="flex items-center gap-1.5 mt-1.5 text-xs font-semibold"
            style={{ color: "hsl(38 80% 40%)" }}>
            <AlertTriangle size={10} />
            {blockedRuns.length} action{blockedRuns.length > 1 ? "s" : ""} attend{blockedRuns.length > 1 ? "ent" : ""} votre accord
            <ChevronRight size={10} />
          </Link>
        )}
      </div>
    );
  }

  // ── Vue complète (/agents) ───────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── État du cerveau ── */}
      <div className="rounded-2xl p-4 relative overflow-hidden" style={{
        background: "linear-gradient(135deg, hsl(218 65% 9%), hsl(218 55% 12%))",
        border: "1px solid hsl(218 40% 22% / 0.5)"
      }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 50% 80% at 80% 50%, hsl(218 72% 40% / 0.12) 0%, transparent 70%)"
        }} />
        <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
              <Brain size={17} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">OpenClaw</p>
              <p className="text-xs text-white/40">Cerveau central · {currentMode.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: activeRun ? "hsl(218 72% 60%)" : "hsl(var(--success))" }} />
            <span className="text-xs text-white/50">{activeRun ? "En cours" : "Prêt"}</span>
          </div>
        </div>

        {/* Run actif ou dernier run */}
        {activeRun ? (
          <div className="rounded-xl px-3 py-2.5 mb-3 flex items-center gap-2"
            style={{ background: "hsl(218 72% 50% / 0.15)", border: "1px solid hsl(218 72% 50% / 0.3)" }}>
            <Sparkles size={12} className="text-white/70 shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {RUN_TYPE_LABELS[activeRun.run_type]?.icon} {activeRun.summary ?? "Cycle en cours…"}
              </p>
              <p className="text-xs text-white/40">
                {activeRun.agent_names?.join(", ") || "Agents actifs"}
              </p>
            </div>
          </div>
        ) : lastRun ? (
          <div className="rounded-xl px-3 py-2 mb-3 flex items-center gap-2" style={{ background: "hsl(218 40% 16% / 0.6)" }}>
            <CheckCircle2 size={12} style={{ color: "hsl(var(--success))" }} className="shrink-0" />
            <p className="text-xs text-white/60 flex-1 truncate">{lastRun.summary ?? "Dernier cycle terminé"}</p>
            <span className="text-xs text-white/30">{formatRelative(lastRun.ended_at ?? lastRun.created_at)}</span>
          </div>
        ) : (
          <div className="rounded-xl px-3 py-2 mb-3" style={{ background: "hsl(218 40% 16% / 0.6)" }}>
            <p className="text-xs text-white/40">Aucun cycle récent. Lancez le cerveau.</p>
          </div>
        )}

        {/* Stats session */}
        {activeSession && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Cycles",   value: activeSession.runs_count },
              { label: "Score",    value: `${activeSession.session_score}/100` },
              { label: "Mode",     value: currentMode.label },
            ].map(({ label, value }) => (
              <div key={label} className="text-center py-1.5 rounded-lg" style={{ background: "hsl(218 40% 14% / 0.8)" }}>
                <p className="text-xs font-bold text-white">{value}</p>
                <p className="text-xs text-white/30">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Actions rapides ── */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { type: "scan",    label: "Lancer un scan",      icon: "📡" },
          { type: "brief",   label: "Préparer un brief",   icon: "📋" },
          { type: "passive", label: "Activer diffusion",   icon: "🌐" },
          { type: "radar",   label: "Analyser signaux",    icon: "🎯" },
        ].map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => handleLaunchRun(type)}
            disabled={launching === type || !!activeRun}
            className="p-3 rounded-xl text-left transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
          >
            <span className="text-base mb-1 block">{icon}</span>
            <p className="text-xs font-semibold text-foreground">
              {launching === type ? "Lancement…" : label}
            </p>
          </button>
        ))}
      </div>

      {/* ── Prochain cycle prévu ── */}
      {nextRun?.next_run_at && (
        <div className="card-surface p-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-muted">
            <Clock size={13} className="text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground">
              Prochain cycle {formatFuture(nextRun.next_run_at)}
            </p>
            <p className="text-xs text-muted-foreground">
              {RUN_TYPE_LABELS[nextRun.run_type]?.label ?? nextRun.run_type}
            </p>
          </div>
          <button onClick={() => handleLaunchRun(nextRun.run_type)}
            className="p-1.5 rounded-lg bg-secondary hover:bg-muted transition-colors">
            <Play size={11} className="text-primary" />
          </button>
        </div>
      )}

      {/* ── Bloqués ── */}
      {blockedRuns.length > 0 && (
        <Link to="/validations" className="rounded-xl p-3 flex items-center justify-between gap-3 hover:opacity-90"
          style={{ background: "hsl(38 80% 90%)", border: "1px solid hsl(38 80% 75%)" }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={13} style={{ color: "hsl(38 80% 30%)" }} />
            <p className="text-xs font-semibold" style={{ color: "hsl(38 80% 30%)" }}>
              {blockedRuns.length} action{blockedRuns.length > 1 ? "s" : ""} attend{blockedRuns.length > 1 ? "ent" : ""} votre accord
            </p>
          </div>
          <ArrowRight size={12} style={{ color: "hsl(38 80% 30%)" }} />
        </Link>
      )}

      {/* ── Essaim d'agents ── */}
      <div className="card-surface p-4">
        <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
          <Zap size={12} className="text-primary" />
          Essaim d'agents spécialisés
        </p>
        <div className="space-y-2">
          {BRAIN_AGENTS.map((agent) => {
            const isActive = runs.some(r =>
              r.status === "en_cours" && r.agent_names?.includes(agent.id)
            );
            const wasRecent = runs.some(r =>
              r.status === "termine" && r.agent_names?.includes(agent.id) &&
              Date.now() - new Date(r.created_at).getTime() < 86400000
            );
            return (
              <div key={agent.id} className="flex items-center gap-3">
                <span className="text-sm">{agent.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{agent.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{agent.desc}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isActive ? (
                    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: agent.color }}>
                      <Radio size={8} className="animate-pulse" /> Actif
                    </span>
                  ) : wasRecent ? (
                    <span className="text-xs text-muted-foreground">Récent</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Prêt</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Modes OpenClaw ── */}
      {showModes && (
        <div className="card-surface p-4">
          <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
            <Brain size={12} className="text-primary" /> Mode actuel
          </p>
          <div className="space-y-2">
            {OPENCLAW_MODES.map((mode) => {
              const isCurrent = mode.id === (config?.autonomie_level ?? "preparation");
              return (
                <div key={mode.id} className={`p-3 rounded-xl transition-all ${isCurrent ? "border-2" : "border"}`}
                  style={{
                    borderColor: isCurrent ? mode.color : "hsl(var(--border))",
                    background: isCurrent ? `${mode.color}10` : "transparent",
                  }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-foreground">{mode.label}</p>
                    {isCurrent && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${mode.color}20`, color: mode.color }}>
                        Actif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{mode.effect}</p>
                </div>
              );
            })}
          </div>
          <Link to="/autonomie" className="flex items-center justify-center gap-1.5 mt-3 text-xs text-primary hover:underline">
            Changer de mode <ArrowRight size={10} />
          </Link>
        </div>
      )}

      {/* ── Historique récent ── */}
      <div className="card-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <RefreshCw size={11} className="text-primary" /> Activité récente
          </p>
        </div>
        {runs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            Aucun cycle enregistré. Lancez le premier scan.
          </p>
        ) : (
          <div className="space-y-2">
            {runs.slice(0, 6).map((run) => {
              const meta = RUN_TYPE_LABELS[run.run_type];
              const statusMeta = RUN_STATUS_LABELS[run.status];
              return (
                <div key={run.id} className="flex items-center gap-2.5">
                  <span className="text-base shrink-0">{meta?.icon ?? "⚙️"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {run.summary ?? meta?.label ?? run.run_type}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatRelative(run.created_at)}</p>
                  </div>
                  <RunStatusBadge status={run.status} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
