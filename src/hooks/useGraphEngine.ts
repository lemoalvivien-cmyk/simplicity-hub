/**
 * useGraphEngine — Best Path Access Engine
 * Calls openclaw-graph-engine edge function for matching, paths, graph stats
 */
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BestPath {
  facilitator_id: string;
  facilitator_name: string;
  global_score: number;
  trust_score: number;
  conversion_score: number;
  corridor_score: number;
  language_score: number;
  sector_score: number;
  zone_score: number;
  response_score: number;
  total_intros: number;
  intros_validees: number;
  revenue: number;
  explanation: string[];
  rank: number;
  confidence_label: string;
  next_action: string;
  recommended_channel: string;
}

export interface PathContext {
  sector?: string;
  zone?: string;
  corridor?: string;
  language?: string;
  limit?: number;
}

export interface GraphStats {
  total_edges: number;
  avg_weight: number;
  by_type: Record<string, number>;
  recent_events: { id: string; event_type: string; created_at: string }[];
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openclaw-graph-engine`;

async function callEngine(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Graph engine error: ${res.status}`);
  return res.json();
}

export function useGraphEngine() {
  const [loading, setLoading] = useState(false);
  const [paths, setPaths] = useState<BestPath[]>([]);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [cachedPaths, setCachedPaths] = useState<unknown[]>([]);

  const findBestPaths = useCallback(async (context: PathContext, targetLabel?: string) => {
    setLoading(true);
    try {
      const result = await callEngine({
        action: "find_best_paths",
        context,
        target_type: "general",
        target_label: targetLabel,
      });
      setPaths(result.paths || []);
      return result.paths as BestPath[];
    } catch (e) {
      console.error("[useGraphEngine] findBestPaths", e);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const feedGraph = useCallback(async (
    eventType: string,
    entityType: string,
    entityId: string
  ) => {
    try {
      await callEngine({ action: "feed_graph", event_type: eventType, entity_type: entityType, entity_id: entityId });
    } catch (e) {
      console.error("[useGraphEngine] feedGraph", e);
    }
  }, []);

  const getGraphStats = useCallback(async () => {
    setLoading(true);
    try {
      const result = await callEngine({ action: "get_graph_stats" });
      setStats(result);
      return result as GraphStats;
    } catch (e) {
      console.error("[useGraphEngine] getGraphStats", e);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCachedPaths = useCallback(async () => {
    try {
      const result = await callEngine({ action: "get_cached_path" });
      setCachedPaths(result.paths || []);
      return result.paths as unknown[];
    } catch (e) {
      console.error("[useGraphEngine] getCachedPaths", e);
      return [];
    }
  }, []);

  return {
    loading,
    paths,
    stats,
    cachedPaths,
    findBestPaths,
    feedGraph,
    getGraphStats,
    getCachedPaths,
  };
}
