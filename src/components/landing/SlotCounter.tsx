/**
 * SlotCounter — Universal slot counter component
 * Shared across landing, pricing, checkout pages.
 */
import { Flame, Zap, Clock, Lock } from "lucide-react";
import { useFounderSlots } from "@/hooks/useFounderSlots";

interface SlotCounterProps {
  variant?: "hero" | "inline" | "banner" | "card";
  /** Override with external slots value (e.g. from parent hook) */
  remaining?: number | null;
  total?: number;
  loading?: boolean;
}

export default function SlotCounter({
  variant = "inline",
  remaining: externalRemaining,
  total: externalTotal,
  loading: externalLoading,
}: SlotCounterProps) {
  const internal = useFounderSlots();

  // Use external values if provided, otherwise fall back to internal hook
  const remaining = externalRemaining !== undefined ? externalRemaining : internal.remaining;
  const total = externalTotal ?? internal.total;
  const loading = externalLoading !== undefined ? externalLoading : internal.loading;
  const isSoldOut = remaining === 0;
  const isUrgent = remaining !== null && remaining > 0 && remaining <= 10;
  const usedPct = remaining !== null ? Math.round(((total - remaining) / total) * 100) : 0;

  if (loading && remaining === null) {
    if (variant === "hero") {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/5 animate-pulse" style={{ minWidth: "200px", height: "28px" }} />
      );
    }
    return null;
  }

  // ── SOLD OUT ────────────────────────────────────────────────────────────────
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
        Offre de lancement terminée
      </div>
    );
  }

  // ── HERO variant ─────────────────────────────────────────────────────────────
  if (variant === "hero") {
    return (
      <div className="inline-flex flex-col items-center gap-2">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold"
          style={
            isUrgent
              ? { background: "hsl(0 72% 51% / 0.12)", borderColor: "hsl(0 72% 51% / 0.4)", color: "hsl(0 72% 72%)" }
              : { background: "hsl(var(--accent) / 0.12)", borderColor: "hsl(var(--accent) / 0.4)", color: "hsl(var(--accent))" }
          }
        >
          {isUrgent
            ? <Flame size={11} className="shrink-0" />
            : <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(var(--accent))", display: "inline-block" }} />
          }
          {isUrgent
            ? `🔥 Plus que ${remaining} place${remaining! > 1 ? "s" : ""} — ça part très vite !`
            : `${remaining} / ${total} places restantes à 99 € /an`
          }
        </div>
        {/* Progress bar */}
        <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(218 40% 25% / 0.5)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${usedPct}%`,
              background: isUrgent
                ? "linear-gradient(90deg, hsl(0 72% 55%), hsl(0 72% 72%))"
                : "linear-gradient(90deg, hsl(var(--accent)), hsl(38 90% 65%))",
            }}
          />
        </div>
      </div>
    );
  }

  // ── BANNER variant (for pricing & checkout banners) ────────────────────────
  if (variant === "banner") {
    return (
      <div
        className="flex items-center gap-3 rounded-2xl px-5 py-3.5 border"
        style={
          isUrgent
            ? { background: "hsl(0 72% 51% / 0.08)", borderColor: "hsl(0 72% 51% / 0.3)" }
            : { background: "hsl(var(--accent) / 0.08)", borderColor: "hsl(var(--accent) / 0.3)" }
        }
      >
        {isUrgent
          ? <Flame size={16} style={{ color: "hsl(0 72% 65%)" }} className="shrink-0" />
          : <Zap size={15} style={{ color: "hsl(var(--accent))" }} className="shrink-0" />
        }
        <div className="flex-1">
          <p
            className="text-sm font-bold"
            style={{ color: isUrgent ? "hsl(0 72% 72%)" : "hsl(var(--accent))" }}
          >
            {isUrgent
              ? `🔥 Plus que ${remaining} place${remaining! > 1 ? "s" : ""} à ce prix de lancement ! Ça part très vite.`
              : `Offre Fondateur · ${remaining} place${remaining! > 1 ? "s" : ""} restante${remaining! > 1 ? "s" : ""} sur ${total}`
            }
          </p>
          {!isUrgent && (
            <div className="mt-1.5 h-1 rounded-full overflow-hidden bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${usedPct}%`, background: "linear-gradient(90deg, hsl(var(--accent)), hsl(38 90% 65%))" }}
              />
            </div>
          )}
        </div>
        <span
          className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
          style={{
            background: isUrgent ? "hsl(0 72% 51% / 0.18)" : "hsl(var(--accent) / 0.18)",
            color: isUrgent ? "hsl(0 72% 75%)" : "hsl(var(--accent))",
          }}
        >
          {remaining} / {total}
        </span>
      </div>
    );
  }

  // ── CARD variant (for sidebar/order card) ────────────────────────────────
  if (variant === "card") {
    return (
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2.5"
        style={
          isUrgent
            ? { background: "hsl(0 72% 51% / 0.12)", border: "1px solid hsl(0 72% 51% / 0.3)" }
            : { background: "hsl(var(--accent) / 0.12)", border: "1px solid hsl(var(--accent) / 0.3)" }
        }
      >
        {isUrgent
          ? <Flame size={12} style={{ color: "hsl(0 72% 65%)" }} />
          : <Clock size={12} style={{ color: "hsl(var(--accent))" }} />
        }
        <p className="text-xs font-semibold" style={{ color: isUrgent ? "hsl(0 72% 72%)" : "hsl(var(--accent))" }}>
          {isUrgent
            ? `Plus que ${remaining} place${remaining! > 1 ? "s" : ""} — ça part très vite !`
            : `Plus que ${remaining} place${remaining! > 1 ? "s" : ""} au tarif fondateur`
          }
        </p>
      </div>
    );
  }

  // ── INLINE (default) ────────────────────────────────────────────────────────
  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={
        isUrgent
          ? { background: "hsl(0 72% 51% / 0.1)", border: "1px solid hsl(0 72% 51% / 0.3)", color: "hsl(0 72% 72%)" }
          : { background: "hsl(var(--accent) / 0.1)", border: "1px solid hsl(var(--accent) / 0.25)", color: "hsl(var(--accent))" }
      }
    >
      {isUrgent ? <Flame size={11} /> : <Zap size={11} />}
      {isUrgent
        ? `🔥 ${remaining} place${remaining! > 1 ? "s" : ""} restante${remaining! > 1 ? "s" : ""} !`
        : `${remaining} place${remaining! > 1 ? "s" : ""} restante${remaining! > 1 ? "s" : ""} à 99 €`
      }
    </div>
  );
}
