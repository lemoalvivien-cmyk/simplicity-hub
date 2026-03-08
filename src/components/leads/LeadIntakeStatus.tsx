/**
 * LeadIntakeStatus — Small reusable component to show unified lead pipeline status.
 * Used in IntroductionsEntreprise, ContactDetail, DashboardEntreprise.
 */
import { CircleDot, CheckCircle2, AlertCircle, Copy, Ban, Zap, RefreshCw } from "lucide-react";
import type { QualificationStatus, NextBestAction } from "@/lib/leadPipeline";
import { QUALIFICATION_LABELS, QUALIFICATION_COLORS, NBA_LABELS } from "@/lib/leadPipeline";
import { NBA_CONFIG } from "@/lib/policyEngine";

interface LeadIntakeStatusProps {
  qualificationStatus: QualificationStatus;
  nextBestAction?: NextBestAction | null;
  dedupStatus?: string;
  compact?: boolean;
}

const QUAL_ICONS: Record<QualificationStatus, React.ReactNode> = {
  pending_review:        <CircleDot size={12} />,
  needs_enrichment:      <AlertCircle size={12} />,
  ready_for_opportunity: <CheckCircle2 size={12} />,
  ready_for_action:      <Zap size={12} />,
  blocked:               <Ban size={12} />,
  duplicate:             <Copy size={12} />,
};

export default function LeadIntakeStatus({
  qualificationStatus,
  nextBestAction,
  dedupStatus,
  compact = false,
}: LeadIntakeStatusProps) {
  const cfg = QUALIFICATION_COLORS[qualificationStatus];
  const label = QUALIFICATION_LABELS[qualificationStatus];
  const icon = QUAL_ICONS[qualificationStatus];

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ color: cfg.color, background: cfg.bg }}
      >
        {icon} {label}
      </span>
    );
  }

  const nbaConfig = nextBestAction ? NBA_CONFIG[nextBestAction] : null;

  return (
    <div className="rounded-xl border border-border p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Pipeline unifié
        </p>
        <span
          className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ color: cfg.color, background: cfg.bg }}
        >
          {icon} {label}
        </span>
      </div>

      {dedupStatus && dedupStatus !== "unique" && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Copy size={10} />
          {dedupStatus === "confirmed_duplicate"
            ? "Lead déjà présent — doublon confirmé"
            : "Doublon possible — vérification nécessaire"}
        </p>
      )}

      {nbaConfig && (
        <div
          className="flex items-start gap-2 p-2.5 rounded-lg"
          style={{
            background:
              nbaConfig.urgency === "high"
                ? "hsl(var(--accent-light))"
                : "hsl(var(--muted))",
          }}
        >
          {nbaConfig.urgency === "high" ? (
            <Zap size={12} className="shrink-0 mt-0.5" style={{ color: "hsl(var(--accent))" }} />
          ) : (
            <RefreshCw size={12} className="shrink-0 mt-0.5 text-muted-foreground" />
          )}
          <div>
            <p
              className="text-xs font-semibold"
              style={{
                color:
                  nbaConfig.urgency === "high"
                    ? "hsl(38 80% 30%)"
                    : "hsl(var(--foreground))",
              }}
            >
              {NBA_LABELS[nextBestAction!]}
            </p>
            <p className="text-xs text-muted-foreground">{nbaConfig.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
