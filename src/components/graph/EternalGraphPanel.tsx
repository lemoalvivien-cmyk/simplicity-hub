/**
 * EternalGraphPanel v2 — React Flow Trust Graph Visualization
 * ─────────────────────────────────────────────────────────────
 * Palantir Gotham-style: interactive force graph with React Flow,
 * opportunity predictions, hidden links, shortest path query.
 */
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ReactFlow, Background, Controls, MiniMap,
  type Node, type Edge, type NodeTypes,
  Handle, Position, useNodesState, useEdgesState,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  GitBranch, Zap, TrendingUp, Shield, RefreshCw,
  Eye, Target, DollarSign, Clock, ChevronRight, Network,
} from "lucide-react";
import { useEternalGraph, type ETGLink, type ETGOpportunity, type ETGHiddenLink } from "@/hooks/useEternalGraph";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Custom ETG Node ───────────────────────────────────────────────

function ETGPersonNode({ data }: { data: { label: string; trust: number; isOpportunity?: boolean } }) {
  const trustColor = data.trust >= 70 ? "#4ade80" : data.trust >= 45 ? "#facc15" : "#94a3b8";
  return (
    <div
      className="rounded-full border-2 flex items-center justify-center select-none"
      style={{
        width: 40, height: 40,
        borderColor: data.isOpportunity ? "hsl(var(--primary))" : trustColor,
        background: data.isOpportunity
          ? "hsl(var(--primary) / 0.15)"
          : `color-mix(in srgb, ${trustColor} 20%, transparent)`,
        boxShadow: `0 0 8px ${trustColor}55`,
        fontSize: 9,
        color: "hsl(var(--foreground))",
      }}
    >
      <Handle type="target" position={Position.Left}  style={{ opacity: 0 }} />
      <span className="font-bold text-center leading-tight px-1 truncate max-w-[36px]">
        {data.trust}
      </span>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

function ETGCompanyNode({ data }: { data: { label: string; trust: number } }) {
  return (
    <div
      className="rounded-lg border-2 flex items-center justify-center select-none"
      style={{
        width: 48, height: 32,
        borderColor: "hsl(var(--primary))",
        background: "hsl(var(--primary) / 0.1)",
        boxShadow: "0 0 10px hsl(var(--primary) / 0.3)",
        fontSize: 9,
        color: "hsl(var(--foreground))",
      }}
    >
      <Handle type="target" position={Position.Left}  style={{ opacity: 0 }} />
      <span className="font-bold truncate max-w-[44px] px-1">{data.label.slice(0, 6)}</span>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  etgPerson:  ETGPersonNode  as NodeTypes[string],
  etgCompany: ETGCompanyNode as NodeTypes[string],
};

// ── Graph builder ─────────────────────────────────────────────────

const EDGE_COLORS: Record<string, string> = {
  INTRODUCED_BY: "hsl(var(--primary))",
  TRUSTS:        "#4ade80",
  DEAL_CLOSED:   "#facc15",
  HIDDEN:        "#a78bfa",
};

function buildFlowGraph(
  links: ETGLink[],
  hiddenLinks: ETGHiddenLink[],
  showHidden: boolean
): { nodes: Node[]; edges: Edge[] } {
  const nodeMap = new Map<string, Node>();
  const edges:    Edge[] = [];

  const addNode = (id: string, type: "person" | "company", trust = 50) => {
    if (nodeMap.has(id)) return;
    const idx = nodeMap.size;
    const angle = idx * 2.39996;
    const r = 120 + (idx % 4) * 30;
    nodeMap.set(id, {
      id,
      type: type === "company" ? "etgCompany" : "etgPerson",
      position: {
        x: 300 + r * Math.cos(angle),
        y: 220 + r * Math.sin(angle),
      },
      data: { label: id.slice(0, 6), trust },
    });
  };

  // Edges from real links
  links.slice(0, 50).forEach((l, i) => {
    addNode(l.from_id, l.from_type, l.trust_score);
    addNode(l.to_id,   l.to_type,   l.trust_score);
    if (l.from_id === l.to_id) return; // skip self-loops in viz
    edges.push({
      id:           `link-${i}`,
      source:       l.from_id,
      target:       l.to_id,
      label:        l.link_type === "DEAL_CLOSED" ? "💰" : l.link_type === "TRUSTS" ? "✓" : "→",
      style:        { stroke: EDGE_COLORS[l.link_type] || "#64748b", strokeWidth: Math.max(1, l.trust_score / 40) },
      animated:     l.link_type === "DEAL_CLOSED",
      markerEnd:    { type: MarkerType.ArrowClosed, color: EDGE_COLORS[l.link_type] },
      labelStyle:   { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
      labelBgStyle: { fill: "transparent" },
    });
  });

  // Hidden link edges
  if (showHidden) {
    hiddenLinks.slice(0, 20).forEach((hl, i) => {
      if (!hl.person_a_id || !hl.person_b_id) return;
      addNode(hl.person_a_id, "person", hl.strength);
      addNode(hl.person_b_id, "person", hl.strength);
      edges.push({
        id:         `hidden-${i}`,
        source:     hl.person_a_id,
        target:     hl.person_b_id,
        style:      { stroke: EDGE_COLORS.HIDDEN, strokeWidth: 1, strokeDasharray: "4 3" },
        animated:   false,
        markerEnd:  { type: MarkerType.ArrowClosed, color: EDGE_COLORS.HIDDEN },
      });
    });
  }

  return { nodes: Array.from(nodeMap.values()), edges };
}

// ── Stat Card ─────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, accent = false,
}: { icon: React.ElementType; label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={cn(
      "rounded-xl border p-3 flex flex-col gap-1 bg-card/60 backdrop-blur-sm",
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

function OpportunityRow({ opp, onClick, selected }: {
  opp: ETGOpportunity;
  onClick: () => void;
  selected: boolean;
}) {
  const conf = opp.confidence_score;
  const confColor = conf >= 70 ? "text-green-400" : conf >= 45 ? "text-yellow-400" : "text-muted-foreground";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
        "border border-border/50 bg-card/40 hover:bg-card/70",
        selected && "border-primary/40 bg-primary/5"
      )}
      onClick={onClick}
    >
      <Target className={cn("h-4 w-4 shrink-0", confColor)} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">
          {opp.target_sector || "Secteur inconnu"} · {opp.target_zone || "Zone inconnue"}
        </div>
        <div className="text-xs text-muted-foreground">
          Fermeture {opp.close_weeks_min}–{opp.close_weeks_max} sem
          {opp.precision_delta > 0 && ` · +${opp.precision_delta}% signal`}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {opp.commission_estimate && (
          <span className="text-xs font-mono text-green-400">
            {opp.commission_estimate.toLocaleString("fr-FR")} €
          </span>
        )}
        <Badge
          variant={conf >= 70 ? "default" : conf >= 45 ? "secondary" : "outline"}
          className="text-xs"
        >
          {conf}%
        </Badge>
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

  const [selectedOpp,  setSelectedOpp]  = useState<ETGOpportunity | null>(null);
  const [activeTab,    setActiveTab]    = useState<"predictions" | "graph" | "hidden">("predictions");
  const [showHidden,   setShowHidden]   = useState(false);

  // React Flow state
  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildFlowGraph(links, hiddenLinks, showHidden),
    [links, hiddenLinks, showHidden]
  );
  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  // Re-sync nodes/edges when links change
  const flowData = useMemo(
    () => buildFlowGraph(links, hiddenLinks, showHidden),
    [links, hiddenLinks, showHidden]
  );

  const handleGenerate = useCallback(async () => {
    await generatePredictions(6, 12);
  }, [generatePredictions]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          <span className="font-bold text-foreground tracking-tight">Eternal Trust Graph</span>
          <Badge variant="outline" className="text-xs font-mono">v2 · pgvector</Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={aggregate} disabled={aggregating} className="text-xs h-7 gap-1.5">
            <RefreshCw className={cn("h-3.5 w-3.5", aggregating && "animate-spin")} />
            {aggregating ? "Agrégation…" : "Agréger"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleGenerate} disabled={predicting} className="text-xs h-7 gap-1.5">
            <Zap className={cn("h-3.5 w-3.5", predicting && "animate-pulse")} />
            {predicting ? "Calcul…" : "Prédire 6-12w"}
          </Button>
          <Button size="sm" onClick={fullRefresh} disabled={loading} className="text-xs h-7 gap-1.5">
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
          <StatCard icon={GitBranch}  label="Liens graphe"    value={stats.total_links}  sub={`${stats.deals_closed} deals`} accent />
          <StatCard icon={Shield}     label="Score confiance" value={`${stats.avg_trust_score}/100`} />
          <StatCard icon={Eye}        label="Liens cachés"    value={stats.hidden_links} sub="inférés" />
          <StatCard icon={DollarSign} label="Commission ETG"  value={`${(stats.total_commission || 0).toLocaleString("fr-FR")} €`} accent />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/50">
        {(["predictions", "graph", "hidden"] as const).map(tab => (
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
            {tab === "graph"       && `React Flow (${links.length} liens)`}
            {tab === "hidden"      && `Liens cachés (${hiddenLinks.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* ── Predictions tab ── */}
        {activeTab === "predictions" && (
          <motion.div key="predictions"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-2"
          >
            {loading && [1,2,3].map(i => (
              <div key={i} className="h-12 rounded-lg bg-muted/30 animate-pulse" />
            ))}
            {!loading && opportunities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Aucune opportunité prédite.</p>
                <p className="text-xs mt-1">Lancez "Agréger" puis "Prédire 6-12w" pour générer les fenêtres prédictives.</p>
              </div>
            )}
            {opportunities.map(opp => (
              <OpportunityRow
                key={opp.opportunity_id}
                opp={opp}
                selected={selectedOpp?.opportunity_id === opp.opportunity_id}
                onClick={() => setSelectedOpp(
                  selectedOpp?.opportunity_id === opp.opportunity_id ? null : opp
                )}
              />
            ))}
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
                      Analyse prédictive ETG · pgvector ANN
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {selectedOpp.reasoning || "Raisonnement non disponible pour cette opportunité."}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-muted-foreground">Deal estimé:</span>
                        <span className="font-mono text-foreground">
                          {(selectedOpp.deal_value_estimate || 0).toLocaleString("fr-FR")} €
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        <span className="text-muted-foreground">+{selectedOpp.precision_delta}% précision/signal</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── React Flow graph tab ── */}
        {activeTab === "graph" && (
          <motion.div key="graph"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-0.5 bg-primary" /> INTRODUCED_BY
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-0.5 bg-green-400" /> TRUSTS
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-0.5 bg-yellow-400" /> DEAL_CLOSED
                </span>
                {showHidden && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-0.5 bg-violet-400" style={{ borderBottom: "2px dashed" }} /> Hidden
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowHidden(v => !v)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Eye className="h-3 w-3" />
                {showHidden ? "Masquer liens cachés" : "Afficher liens cachés"}
              </button>
            </div>

            <div
              className="rounded-xl border border-border/50 bg-card/20 overflow-hidden"
              style={{ height: 380 }}
            >
              {loading ? (
                <div className="h-full bg-muted/20 animate-pulse rounded-xl flex items-center justify-center">
                  <Network className="h-8 w-8 text-muted-foreground/30 animate-pulse" />
                </div>
              ) : flowData.nodes.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  <div className="text-center">
                    <Network className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>Aucun lien graphe — lancez l'agrégation.</p>
                  </div>
                </div>
              ) : (
                <ReactFlow
                  nodes={flowData.nodes}
                  edges={flowData.edges}
                  nodeTypes={nodeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                  minZoom={0.3}
                  maxZoom={2}
                  proOptions={{ hideAttribution: true }}
                  style={{ background: "transparent" }}
                >
                  <Background color="hsl(var(--border))" gap={20} size={0.5} />
                  <Controls
                    style={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                  />
                  <MiniMap
                    style={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                    nodeColor={(n) =>
                      n.type === "etgCompany" ? "hsl(var(--primary))" : "#4ade80"
                    }
                  />
                </ReactFlow>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Hidden links tab ── */}
        {activeTab === "hidden" && (
          <motion.div key="hidden"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-2"
          >
            {hiddenLinks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Aucun lien caché inféré.</p>
                <p className="text-xs mt-1">
                  L'algorithme détecte les connexions latentes via ≥2 introducteurs communs.
                </p>
              </div>
            ) : (
              hiddenLinks.map(hl => (
                <div key={hl.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/50 bg-card/40"
                >
                  <Eye className="h-4 w-4 text-violet-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground">
                      Lien inféré — force {hl.strength}/100 · confiance {hl.confidence}%
                    </div>
                    <div className="text-xs font-mono text-foreground/60 truncate">
                      {hl.person_a_id.slice(0, 8)}… ↔ {hl.person_b_id.slice(0, 8)}…
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
        <span>ETG v2 · pgvector ANN · shortest_path recursive CTE · RLS strict · Audit log</span>
        {stats?.computed_at && (
          <span>
            {new Date(stats.computed_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
}
