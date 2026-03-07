/**
 * OpenClawBrainWidget — Bloc compact "cerveau vivant" pour les dashboards
 * Montre l'état du cerveau en quelques lignes
 */
import { Brain, Radio, Clock, AlertTriangle, ChevronRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useOpenClawRuns, RUN_TYPE_LABELS } from "@/hooks/useOpenClawRuns";
import { useOpenClaw } from "@/hooks/useOpenClaw";

interface OpenClawBrainWidgetProps {
  variant?: "entreprise" | "facilitateur";
}

function formatFuture(iso: string | null) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "bientôt";
  if (diff < 3600000) return `dans ${Math.floor(diff / 60000)}min`;
  if (diff < 86400000) return `dans ${Math.floor(diff / 3600000)}h`;
  return `dans ${Math.floor(diff / 86400000)}j`;
}

export default function OpenClawBrainWidget({ variant = "entreprise" }: OpenClawBrainWidgetProps) {
  const { activeRun, lastRun, blockedRuns, nextRun, loading } = useOpenClawRuns();
  const { config } = useOpenClaw();

  const isConnected = config?.is_connected && !config?.kill_switch_global;

  // Texte de statut contextuel
  const statusLine = () => {
    if (config?.kill_switch_global) return "Pause activée. Réactivez pour reprendre.";
    if (activeRun) return `${RUN_TYPE_LABELS[activeRun.run_type]?.icon ?? "⚙️"} ${activeRun.summary ?? "Cycle en cours…"}`;
    if (blockedRuns.length > 0) return `${blockedRuns.length} action${blockedRuns.length > 1 ? "s" : ""} attend${blockedRuns.length > 1 ? "ent" : ""} votre accord.`;
    if (lastRun) return lastRun.summary ?? "Dernier cycle terminé.";
    if (nextRun?.next_run_at) return `Prochain cycle ${formatFuture(nextRun.next_run_at)}.`;
    if (!config?.gateway_url) return "Connectez OpenClaw pour démarrer la prospection automatisée.";
    return variant === "entreprise"
      ? "OpenClaw pilote votre prospection automatisée."
      : "Le cerveau prépare vos prochaines opportunités.";
  };

  const pulseColor = activeRun
    ? "hsl(218 72% 55%)"
    : isConnected
      ? "hsl(var(--success))"
      : "hsl(var(--muted-foreground))";

  return (
    <div className="rounded-2xl p-4 relative overflow-hidden" style={{
      background: "linear-gradient(135deg, hsl(218 65% 9%), hsl(218 55% 12%))",
      border: "1px solid hsl(218 40% 22% / 0.5)"
    }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 100% at 90% 50%, hsl(218 72% 40% / 0.1) 0%, transparent 70%)"
      }} />
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
              <Brain size={13} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">OpenClaw</p>
              <p className="text-white/40 text-xs">{config?.autonomie_level ?? "Préparation"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{
              background: pulseColor,
              animation: activeRun ? "pulse 1.5s infinite" : "none"
            }} />
            <span className="text-xs text-white/40">{activeRun ? "En cours" : isConnected ? "Connecté" : "Prêt"}</span>
          </div>
        </div>

        {/* Statut principal */}
        <p className="text-xs text-white/70 leading-relaxed mb-2">{loading ? "…" : statusLine()}</p>

        {/* Indicateurs */}
        <div className="flex items-center gap-3 flex-wrap">
          {blockedRuns.length > 0 && (
            <Link to="/validations" className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: "hsl(38 90% 60%)" }}>
              <AlertTriangle size={10} /> {blockedRuns.length} accord{blockedRuns.length > 1 ? "s" : ""} requis
            </Link>
          )}
          {nextRun?.next_run_at && !activeRun && (
            <span className="flex items-center gap-1 text-xs text-white/40">
              <Clock size={9} /> {formatFuture(nextRun.next_run_at)}
            </span>
          )}
          <Link to="/agents" className="ml-auto flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
            <Zap size={9} /> Voir l'activité <ChevronRight size={9} />
          </Link>
        </div>
      </div>
    </div>
  );
}
