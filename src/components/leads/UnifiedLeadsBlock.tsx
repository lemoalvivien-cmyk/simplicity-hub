/**
 * UnifiedLeadsBlock — Dashboard block showing the lead pipeline summary.
 * Used in DashboardEntreprise and Dashboard (facilitateur).
 */
import { Link } from "react-router-dom";
import { Layers, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useLeadIntakes } from "@/hooks/useLeadIntakes";
import { QUALIFICATION_LABELS, QUALIFICATION_COLORS } from "@/lib/leadPipeline";
import type { QualificationStatus } from "@/lib/leadPipeline";

const PRIORITY_STATUSES: QualificationStatus[] = [
  "ready_for_opportunity",
  "ready_for_action",
  "pending_review",
  "needs_enrichment",
];

export default function UnifiedLeadsBlock() {
  const { summary, loading, error } = useLeadIntakes();

  if (loading) {
    return (
      <div className="card-surface p-5 flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-surface p-4 flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle size={14} /> {error}
      </div>
    );
  }

  if (summary.total === 0) return null;

  const actionable = summary.ready_for_opportunity + summary.ready_for_action;

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
          <Layers size={14} className="text-primary" />
          Pipeline unifié
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
            style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}
          >
            {summary.total}
          </span>
        </h2>
        {actionable > 0 && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}
          >
            {actionable} à traiter
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {PRIORITY_STATUSES.map((status) => {
          const count = summary[status];
          if (count === 0) return null;
          const cfg = QUALIFICATION_COLORS[status];
          const label = QUALIFICATION_LABELS[status];
          return (
            <div
              key={status}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: cfg.bg }}
            >
              <p className="text-xs font-medium" style={{ color: cfg.color }}>
                {label}
              </p>
              <span className="text-sm font-bold" style={{ color: cfg.color }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {summary.duplicate > 0 && (
        <p className="text-xs text-muted-foreground mb-3">
          + {summary.duplicate} doublon{summary.duplicate > 1 ? "s" : ""} ignoré{summary.duplicate > 1 ? "s" : ""}
        </p>
      )}

      <Link
        to="/opportunites"
        className="flex items-center justify-between text-xs font-medium text-primary hover:underline"
      >
        Voir toutes les opportunités <ArrowRight size={12} />
      </Link>
    </div>
  );
}
