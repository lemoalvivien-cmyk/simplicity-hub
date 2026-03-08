/**
 * useLeadIntakes — Fetches and summarizes the unified lead pipeline.
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

export function useLeadIntakes(): UseLeadIntakesReturn {
  const { user } = useAuth();
  const [intakes, setIntakes] = useState<LeadIntake[]>([]);
  const [summary, setSummary] = useState<LeadPipelineSummary>({
    total: 0,
    pending_review: 0,
    needs_enrichment: 0,
    ready_for_opportunity: 0,
    ready_for_action: 0,
    blocked: 0,
    duplicate: 0,
  });
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
          fetchLeadPipelineSummary(user.id),
          fetchLeadIntakes(user.id, { limit: 50 }),
        ]);
        if (!cancelled) {
          setSummary(summaryData);
          setIntakes(intakesData);
        }
      } catch (e) {
        if (!cancelled) setError("Erreur lors du chargement du pipeline.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user, tick]);

  return {
    intakes,
    summary,
    loading,
    error,
    reload: () => setTick((t) => t + 1),
  };
}
