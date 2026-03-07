/**
 * TrustBadge — Composant de badge de confiance réutilisable
 * Affichage simple et premium du score de confiance
 */
import { ShieldCheck, Star, Zap, CheckCircle2, AlertTriangle } from "lucide-react";

interface TrustBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "badge" | "pill" | "full";
}

export function getTrustLevel(score: number) {
  if (score >= 85) return { label: "Confiance élevée", color: "hsl(142 62% 30%)", bg: "hsl(142 62% 96%)", icon: "🛡️", ring: "hsl(142 62% 75%)" };
  if (score >= 70) return { label: "Fiabilité reconnue", color: "hsl(218 72% 40%)", bg: "hsl(218 72% 96%)", icon: "✅", ring: "hsl(218 72% 75%)" };
  if (score >= 50) return { label: "Profil sérieux", color: "hsl(38 80% 35%)", bg: "hsl(38 80% 96%)", icon: "👍", ring: "hsl(38 80% 75%)" };
  return { label: "En construction", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))", icon: "🔵", ring: "hsl(var(--border))" };
}

export default function TrustBadge({ score, showLabel = true, size = "md", variant = "pill" }: TrustBadgeProps) {
  const trust = getTrustLevel(score);

  if (variant === "full") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{
        background: trust.bg,
        borderColor: trust.ring
      }}>
        <ShieldCheck size={size === "sm" ? 13 : 16} style={{ color: trust.color }} />
        <div>
          <p className="text-xs font-bold" style={{ color: trust.color }}>{trust.label}</p>
          <p className="text-xs" style={{ color: `${trust.color}99` }}>Score {score}/100</p>
        </div>
      </div>
    );
  }

  if (variant === "badge") {
    return (
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: trust.bg, border: `1px solid ${trust.ring}` }}
        title={`${trust.label} — ${score}/100`}
      >
        <ShieldCheck size={14} style={{ color: trust.color }} />
      </div>
    );
  }

  // pill (default)
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: trust.bg, color: trust.color }}
    >
      {trust.icon} {showLabel ? trust.label : `${score}/100`}
    </span>
  );
}

interface TrustScoreBarProps {
  label: string;
  score: number;
  color?: string;
}

export function TrustScoreBar({ label, score, color = "hsl(var(--primary))" }: TrustScoreBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums w-8 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

interface ProtectedIntroBadgeProps {
  status?: string;
}

export function ProtectedIntroBadge({ status = "protegee" }: ProtectedIntroBadgeProps) {
  const statuses: Record<string, { label: string; color: string; bg: string; icon: JSX.Element }> = {
    demandee: { label: "Demandée", color: "hsl(38 80% 35%)", bg: "hsl(38 80% 96%)", icon: <Zap size={10} /> },
    acceptee: { label: "Acceptée", color: "hsl(218 72% 40%)", bg: "hsl(218 72% 96%)", icon: <CheckCircle2 size={10} /> },
    protegee: { label: "Introduction protégée", color: "hsl(142 62% 30%)", bg: "hsl(142 62% 96%)", icon: <ShieldCheck size={10} /> },
    en_relation: { label: "En relation", color: "hsl(218 72% 40%)", bg: "hsl(218 72% 96%)", icon: <Star size={10} /> },
    convertie: { label: "Convertie ✓", color: "hsl(142 62% 30%)", bg: "hsl(142 62% 96%)", icon: <CheckCircle2 size={10} /> },
    litigieuse: { label: "En révision", color: "hsl(0 72% 40%)", bg: "hsl(0 72% 96%)", icon: <AlertTriangle size={10} /> },
  };

  const cfg = statuses[status] || statuses.demandee;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}
