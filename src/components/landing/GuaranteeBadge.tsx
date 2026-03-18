/**
 * GuaranteeBadge — "Prix garanti à vie + Remboursement 30 jours"
 * Réutilisable partout : CTA, pricing, success, dashboard
 */
import { ShieldCheck, BadgeCheck } from "lucide-react";

interface GuaranteeBadgeProps {
  variant?: "inline" | "bar" | "card";
  className?: string;
}

export default function GuaranteeBadge({ variant = "inline", className = "" }: GuaranteeBadgeProps) {
  if (variant === "bar") {
    return (
      <div
        className={`flex items-center justify-center flex-wrap gap-x-5 gap-y-1.5 px-4 py-2 rounded-xl ${className}`}
        style={{ background: "hsl(38 95% 50% / 0.07)", border: "1px solid hsl(38 95% 50% / 0.2)" }}
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "hsl(38 95% 55%)" }}>
          <BadgeCheck size={13} />
          Prix garanti à vie
        </span>
        <span className="text-white/25 text-xs hidden sm:inline">·</span>
        <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "hsl(152 62% 52%)" }}>
          <ShieldCheck size={13} />
          Engagement annuel · Résiliation libre
        </span>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={`rounded-xl p-3.5 flex items-start gap-3 ${className}`}
        style={{ background: "hsl(38 95% 50% / 0.06)", border: "1px solid hsl(38 95% 50% / 0.2)" }}
      >
        <BadgeCheck size={16} style={{ color: "hsl(38 95% 55%)" }} className="shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold mb-0.5" style={{ color: "hsl(38 95% 55%)" }}>
            Double garantie
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Prix verrouillé à vie</strong> · votre tarif de 99 €/an ne changera jamais.{" "}
            <strong className="text-foreground">Remboursement intégral</strong> si vous n'êtes pas satisfait dans les 30 jours.
          </p>
        </div>
      </div>
    );
  }

  // inline
  return (
    <p className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground ${className}`}>
      <span className="flex items-center gap-1" style={{ color: "hsl(38 95% 55%)" }}>
        <BadgeCheck size={12} /> Prix garanti à vie
      </span>
      <span className="text-muted-foreground/40">·</span>
      <span className="flex items-center gap-1" style={{ color: "hsl(152 62% 50%)" }}>
        <ShieldCheck size={12} /> Remboursé si insatisfait — 30 jours
      </span>
    </p>
  );
}
