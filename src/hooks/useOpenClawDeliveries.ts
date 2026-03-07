/**
 * useOpenClawDeliveries
 * ─────────────────────
 * Loads delivery receipts from openclaw_channel_deliveries.
 * Exposes real dispatch stats, channel health, outcome loop.
 * Also exposes the CHANNEL_CAPABILITY_MATRIX for honest UI rendering.
 */
import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type DeliveryStatus =
  | "prepared"
  | "approval_required"
  | "queued"
  | "dispatched"
  | "delivered"
  | "failed"
  | "bounced"
  | "replied"
  | "cancelled"
  | "expired";

export type ChannelAvailability = "auto" | "sendable" | "export" | "prepared" | "prepared_only" | "not_supported";

export interface ChannelCapability {
  channel: string;
  channel_name: string;
  emoji: string;
  can_prepare: boolean;
  can_auto_send: boolean;
  can_send_validated: boolean;
  can_export_human: boolean;
  can_receive_receipt: boolean;
  can_track_reply: boolean;
  requires_gateway: boolean;
  requires_external_api: boolean;
  availability: ChannelAvailability;
  honest_note: string;
}

export interface ChannelDelivery {
  id: string;
  user_id: string;
  channel_action_id: string;
  channel: string;
  dispatch_status: DeliveryStatus;
  provider_status: string | null;
  provider_message_id: string | null;
  external_thread_id: string | null;
  provider_response: Record<string, unknown> | null;
  queued_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  replied_at: string | null;
  cancelled_at: string | null;
  expired_at: string | null;
  error_code: string | null;
  error_summary: string | null;
  error_type: string | null;
  reply_summary: string | null;
  reply_sentiment: string | null;
  engagement_detected: boolean;
  linked_opportunity_id: string | null;
  linked_introduction_id: string | null;
  linked_gain_id: string | null;
  outcome_type: string | null;
  source_run_id: string | null;
  source_job_id: string | null;
  dispatched_by: string;
  dispatch_mode: string;
  requires_approval: boolean;
  approval_given_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Delivery status metadata ──────────────────────────────────────────────────
export const DELIVERY_STATUS_META: Record<DeliveryStatus, {
  label: string;
  badge: string;
  color: string;
  bg: string;
}> = {
  prepared:         { label: "Prêt à envoyer",          badge: "🔵", color: "hsl(218 72% 55%)",            bg: "hsl(218 72% 55% / 0.12)" },
  approval_required:{ label: "Attend votre accord",      badge: "🟠", color: "hsl(38 80% 45%)",             bg: "hsl(38 80% 45% / 0.12)" },
  queued:           { label: "En file d'attente",        badge: "⏳", color: "hsl(218 60% 60%)",            bg: "hsl(218 60% 60% / 0.12)" },
  dispatched:       { label: "Envoyé",                   badge: "✅", color: "hsl(var(--success))",         bg: "hsl(var(--success) / 0.12)" },
  delivered:        { label: "Livré",                    badge: "✅", color: "hsl(142 65% 40%)",            bg: "hsl(142 65% 40% / 0.12)" },
  failed:           { label: "Échec d'envoi",            badge: "🔴", color: "hsl(0 65% 40%)",             bg: "hsl(0 65% 40% / 0.12)" },
  bounced:          { label: "Rebondi",                  badge: "⛔", color: "hsl(0 50% 50%)",             bg: "hsl(0 50% 50% / 0.12)" },
  replied:          { label: "Réponse reçue",            badge: "💬", color: "hsl(280 60% 55%)",            bg: "hsl(280 60% 55% / 0.12)" },
  cancelled:        { label: "Annulé",                   badge: "⚪", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
  expired:          { label: "Expiré",                   badge: "⏰", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
};

// ── Hardcoded capability matrix (mirrors DB, always available offline) ────────
export const CHANNEL_CAPABILITY_MATRIX: ChannelCapability[] = [
  {
    channel: "email", channel_name: "Email", emoji: "📧",
    can_prepare: true, can_auto_send: false, can_send_validated: true,
    can_export_human: true, can_receive_receipt: false, can_track_reply: false,
    requires_gateway: false, requires_external_api: false,
    availability: "sendable",
    honest_note: "Actions préparées. Envoi avec validation humaine possible via le produit.",
  },
  {
    channel: "introduction", channel_name: "Introduction", emoji: "🤝",
    can_prepare: true, can_auto_send: false, can_send_validated: true,
    can_export_human: true, can_receive_receipt: false, can_track_reply: true,
    requires_gateway: false, requires_external_api: false,
    availability: "sendable",
    honest_note: "Introductions natives WIINUP. Envoi déclenché côté produit.",
  },
  {
    channel: "whatsapp", channel_name: "WhatsApp Business", emoji: "💬",
    can_prepare: true, can_auto_send: false, can_send_validated: false,
    can_export_human: true, can_receive_receipt: false, can_track_reply: false,
    requires_gateway: true, requires_external_api: true,
    availability: "prepared",
    honest_note: "Préparé uniquement. Envoi réel nécessite WhatsApp Business API + gateway.",
  },
  {
    channel: "telegram", channel_name: "Telegram", emoji: "✈️",
    can_prepare: true, can_auto_send: false, can_send_validated: false,
    can_export_human: true, can_receive_receipt: false, can_track_reply: false,
    requires_gateway: true, requires_external_api: true,
    availability: "prepared",
    honest_note: "Préparé uniquement. Connexion Telegram Bot nécessaire.",
  },
  {
    channel: "slack", channel_name: "Slack", emoji: "💼",
    can_prepare: true, can_auto_send: false, can_send_validated: false,
    can_export_human: true, can_receive_receipt: false, can_track_reply: false,
    requires_gateway: false, requires_external_api: true,
    availability: "prepared",
    honest_note: "Préparé uniquement. Intégration Slack nécessaire.",
  },
  {
    channel: "phone", channel_name: "Téléphone", emoji: "📞",
    can_prepare: true, can_auto_send: false, can_send_validated: false,
    can_export_human: true, can_receive_receipt: false, can_track_reply: false,
    requires_gateway: false, requires_external_api: false,
    availability: "export",
    honest_note: "Export humain uniquement. Pas d'automatisation téléphonique.",
  },
  {
    channel: "linkedin", channel_name: "LinkedIn", emoji: "🔗",
    can_prepare: true, can_auto_send: false, can_send_validated: false,
    can_export_human: true, can_receive_receipt: false, can_track_reply: false,
    requires_gateway: false, requires_external_api: true,
    availability: "prepared",
    honest_note: "Préparé uniquement. LinkedIn ne permet pas l'auto-envoi conforme.",
  },
];

export function getChannelCapability(channel: string): ChannelCapability {
  return CHANNEL_CAPABILITY_MATRIX.find(c => c.channel === channel) ?? {
    channel, channel_name: channel, emoji: "📡",
    can_prepare: true, can_auto_send: false, can_send_validated: false,
    can_export_human: true, can_receive_receipt: false, can_track_reply: false,
    requires_gateway: false, requires_external_api: false,
    availability: "prepared",
    honest_note: "Canal non reconnu. Export humain uniquement.",
  };
}

export function getDispatchLabel(cap: ChannelCapability): {
  label: string; badge: string; color: string; canDispatch: boolean;
} {
  if (cap.can_auto_send)       return { label: "Envoyé automatiquement", badge: "⚡", color: "hsl(var(--success))", canDispatch: true };
  if (cap.can_send_validated)  return { label: "Envoyé après validation", badge: "✅", color: "hsl(142 65% 40%)",   canDispatch: true };
  if (cap.availability === "export") return { label: "Prêt à exporter",  badge: "📋", color: "hsl(38 80% 40%)",   canDispatch: false };
  return                              { label: "Préparé",                badge: "🔵", color: "hsl(218 72% 55%)",   canDispatch: false };
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useOpenClawDeliveries() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<ChannelDelivery[]>([]);
  const [loading, setLoading]       = useState(true);
  const [dispatching, setDispatching] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!user) return;
    const { data } = await db
      .from("openclaw_channel_deliveries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setDeliveries((data as ChannelDelivery[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Dispatch a channel action ──────────────────────────────────────────────
  const dispatchAction = useCallback(async (
    channelActionId: string,
    forceMode?: "export" | "validated"
  ): Promise<{ ok: boolean; delivery_id?: string; dispatch_status?: string; message?: string; error?: string }> => {
    if (!user) return { ok: false, error: "Non authentifié" };
    setDispatching(channelActionId);
    try {
      const { data, error } = await supabase.functions.invoke("openclaw-channel-dispatch", {
        body: { channel_action_id: channelActionId, force_mode: forceMode },
      });
      if (error) throw error;
      await loadAll();
      return {
        ok: data?.dispatched ?? false,
        delivery_id: data?.delivery_id,
        dispatch_status: data?.dispatch_status,
        message: data?.message,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      return { ok: false, error: msg };
    } finally {
      setDispatching(null);
    }
  }, [user, loadAll]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const dispatchedToday = deliveries.filter(d => {
    if (!d.dispatched_at) return false;
    const age = Date.now() - new Date(d.dispatched_at).getTime();
    return age < 86400000 && d.dispatch_status === "dispatched";
  });

  const deliveredToday = deliveries.filter(d => {
    if (!d.delivered_at) return false;
    const age = Date.now() - new Date(d.delivered_at).getTime();
    return age < 86400000;
  });

  const repliedToday = deliveries.filter(d => {
    if (!d.replied_at) return false;
    const age = Date.now() - new Date(d.replied_at).getTime();
    return age < 86400000;
  });

  const failedToday = deliveries.filter(d => {
    if (!d.failed_at) return false;
    const age = Date.now() - new Date(d.failed_at).getTime();
    return age < 86400000;
  });

  const pendingApproval = deliveries.filter(d => d.dispatch_status === "approval_required");
  const queued          = deliveries.filter(d => d.dispatch_status === "queued");
  const allDispatched   = deliveries.filter(d => ["dispatched", "delivered"].includes(d.dispatch_status));
  const allFailed       = deliveries.filter(d => ["failed", "bounced"].includes(d.dispatch_status));
  const allReplied      = deliveries.filter(d => d.dispatch_status === "replied");

  // By channel
  const byChannel = deliveries.reduce<Record<string, ChannelDelivery[]>>((acc, d) => {
    (acc[d.channel] = acc[d.channel] || []).push(d);
    return acc;
  }, {});

  // Delivery rate today
  const totalToday   = [...dispatchedToday, ...failedToday].length;
  const deliveryRate = totalToday > 0 ? Math.round((dispatchedToday.length / totalToday) * 100) : null;

  return {
    deliveries, loading, dispatching,
    dispatchedToday, deliveredToday, repliedToday, failedToday,
    pendingApproval, queued, allDispatched, allFailed, allReplied,
    byChannel, deliveryRate, totalToday,
    dispatchAction, loadAll,
    capabilities: CHANNEL_CAPABILITY_MATRIX,
  };
}
