// PROOF:EXPORT_RECOVERY_V1:lead_actions_queue_present → this file
/**
 * LeadActionsQueue — Actions pipeline avec badge IA, modal brouillon email,
 * boutons Exécuter / Ignorer.
 */
import { useState } from "react";
import {
  Building2, User, Zap, CheckCircle2, Loader2,
  RefreshCw, AlertCircle, Mail, Phone, Star, ArrowUpCircle,
  ExternalLink, XCircle, Sparkles, X
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLeadActions, type ActionType, type ActionStatus } from "@/hooks/useLeadActions";
import { Skeleton } from "@/components/ui/skeleton";
import AIScoreBadge from "@/components/leads/AIScoreBadge";
import { toast } from "sonner";

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

const PRIORITY_CONFIG: Record<string, {
  color: string; bg: string; ring: string; label: string; pulse: boolean;
}> = {
  urgent: {
    color: "hsl(0 72% 45%)", bg: "hsl(0 72% 97%)", ring: "hsl(0 72% 75%)",
    label: "Urgent", pulse: true,
  },
  high: {
    color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", ring: "hsl(var(--primary) / 0.4)",
    label: "Haute", pulse: false,
  },
  normal: {
    color: "hsl(var(--foreground))", bg: "hsl(var(--muted))", ring: "hsl(var(--border))",
    label: "", pulse: false,
  },
  low: {
    color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))", ring: "hsl(var(--border))",
    label: "", pulse: false,
  },
};

const STATUS_LABELS: Record<ActionStatus, string> = {
  open:        "À faire",
  in_progress: "En cours",
  done:        "Terminée",
  superseded:  "Remplacée",
  cancelled:   "Annulée",
};
void STATUS_LABELS;

// ── Email draft modal ─────────────────────────────────────────
function EmailDraftModal({
  action,
  onClose,
}: {
  action: { person_name?: string | null; company_name?: string | null; ai_reasoning?: string | null };
  onClose: () => void;
}) {
  const recipient = action.person_name || action.company_name || "votre prospect";
  const draft = `Bonjour ${recipient},

${action.ai_reasoning
    ? `Suite à notre analyse de votre profil, nous avons identifié une opportunité qui pourrait vous intéresser : ${action.ai_reasoning}`
    : "Nous avons identifié une opportunité qui pourrait vous intéresser."
  }

Seriez-vous disponible pour un échange de 20 minutes cette semaine ?

Cordialement`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draft).then(() => toast.success("Brouillon copié !"));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "hsl(var(--background) / 0.85)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-5 space-y-4"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", boxShadow: "0 20px 60px hsl(0 0% 0% / 0.3)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
              <Mail size={13} className="text-white" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">Brouillon d'email</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <X size={14} />
          </button>
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Sparkles size={11} style={{ color: "hsl(38 90% 55%)" }} />
          <span>Généré par l'IA à partir du contexte du lead</span>
        </div>

        <textarea
          rows={8}
          defaultValue={draft}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition font-mono leading-relaxed"
        />

        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "var(--gradient-primary)" }}
          >
            Copier le brouillon
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
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
  const { actions, openCount, urgentCount, loading, markDone, markInProgress, markCancelled } =
    useLeadActions(statusFilter);

  const [emailDraftAction, setEmailDraftAction] = useState<typeof actions[0] | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const visible = actions.slice(0, limit);

  const withPending = async (id: string, fn: () => Promise<void>) => {
    setPendingIds(prev => new Set(prev).add(id));
    try { await fn(); } finally {
      setPendingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleExecute = (action: typeof actions[0]) => {
    if (action.action_type === "contact_email_draft") {
      setEmailDraftAction(action);
      return;
    }
    withPending(action.id, () => markInProgress(action.id));
    toast.success("Action démarrée");
  };

  const handleIgnore = (action: typeof actions[0]) => {
    withPending(action.id, () =>
      markCancelled(action.id, "Ignorée par l'utilisateur")
    );
    toast.info("Action ignorée");
  };

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
              <Skeleton className="w-14 h-6 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

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
    <>
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
            const isPending = pendingIds.has(action.id);
            const entityLabel = action.company_name || action.person_name;
            const sourceLabel = action.source_type
              ? (SOURCE_LABELS[action.source_type] ?? action.source_type)
              : null;
            const hasOpp = !!action.linked_opportunity_id;

            // IA-generated detection: if action has AI score from lead_intakes → badge IA
            const isAiGenerated = action.ai_score !== null && action.ai_score !== undefined;

            return (
              <div
                key={action.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-opacity ${isDone ? "opacity-40" : ""}`}
                style={{ borderColor: pCfg.ring, background: pCfg.bg }}
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
                  {/* Label + badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-semibold text-foreground">{label}</p>

                    {/* IA badge — orange — when action comes from AI scoring */}
                    {isAiGenerated && (
                      <span
                        className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0 rounded font-bold leading-5"
                        style={{ color: "hsl(24 100% 45%)", background: "hsl(24 100% 95%)", border: "1px solid hsl(24 100% 80%)" }}
                      >
                        <Sparkles size={9} /> IA
                      </span>
                    )}

                    {pCfg.label && (
                      <span
                        className="text-xs px-1.5 py-0 rounded font-bold leading-5"
                        style={{ color: pCfg.color, background: `${pCfg.color}1a` }}
                      >
                        {pCfg.label}
                      </span>
                    )}
                    {isInProgress && (
                      <span
                        className="text-xs px-1.5 py-0 rounded font-medium leading-5"
                        style={{ color: "hsl(220 80% 45%)", background: "hsl(220 80% 95%)" }}
                      >
                        En cours
                      </span>
                    )}
                    <AIScoreBadge
                      score={action.ai_score}
                      label={action.ai_label}
                      reasoning={action.ai_reasoning}
                      size="sm"
                      showReasoning
                    />
                  </div>

                  {/* Context line */}
                  {!compact && (
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {entityLabel && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          {action.company_name ? <Building2 size={9} /> : <User size={9} />}
                          <span className="truncate max-w-[120px] font-medium">{entityLabel}</span>
                        </span>
                      )}
                      {sourceLabel && <span className="text-xs text-muted-foreground">· {sourceLabel}</span>}
                      {action.reason && (
                        <span className="text-xs text-muted-foreground italic truncate max-w-[100px]">
                          · {action.reason}
                        </span>
                      )}
                    </div>
                  )}

                  {hasOpp && !compact && (
                    <Link
                      to="/missions"
                      className="inline-flex items-center gap-1 text-xs font-medium mt-1"
                      style={{ color: "hsl(var(--primary))" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={9} /> Voir les missions
                    </Link>
                  )}
                </div>

                {/* CTA buttons: Exécuter + Ignorer */}
                {!isDone && (
                  <div className="flex items-center gap-1 shrink-0">
                    {isPending ? (
                      <Loader2 size={14} className="animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <button
                          onClick={() => handleExecute(action)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                          style={{ background: "var(--gradient-primary)" }}
                          title={action.action_type === "contact_email_draft" ? "Voir le brouillon" : "Exécuter"}
                        >
                          {action.action_type === "contact_email_draft" ? <Mail size={11} /> : <CheckCircle2 size={11} />}
                          {action.action_type === "contact_email_draft" ? "Email" : "Exécuter"}
                        </button>
                        <button
                          onClick={() => handleIgnore(action)}
                          className="p-1.5 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-red-400"
                          title="Ignorer"
                        >
                          <XCircle size={13} />
                        </button>
                      </>
                    )}
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

      {/* Email draft modal */}
      {emailDraftAction && (
        <EmailDraftModal
          action={emailDraftAction}
          onClose={() => setEmailDraftAction(null)}
        />
      )}
    </>
  );
}
