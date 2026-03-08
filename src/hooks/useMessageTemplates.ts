/**
 * useMessageTemplates — reads + writes message_templates from real DB.
 * PROOF:GOLIVE_V1:message_templates_ui_real → called by Messages.tsx
 */
import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface MessageTemplate {
  id: string;
  owner_user_id: string;
  template_type: string;
  title: string;
  body: string;
  channel: "email" | "telephone" | "autre";
  is_active: boolean;
  utilises: number;
  created_at: string;
  updated_at: string;
}

export function useMessageTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await db
      .from("message_templates")
      .select("*")
      .eq("owner_user_id", user.id)
      .order("created_at");

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    // Seed defaults if empty
    if (!data || data.length === 0) {
      await db.rpc("seed_default_message_templates", { p_user_id: user.id });
      const { data: seeded } = await db
        .from("message_templates")
        .select("*")
        .eq("owner_user_id", user.id)
        .order("created_at");
      setTemplates((seeded as MessageTemplate[]) ?? []);
    } else {
      setTemplates(data as MessageTemplate[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // PROOF:GOLIVE_V1:message_templates_ui_real — update body persists to DB
  const updateBody = useCallback(async (id: string, body: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, body } : t));
    const { error: err } = await db
      .from("message_templates")
      .update({ body })
      .eq("id", id)
      .eq("owner_user_id", user?.id ?? "");
    if (err) setError(err.message);
  }, [user]);

  const toggleActive = useCallback(async (id: string) => {
    const tpl = templates.find(t => t.id === id);
    if (!tpl) return;
    const next = !tpl.is_active;
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, is_active: next } : t));
    const { error: err } = await db
      .from("message_templates")
      .update({ is_active: next })
      .eq("id", id)
      .eq("owner_user_id", user?.id ?? "");
    if (err) {
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, is_active: !next } : t));
      setError(err.message);
    }
  }, [templates, user]);

  const createTemplate = useCallback(async (partial: Omit<MessageTemplate, "id" | "owner_user_id" | "created_at" | "updated_at" | "utilises">) => {
    if (!user) return null;
    const { data, error: err } = await db
      .from("message_templates")
      .insert({ ...partial, owner_user_id: user.id })
      .select()
      .single();
    if (err) { setError(err.message); return null; }
    setTemplates(prev => [...prev, data as MessageTemplate]);
    return data as MessageTemplate;
  }, [user]);

  return { templates, loading, error, updateBody, toggleActive, createTemplate, reload: load };
}
