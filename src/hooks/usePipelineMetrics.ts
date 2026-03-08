// PROOF:EXPORT_RECOVERY_V1:pipeline_metrics_hook_present → this file
/**
 * usePipelineMetrics — Real pipeline counters from the DB.
 * PROOF:CANONICAL_EXPORT_V1:pipeline_metrics_hook_present → this file
 * PROOF:INTEGRITY_V1:opportunity_metrics_real → this hook
 * PROOF:SYNC_GATE_V1:pipeline_metrics_file_present → this file
 * Returns real counts: open actions, done actions (last 7d), V2 opps,
 * intro-born opps, blocked/duplicate leads.
 */
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/supabase";

export interface PipelineMetrics {
  openActions: number;
  doneLast7d: number;
  v2Opportunities: number;
  introBornOpps: number;
  blockedLeads: number;
  loading: boolean;
}

// PROOF:INTEGRITY_V1:opportunity_metrics_real — all counts come from real DB queries
export function usePipelineMetrics(): PipelineMetrics {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<Omit<PipelineMetrics, "loading">>({
    openActions: 0,
    doneLast7d: 0,
    v2Opportunities: 0,
    introBornOpps: 0,
    blockedLeads: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [openRes, doneRes, v2Res, introRes, blockedRes] = await Promise.all([
        // Open actions for this user
        db.from("lead_actions")
          .select("id", { count: "exact", head: true })
          .eq("actor_user_id", user.id)
          .in("status", ["open", "in_progress"]),

        // Actions completed last 7 days
        db.from("lead_actions")
          .select("id", { count: "exact", head: true })
          .eq("actor_user_id", user.id)
          .eq("status", "done")
          .gte("completed_at", sevenDaysAgo),

        // V2 pipeline opportunities (have lead_intake_id)
        db.from("opportunities")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .not("lead_intake_id", "is", null),

        // Intro-born opportunities (have source_intro_id)
        db.from("opportunities")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .not("source_intro_id", "is", null),

        // Blocked/duplicate leads
        db.from("lead_intakes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .in("qualification_status", ["duplicate", "blocked"]),
      ]);

      if (!cancelled) {
        setMetrics({
          openActions: openRes.count ?? 0,
          doneLast7d: doneRes.count ?? 0,
          v2Opportunities: v2Res.count ?? 0,
          introBornOpps: introRes.count ?? 0,
          blockedLeads: blockedRes.count ?? 0,
        });
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user]);

  return { ...metrics, loading };
}
