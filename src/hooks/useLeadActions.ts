// PROOF:EXPORT_RECOVERY_V1:lead_actions_hook_present → this file
/**
 * useLeadActions — Fetches real lead_actions from DB for a given actor.
 * PROOF:CANONICAL_EXPORT_V1:lead_actions_hook_present → this file
 * PROOF:EXECUTION_V1:action_queue_ui_real → this file
 * PROOF:EXECUTION_V1:enterprise_action_queue → used by DashboardEntreprise
 * PROOF:SYNC_GATE_V1:lead_actions_file_present → this file
 * PROOF:EXECUTION_V1:facilitateur_action_queue → used by DashboardFacilitateur
 * PROOF:INTEGRITY_V1:action_rpc_usage → markDone / markInProgress call canonical RPC
 * PROOF:INTEGRITY_V1:canonical_action_mutation → no direct .update() on critical path
 * PROOF:CONSISTENCY_V1:action_queue_truth → reads real lead_actions table + lead_intakes join; mutations via update_lead_action_status() RPC only
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  // Joined context fields (from lead_intakes join)
  person_name?: string | null;
  company_name?: string | null;
  source_type?: string | null;
  linked_opportunity_id?: string | null;
  // AI scoring fields (joined from lead_intakes)
  ai_score?: number | null;
  ai_label?: string | null;
  ai_reasoning?: string | null;
}

interface UseLeadActionsReturn {
  actions: LeadAction[];
  openCount: number;
  urgentCount: number;
  loading: boolean;
  reload: () => void;
  markDone: (actionId: string, note?: string) => Promise<void>;
  markInProgress: (actionId: string) => Promise<void>;
  markCancelled: (actionId: string, note?: string) => Promise<void>;
}

// PROOF:EXECUTION_V1:action_status_mutations → markDone / markInProgress / markCancelled
// PROOF:INTEGRITY_V1:action_rpc_usage → all mutations use canonical RPC update_lead_action_status
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
      // PROOF:EXECUTION_V1:action_queue_ui_real — reads real lead_actions table with context join
      // PROOF:INTEGRITY_V1:action_context_ui — join with lead_intakes for business context
      const { data } = await db
        .from("lead_actions")
        .select(`
          *,
          lead_intakes!lead_actions_lead_intake_id_fkey (
            person_name,
            company_name,
            source_type,
            linked_opportunity_id,
            ai_score,
            ai_label,
            ai_reasoning
          )
        `)
        .eq("actor_user_id", user.id)
        .in("status", statusFilter)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (!cancelled) {
        const mapped = (data ?? []).map((row: Record<string, unknown>) => {
          const intake = row.lead_intakes as Record<string, unknown> | null;
          return {
            ...row,
            person_name: intake?.person_name ?? null,
            company_name: intake?.company_name ?? null,
            source_type: intake?.source_type ?? null,
            linked_opportunity_id: intake?.linked_opportunity_id ?? null,
            ai_score: intake?.ai_score ?? null,
            ai_label: intake?.ai_label ?? null,
            ai_reasoning: intake?.ai_reasoning ?? null,
          } as LeadAction;
        });
        setActions(mapped);
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user, tick, statusFilter.join(",")]);

  // PROOF:INTEGRITY_V1:canonical_action_mutation
  // PROOF:INTEGRITY_V1:action_rpc_usage
  // All status mutations go through canonical RPC — no direct .update() calls
  const callCanonicalRpc = useCallback(async (actionId: string, newStatus: string, note?: string) => {
    if (!user) return;
    const { data } = await supabase.rpc("update_lead_action_status", {
      p_action_id: actionId,
      p_new_status: newStatus,
      p_actor_id: user.id,
      p_note: note ?? null,
    });
    if (data) {
      setActions(prev => prev.map(a =>
        a.id === actionId ? { ...a, status: newStatus as ActionStatus } : a
      ));
    }
  }, [user]);

  const markDone = useCallback((actionId: string, note?: string) =>
    callCanonicalRpc(actionId, "done", note), [callCanonicalRpc]);

  const markInProgress = useCallback((actionId: string) =>
    callCanonicalRpc(actionId, "in_progress"), [callCanonicalRpc]);

  const markCancelled = useCallback((actionId: string, note?: string) =>
    callCanonicalRpc(actionId, "cancelled", note), [callCanonicalRpc]);

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
    markCancelled,
  };
}
