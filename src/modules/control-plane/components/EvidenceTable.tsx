// PROOF:CONTROL_PLANE_V2:evidence_table_component
/**
 * EvidenceTable — Table filtrable des preuves vivantes
 *
 * Tri par criticité et fraîcheur.
 * Drill-down détaillé par ligne.
 */

import { useState, useMemo } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, Filter } from "lucide-react";
import type { EvidenceRecord } from "@/modules/control-plane/domain/evidence.types";

interface EvidenceTableProps {
  records: EvidenceRecord[];
  loading?: boolean;
}

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: "CRITIQUE",  color: "text-destructive", bg: "bg-destructive/8" },
  high:     { label: "HAUTE",     color: "text-warning",     bg: "bg-warning/8" },
  medium:   { label: "MOYENNE",   color: "text-accent",      bg: "bg-accent/8" },
  low:      { label: "BASSE",     color: "text-muted-foreground", bg: "bg-muted/30" },
  info:     { label: "INFO",      color: "text-success",     bg: "bg-success/8" },
};

const EVIDENCE_TYPE_CONFIG: Record<string, { label: string; cls: string }> = {
  "runtime":         { label: "RUNTIME",      cls: "evidence-runtime" },
  "code":            { label: "CODE",         cls: "evidence-code" },
  "external-config": { label: "EXTERNAL-CFG", cls: "evidence-external" },
  "manual-step":     { label: "MANUAL",       cls: "evidence-manual" },
  "unknown":         { label: "UNKNOWN",      cls: "evidence-unknown" },
};

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "info")     return <CheckCircle2 size={13} className="text-success shrink-0" />;
  if (severity === "low")      return <Info size={13} className="text-muted-foreground shrink-0" />;
  if (severity === "medium")   return <AlertTriangle size={13} className="text-accent shrink-0" />;
  if (severity === "high")     return <AlertTriangle size={13} className="text-warning shrink-0" />;
  return <XCircle size={13} className="text-destructive shrink-0" />;
}

type FilterSeverity = "all" | "critical" | "high" | "medium" | "low" | "info";
type FilterEvidType = "all" | "runtime" | "code" | "external-config" | "manual-step";

export default function EvidenceTable({ records, loading = false }: EvidenceTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>("all");
  const [filterType, setFilterType] = useState<FilterEvidType>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return records
      .filter((r) => filterSeverity === "all" || r.severity === filterSeverity)
      .filter((r) => filterType === "all" || r.evidenceType === filterType)
      .filter((r) =>
        !search ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.summary.toLowerCase().includes(search.toLowerCase()) ||
        r.capabilityKey.toLowerCase().includes(search.toLowerCase())
      )
      .sort(
        (a, b) =>
          (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
      );
  }, [records, filterSeverity, filterType, search]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={13} className="text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-2.5 py-1 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-40"
        />
        <div className="flex gap-1">
          {(["all", "critical", "high", "medium", "info"] as FilterSeverity[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                filterSeverity === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "Tout" : s}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["all", "runtime", "code", "external-config", "manual-step"] as FilterEvidType[]).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                filterType === t
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "all" ? "Tout" : t}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} preuves</span>
      </div>

      {/* Table */}
      <div className="card-surface overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6 text-center">
            Aucune preuve correspondant aux filtres.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((rec) => {
              const sev = SEVERITY_CONFIG[rec.severity] ?? SEVERITY_CONFIG.info;
              const evType = EVIDENCE_TYPE_CONFIG[rec.evidenceType] ?? EVIDENCE_TYPE_CONFIG.unknown;
              const isExpanded = expandedId === rec.id;

              return (
                <div key={rec.id} className={isExpanded ? sev.bg : ""}>
                  <button
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors text-left"
                    onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                  >
                    <SeverityIcon severity={rec.severity} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{rec.title}</p>
                        <span className={`text-xs font-mono font-bold ${sev.color}`}>
                          {sev.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{rec.summary}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={evType.cls}>{evType.label}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(rec.verifiedAt).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-10 pb-3 space-y-2">
                      <p className="text-xs font-mono text-muted-foreground bg-muted/50 rounded p-2 leading-relaxed">
                        {rec.summary}
                      </p>
                      {rec.rawDetails && (
                        <pre className="text-xs font-mono text-muted-foreground bg-muted/30 rounded p-2 overflow-x-auto">
                          {rec.rawDetails}
                        </pre>
                      )}
                      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                        <span className="font-mono">{rec.sourceLabel}</span>
                        {rec.blastRadius && (
                          <span className="flex items-center gap-1">
                            <AlertTriangle size={10} className="text-warning" />
                            {rec.blastRadius}
                          </span>
                        )}
                        {rec.recommendedAction && (
                          <span className="text-primary font-medium">→ {rec.recommendedAction}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
