// PROOF:CONTROL_PLANE_V2:revenue_leak_radar_component
import { useRevenueLeaks } from "../hooks/useRevenueLeaks";
import { DollarSign, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import type { RevenueLeak } from "../domain/revenue.types";

const SEV_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  critical: { bg: "hsl(var(--level-critical-bg))", border: "hsl(var(--level-critical-border))", color: "hsl(var(--level-critical-fg))" },
  high:     { bg: "hsl(var(--level-high-bg))",     border: "hsl(var(--level-high-border))",     color: "hsl(var(--level-high-fg))" },
  medium:   { bg: "hsl(var(--level-medium-bg))",   border: "hsl(var(--level-medium-border))",   color: "hsl(var(--level-medium-fg))" },
  low:      { bg: "hsl(var(--level-unknown-bg))",   border: "hsl(var(--level-unknown-border))",  color: "hsl(var(--level-unknown-fg))" },
};

function LeakCard({ leak, primary = false }: { leak: RevenueLeak; primary?: boolean }) {
  const sev = SEV_STYLE[leak.severity] ?? SEV_STYLE.low;
  return (
    <div
      className={`rounded-xl border overflow-hidden ${primary ? "border-2" : ""}`}
      style={{ borderColor: sev.border, background: primary ? sev.bg : undefined }}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded" style={{ color: sev.color, background: sev.bg }}>
              {leak.severity.toUpperCase()}
            </span>
            {leak.estimatedValue !== null && (
              <span className="text-xs font-semibold text-foreground">~{leak.estimatedValue.toLocaleString("fr-FR")} €</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{leak.usersAffected} affecté{leak.usersAffected !== 1 ? "s" : ""}</span>
        </div>
        <p className="text-sm font-semibold text-foreground mb-0.5">{leak.label}</p>
        <p className="text-xs text-muted-foreground mb-2">{leak.evidence}</p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground italic">{leak.recommendedAction}</p>
          {leak.routeTarget && (
            <a href={leak.routeTarget} className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
              Action <ArrowRight size={10} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RevenueLeakRadar() {
  const { result, loading } = useRevenueLeaks();

  if (loading) {
    return (
      <div className="card-surface p-6 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 size={14} className="animate-spin" /> Analyse des fuites…
      </div>
    );
  }

  const hasLeaks = result.primary !== null || result.secondary.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-destructive/10">
            <DollarSign size={13} className="text-destructive" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm text-foreground">Revenue Leak Radar</h2>
            <p className="text-xs text-muted-foreground">
              {hasLeaks
                ? `~${result.totalEstimatedLoss.toLocaleString("fr-FR")} € de perte estimée`
                : "Aucune fuite détectée"}
            </p>
          </div>
        </div>
        {hasLeaks && (
          <span className="badge-high flex items-center gap-1 text-xs">
            <AlertTriangle size={10} />
            {1 + result.secondary.length} fuite{result.secondary.length > 0 ? "s" : ""}
          </span>
        )}
      </div>

      {!hasLeaks ? (
        <div className="card-surface p-4 text-center">
          <p className="text-sm text-muted-foreground">Aucune fuite de revenu détectée depuis les données actuelles.</p>
          <p className="text-xs text-muted-foreground mt-1">Les fuites apparaîtront dès que des utilisateurs seront actifs.</p>
        </div>
      ) : (
        <>
          {result.primary && <LeakCard leak={result.primary} primary />}
          {result.secondary.map((leak) => (
            <LeakCard key={leak.id} leak={leak} />
          ))}
        </>
      )}
    </div>
  );
}
