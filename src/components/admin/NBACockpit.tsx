/**
 * NEXT BEST ACTION COCKPIT
 *
 * Moteur NBA visible + opérable dans l'UI admin.
 * Recommande 1 action principale + 2-3 secondaires.
 * Chaque action est justifiée par des preuves, classée par impact et risque.
 */
import { useState } from "react";
import { computeNBA, type NextBestAction, type ActionPriority } from "@/lib/nextBestAction";
import {
  Zap, AlertTriangle, ChevronDown, ChevronUp, ExternalLink,
  Clock, Target, Shield, TrendingUp, Activity, Terminal, CheckSquare
} from "lucide-react";

const PRIORITY_CONFIG: Record<ActionPriority, { label: string; color: string; bg: string; border: string }> = {
  critical: {
    label: "CRITIQUE",
    color: "hsl(var(--level-critical-fg))",
    bg: "hsl(var(--level-critical-bg))",
    border: "hsl(var(--level-critical-border))",
  },
  high: {
    label: "HAUTE",
    color: "hsl(var(--level-high-fg))",
    bg: "hsl(var(--level-high-bg))",
    border: "hsl(var(--level-high-border))",
  },
  medium: {
    label: "MOYENNE",
    color: "hsl(var(--level-medium-fg))",
    bg: "hsl(var(--level-medium-bg))",
    border: "hsl(var(--level-medium-border))",
  },
  low: {
    label: "FAIBLE",
    color: "hsl(var(--level-unknown-fg))",
    bg: "hsl(var(--level-unknown-bg))",
    border: "hsl(var(--level-unknown-border))",
  },
};

const IMPACT_ICONS = {
  revenue: <TrendingUp size={12} />,
  security: <Shield size={12} />,
  reliability: <Activity size={12} />,
  scale: <Zap size={12} />,
  ux: <Target size={12} />,
};

const IMPACT_LABELS = {
  revenue: "Revenu",
  security: "Sécurité",
  reliability: "Fiabilité",
  scale: "Scale",
  ux: "UX",
};

function ActionCard({
  action,
  primary = false,
}: {
  action: NextBestAction;
  primary?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const prio = PRIORITY_CONFIG[action.priority];

  if (primary) {
    return (
      <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: prio.border, background: prio.bg }}>
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded font-mono"
                style={{ color: prio.color, background: "hsl(0 0% 100% / 0.6)" }}
              >
                {prio.label}
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                {IMPACT_ICONS[action.impact]}
                {IMPACT_LABELS[action.impact]}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock size={11} />
                ~{action.estimatedMinutes}min
              </span>
            </div>
            {!action.executableInLovable && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-mono shrink-0">
                ENV EXTERNE
              </span>
            )}
          </div>
          <h3 className="font-display font-bold text-base text-foreground leading-tight mb-1">
            {action.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{action.description}</p>
        </div>

        {/* Why */}
        <div className="px-4 pb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pourquoi maintenant</p>
          <p className="text-xs text-foreground leading-relaxed">{action.why}</p>
        </div>

        {/* Evidence toggle */}
        <button
          className="w-full flex items-center justify-between px-4 py-2.5 border-t text-xs text-muted-foreground hover:text-foreground transition-colors"
          style={{ borderColor: prio.border + "80" }}
          onClick={() => setExpanded(!expanded)}
        >
          <span className="flex items-center gap-1.5 font-medium">
            <CheckSquare size={11} />
            Preuve technique
          </span>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        {expanded && (
          <div className="px-4 pb-3 pt-2 animate-slide-up">
            <p className="text-xs font-mono text-muted-foreground leading-relaxed bg-muted/40 rounded-lg p-3">
              {action.evidence}
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: prio.border + "60" }}>
          {action.ctaLink ? (
            <a
              href={action.ctaLink}
              target={action.ctaLink.startsWith("http") ? "_blank" : "_self"}
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ background: prio.color, color: "hsl(0 0% 100%)" }}
            >
              <Terminal size={13} />
              {action.cta}
              {action.ctaLink.startsWith("http") && <ExternalLink size={11} />}
            </a>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/60">
              <Terminal size={12} className="text-muted-foreground shrink-0" />
              <code className="text-xs font-mono text-muted-foreground">{action.cta}</code>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card-surface p-3.5 hover:shadow transition-all">
      <div className="flex items-start gap-2.5">
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded font-mono shrink-0 mt-0.5"
          style={{ color: prio.color, background: prio.bg }}
        >
          {prio.label}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">{action.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{action.description}</p>
          {action.ctaLink ? (
            <a
              href={action.ctaLink}
              target={action.ctaLink.startsWith("http") ? "_blank" : "_self"}
              rel="noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:underline"
            >
              <Terminal size={10} />
              {action.cta}
              {action.ctaLink.startsWith("http") && <ExternalLink size={9} />}
            </a>
          ) : (
            <div className="inline-flex items-center gap-1 mt-1.5">
              <code className="text-xs text-muted-foreground font-mono">{action.cta}</code>
            </div>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          {IMPACT_ICONS[action.impact]}
        </span>
      </div>
    </div>
  );
}

export default function NBACockpit() {
  const result = computeNBA();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--gradient-accent)" }}
          >
            <Zap size={13} className="text-white" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm text-foreground">Next Best Action</h2>
            <p className="text-xs text-muted-foreground">
              {result.blockerCount} bloquant{result.blockerCount !== 1 ? "s" : ""} détecté{result.blockerCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {result.blockerCount > 0 && (
          <span className="badge-high flex items-center gap-1">
            <AlertTriangle size={11} />
            {result.blockerCount} à traiter
          </span>
        )}
      </div>

      {/* Primary action */}
      <ActionCard action={result.primary} primary />

      {/* Secondary actions */}
      {result.secondary.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions suivantes</p>
          {result.secondary.map((action) => (
            <ActionCard key={action.id} action={action} />
          ))}
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-muted-foreground text-center pt-1">
        Calculé à partir de la capability matrix ·{" "}
        {new Date(result.computedAt).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}
