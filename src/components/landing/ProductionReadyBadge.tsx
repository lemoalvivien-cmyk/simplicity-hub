/**
 * ProductionReadyBadge
 * Affiché UNIQUEMENT quand CLOSED_BETA = false.
 * Signale visuellement que la plateforme est ouverte au public.
 */
import { Zap, ShieldCheck } from "lucide-react";
import { CLOSED_BETA } from "@/lib/betaConfig";

interface ProductionReadyBadgeProps {
  className?: string;
}

export default function ProductionReadyBadge({ className = "" }: ProductionReadyBadgeProps) {
  if (CLOSED_BETA) return null;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold ${className}`}
      style={{
        background: "hsl(152 62% 34% / 0.15)",
        border: "1px solid hsl(152 62% 40% / 0.35)",
        color: "hsl(152 62% 58%)",
      }}
      role="status"
      aria-label="Plateforme ouverte au public"
    >
      {/* Pulsing green dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{ background: "hsl(152 62% 52%)" }}
        />
        <span
          className="relative inline-flex rounded-full h-2 w-2"
          style={{ background: "hsl(152 62% 52%)" }}
        />
      </span>
      <ShieldCheck size={11} />
      Production · Ouvert au public
      <Zap size={11} />
    </div>
  );
}
