/**
 * automationEngine.ts — Client-side bridge to the DB automation rule evaluator.
 *
 * Owner resolution strategy (mirrored from SQL):
 *   resolved_owner = entreprise_id ?? user_id
 * Enterprise leads → enterprise rules → enterprise actions (conversion).
 * Facilitator leads → facilitator rules → facilitator actions (enrichment).
 * Exception: request_facilitator_precision always routes to facilitator_id.
 */
import { db } from "@/lib/supabase";

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
    owner_source:     "entreprise_id" | "user_id"; // which field was used
    applied_count:    number;
    decisions:        Array<{ rule: string; decision: string; action?: string }>;
  } | null;
}

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

export async function getAutomationEngineHealth(): Promise<{
  active_rules:                number;
  total_decisions:             number;
  apply_decisions:             number;
  skip_decisions:              number;
  templates_resolved:          number;
  template_fallbacks:          number;
  engine_mode:                 "active" | "idle";
  owner_resolution_strategy:  string;
  action_routing:              string;
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
