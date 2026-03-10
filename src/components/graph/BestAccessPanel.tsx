/**
 * BestAccessPanel — Shows the best facilitator paths for a given context
 * Embeddable in dashboards, radar, facilitateur pages
 * Fully internationalized with useTranslation
 */
import { useState, useEffect } from "react";
import { useGraphEngine, BestPath, PathContext } from "@/hooks/useGraphEngine";
import {
  Sparkles, ArrowRight, Shield, TrendingUp, Globe, Zap,
  Loader2, ChevronRight, Star, Users
} from "lucide-react";


interface Props {
  context?: PathContext;
  title?: string;
  showAlternatives?: boolean;
  compact?: boolean;
  onSelectPath?: (path: BestPath) => void;
}

function ScorePill({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80 ? "hsl(142 50% 30%)" :
    score >= 60 ? "hsl(218 72% 40%)" :
    score >= 40 ? "hsl(38 90% 40%)" :
    "hsl(var(--muted-foreground))";
  const bg =
    score >= 80 ? "hsl(142 50% 95%)" :
    score >= 60 ? "hsl(218 72% 95%)" :
    score >= 40 ? "hsl(38 90% 95%)" :
    "hsl(var(--muted))";
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color, background: bg }}>
      {label} {score}
    </span>
  );
}

function ScoreBar({ value, color = "hsl(var(--primary))" }: { value: number; color?: string }) {
  return (
    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

const DIMENSION_COLORS: Record<string, string> = {
  trust:      "hsl(142 50% 35%)",
  conversion: "hsl(218 72% 45%)",
  corridor:   "hsl(280 65% 50%)",
  language:   "hsl(38 90% 45%)",
  sector:     "hsl(var(--primary))",
};

export default function BestAccessPanel({ context = {}, title, showAlternatives = true, compact = false, onSelectPath }: Props) {
  const { loading, paths, findBestPaths } = useGraphEngine();
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    findBestPaths({ ...context, limit: compact ? 3 : 5 });
  }, [context.sector, context.zone, context.corridor, context.language]);

  const best = paths[0];
  const alternatives = paths.slice(1);

  if (loading) {
    return (
      <div className="card-surface p-5 flex items-center gap-3">
        <Loader2 size={16} className="animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("best_path_loading")}</p>
      </div>
    );
  }

  if (!best) {
    return (
      <div className="card-surface p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {title || t("best_path_title")}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("best_path_empty")}
        </p>
      </div>
    );
  }

  const dimensions = [
    { key: "trust",      label: t("best_path_trust"),      value: best.trust_score,      icon: Shield },
    { key: "conversion", label: t("best_path_conversion"),  value: best.conversion_score, icon: TrendingUp },
    { key: "corridor",   label: t("best_path_corridor"),    value: best.corridor_score,   icon: Globe },
    { key: "language",   label: t("best_path_language"),    value: best.language_score,   icon: Users },
    { key: "sector",     label: t("best_path_sector"),      value: best.sector_score,     icon: Star },
  ];

  return (
    <div className="card-surface overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Sparkles size={13} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              {title || t("best_path_title")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {paths.length} facilitateur{paths.length > 1 ? "s" : ""} · {t("best_path_engine_label")}
            </p>
          </div>
        </div>
      </div>

      {/* Best path */}
      <div
        className="p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
        onClick={() => {
          setExpanded(expanded === best.facilitator_id ? null : best.facilitator_id);
          onSelectPath?.(best);
        }}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-white text-lg"
            style={{ background: "var(--gradient-primary)" }}
          >
            {best.facilitator_name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-foreground">{best.facilitator_name}</p>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: best.global_score >= 70 ? "hsl(142 50% 95%)" : "hsl(var(--muted))",
                  color: best.global_score >= 70 ? "hsl(142 50% 30%)" : "hsl(var(--muted-foreground))",
                }}
              >
                {t("best_path_recommended")}
              </span>
            </div>

            {/* Score bar */}
            <div className="mt-2 mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{t("best_path_global_score")}</span>
                <span className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>
                  {best.global_score}/100 — {best.confidence_label}
                </span>
              </div>
              <ScoreBar
                value={best.global_score}
                color={best.global_score >= 70 ? "hsl(142 50% 40%)" : "hsl(var(--primary))"}
              />
            </div>

            {/* Explanation pills */}
            {best.explanation.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {best.explanation.slice(0, 3).map((e, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {e}
                  </span>
                ))}
              </div>
            )}

            {/* Next action */}
            <div className="mt-2 flex items-center gap-1.5">
              <Zap size={11} style={{ color: "hsl(var(--primary))" }} />
              <span className="text-xs font-semibold" style={{ color: "hsl(var(--primary))" }}>
                {best.next_action}
              </span>
            </div>
          </div>

          <ChevronRight
            size={14}
            className="text-muted-foreground shrink-0 transition-transform mt-1"
            style={{ transform: expanded === best.facilitator_id ? "rotate(90deg)" : "none" }}
          />
        </div>

        {/* Expanded dimension scores */}
        {expanded === best.facilitator_id && !compact && (
          <div className="mt-4 pt-4 border-t space-y-2.5" style={{ borderColor: "hsl(var(--border))" }}>
            {dimensions.map(({ key, label, value, icon: Icon }) => (
              <div key={key} className="flex items-center gap-2">
                <Icon size={12} style={{ color: DIMENSION_COLORS[key] }} className="shrink-0" />
                <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
                <div className="flex-1">
                  <ScoreBar value={value} color={DIMENSION_COLORS[key]} />
                </div>
                <span className="text-xs font-semibold w-8 text-right" style={{ color: DIMENSION_COLORS[key] }}>
                  {value}
                </span>
              </div>
            ))}
            {best.total_intros > 0 && (
              <p className="text-xs text-muted-foreground pt-1">
                {best.intros_validees} {t("best_path_intros_validated")} {best.total_intros} · {
                  best.revenue > 0 ? t("best_path_gains") : t("best_path_no_gains")
                }
              </p>
            )}
          </div>
        )}
      </div>

      {/* Alternatives */}
      {showAlternatives && alternatives.length > 0 && (
        <div className="border-t" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="p-3 pb-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t("best_path_alternatives")}
            </p>
          </div>
          {alternatives.slice(0, compact ? 2 : 3).map(alt => (
            <div
              key={alt.facilitator_id}
              className="px-4 py-3 flex items-center gap-3 hover:bg-secondary/40 transition-colors cursor-pointer"
              onClick={() => onSelectPath?.(alt)}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm text-white"
                style={{ background: "hsl(var(--muted))" }}
              >
                <span style={{ color: "hsl(var(--foreground))" }}>{alt.facilitator_name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{alt.facilitator_name}</p>
                  <span className="text-xs font-bold text-muted-foreground">{alt.global_score}/100</span>
                </div>
                <ScoreBar value={alt.global_score} />
                {alt.explanation[0] && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{alt.explanation[0]}</p>
                )}
              </div>
              <ArrowRight size={12} className="text-muted-foreground shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
