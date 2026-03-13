/**
 * useEternalGraph — Eternal Trust Graph React Hook
 * ──────────────────────────────────────────────────
 * Interface React vers les 3 Edge Functions ETG.
 * Fournit : stats, opportunités prédictives, liens, agrégation temps réel.
 */
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// ── Types ─────────────────────────────────────────────────────────

export interface ETGStats {
  total_persons:      number;
  total_companies:    number;
  total_links:        number;
  deals_closed:       number;
  total_commission:   number;
  avg_trust_score:    number;
  hidden_links:       number;
  open_opportunities: number;
  top_confidence:     number;
  computed_at:        string;
}

export interface ETGOpportunity {
  opportunity_id:       string;
  confidence_score:     number;
  precision_delta:      number;
  target_sector:        string | null;
  target_zone:          string | null;
  close_weeks_min:      number;
  close_weeks_max:      number;
  deal_value_estimate:  number | null;
  commission_estimate:  number | null;
  reasoning:            string | null;
  recommended_intro_id: string | null;
  trust_path:           unknown[];
  status:               string;
  created_at:           string;
}

export interface ETGLink {
  id:                   string;
  from_id:              string;
  from_type:            "person" | "company";
  to_id:                string;
  to_type:              "person" | "company";
  link_type:            "INTRODUCED_BY" | "TRUSTS" | "DEAL_CLOSED";
  trust_score:          number;
  hidden_link_strength: number;
  commission_amount:    number;
  weight:               number;
}

export interface ETGHiddenLink {
  id:                          string;
  person_a_id:                 string;
  person_b_id:                 string;
  strength:                    number;
  confidence:                  number;
  predicted_deal_probability:  number;
}

export interface ETGGraphData {
  stats:         ETGStats | null;
  opportunities: ETGOpportunity[];
  links:         ETGLink[];
  hiddenLinks:   ETGHiddenLink[];
}

// ── Edge Function caller ──────────────────────────────────────────

const BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function callETG(fn: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const res = await fetch(`${BASE}/${fn}`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[${fn}] ${res.status}: ${err}`);
  }
  return res.json();
}

// ── Hook ──────────────────────────────────────────────────────────

export function useEternalGraph(autoLoad = true) {
  const [loading,       setLoading]       = useState(false);
  const [aggregating,   setAggregating]   = useState(false);
  const [predicting,    setPredicting]    = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [stats,         setStats]         = useState<ETGStats | null>(null);
  const [opportunities, setOpportunities] = useState<ETGOpportunity[]>([]);
  const [links,         setLinks]         = useState<ETGLink[]>([]);
  const [hiddenLinks,   setHiddenLinks]   = useState<ETGHiddenLink[]>([]);

  /** Pull current graph data from DB directly (no edge function) */
  const loadGraphData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: uid } = await supabase.auth.getUser();
      if (!uid?.user) return;

      const [statsRes, oppsRes, linksRes, hiddenRes] = await Promise.all([
        supabase.rpc("etg_graph_stats", { p_user_id: uid.user.id }),
        supabase.rpc("etg_predict_opportunities", {
          p_user_id:        uid.user.id,
          p_weeks_min:      6,
          p_weeks_max:      12,
          p_min_confidence: 20,
          p_limit:          20,
        }),
        supabase.from("etg_links" as never)
          .select("id, from_id, from_type, to_id, to_type, link_type, trust_score, hidden_link_strength, commission_amount, weight")
          .eq("user_id", uid.user.id)
          .order("trust_score", { ascending: false })
          .limit(100),
        supabase.from("etg_hidden_links" as never)
          .select("id, person_a_id, person_b_id, strength, confidence, predicted_deal_probability")
          .eq("user_id", uid.user.id)
          .gte("predicted_deal_probability", 0.3)
          .order("predicted_deal_probability", { ascending: false })
          .limit(50),
      ]);

      if (statsRes.data)   setStats(statsRes.data as ETGStats);
      if (oppsRes.data)    setOpportunities(oppsRes.data as ETGOpportunity[]);
      if (linksRes.data)   setLinks(linksRes.data as ETGLink[]);
      if (hiddenRes.data)  setHiddenLinks(hiddenRes.data as ETGHiddenLink[]);
    } catch (e) {
      console.error("[useEternalGraph] loadGraphData", e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  /** Trigger full aggregation pipeline (etg-aggregate) */
  const aggregate = useCallback(async () => {
    setAggregating(true);
    setError(null);
    try {
      await callETG("etg-aggregate", { action: "aggregate_anonymous_graph" });
      await loadGraphData();
    } catch (e) {
      console.error("[useEternalGraph] aggregate", e);
      setError(String(e));
    } finally {
      setAggregating(false);
    }
  }, [loadGraphData]);

  /** Generate new 6-12 week predictions (etg-predict) */
  const generatePredictions = useCallback(async (weeksMin = 6, weeksMax = 12) => {
    setPredicting(true);
    setError(null);
    try {
      const result = await callETG("etg-predict", {
        action:    "generate_predictions",
        weeks_min: weeksMin,
        weeks_max: weeksMax,
      });
      await loadGraphData();
      return result as { generated: number; skipped: number };
    } catch (e) {
      console.error("[useEternalGraph] generatePredictions", e);
      setError(String(e));
      return { generated: 0, skipped: 0 };
    } finally {
      setPredicting(false);
    }
  }, [loadGraphData]);

  /** Ingest a single event into the ETG (etg-ingest) */
  const ingestEvent = useCallback(async (
    eventType: "introduction_validee" | "gain_confirme" | "deal_closed",
    entityId:  string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      const result = await callETG("etg-ingest", {
        event_type: eventType,
        entity_id:  entityId,
        metadata:   metadata || {},
      });
      // Refresh after ingest
      await loadGraphData();
      return result;
    } catch (e) {
      console.error("[useEternalGraph] ingestEvent", e);
      setError(String(e));
      return null;
    }
  }, [loadGraphData]);

  /** Full refresh: aggregate → predict → load */
  const fullRefresh = useCallback(async () => {
    setLoading(true);
    try {
      await callETG("etg-aggregate", { action: "aggregate_anonymous_graph" });
      await callETG("etg-predict",   { action: "generate_predictions", weeks_min: 6, weeks_max: 12 });
      await loadGraphData();
    } catch (e) {
      console.error("[useEternalGraph] fullRefresh", e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [loadGraphData]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) loadGraphData();
  }, [autoLoad, loadGraphData]);

  const graphData: ETGGraphData = { stats, opportunities, links, hiddenLinks };

  return {
    // State
    loading,
    aggregating,
    predicting,
    error,
    graphData,
    stats,
    opportunities,
    links,
    hiddenLinks,
    // Actions
    aggregate,
    generatePredictions,
    ingestEvent,
    fullRefresh,
    loadGraphData,
  };
}
