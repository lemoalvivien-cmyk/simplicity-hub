/**
 * EternalGraphPanel — Visualisation du Trust Graph ETG
 * ──────────────────────────────────────────────────────
 * Dashboard Palantir-style : stats, opportunités 6-12 semaines,
 * force graph SVG natif (pas de dépendance externe), actions temps réel.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch, Zap, TrendingUp, Shield, RefreshCw,
  Eye, Target, DollarSign, Clock, ChevronRight
} from "lucide-react";
import { useEternalGraph, type ETGLink, type ETGOpportunity } from "@/hooks/useEternalGraph";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Mini Force Graph (SVG natif, aucune dépendance) ──────────────

interface GraphNode { id: string; x: number; y: number; type: "person" | "company" | "hidden"; label?: string; trust?: number; }
interface GraphEdge { source: string; target: string; type: string; weight: number; }

function buildGraphFromLinks(links: ETGLink[], w: number, h: number): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodeSet = new Map<string, GraphNode>();
  const addNode = (id: string, type: "person" | "company") => {
    if (!nodeSet.has(id)) {
      const angle = nodeSet.size * (2.39996); // golden angle spread
      const r     = Math.min(w, h) * 0.3 + (nodeSet.size % 3) * 20;
      nodeSet.set(id, {
        id, type,
        x: w / 2 + r * Math.cos(angle),
        y: h / 2 + r * Math.sin(angle),
        trust: 50,
      });
    }
  };

  const edges: GraphEdge[] = links.slice(0, 40).map(l => {
    addNode(l.from_id, l.from_type);
    addNode(l.to_id,   l.to_type);
    return { source: l.from_id, target: l.to_id, type: l.link_type, weight: l.trust_score };
  });

  return { nodes: Array.from(nodeSet.values()), edges };
}

const LINK_COLORS: Record<string, string> = {
  INTRODUCED_BY: "hsl(var(--primary))",
  TRUSTS:        "hsl(142 71% 45%)",
  DEAL_CLOSED:   "hsl(38 95% 52%)",
};

function MiniForceGraph({ links, w = 400, h = 280 }: { links: ETGLink[]; w?: number; h?: number }) {
  const { nodes, edges } = buildGraphFromLinks(links, w, h);
  if (nodes.length === 0) return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      Aucun lien graphe — lancez l'agrégation.
    </div>
  );

  return (
    <svg width={w} height={h} className="w-full h-full">
      <defs>
        <filter id="etg-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Edges */}
      {edges.map((e, i) => {
        const s = nodes.find(n => n.id === e.source);
        const t = nodes.find(n => n.id === e.target);
        if (!s || !t || (s.x === t.x && s.y === t.y)) return null;
        return (
          <line key={i}
            x1={s.x} y1={s.y} x2={t.x} y2={t.y}
            stroke={LINK_COLORS[e.type] || "hsl(var(--muted-foreground))"}
            strokeWidth={Math.max(1, e.weight / 30)}
            strokeOpacity={0.5}
            strokeDasharray={e.type === "INTRODUCED_BY" ? "4 3" : undefined}
          />
        );
      })}
      {/* Nodes */}
      {nodes.map(n => (
        <g key={n.id} filter="url(#etg-glow)">
          <circle
            cx={n.x} cy={n.y}
            r={n.type === "company" ? 10 : 7}
            fill={n.type === "company" ? "hsl(var(--primary) / 0.2)" : "hsl(var(--primary) / 0.5)"}
            stroke={n.type === "company" ? "hsl(var(--primary))" : "hsl(142 71% 45%)"}
            strokeWidth={1.5}
          />
        </g>
      ))}
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, accent = false
}: { icon: React.ElementType; label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={cn(
      "rounded-xl border p-3 flex flex-col gap-1",
      "bg-card/60 backdrop-blur-sm",
      accent && "border-primary/40 bg-primary/5"
    )}>
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <div className="text-xl font-bold text-foreground tracking-tight">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

// ── Opportunity Row ───────────────────────────────────────────────

function OpportunityRow({ opp, onClick }: { opp: ETGOpportunity; onClick: () => void }) {
  const conf = opp.confidence_score;
  const confColor = conf >= 70 ? "text-green-400" : conf >= 45 ? "text-yellow-400" : "text-muted-foreground";
  const badge = conf >= 70 ? "default" : conf >= 45 ? "secondary" : "outline";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
        "border border-border/50 bg-card/40 hover:bg-card/70 transition-colors"
      )}
      onClick={onClick}
    >
      <Target className={cn("h-4 w-4 shrink-0", confColor)} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">
          {opp.target_sector || "Secteur inconnu"} · {opp.target_zone || "Zone inconnue"}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          Fermeture {opp.close_weeks_min}–{opp.close_weeks_max} semaines
          {opp.precision_delta > 0 && ` · +${opp.precision_delta}% précision/signal`}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {opp.commission_estimate && (
          <span className="text-xs font-mono text-green-400">
            {opp.commission_estimate.toLocaleString("fr-FR")} €
          </span>
        )}
        <Badge variant={badge} className="text-xs">{conf}%</Badge>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </motion.div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────

export function EternalGraphPanel({ className }: { className?: string }) {
  const {
    loading, aggregating, predicting, error,
    stats, opportunities, links, hiddenLinks,
    aggregate, generatePredictions, fullRefresh,
  } = useEternalGraph(true);

  const [selectedOpp, setSelectedOpp] = useState<ETGOpportunity | null>(null);
  const [activeTab,   setActiveTab]   = useState<"graph" | "predictions" | "hidden">("predictions");
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphSize,   setGraphSize]   = useState({ w: 400, h: 260 });

  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => {
      setGraphSize({ w: entry.contentRect.width, h: 260 });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const handleGenerate = useCallback(async () => {
    await generatePredictions(6, 12);
  }, [generatePredictions]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          <span className="font-bold text-foreground tracking-tight">Eternal Trust Graph</span>
          <Badge variant="outline" className="text-xs font-mono">v1</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm" variant="outline"
            onClick={aggregate}
            disabled={aggregating}
            className="text-xs h-7 gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", aggregating && "animate-spin")} />
            {aggregating ? "Agrégation…" : "Agréger"}
          </Button>
          <Button
            size="sm" variant="outline"
            onClick={handleGenerate}
            disabled={predicting}
            className="text-xs h-7 gap-1.5"
          >
            <Zap className={cn("h-3.5 w-3.5", predicting && "animate-pulse")} />
            {predicting ? "Calcul…" : "Prédire"}
          </Button>
          <Button
            size="sm"
            onClick={fullRefresh}
            disabled={loading}
            className="text-xs h-7 gap-1.5"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Full Refresh
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard icon={GitBranch} label="Liens graphe"   value={stats.total_links}         sub={`${stats.deals_closed} deals`} accent />
          <StatCard icon={Shield}    label="Score confiance" value={`${stats.avg_trust_score}/100`} />
          <StatCard icon={Eye}       label="Liens cachés"   value={stats.hidden_links}        sub="inférés" />
          <StatCard icon={DollarSign} label="Commission ETG" value={`${(stats.total_commission || 0).toLocaleString("fr-FR")} €`} accent />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/50">
        {(["predictions","graph","hidden"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "predictions" && `Opportunités (${opportunities.length})`}
            {tab === "graph"       && `Force Graph (${links.length})`}
            {tab === "hidden"      && `Liens cachés (${hiddenLinks.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "predictions" && (
          <motion.div key="predictions"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-2"
          >
            {loading && (
              <div className="flex flex-col gap-2">
                {[1,2,3].map(i => (
                  <div key={i} className="h-12 rounded-lg bg-muted/30 animate-pulse" />
                ))}
              </div>
            )}
            {!loading && opportunities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Aucune opportunité prédite.</p>
                <p className="text-xs mt-1">Lancez "Agréger" puis "Prédire" pour générer les fenêtres 6-12 semaines.</p>
              </div>
            )}
            {opportunities.map(opp => (
              <OpportunityRow
                key={opp.opportunity_id}
                opp={opp}
                onClick={() => setSelectedOpp(selectedOpp?.opportunity_id === opp.opportunity_id ? null : opp)}
              />
            ))}
            {/* Expanded opportunity detail */}
            <AnimatePresence>
              {selectedOpp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
                    <div className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Analyse prédictive ETG
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">{selectedOpp.reasoning}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-muted-foreground">Deal estimé:</span>
                        <span className="font-mono text-foreground">{(selectedOpp.deal_value_estimate || 0).toLocaleString("fr-FR")} €</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        <span className="text-muted-foreground">Précision +{selectedOpp.precision_delta}%/signal</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {activeTab === "graph" && (
          <motion.div key="graph"
            ref={containerRef}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-xl border border-border/50 bg-card/30 overflow-hidden"
            style={{ height: 260 }}
          >
            {loading ? (
              <div className="h-full bg-muted/20 animate-pulse rounded-xl" />
            ) : (
              <MiniForceGraph links={links} w={graphSize.w} h={graphSize.h} />
            )}
          </motion.div>
        )}

        {activeTab === "hidden" && (
          <motion.div key="hidden"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-2"
          >
            {hiddenLinks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Aucun lien caché inféré.</p>
                <p className="text-xs mt-1">L'algorithme détecte les connexions latentes à partir de ≥2 introducteurs communs.</p>
              </div>
            ) : (
              hiddenLinks.map(hl => (
                <div key={hl.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/50 bg-card/40"
                >
                  <Eye className="h-4 w-4 text-primary/60 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground">
                      Lien inféré — force {hl.strength}/100
                    </div>
                    <div className="text-xs font-mono text-foreground/60 truncate">
                      {hl.person_a_id.slice(0,8)}… ↔ {hl.person_b_id.slice(0,8)}…
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs font-bold text-yellow-400">
                      {Math.round(hl.predicted_deal_probability * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">prob. deal</div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/30">
        <span>ETG v1 · Commission 7% auto · RLS strict · Audit log actif</span>
        {stats?.computed_at && (
          <span>
            Calculé le {new Date(stats.computed_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
}
