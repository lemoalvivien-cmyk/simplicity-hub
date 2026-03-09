// PROOF:CONTROL_PLANE_V2:nba_panel_component
import { useState } from "react";
import { useNextBestAction } from "../hooks/useNextBestAction";
import type { Capability } from "../domain/capability.types";
import type { NextBestAction } from "../domain/action.types";
import {
  Zap, AlertTriangle, ChevronDown, ChevronUp, ExternalLink,
  Clock, Terminal, TrendingUp
} from "lucide-react";

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${value}%` }} />
      </div>
      <span className="text-muted-foreground font-mono w-7 text-right">{value}</span>
    </div>
  );
}

function ActionCard({ action, primary = false }: { action: NextBestAction; primary?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`card-surface overflow-hidden ${primary ? "ring-2 ring-primary/30" : ""}`}>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
              action.priority === "critical" ? "bg-destructive/15 text-destructive" :
              action.priority === "high" ? "badge-high" : "badge-medium"
            }`}>
              {action.priority.toUpperCase()}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={10} /> ~{action.timeToExecuteMin}min
            </span>
          </div>
          {!action.isInternal && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">EXTERNE</span>
          )}
        </div>
        <h3 className={`font-semibold text-foreground leading-tight mb-1 ${primary ? "text-base" : "text-sm"}`}>
          {action.title}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">{action.description}</p>

        {primary && (
          <div className="space-y-1 mb-3">
            <ScoreBar label="Revenu" value={action.impactRevenue} />
            <ScoreBar label="Release" value={action.impactRelease} />
            <ScoreBar label="Ops" value={action.impactOps} />
          </div>
        )}

        {primary && (
          <div className="p-2.5 rounded-lg bg-muted/40 mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Pourquoi maintenant</p>
            <p className="text-xs text-foreground">{action.whyNow}</p>
          </div>
        )}

        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          Preuve {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
        {expanded && (
          <p className="text-xs font-mono text-muted-foreground mt-2 p-2.5 rounded-lg bg-muted/40 leading-relaxed">
            {action.evidence}
          </p>
        )}
      </div>

      <div className="px-3.5 pb-3.5 pt-1">
        {action.ctaLink ? (
          <a
            href={action.ctaLink}
            target={action.ctaLink.startsWith("http") ? "_blank" : "_self"}
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Terminal size={11} /> {action.cta}
            {action.ctaLink.startsWith("http") && <ExternalLink size={9} />}
          </a>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/60">
            <Terminal size={11} className="text-muted-foreground" />
            <code className="text-xs font-mono text-muted-foreground">{action.cta}</code>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NextBestActionPanel({ capabilities }: { capabilities: Capability[] }) {
  const result = useNextBestAction(capabilities);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-accent)" }}>
            <Zap size={13} className="text-white" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm text-foreground">Next Best Action</h2>
            <p className="text-xs text-muted-foreground">
              {result.blockerCount} bloquant{result.blockerCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {result.blockerCount > 0 && (
          <span className="badge-high flex items-center gap-1 text-xs">
            <AlertTriangle size={10} /> {result.blockerCount}
          </span>
        )}
      </div>

      <ActionCard action={result.primary} primary />

      {result.secondary.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suivantes</p>
          {result.secondary.map((a) => (
            <ActionCard key={a.id} action={a} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Score = revenu×0.5 + release×0.3 + ops×0.2 · {new Date(result.computedAt).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}
