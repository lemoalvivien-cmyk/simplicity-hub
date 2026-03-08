/**
 * useAutomationRules — reads + writes automation_rules from real DB.
 * PROOF:GOLIVE_V1:automation_rules_ui_real → called by Regles.tsx
 */
import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface AutomationRule {
  id: string;
  owner_user_id: string;
  rule_type: string;
  label: string;
  description: string | null;
  is_enabled: boolean;
  niveau: "securite" | "automatisation" | "validation";
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useAutomationRules() {
  const { user } = useAuth();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await db
      .from("automation_rules")
      .select("*")
      .eq("owner_user_id", user.id)
      .order("niveau")
      .order("created_at");

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    // If no rules exist yet, seed defaults then reload
    if (!data || data.length === 0) {
      await db.rpc("seed_default_automation_rules", { p_user_id: user.id });
      const { data: seeded } = await db
        .from("automation_rules")
        .select("*")
        .eq("owner_user_id", user.id)
        .order("niveau")
        .order("created_at");
      setRules((seeded as AutomationRule[]) ?? []);
    } else {
      setRules(data as AutomationRule[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // PROOF:GOLIVE_V1:automation_rules_ui_real — toggle persists to DB
  const toggle = useCallback(async (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    const next = !rule.is_enabled;
    // Optimistic update
    setRules(prev => prev.map(r => r.id === id ? { ...r, is_enabled: next } : r));
    const { error: err } = await db
      .from("automation_rules")
      .update({ is_enabled: next })
      .eq("id", id)
      .eq("owner_user_id", user?.id ?? "");
    if (err) {
      // Rollback
      setRules(prev => prev.map(r => r.id === id ? { ...r, is_enabled: !next } : r));
      setError(err.message);
    }
  }, [rules, user]);

  return { rules, loading, error, toggle, reload: load };
}
