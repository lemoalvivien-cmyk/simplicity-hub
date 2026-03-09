// PROOF:CONTROL_PLANE_V2:capability_section_component
/**
 * CapabilitySection — Affichage d'un groupe de capabilities avec Explain drawer
 */

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, XCircle, HelpCircle, Terminal, ExternalLink } from "lucide-react";
import type { Capability, CapabilityStatus } from "@/modules/control-plane/domain/capability.types";
import type { EvidenceRecord } from "@/modules/control-plane/domain/evidence.types";
import ExplainStatusDrawer from "./ExplainStatusDrawer";

interface CapabilitySectionProps {
  group: string;
  capabilities: Capability[];
  evidence: EvidenceRecord[];
}

const STATUS_CONFIG: Record<CapabilityStatus, { label: string; chipClass: string; icon: React.ReactNode }> = {
  ready:   { label: "READY",   chipClass: "cap-ready",   icon: <CheckCircle2 size={13} /> },
  partial: { label: "PARTIAL", chipClass: "cap-partial", icon: <AlertTriangle size={13} /> },
  blocked: { label: "BLOCKED", chipClass: "cap-blocked", icon: <XCircle size={13} /> },
  unknown: { label: "UNKNOWN", chipClass: "cap-unknown", icon: <HelpCircle size={13} /> },
};

const EVIDENCE_CONFIG: Record<string, { label: string; chipClass: string }> = {
  "code":            { label: "CODE",         chipClass: "evidence-code" },
  "runtime":         { label: "RUNTIME",      chipClass: "evidence-runtime" },
  "external-config": { label: "EXTERNAL-CFG", chipClass: "evidence-external" },
  "manual-step":     { label: "MANUAL STEP",  chipClass: "evidence-manual" },
  "unknown":         { label: "UNKNOWN",      chipClass: "evidence-unknown" },
};

function CapabilityRow({
  cap,
  onExplain,
}: {
  cap: Capability;
  onExplain: (cap: Capability) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[cap.status];
  const evidence = EVIDENCE_CONFIG[cap.evidenceType] ?? EVIDENCE_CONFIG.unknown;
  const statusColor =
    cap.status === "ready"   ? "hsl(var(--level-ok-fg))"
    : cap.status === "blocked" ? "hsl(var(--level-critical-fg))"
    : cap.status === "partial" ? "hsl(var(--level-medium-fg))"
    : "hsl(var(--level-unknown-fg))";

  return (
    <div className={`border-b border-border last:border-0 ${cap.blocking && cap.status !== "ready" ? "bg-destructive/2" : ""}`}>
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="mt-0.5 shrink-0" style={{ color: statusColor }}>
          {status.icon}
        </span>
        <button
          className="flex-1 min-w-0 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{cap.label}</p>
            {cap.blocking && cap.status !== "ready" && (
              <span className="badge-critical text-xs">BLOQUANT</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{cap.summary}</p>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <span className={status.chipClass}>{status.label}</span>
          <span className={evidence.chipClass}>{evidence.label}</span>
          <button
            onClick={() => onExplain(cap)}
            className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
            title="Explain this status"
          >
            Expliquer
          </button>
          <button onClick={() => setExpanded(!expanded)}>
            {expanded
              ? <ChevronUp size={13} className="text-muted-foreground" />
              : <ChevronDown size={13} className="text-muted-foreground" />
            }
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-11 pb-3 animate-slide-up space-y-2">
          <p className="text-xs font-mono text-muted-foreground leading-relaxed bg-muted/40 rounded-lg p-3">
            {cap.details}
          </p>
          <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
            {cap.source && <span className="font-mono">{cap.source}</span>}
            {cap.lastCheckedAt && (
              <span>Vérifié: {new Date(cap.lastCheckedAt).toLocaleTimeString("fr")}</span>
            )}
            {cap.confidenceScore !== undefined && (
              <span>Confiance: {cap.confidenceScore}%</span>
            )}
          </div>
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

export default function CapabilitySection({ group, capabilities, evidence }: CapabilitySectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [explaining, setExplaining] = useState<Capability | null>(null);

  const groupBlocked = capabilities.filter((c) => c.status === "blocked").length;
  const groupPartial = capabilities.filter((c) => c.status === "partial").length;

  return (
    <>
      <div className="card-cockpit">
        <button
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors border-b border-border"
          onClick={() => setIsOpen(!isOpen)}
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
            <span className="text-xs text-muted-foreground">{capabilities.length} checks</span>
            {isOpen ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
          </div>
        </button>
        {isOpen && (
          <div>
            {capabilities.map((cap) => (
              <CapabilityRow key={cap.key} cap={cap} onExplain={setExplaining} />
            ))}
          </div>
        )}
      </div>

      {explaining && (
        <ExplainStatusDrawer
          capability={explaining}
          evidenceRecords={evidence}
          onClose={() => setExplaining(null)}
        />
      )}
    </>
  );
}
