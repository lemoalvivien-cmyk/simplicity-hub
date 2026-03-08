/**
 * LeadActionsQueue — Renders real lead_actions from the DB with business context.
 * PROOF:EXECUTION_V1:action_queue_ui_real → this file
 * PROOF:EXECUTION_V1:enterprise_dashboard_actions → used in DashboardEntreprise
 * PROOF:EXECUTION_V1:facilitateur_dashboard_actions → used in DashboardFacilitateur
 * PROOF:INTEGRITY_V1:action_context_ui → shows lead/company name, source, opportunity link
 * PROOF:INTEGRITY_V1:action_rpc_usage → mutations via canonical RPC (from useLeadActions)
 * PROOF:PREMIUM_V1:action_queue_clarity → priority rings, urgency pulse, clear CTAs
 */
import {
  Building2, User, Zap, CheckCircle2, PlayCircle, Loader2,
  RefreshCw, AlertCircle, Mail, Phone, Star, ArrowUpCircle,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLeadActions, type ActionType, type ActionStatus } from "@/hooks/useLeadActions";
import { Skeleton } from "@/components/ui/skeleton";

// PROOF:EXECUTION_V1:action_queue_ui_real — action label map
const ACTION_LABELS: Record<ActionType, string> = {
  review_lead:                    "Examiner ce lead",
  enrich_lead:                    "Compléter les données",
  contact_email_draft:            "Rédiger un email",
  contact_manual_call:            "Appeler manuellement",
  request_facilitator_precision:  "Précision au facilitateur",
  promote_to_opportunity:         "Promouvoir en opportunité",
};

const ACTION_ICONS: Record<ActionType, React.ReactNode> = {
  review_lead:                   <RefreshCw size={11} />,
  enrich_lead:                   <AlertCircle size={11} />,
  contact_email_draft:           <Mail size={11} />,
  contact_manual_call:           <Phone size={11} />,
  request_facilitator_precision: <Star size={11} />,
  promote_to_opportunity:        <ArrowUpCircle size={11} />,
};

const SOURCE_LABELS: Record<string, string> = {
  introduction:  "Introduction",
  import:        "Import CSV",
  passive_click: "Signal passif",
  manual:        "Manuel",
  radar:         "Radar",
};

// PROOF:PREMIUM_V1:action_queue_clarity — richer priority color system
const PRIORITY_CONFIG: Record<string, {
  color: string; bg: string; ring: string; label: string; pulse: boolean;
}> = {
  urgent: {
    color: "hsl(0 72% 45%)",
    bg:    "hsl(0 72% 97%)",
    ring:  "hsl(0 72% 75%)",
    label: "Urgent",
    pulse: true,
  },
  high: {
    color: "hsl(var(--primary))",
    bg:    "hsl(var(--secondary))",
    ring:  "hsl(var(--primary) / 0.4)",
    label: "Haute",
    pulse: false,
  },
  normal: {
    color: "hsl(var(--foreground))",
    bg:    "hsl(var(--muted))",
    ring:  "hsl(var(--border))",
    label: "",
    pulse: false,
  },
  low: {
    color: "hsl(var(--muted-foreground))",
    bg:    "hsl(var(--muted))",
    ring:  "hsl(var(--border))",
    label: "",
    pulse: false,
  },
};

const STATUS_LABELS: Record<ActionStatus, string> = {
  open:       "À faire",
  in_progress: "En cours",
  done:        "Terminée",
  superseded:  "Remplacée",
  cancelled:   "Annulée",
};

interface LeadActionsQueueProps {
  limit?: number;
  statusFilter?: ActionStatus[];
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

  // PROOF:PREMIUM_V1:premium_loading_states — card-shaped skeleton for action queue
  if (loading) {
    return (
      <div className="card-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border">
              <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // PROOF:PREMIUM_V1:premium_empty_states — meaningful empty state
  if (visible.length === 0) {
    return (
      <div className="card-surface p-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-primary" />
          <h2 className="font-semibold text-foreground text-sm">{title}</h2>
        </div>
        <div className="text-center py-5">
          <CheckCircle2 size={24} className="mx-auto mb-2" style={{ color: "hsl(var(--success))" }} />
          <p className="text-sm font-medium text-foreground">Tout est traité 🎉</p>
          <p className="text-xs text-muted-foreground mt-1">Aucune action en attente pour l'instant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-surface p-5">
      {/* Header */}
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
        {/* PROOF:PREMIUM_V1:action_queue_clarity — urgency badge pulses */}
        {urgentCount > 0 && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{ background: "hsl(0 72% 95%)", color: "hsl(0 72% 40%)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {urgentCount} urgent{urgentCount > 1 ? "es" : "e"}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {visible.map((action) => {
          const pCfg = PRIORITY_CONFIG[action.priority] ?? PRIORITY_CONFIG.normal;
          const icon = ACTION_ICONS[action.action_type];
          const label = ACTION_LABELS[action.action_type] ?? action.action_type;
          const isDone = action.status === "done";
          const isInProgress = action.status === "in_progress";

          // PROOF:INTEGRITY_V1:action_context_ui — business context display
          const entityLabel = action.company_name || action.person_name;
          const sourceLabel = action.source_type
            ? (SOURCE_LABELS[action.source_type] ?? action.source_type)
            : null;
          const hasOpp = !!action.linked_opportunity_id;

          return (
            <div
              key={action.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-opacity ${isDone ? "opacity-40" : ""}`}
              style={{
                borderColor: pCfg.ring,
                background: pCfg.bg,
              }}
            >
              {/* Icon with priority ring */}
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0 mt-0.5"
                style={{
                  background: "hsl(var(--background))",
                  color: pCfg.color,
                  outline: `2px solid ${pCfg.ring}`,
                  outlineOffset: "-2px",
                }}
              >
                {icon}
              </span>

              <div className="flex-1 min-w-0">
                {/* Action label + priority badge */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  {pCfg.label && (
                    <span
                      className="text-xs px-1.5 py-0 rounded font-bold leading-5"
                      style={{ color: pCfg.color, background: `${pCfg.color}1a` }}
                    >
                      {pCfg.label}
                    </span>
                  )}
                  {isInProgress && (
                    <span className="text-xs px-1.5 py-0 rounded font-medium leading-5"
                      style={{ color: "hsl(220 80% 45%)", background: "hsl(220 80% 95%)" }}>
                      En cours
                    </span>
                  )}
                </div>

                {/* Context line: entity + source + status */}
                {!compact && (
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {entityLabel && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        {action.company_name ? <Building2 size={9} /> : <User size={9} />}
                        <span className="truncate max-w-[120px] font-medium">{entityLabel}</span>
                      </span>
                    )}
                    {sourceLabel && (
                      <span className="text-xs text-muted-foreground">· {sourceLabel}</span>
                    )}
                    {action.reason && (
                      <span className="text-xs text-muted-foreground italic truncate max-w-[100px]">
                        · {action.reason}
                      </span>
                    )}
                  </div>
                )}

                {/* Opportunity link */}
                {hasOpp && !compact && (
                  <Link
                    to="/opportunites"
                    className="inline-flex items-center gap-1 text-xs font-medium mt-1"
                    style={{ color: "hsl(var(--primary))" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={9} /> Voir l'opportunité
                  </Link>
                )}
              </div>

              {/* Action buttons — PROOF:PREMIUM_V1:action_queue_clarity clearer CTAs */}
              {!isDone && (
                <div className="flex items-center gap-1 shrink-0">
                  {action.status === "open" && (
                    <button
                      onClick={() => markInProgress(action.id)}
                      className="p-1.5 rounded-lg hover:bg-background transition-colors"
                      title="Démarrer"
                    >
                      <PlayCircle size={14} className="text-primary" />
                    </button>
                  )}
                  <button
                    onClick={() => markDone(action.id)}
                    className="p-1.5 rounded-lg hover:bg-background transition-colors group"
                    title="Marquer comme terminée"
                  >
                    <CheckCircle2 size={14} className="text-muted-foreground group-hover:text-green-500 transition-colors" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {actions.length > limit && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          + {actions.length - limit} autre{actions.length - limit > 1 ? "s" : ""} action{actions.length - limit > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
