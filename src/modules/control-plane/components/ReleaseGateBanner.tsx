// PROOF:CONTROL_PLANE_V3:release_gate_banner_visual_distinction
/**
 * ReleaseGateBanner — PATCH V3
 * ÉCART CORRIGÉ : PRIVATE_BETA_READY et PRIVATE_BETA_POSSIBLE avaient le même style visuel.
 * Un opérateur ne pouvait pas distinguer "beta possible" de "beta prête".
 * Fix : PRIVATE_BETA_READY = vert (ok), PRIVATE_BETA_POSSIBLE = ambre/medium.
 */
import type { ReleaseGateResult } from "../domain/gate.types";
import { RefreshCw, Loader2 } from "lucide-react";

const VERDICT_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  PROD_BLOCKED:          { color: "hsl(var(--level-critical-fg))", bg: "hsl(var(--level-critical-bg))", border: "hsl(var(--level-critical-border))" },
  PUBLIC_BETA_BLOCKED:   { color: "hsl(var(--level-high-fg))",     bg: "hsl(var(--level-high-bg))",     border: "hsl(var(--level-high-border))" },
  // PRIVATE_BETA_READY = vert (gate E2E passé) — distinct de POSSIBLE
  PRIVATE_BETA_READY:    { color: "hsl(var(--level-ok-fg))",       bg: "hsl(var(--level-ok-bg))",       border: "hsl(var(--level-ok-border))" },
  // PRIVATE_BETA_POSSIBLE = ambre (runtime partiellement prouvé) — JAMAIS confondu avec READY
  PRIVATE_BETA_POSSIBLE: { color: "hsl(var(--level-medium-fg))",   bg: "hsl(var(--level-medium-bg))",   border: "hsl(var(--level-medium-border))" },
  INTERNAL_TEST:         { color: "hsl(var(--level-medium-fg))",   bg: "hsl(var(--level-medium-bg))",   border: "hsl(var(--level-medium-border))" },
  DEV_ONLY:              { color: "hsl(var(--level-unknown-fg))",  bg: "hsl(var(--level-unknown-bg))",  border: "hsl(var(--level-unknown-border))" },
};

interface Props {
  gate: ReleaseGateResult;
  summary: { ready: number; partial: number; blocked: number };
  loading: boolean;
  onRefresh: () => void;
}

export default function ReleaseGateBanner({ gate, summary, loading, onRefresh }: Props) {
  const v = VERDICT_STYLE[gate.verdict] ?? VERDICT_STYLE.DEV_ONLY;

  return (
    <div
      className="flex items-center justify-between p-3 rounded-xl border mb-6 flex-wrap gap-2"
      style={{ background: v.bg, borderColor: v.border }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="health-pulse shrink-0"><span className="health-pulse-dot" /></div>
        <span className="text-xs font-bold font-mono shrink-0" style={{ color: v.color }}>
          {loading ? "COMPUTING…" : gate.verdict.replace(/_/g, " ")}
        </span>
        <span className="text-xs text-muted-foreground shrink-0">·</span>
        <span className="text-xs text-muted-foreground truncate">{gate.justification}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <>
            <span className="text-success font-semibold">{summary.ready} ready</span>
            <span className="text-warning font-semibold">{summary.partial} partial</span>
            <span className="text-destructive font-semibold">{summary.blocked} blocked</span>
            {gate.confidenceScore > 0 && (
              <span>confiance: {gate.confidenceScore}%</span>
            )}
          </>
        )}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          title="Recalculer"
        >
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  );
}
