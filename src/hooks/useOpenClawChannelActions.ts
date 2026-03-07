/**
 * useOpenClawChannelActions
 * ──────────────────────────
 * Loads channel actions produced by OpenClaw jobs.
 * Exposes prepared / pending_approval / sent actions,
 * approval functions, and "pendant que tu dors" summary.
 */
import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type ChannelActionStatus =
  | "prepared"
  | "pending_approval"
  | "approved"
  | "sent"
  | "failed"
  | "cancelled";

export type TriggerMode = "auto" | "assisted" | "manual";

export interface ChannelAction {
  id: string;
  channel: string;
  action_type: string;
  job_type: string;
  execution_id: string | null;
  source_entity_id: string | null;
  source_entity_type: string | null;
  status: ChannelActionStatus;
  trigger_mode: TriggerMode;
  approval_required: boolean;
  approved_at: string | null;
  executed_at: string | null;
  payload_summary: string | null;
  payload: Record<string, unknown> | null;
  error_detail: string | null;
  created_at: string;
  updated_at: string;
}

export const CHANNEL_META: Record<string, { label: string; emoji: string; color: string }> = {
  email:        { label: "Email",         emoji: "📧", color: "hsl(218 72% 55%)" },
  whatsapp:     { label: "WhatsApp",      emoji: "💬", color: "hsl(142 70% 42%)" },
  telegram:     { label: "Telegram",      emoji: "✈️", color: "hsl(199 90% 48%)" },
  slack:        { label: "Slack",         emoji: "💼", color: "hsl(25 60% 50%)" },
  introduction: { label: "Introduction",  emoji: "🤝", color: "hsl(280 60% 55%)" },
  phone:        { label: "Téléphone",     emoji: "📞", color: "hsl(var(--muted-foreground))" },
};

export const ACTION_TYPE_META: Record<string, { label: string }> = {
  outreach:  { label: "Prise de contact" },
  relance:   { label: "Relance" },
  diffusion: { label: "Diffusion passive" },
  rappel:    { label: "Rappel" },
  brief:     { label: "Brief préparé" },
  digest:    { label: "Synthèse" },
};

export const STATUS_META: Record<ChannelActionStatus, { label: string; color: string; badge: string }> = {
  prepared:         { label: "Prêt",               color: "hsl(218 72% 55%)", badge: "🔵" },
  pending_approval: { label: "Attend votre accord", color: "hsl(38 80% 45%)",  badge: "🟠" },
  approved:         { label: "Approuvé",            color: "hsl(142 65% 42%)", badge: "🟢" },
  sent:             { label: "Envoyé",              color: "hsl(var(--success))", badge: "✅" },
  failed:           { label: "Échoué",              color: "hsl(0 65% 40%)",   badge: "🔴" },
  cancelled:        { label: "Annulé",              color: "hsl(var(--muted-foreground))", badge: "⚪" },
};

export const TRIGGER_MODE_META: Record<TriggerMode, { label: string; badge: string; color: string }> = {
  auto:     { label: "Déclenché automatiquement", badge: "⚡", color: "hsl(var(--success))" },
  assisted: { label: "Assisté — validation requise", badge: "🤝", color: "hsl(38 80% 45%)" },
  manual:   { label: "Lancé manuellement",         badge: "👆", color: "hsl(var(--muted-foreground))" },
};

export function useOpenClawChannelActions() {
  const { user } = useAuth();
  const [actions, setActions]   = useState<ChannelAction[]>([]);
  const [loading, setLoading]   = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!user) return;
    const { data } = await db
      .from("openclaw_channel_actions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setActions((data as ChannelAction[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Approve an action ───────────────────────────────────────────────────────
  const approveAction = useCallback(async (actionId: string) => {
    if (!user) return;
    setApproving(actionId);
    await db
      .from("openclaw_channel_actions")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", actionId)
      .eq("user_id", user.id);
    await loadAll();
    setApproving(null);
  }, [user, loadAll]);

  // ── Cancel an action ────────────────────────────────────────────────────────
  const cancelAction = useCallback(async (actionId: string) => {
    if (!user) return;
    await db
      .from("openclaw_channel_actions")
      .update({ status: "cancelled" })
      .eq("id", actionId)
      .eq("user_id", user.id);
    await loadAll();
  }, [user, loadAll]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const preparedActions    = actions.filter(a => a.status === "prepared");
  const pendingApprovals   = actions.filter(a => a.status === "pending_approval");
  const sentActions        = actions.filter(a => a.status === "sent");
  const failedActions      = actions.filter(a => a.status === "failed");
  const autoActions        = actions.filter(a => a.trigger_mode === "auto");
  const manualActions      = actions.filter(a => a.trigger_mode === "manual");

  // "Pendant que tu dors": actions created in last 8h by auto/assisted mode
  const whileYouSlept = actions.filter(a => {
    const age = Date.now() - new Date(a.created_at).getTime();
    return age < 8 * 60 * 60 * 1000 && a.trigger_mode !== "manual";
  });

  // Channel breakdown
  const byChannel = actions.reduce<Record<string, ChannelAction[]>>((acc, a) => {
    (acc[a.channel] = acc[a.channel] || []).push(a);
    return acc;
  }, {});

  return {
    actions, loading, approving,
    preparedActions, pendingApprovals, sentActions, failedActions,
    autoActions, manualActions, whileYouSlept, byChannel,
    approveAction, cancelAction, loadAll,
  };
}
