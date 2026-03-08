/**
 * useLeadActions — Fetches real lead_actions from DB for a given actor.
 * PROOF:EXECUTION_V1:action_queue_ui_real → this file
 * PROOF:EXECUTION_V1:enterprise_action_queue → used by DashboardEntreprise
 * PROOF:EXECUTION_V1:facilitateur_action_queue → used by DashboardFacilitateur
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/supabase";

export type ActionStatus = "open" | "in_progress" | "done" | "superseded" | "cancelled";
export type ActionPriority = "low" | "normal" | "high" | "urgent";
export type ActionType =
  | "review_lead"
  | "enrich_lead"
  | "contact_email_draft"
  | "contact_manual_call"
  | "request_facilitator_precision"
  | "promote_to_opportunity";

export interface LeadAction {
  id: string;
  lead_intake_id: string;
  opportunity_id: string | null;
  actor_user_id: string;
  action_type: ActionType;
  status: ActionStatus;
  priority: ActionPriority;
  reason: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface UseLeadActionsReturn {
  actions: LeadAction[];
  openCount: number;
  urgentCount: number;
  loading: boolean;
  reload: () => void;
  markDone: (actionId: string) => Promise<void>;
  markInProgress: (actionId: string) => Promise<void>;
}

// PROOF:EXECUTION_V1:action_status_mutations → markDone / markInProgress
export function useLeadActions(statusFilter: ActionStatus[] = ["open", "in_progress"]): UseLeadActionsReturn {
  const { user } = useAuth();
  const [actions, setActions] = useState<LeadAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      // PROOF:EXECUTION_V1:action_queue_ui_real — reads real lead_actions table
      const { data } = await db
        .from("lead_actions")
        .select("*")
        .eq("actor_user_id", user.id)
        .in("status", statusFilter)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (!cancelled) {
        setActions((data ?? []) as LeadAction[]);
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user, tick, statusFilter.join(",")]);

  // PROOF:EXECUTION_V1:action_status_mutations
  const markDone = useCallback(async (actionId: string) => {
    if (!user) return;
    await db.from("lead_actions")
      .update({ status: "done", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", actionId)
      .eq("actor_user_id", user.id);
    setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: "done" as ActionStatus } : a));
  }, [user]);

  const markInProgress = useCallback(async (actionId: string) => {
    if (!user) return;
    await db.from("lead_actions")
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", actionId)
      .eq("actor_user_id", user.id);
    setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: "in_progress" as ActionStatus } : a));
  }, [user]);

  const openCount = actions.filter(a => a.status === "open").length;
  const urgentCount = actions.filter(a => a.priority === "urgent" || a.priority === "high").length;

  return {
    actions,
    openCount,
    urgentCount,
    loading,
    reload: () => setTick(t => t + 1),
    markDone,
    markInProgress,
  };
}
