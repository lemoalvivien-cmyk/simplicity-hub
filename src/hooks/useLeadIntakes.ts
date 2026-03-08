/**
 * useLeadIntakes — Fetches and summarizes the unified lead pipeline.
 * Supports both facilitateur (owner) and entreprise (relational) views.
 * PROOF:PIPELINE_V2:facilitateur_dashboard_pipeline → src/pages/DashboardFacilitateur.tsx (UnifiedLeadsBlock)
 * PROOF:PIPELINE_V2:enterprise_dashboard_pipeline   → src/pages/DashboardEntreprise.tsx (UnifiedLeadsBlock asEntreprise)
 */
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchLeadPipelineSummary,
  fetchLeadIntakes,
  type LeadIntake,
  type LeadPipelineSummary,
} from "@/lib/leadPipeline";

interface UseLeadIntakesReturn {
  intakes: LeadIntake[];
  summary: LeadPipelineSummary;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const EMPTY_SUMMARY: LeadPipelineSummary = {
  total: 0, pending_review: 0, needs_enrichment: 0,
  ready_for_opportunity: 0, ready_for_action: 0, blocked: 0, duplicate: 0,
};

/**
 * @param asEntreprise - When true, fetches leads where entreprise_id = user.id
 *                       instead of user_id = user.id. This is how entreprise users
 *                       see their pipeline (they own the target, not the lead record).
 */
export function useLeadIntakes(asEntreprise = false): UseLeadIntakesReturn {
  const { user } = useAuth();
  const [intakes, setIntakes] = useState<LeadIntake[]>([]);
  const [summary, setSummary] = useState<LeadPipelineSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryData, intakesData] = await Promise.all([
          fetchLeadPipelineSummary(user.id, asEntreprise),
          fetchLeadIntakes(user.id, { limit: 50, asEntreprise }),
        ]);
        if (!cancelled) {
          setSummary(summaryData);
          setIntakes(intakesData);
        }
      } catch {
        if (!cancelled) setError("Erreur lors du chargement du pipeline.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user, tick, asEntreprise]);

  return {
    intakes,
    summary,
    loading,
    error,
    reload: () => setTick((t) => t + 1),
  };
}
