/**
 * useAutomationEngine — hook for admin visibility of the automation execution engine.
 * PROOF:AUTOMATION_V1:automation_engine_health
 * PROOF:AUTOMATION_V1:automation_rule_admin_visibility
 * PROOF:AUTOMATION_PROOF_V1:automation_engine_health
 * PROOF:AUTOMATION_PROOF_V1:automation_rule_admin_visibility
 */
import { useState, useCallback } from "react";
import { getAutomationEngineHealth } from "@/lib/automationEngine";

export interface AutomationEngineHealth {
  active_rules:       number;
  total_decisions:    number;
  apply_decisions:    number;
  skip_decisions:     number;
  templates_resolved: number;
  template_fallbacks: number;
  engine_mode:        "active" | "idle";
  rule_types_active:  Array<{ rule_type: string; count: number }>;
  recent_decisions:   Array<{ rule_type: string; decision: string; context: Record<string, unknown>; created_at: string }>;
}

export function useAutomationEngine() {
  const [health, setHealth] = useState<AutomationEngineHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // PROOF:AUTOMATION_V1:automation_engine_health
  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAutomationEngineHealth();
    setHealth(data);
    setLoaded(true);
    setLoading(false);
  }, []);

  return { health, loading, loaded, load };
}
