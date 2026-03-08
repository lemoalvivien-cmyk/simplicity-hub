/**
 * LeadActionBadge — Compact badge showing the open lead action for a lead.
 * Used inline in IntroductionsEntreprise, ContactDetail, etc.
 */
import { Zap, RefreshCw, AlertCircle, Phone, Mail, Star, ArrowUpCircle } from "lucide-react";
import type { NextBestAction, LeadAction } from "@/lib/leadPipeline";
import { NBA_LABELS } from "@/lib/leadPipeline";

interface LeadActionBadgeProps {
  action: LeadAction | NextBestAction | null | undefined;
  /** If a full LeadAction object is passed, show its status too */
  showStatus?: boolean;
}

const ACTION_ICONS: Record<NextBestAction, React.ReactNode> = {
  review_lead:                    <RefreshCw size={10} />,
  enrich_lead:                    <AlertCircle size={10} />,
  contact_email_draft:            <Mail size={10} />,
  contact_manual_call:            <Phone size={10} />,
  request_facilitator_precision:  <Star size={10} />,
  promote_to_opportunity:         <ArrowUpCircle size={10} />,
};

const ACTION_COLORS: Record<NextBestAction, { color: string; bg: string }> = {
  review_lead:                   { color: "hsl(38 80% 30%)",         bg: "hsl(var(--accent-light))" },
  enrich_lead:                   { color: "hsl(0 72% 45%)",          bg: "hsl(0 72% 95%)" },
  contact_email_draft:           { color: "hsl(var(--primary))",     bg: "hsl(var(--secondary))" },
  contact_manual_call:           { color: "hsl(var(--primary))",     bg: "hsl(var(--secondary))" },
  request_facilitator_precision: { color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
  promote_to_opportunity:        { color: "hsl(var(--success))",     bg: "hsl(var(--success-light))" },
};

export default function LeadActionBadge({ action, showStatus = false }: LeadActionBadgeProps) {
  if (!action) return null;

  const actionType: NextBestAction = typeof action === "string"
    ? action
    : (action as LeadAction).action_type;

  const status = typeof action === "object" ? (action as LeadAction).status : null;

  const cfg = ACTION_COLORS[actionType];
  const icon = ACTION_ICONS[actionType];
  const label = NBA_LABELS[actionType];

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <Zap size={9} />
      {icon}
      {label}
      {showStatus && status && status !== "open" && (
        <span className="opacity-60 ml-0.5">· {status}</span>
      )}
    </span>
  );
}
