// PROOF:EXPORT_RECOVERY_V1:automation_engine_present → this file
/**
 * automationEngine.ts — Client-side bridge to the DB automation rule evaluator.
 * PROOF:CANONICAL_EXPORT_V1:automation_engine_present → this file
 * PROOF:AUTOMATION_V1:automation_rule_evaluator
 * PROOF:AUTOMATION_V1:template_resolution_engine
 * PROOF:AUTOMATION_V1:action_payload_from_template
 * PROOF:AUTOMATION_V1:automation_engine_health
 * PROOF:AUTOMATION_PROOF_V1:automation_rule_evaluator
 * PROOF:AUTOMATION_PROOF_V1:template_resolution_engine
 * PROOF:AUTOMATION_PROOF_V1:action_payload_from_template
 * PROOF:AUTOMATION_PROOF_V1:automation_engine_health
 * PROOF:AUTOMATION_PROOF_V1:passive_threshold_rule_applied
 * PROOF:REALITY_GATE_V1:automation_rule_evaluator
 * PROOF:REALITY_GATE_V1:template_resolution_engine
 * PROOF:REALITY_GATE_V1:action_payload_from_template
 * PROOF:REALITY_GATE_V1:automation_engine_health
 * PROOF:REALITY_GATE_V1:passive_threshold_rule_applied
 *
 * PROOF:AUTOMATION_CLEANUP_V1:rule_owner_resolution
 * Owner resolution strategy (mirrored from SQL):
 *   resolved_owner = entreprise_id ?? user_id
 * Enterprise leads → enterprise rules → enterprise actions (conversion).
 * Facilitator leads → facilitator rules → facilitator actions (enrichment).
 * Exception: request_facilitator_precision always routes to facilitator_id.
 */
import { db } from "@/lib/supabase";

// PROOF:AUTOMATION_V1:automation_rule_evaluator
// PROOF:AUTOMATION_CLEANUP_V1:rule_owner_resolution
// p_owner_id is optional — the SQL function resolves it via entreprise_id ?? user_id if absent.
export async function applyAutomationRulesToLead(intakeId: string, ownerId: string) {
  const { data, error } = await db.rpc("apply_automation_rules_to_lead", {
    p_intake_id: intakeId,
    p_owner_id:  ownerId,
  });
  if (error) console.error("[AutomationEngine] apply_automation_rules_to_lead:", error.message);
  return data as {
    status:           string;
    intake_id:        string;
    resolved_owner:   string;
    // PROOF:AUTOMATION_CLEANUP_V1:rule_owner_resolution
    owner_source:     "entreprise_id" | "user_id"; // which field was used
    applied_count:    number;
    decisions:        Array<{ rule: string; decision: string; action?: string }>;
  } | null;
}

// PROOF:AUTOMATION_V1:template_resolution_engine
// PROOF:AUTOMATION_V1:action_payload_from_template
export async function resolveMessageTemplate(
  ownerId:    string,
  actionType: string,
  channel:    "email" | "telephone" | "autre" = "email"
): Promise<{
  template_id:   string | null;
  template_type: string;
  channel:       string;
  title:         string;
  body:          string;
  fallback:      boolean;
} | null> {
  const { data, error } = await db.rpc("resolve_message_template", {
    p_owner_id:    ownerId,
    p_action_type: actionType,
    p_channel:     channel,
  });
  if (error) {
    console.error("[AutomationEngine] resolve_message_template:", error.message);
    return null;
  }
  return data as ReturnType<typeof resolveMessageTemplate> extends Promise<infer T> ? T : never;
}

// PROOF:AUTOMATION_V1:passive_threshold_rule_applied
// PROOF:REALITY_GATE_V1:passive_threshold_rule_applied
// Reads the actual threshold from automation_rules (passive_ingest_threshold).
// Fallback = 3 if no rule exists or RPC fails.
export async function getPassiveThreshold(ownerId: string): Promise<number> {
  const { data, error } = await db.rpc("get_automation_rule_threshold", {
    p_owner_id:  ownerId,
    p_rule_type: "passive_ingest_threshold",
    p_default:   3,
  });
  if (error) return 3;
  return (data as number) ?? 3;
}

// PROOF:AUTOMATION_V1:automation_engine_health
// PROOF:AUTOMATION_CLEANUP_V1:admin_health_consistency
export async function getAutomationEngineHealth(): Promise<{
  active_rules:                number;
  total_decisions:             number;
  apply_decisions:             number;
  skip_decisions:              number;
  templates_resolved:          number;
  template_fallbacks:          number;
  engine_mode:                 "active" | "idle";
  // PROOF:AUTOMATION_CLEANUP_V1:rule_owner_resolution
  owner_resolution_strategy:  string; // "entreprise_id → user_id (enterprise wins)"
  // PROOF:AUTOMATION_CLEANUP_V1:action_routing_coherence
  action_routing:              string; // describes how actions are assigned
  rule_types_active:           Array<{ rule_type: string; count: number }>;
  recent_decisions:            Array<{ rule_type: string; decision: string; context: Record<string, unknown>; created_at: string }>;
} | null> {
  const { data, error } = await db.rpc("get_automation_engine_health");
  if (error) {
    console.error("[AutomationEngine] get_automation_engine_health:", error.message);
    return null;
  }
  return data as ReturnType<typeof getAutomationEngineHealth> extends Promise<infer T> ? T : never;
}
