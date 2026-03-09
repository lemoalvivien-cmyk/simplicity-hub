/**
 * Capability Matrix UI — Control Plane View
 * Remplace GoLive.tsx et EnvCheck.tsx status statiques par la matrice dynamique.
 */
import { useState } from "react";
import {
  CAPABILITY_MATRIX,
  CAPABILITIES_BY_GROUP,
  getCapabilityStatusSummary,
  getReleaseGate,
  type Capability,
  type CapabilityStatus,
} from "@/lib/capabilityMatrix";
import {
  CheckCircle2, AlertTriangle, XCircle, HelpCircle,
  ExternalLink, ChevronDown, ChevronUp, Terminal
} from "lucide-react";

const STATUS_CONFIG: Record<CapabilityStatus, {
  label: string; chipClass: string; icon: React.ReactNode;
}> = {
  ready:   { label: "READY",   chipClass: "cap-ready",   icon: <CheckCircle2 size={13} /> },
  partial: { label: "PARTIAL", chipClass: "cap-partial", icon: <AlertTriangle size={13} /> },
  blocked: { label: "BLOCKED", chipClass: "cap-blocked", icon: <XCircle size={13} /> },
  unknown: { label: "UNKNOWN", chipClass: "cap-unknown", icon: <HelpCircle size={13} /> },
};

const EVIDENCE_CONFIG: Record<string, { label: string; chipClass: string }> = {
  "code":            { label: "CODE",          chipClass: "evidence-code" },
  "runtime":         { label: "RUNTIME",       chipClass: "evidence-runtime" },
  "external-config": { label: "EXTERNAL-CFG",  chipClass: "evidence-external" },
  "manual-step":     { label: "MANUAL STEP",   chipClass: "evidence-manual" },
  "unverifiable":    { label: "UNVERIFIABLE",  chipClass: "evidence-unknown" },
};

const VERDICT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PROD_BLOCKED:          { label: "PROD BLOCKED",           color: "hsl(var(--level-critical-fg))", bg: "hsl(var(--level-critical-bg))" },
  PUBLIC_BETA_BLOCKED:   { label: "PUBLIC BETA BLOCKED",    color: "hsl(var(--level-high-fg))",     bg: "hsl(var(--level-high-bg))" },
  // PRIVATE_BETA_READY : uniquement via computeReleaseGate() + billing runtime. Affiché ici pour compatibilité.
  PRIVATE_BETA_READY:    { label: "PRIVATE BETA READY",     color: "hsl(var(--level-ok-fg))",       bg: "hsl(var(--level-ok-bg))" },
  // PRIVATE_BETA_POSSIBLE : verdict billing-blind (getReleaseGate seule, sans full_proof_events).
  PRIVATE_BETA_POSSIBLE: { label: "PRIVATE BETA POSSIBLE",  color: "hsl(var(--level-medium-fg))",   bg: "hsl(var(--level-medium-bg))" },
  INTERNAL_TEST:         { label: "INTERNAL TEST ONLY",     color: "hsl(var(--level-medium-fg))",   bg: "hsl(var(--level-medium-bg))" },
  DEV_ONLY:              { label: "DEV ONLY",               color: "hsl(var(--level-unknown-fg))",  bg: "hsl(var(--level-unknown-bg))" },
};

function CapabilityRow({ cap }: { cap: Capability }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[cap.status];
  const evidence = EVIDENCE_CONFIG[cap.evidenceType];

  return (
    <div className={`border-b border-border last:border-0 ${cap.blocking && cap.status !== "ready" ? "bg-destructive/2" : ""}`}>
      <button
        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="mt-0.5 shrink-0" style={{ color: cap.status === "ready" ? "hsl(var(--level-ok-fg))" : cap.status === "blocked" ? "hsl(var(--level-critical-fg))" : "hsl(var(--level-medium-fg))" }}>
          {status.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{cap.label}</p>
            {cap.blocking && cap.status !== "ready" && (
              <span className="badge-critical text-xs">BLOQUANT</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{cap.summary}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={status.chipClass}>{status.label}</span>
          <span className={evidence.chipClass}>{evidence.label}</span>
          {expanded ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-11 pb-3 animate-slide-up space-y-2">
          <p className="text-xs font-mono text-muted-foreground leading-relaxed bg-muted/40 rounded-lg p-3">
            {cap.details}
          </p>
          {cap.cta && (
            cap.ctaLink ? (
              <a
                href={cap.ctaLink}
                target={cap.ctaLink.startsWith("http") ? "_blank" : "_self"}
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Terminal size={10} />
                {cap.cta}
                {cap.ctaLink.startsWith("http") && <ExternalLink size={9} />}
              </a>
            ) : (
              <div className="flex items-center gap-1.5">
                <Terminal size={10} className="text-muted-foreground" />
                <code className="text-xs text-muted-foreground font-mono">{cap.cta}</code>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function CapabilityMatrixPanel() {
  const summary = getCapabilityStatusSummary();
  const releaseGate = getReleaseGate();
  const verdict = VERDICT_CONFIG[releaseGate.verdict];
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const groups = Object.keys(CAPABILITIES_BY_GROUP);

  return (
    <div className="space-y-6">
      {/* Release Gate */}
      <div
        className="rounded-xl border-2 p-4"
        style={{ borderColor: verdict.color + "60", background: verdict.bg }}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Release Gate</p>
            <span
              className="text-sm font-bold font-mono px-2 py-0.5 rounded"
              style={{ color: verdict.color, background: "hsl(0 0% 100% / 0.7)" }}
            >
              {verdict.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-md leading-relaxed">{releaseGate.justification}</p>
        </div>
      </div>

      {/* Summary counters */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key: "ready",   label: "Prêts",     cls: "text-success" },
          { key: "partial", label: "Partiels",  cls: "text-warning" },
          { key: "blocked", label: "Bloqués",   cls: "text-destructive" },
          { key: "unknown", label: "Inconnus",  cls: "text-muted-foreground" },
        ].map(({ key, label, cls }) => (
          <div key={key} className="stat-card text-center py-3">
            <p className={`font-display text-2xl font-bold ${cls}`}>
              {summary[key as keyof typeof summary]}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Groups */}
      {groups.map((group) => {
        const caps = CAPABILITIES_BY_GROUP[group];
        const isOpen = activeGroup === group || activeGroup === null;
        const groupBlocked = caps.filter((c) => c.status === "blocked").length;
        const groupPartial = caps.filter((c) => c.status === "partial").length;

        return (
          <div key={group} className="card-cockpit">
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors border-b border-border"
              onClick={() => setActiveGroup(activeGroup === group ? null : group)}
            >
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-foreground">{group}</p>
                {groupBlocked > 0 && (
                  <span className="cap-blocked">{groupBlocked} bloqué{groupBlocked > 1 ? "s" : ""}</span>
                )}
                {groupPartial > 0 && (
                  <span className="cap-partial">{groupPartial} partiel{groupPartial > 1 ? "s" : ""}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{caps.length} checks</span>
                {isOpen ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
              </div>
            </button>
            {isOpen && (
              <div className="animate-fade-in">
                {caps.map((cap) => (
                  <CapabilityRow key={cap.key} cap={cap} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Legend */}
      <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-2">Légende des preuves</p>
        <div className="flex flex-wrap gap-2">
          <span className="evidence-code">CODE = prouvé par le code source</span>
          <span className="evidence-runtime">RUNTIME = prouvé par exécution observée</span>
          <span className="evidence-external">EXTERNAL-CFG = dépend d'une config externe</span>
          <span className="evidence-manual">MANUAL STEP = étape manuelle requise</span>
          <span className="evidence-unknown">UNVERIFIABLE = impossible à vérifier ici</span>
        </div>
      </div>
    </div>
  );
}
