// PROOF:CONTROL_PLANE_V2:explain_status_drawer
/**
 * ExplainStatusDrawer — "Explain this status" pour chaque capability
 *
 * Tire les données directement de l'evidence registry.
 * Affiche: pourquoi ce statut, quelle preuve existe/manque,
 * blast radius, prochaine action.
 */

import { useState } from "react";
import { X, Info, AlertTriangle, CheckCircle2, HelpCircle, XCircle, Zap, Target } from "lucide-react";
import type { Capability } from "@/modules/control-plane/domain/capability.types";
import type { EvidenceRecord } from "@/modules/control-plane/domain/evidence.types";

interface ExplainStatusDrawerProps {
  capability: Capability | null;
  evidenceRecords: EvidenceRecord[];
  onClose: () => void;
}

const STATUS_ICONS = {
  ready:   <CheckCircle2 size={16} className="text-success" />,
  partial: <AlertTriangle size={16} className="text-warning" />,
  blocked: <XCircle size={16} className="text-destructive" />,
  unknown: <HelpCircle size={16} className="text-muted-foreground" />,
};

const EVIDENCE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  "runtime":         { label: "RUNTIME",       color: "text-success" },
  "code":            { label: "CODE",           color: "text-primary" },
  "external-config": { label: "EXTERNAL-CFG",  color: "text-warning" },
  "manual-step":     { label: "MANUAL STEP",   color: "text-accent" },
  "unknown":         { label: "UNKNOWN",        color: "text-muted-foreground" },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-destructive",
  high:     "text-warning",
  medium:   "text-accent",
  low:      "text-muted-foreground",
  info:     "text-success",
};

export default function ExplainStatusDrawer({
  capability,
  evidenceRecords,
  onClose,
}: ExplainStatusDrawerProps) {
  const [showRaw, setShowRaw] = useState(false);

  if (!capability) return null;

  const relatedEvidence = evidenceRecords.filter(
    (e) => e.capabilityKey === capability.key
  );

  const evidenceTypeCfg = EVIDENCE_TYPE_LABELS[capability.evidenceType] ?? EVIDENCE_TYPE_LABELS.unknown;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/20 z-40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-background border-l border-border z-50 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border bg-muted/30">
          <div className="flex items-start gap-3">
            {STATUS_ICONS[capability.status]}
            <div>
              <h2 className="font-display font-bold text-base text-foreground">{capability.label}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs font-mono font-bold ${evidenceTypeCfg.color}`}>
                  {evidenceTypeCfg.label}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{capability.group}</span>
                {capability.confidenceScore !== undefined && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      confiance: {capability.confidenceScore}%
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Statut expliqué */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Pourquoi ce statut
            </h3>
            <p className="text-sm text-foreground leading-relaxed">{capability.summary}</p>
          </section>

          {/* Détails techniques */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Détails techniques
            </h3>
            <p className="text-xs font-mono text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3">
              {capability.details}
            </p>
          </section>

          {/* Preuves vivantes */}
          {relatedEvidence.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Preuves ({relatedEvidence.length})
              </h3>
              <div className="space-y-2">
                {relatedEvidence.map((ev) => (
                  <div key={ev.id} className="rounded-lg border border-border bg-muted/20 p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-foreground">{ev.title}</p>
                      <span className={`text-xs font-mono font-bold ${SEVERITY_COLORS[ev.severity] ?? "text-muted-foreground"}`}>
                        {ev.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{ev.summary}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{ev.sourceLabel}</span>
                      <span>·</span>
                      <span>{new Date(ev.verifiedAt).toLocaleTimeString("fr")}</span>
                    </div>
                    {showRaw && ev.rawDetails && (
                      <pre className="mt-2 text-xs font-mono text-muted-foreground bg-muted rounded p-2 overflow-x-auto">
                        {ev.rawDetails}
                      </pre>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setShowRaw(!showRaw)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showRaw ? "Masquer" : "Afficher"} les détails bruts
                </button>
              </div>
            </section>
          )}

          {/* Blast radius */}
          {relatedEvidence.some((e) => e.blastRadius) && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-destructive mb-2">
                Blast radius si bloqué
              </h3>
              <div className="space-y-1">
                {relatedEvidence
                  .filter((e) => e.blastRadius)
                  .map((ev) => (
                    <div key={ev.id} className="flex items-center gap-2 text-sm">
                      <AlertTriangle size={12} className="text-warning shrink-0" />
                      <span className="text-foreground">{ev.blastRadius}</span>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Prochaine action */}
          {(capability.cta || relatedEvidence.some((e) => e.recommendedAction)) && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                Prochaine action
              </h3>
              <div className="space-y-2">
                {capability.cta && (
                  <div className="flex items-start gap-2">
                    <Zap size={12} className="text-accent mt-1 shrink-0" />
                    {capability.ctaLink ? (
                      <a
                        href={capability.ctaLink}
                        target={capability.ctaLink.startsWith("http") ? "_blank" : "_self"}
                        rel="noreferrer"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {capability.cta}
                      </a>
                    ) : (
                      <code className="text-sm font-mono text-foreground">{capability.cta}</code>
                    )}
                  </div>
                )}
                {relatedEvidence
                  .filter((e) => e.recommendedAction)
                  .map((ev) => (
                    <div key={ev.id} className="flex items-start gap-2">
                      <Target size={12} className="text-muted-foreground mt-1 shrink-0" />
                      <span className="text-sm text-muted-foreground">{ev.recommendedAction}</span>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Fraîcheur */}
          {capability.lastCheckedAt && (
            <section className="pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info size={11} />
                Vérifié à {new Date(capability.lastCheckedAt).toLocaleTimeString("fr")}
                {capability.confidenceScore !== undefined && (
                  <span>· Confiance: {capability.confidenceScore}%</span>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
