/**
 * LeadActionsQueue — Renders real lead_actions from the DB with business context.
 * PROOF:EXECUTION_V1:action_queue_ui_real → this file
 * PROOF:EXECUTION_V1:enterprise_dashboard_actions → used in DashboardEntreprise
 * PROOF:EXECUTION_V1:facilitateur_dashboard_actions → used in DashboardFacilitateur
 * PROOF:INTEGRITY_V1:action_context_ui → shows lead/company name, source, opportunity link
 * PROOF:INTEGRITY_V1:action_rpc_usage → mutations via canonical RPC (from useLeadActions)
 */
import { Building2, User, Zap, CheckCircle2, PlayCircle, Loader2, RefreshCw, AlertCircle, Mail, Phone, Star, ArrowUpCircle, XCircle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useLeadActions, type ActionType, type ActionStatus } from "@/hooks/useLeadActions";

// PROOF:EXECUTION_V1:action_queue_ui_real
const ACTION_LABELS: Record<ActionType, string> = {
  review_lead: "Examiner ce lead",
  enrich_lead: "Compléter les données",
  contact_email_draft: "Rédiger un email",
  contact_manual_call: "Appeler manuellement",
  request_facilitator_precision: "Demander précision au facilitateur",
  promote_to_opportunity: "Promouvoir en opportunité",
};

const ACTION_ICONS: Record<ActionType, React.ReactNode> = {
  review_lead: <RefreshCw size={11} />,
  enrich_lead: <AlertCircle size={11} />,
  contact_email_draft: <Mail size={11} />,
  contact_manual_call: <Phone size={11} />,
  request_facilitator_precision: <Star size={11} />,
  promote_to_opportunity: <ArrowUpCircle size={11} />,
};

const SOURCE_LABELS: Record<string, string> = {
  introduction: "Introduction",
  import: "Import CSV",
  passive_click: "Signal passif",
  manual: "Manuel",
  radar: "Radar",
};

const PRIORITY_COLORS: Record<string, { color: string; bg: string }> = {
  urgent: { color: "hsl(0 72% 45%)",          bg: "hsl(0 72% 95%)" },
  high:   { color: "hsl(var(--primary))",      bg: "hsl(var(--secondary))" },
  normal: { color: "hsl(var(--foreground))",   bg: "hsl(var(--muted))" },
  low:    { color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
};

const STATUS_LABELS: Record<ActionStatus, string> = {
  open: "Ouverte",
  in_progress: "En cours",
  done: "Terminée",
  superseded: "Remplacée",
  cancelled: "Annulée",
};

interface LeadActionsQueueProps {
  /** Max actions to show */
  limit?: number;
  /** Only show actions with these statuses */
  statusFilter?: ActionStatus[];
  /** Show compact version */
  compact?: boolean;
  title?: string;
}

export default function LeadActionsQueue({
  limit = 5,
  statusFilter = ["open", "in_progress"],
  compact = false,
  title = "File d'actions",
}: LeadActionsQueueProps) {
  // PROOF:EXECUTION_V1:action_queue_ui_real — reads real lead_actions table
  // PROOF:INTEGRITY_V1:action_rpc_usage — mutations go via canonical RPC
  const { actions, openCount, urgentCount, loading, markDone, markInProgress } = useLeadActions(statusFilter);

  const visible = actions.slice(0, limit);

  if (loading) {
    return (
      <div className="card-surface p-5 flex items-center justify-center py-8">
        <Loader2 size={18} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (visible.length === 0) return null;

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
          <Zap size={14} className="text-primary" />
          {title}
          {openCount > 0 && (
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
              style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}
            >
              {openCount}
            </span>
          )}
        </h2>
        {urgentCount > 0 && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "hsl(0 72% 95%)", color: "hsl(0 72% 45%)" }}>
            {urgentCount} urgent{urgentCount > 1 ? "es" : "e"}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {visible.map((action) => {
          const priorityCfg = PRIORITY_COLORS[action.priority] ?? PRIORITY_COLORS.normal;
          const icon = ACTION_ICONS[action.action_type];
          const label = ACTION_LABELS[action.action_type] ?? action.action_type;
          const isDone = action.status === "done";

          // PROOF:INTEGRITY_V1:action_context_ui — business context display
          const entityLabel = action.company_name || action.person_name;
          const sourceLabel = action.source_type ? (SOURCE_LABELS[action.source_type] ?? action.source_type) : null;
          const hasOpp = !!action.linked_opportunity_id;

          return (
            <div
              key={action.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-opacity ${isDone ? "opacity-50" : ""}`}
              style={{ borderColor: "hsl(var(--border))", background: priorityCfg.bg }}
            >
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0 mt-0.5"
                style={{ background: "hsl(var(--background))", color: priorityCfg.color }}
              >
                {icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{label}</p>
                {/* PROOF:INTEGRITY_V1:action_context_ui — entity + source context */}
                {!compact && (
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {entityLabel && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        {action.company_name ? <Building2 size={9} /> : <User size={9} />}
                        <span className="truncate max-w-[120px]">{entityLabel}</span>
                      </span>
                    )}
                    {sourceLabel && (
                      <span className="text-xs text-muted-foreground">
                        · {sourceLabel}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      · {STATUS_LABELS[action.status]}
                    </span>
                    {action.reason && (
                      <span className="text-xs text-muted-foreground italic truncate max-w-[100px]">
                        {action.reason}
                      </span>
                    )}
                  </div>
                )}
                {/* Opportunity link badge */}
                {hasOpp && !compact && (
                  <Link
                    to="/opportunites"
                    className="inline-flex items-center gap-1 text-xs font-medium mt-1"
                    style={{ color: "hsl(var(--primary))" }}
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink size={9} /> Opportunité liée
                  </Link>
                )}
              </div>
              {!isDone && (
                <div className="flex items-center gap-1 shrink-0">
                  {action.status === "open" && (
                    <button
                      onClick={() => markInProgress(action.id)}
                      className="p-1.5 rounded-lg hover:bg-background transition-colors"
                      title="Marquer en cours"
                    >
                      <PlayCircle size={13} className="text-primary" />
                    </button>
                  )}
                  <button
                    onClick={() => markDone(action.id)}
                    className="p-1.5 rounded-lg hover:bg-background transition-colors"
                    title="Marquer comme terminée"
                  >
                    <CheckCircle2 size={13} className="text-muted-foreground hover:text-success" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {actions.length > limit && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          + {actions.length - limit} autres actions
        </p>
      )}
    </div>
  );
}
