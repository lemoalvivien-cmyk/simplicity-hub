/**
 * SlotCounter — Universal Founder Pass badge.
 * RÈGLE ABSOLUE : N'affiche JAMAIS le nombre de places (interdit).
 * Affiche uniquement "Founder Pass — 99 €/an · Prix garanti à vie"
 * ou l'état sold-out / loading.
 */
import { Zap, Lock } from "lucide-react";
import { useFounderSlots } from "@/hooks/useFounderSlots";

interface SlotCounterProps {
  variant?: "hero" | "inline" | "banner" | "card";
  /** Props kept for API compatibility — valeurs ignorées côté affichage */
  remaining?: number | null;
  total?: number;
  loading?: boolean;
}

export default function SlotCounter({
  variant = "inline",
  loading: externalLoading,
}: SlotCounterProps) {
  const { isSoldOut, loading: internalLoading } = useFounderSlots();
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;

  // ── LOADING skeleton ────────────────────────────────────────────────────
  if (loading) {
    if (variant === "hero") {
      return (
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/5 animate-pulse"
          style={{ minWidth: "220px", height: "28px" }}
        />
      );
    }
    return (
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full animate-pulse"
        style={{ background: "hsl(var(--accent) / 0.08)", minWidth: "120px", height: "24px" }}
      />
    );
  }

  // ── SOLD OUT ─────────────────────────────────────────────────────────────
  if (isSoldOut) {
    return (
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold"
        style={{
          background: "hsl(218 20% 88% / 0.08)",
          borderColor: "hsl(218 20% 70% / 0.3)",
          color: "hsl(218 15% 65%)",
        }}
      >
        <Lock size={11} />
        Offre Founder Pass terminée
      </div>
    );
  }

  // ── HERO ──────────────────────────────────────────────────────────────────
  if (variant === "hero") {
    return (
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold"
        style={{
          background: "hsl(var(--accent) / 0.12)",
          borderColor: "hsl(var(--accent) / 0.4)",
          color: "hsl(var(--accent))",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
          style={{ background: "hsl(var(--accent))", display: "inline-block" }}
        />
        Founder Pass — 99 €/an · Prix garanti à vie
      </div>
    );
  }

  // ── BANNER ────────────────────────────────────────────────────────────────
  if (variant === "banner") {
    return (
      <div
        className="flex items-center gap-3 rounded-2xl px-5 py-3.5 border"
        style={{
          background: "hsl(var(--accent) / 0.08)",
          borderColor: "hsl(var(--accent) / 0.3)",
        }}
      >
        <Zap size={15} style={{ color: "hsl(var(--accent))" }} className="shrink-0" />
        <p className="text-sm font-bold" style={{ color: "hsl(var(--accent))" }}>
          Founder Pass — 99 €/an · Prix garanti à vie · Résiliation libre
        </p>
      </div>
    );
  }

  // ── CARD ──────────────────────────────────────────────────────────────────
  if (variant === "card") {
    return (
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2.5"
        style={{
          background: "hsl(var(--accent) / 0.12)",
          border: "1px solid hsl(var(--accent) / 0.3)",
        }}
      >
        <Zap size={12} style={{ color: "hsl(var(--accent))" }} />
        <p className="text-xs font-semibold" style={{ color: "hsl(var(--accent))" }}>
          Founder Pass — Prix garanti à vie
        </p>
      </div>
    );
  }

  // ── INLINE (default) ─────────────────────────────────────────────────────
  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{
        background: "hsl(var(--accent) / 0.1)",
        border: "1px solid hsl(var(--accent) / 0.25)",
        color: "hsl(var(--accent))",
      }}
    >
      <Zap size={11} />
      Founder Pass — 99 €/an
    </div>
  );
}
