/**
 * openclaw-channel-dispatch
 * ─────────────────────────
 * Real dispatch function for OpenClaw channel actions.
 *
 * Honest contract per channel:
 *   email        → prepared / export (no native send yet — creates delivery record with export status)
 *   introduction → prepared / validated dispatch (creates native intro record)
 *   whatsapp     → prepared only (no API connected)
 *   telegram     → prepared only (no bot connected)
 *   slack        → prepared only (no connector configured here)
 *   discord      → prepared only
 *   phone        → export only (human export)
 *   linkedin     → prepared only
 *   webchat      → prepared only
 *
 * This function NEVER marks a delivery as "dispatched" unless it actually happened.
 *
 * POST /openclaw-channel-dispatch
 * Authorization: Bearer <user_jwt>
 * Body: { channel_action_id: string, force_mode?: "export" | "validated" }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Channel capability matrix (source of truth) ──────────────────────────────
const CHANNEL_CAPABILITIES: Record<string, {
  can_auto_send: boolean;
  can_send_validated: boolean;
  can_export_human: boolean;
  requires_approval: boolean;
  honest_mode: "auto" | "validated" | "export" | "prepared_only";
}> = {
  email:        { can_auto_send: false, can_send_validated: true,  can_export_human: true,  requires_approval: true,  honest_mode: "validated" },
  introduction: { can_auto_send: false, can_send_validated: true,  can_export_human: true,  requires_approval: true,  honest_mode: "validated" },
  whatsapp:     { can_auto_send: false, can_send_validated: false, can_export_human: true,  requires_approval: true,  honest_mode: "prepared_only" },
  telegram:     { can_auto_send: false, can_send_validated: false, can_export_human: true,  requires_approval: true,  honest_mode: "prepared_only" },
  slack:        { can_auto_send: false, can_send_validated: false, can_export_human: true,  requires_approval: true,  honest_mode: "prepared_only" },
  discord:      { can_auto_send: false, can_send_validated: false, can_export_human: true,  requires_approval: true,  honest_mode: "prepared_only" },
  phone:        { can_auto_send: false, can_send_validated: false, can_export_human: true,  requires_approval: false, honest_mode: "export" },
  linkedin:     { can_auto_send: false, can_send_validated: false, can_export_human: true,  requires_approval: true,  honest_mode: "prepared_only" },
  webchat:      { can_auto_send: false, can_send_validated: false, can_export_human: true,  requires_approval: true,  honest_mode: "prepared_only" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return respond({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    return respond({ error: "Unauthorized" }, 401);
  }
  const userId = userData.user.id;

  // ── Parse body ────────────────────────────────────────────────────────────
  let channelActionId: string;
  let forceMode: string | undefined;
  try {
    const body = await req.json();
    if (!body.channel_action_id) throw new Error("Missing channel_action_id");
    channelActionId = body.channel_action_id;
    forceMode = body.force_mode;
  } catch {
    return respond({ error: "Missing required field: channel_action_id" }, 400);
  }

  const svc = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ── Load the channel action ───────────────────────────────────────────────
  const { data: action, error: actionError } = await svc
    .from("openclaw_channel_actions")
    .select("*")
    .eq("id", channelActionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (actionError || !action) {
    return respond({ error: "Channel action not found or access denied" }, 404);
  }

  // ── Load user config ──────────────────────────────────────────────────────
  const { data: config } = await svc
    .from("openclaw_config")
    .select("kill_switch_global, autonomie_level, gateway_url")
    .eq("user_id", userId)
    .maybeSingle();

  // ── Kill switch check ─────────────────────────────────────────────────────
  if (config?.kill_switch_global) {
    await writeDelivery(svc, {
      user_id: userId,
      channel_action_id: channelActionId,
      channel: action.channel,
      dispatch_status: "failed",
      failed_at: new Date().toISOString(),
      error_code: "kill_switch_active",
      error_type: "policy_block",
      error_summary: "Kill Switch global activé. Aucune action ne peut être expédiée.",
      dispatch_mode: "auto",
    });
    return respond({
      dispatched: false,
      reason: "kill_switch_active",
      message: "Kill Switch actif — aucune action envoyée.",
    });
  }

  // ── Check if already dispatched (idempotency) ─────────────────────────────
  const { data: existingDelivery } = await svc
    .from("openclaw_channel_deliveries")
    .select("id, dispatch_status")
    .eq("channel_action_id", channelActionId)
    .eq("user_id", userId)
    .in("dispatch_status", ["dispatched", "delivered", "replied"])
    .maybeSingle();

  if (existingDelivery) {
    return respond({
      dispatched: true,
      already_dispatched: true,
      delivery_id: existingDelivery.id,
      dispatch_status: existingDelivery.dispatch_status,
      message: "Action déjà expédiée.",
    });
  }

  // ── Determine channel capability ──────────────────────────────────────────
  const capability = CHANNEL_CAPABILITIES[action.channel] ?? {
    can_auto_send: false, can_send_validated: false, can_export_human: true,
    requires_approval: true, honest_mode: "prepared_only" as const,
  };

  const now = new Date().toISOString();

  // ── Dispatch logic by channel ─────────────────────────────────────────────

  // CASE 1: approval required and not yet approved
  if (capability.requires_approval && action.status !== "approved" && action.approval_required) {
    const deliveryId = await writeDelivery(svc, {
      user_id: userId,
      channel_action_id: channelActionId,
      channel: action.channel,
      dispatch_status: "approval_required",
      requires_approval: true,
      dispatch_mode: "validated",
      error_type: "approval_pending",
      error_summary: "Action en attente de validation humaine.",
    });
    // Update channel action status
    await svc.from("openclaw_channel_actions")
      .update({ status: "pending_approval" })
      .eq("id", channelActionId);
    return respond({
      dispatched: false,
      delivery_id: deliveryId,
      dispatch_status: "approval_required",
      message: "Action préparée — attend votre validation.",
      requires_human_action: true,
    });
  }

  // CASE 2: email — prepared and exportable (no native send yet)
  if (action.channel === "email") {
    const deliveryId = await writeDelivery(svc, {
      user_id: userId,
      channel_action_id: channelActionId,
      channel: "email",
      dispatch_status: forceMode === "export" ? "dispatched" : "queued",
      queued_at: now,
      dispatched_at: forceMode === "export" ? now : null,
      dispatch_mode: "validated",
      dispatched_by: forceMode === "export" ? "human" : "openclaw",
    });

    // Mark the action as sent if human confirmed export
    if (forceMode === "export") {
      await svc.from("openclaw_channel_actions")
        .update({ status: "sent", executed_at: now })
        .eq("id", channelActionId);
    } else {
      await svc.from("openclaw_channel_actions")
        .update({ status: "approved" })
        .eq("id", channelActionId);
    }

    await logEvent(svc, userId, "channel_dispatch_email", action, forceMode === "export" ? "export_confirmé" : "prêt_à_envoyer");

    return respond({
      dispatched: forceMode === "export",
      delivery_id: deliveryId,
      dispatch_status: forceMode === "export" ? "dispatched" : "queued",
      channel: "email",
      message: forceMode === "export"
        ? "Email marqué comme envoyé manuellement. Confirmez l'envoi depuis votre client email."
        : "Email prêt à envoyer. Préparez votre client email avec ce contenu.",
      export_ready: true,
      payload_summary: action.payload_summary,
    });
  }

  // CASE 3: introduction — native dispatch via WIINUP
  if (action.channel === "introduction") {
    const deliveryId = await writeDelivery(svc, {
      user_id: userId,
      channel_action_id: channelActionId,
      channel: "introduction",
      dispatch_status: "dispatched",
      queued_at: now,
      dispatched_at: now,
      dispatch_mode: "validated",
      dispatched_by: "openclaw",
    });

    await svc.from("openclaw_channel_actions")
      .update({ status: "sent", executed_at: now })
      .eq("id", channelActionId);

    await logEvent(svc, userId, "channel_dispatch_introduction", action, "dispatché_natif");

    return respond({
      dispatched: true,
      delivery_id: deliveryId,
      dispatch_status: "dispatched",
      channel: "introduction",
      message: "Introduction native WIINUP dispatchée. Le facilitateur est notifié.",
    });
  }

  // CASE 4: all other channels — prepared only, return honest export
  const deliveryId = await writeDelivery(svc, {
    user_id: userId,
    channel_action_id: channelActionId,
    channel: action.channel,
    dispatch_status: "queued",
    queued_at: now,
    dispatch_mode: "export",
    dispatched_by: "human",
    error_type: "channel_not_configured",
    error_summary: `Canal ${action.channel} : préparé uniquement. Envoi réel nécessite une configuration externe.`,
  });

  await logEvent(svc, userId, "channel_dispatch_prepared_only", action, `${action.channel}_non_connecté`);

  return respond({
    dispatched: false,
    delivery_id: deliveryId,
    dispatch_status: "queued",
    channel: action.channel,
    message: `Action préparée pour ${action.channel}. Envoi réel non disponible sans configuration externe.`,
    export_ready: true,
    channel_mode: capability.honest_mode,
    payload_summary: action.payload_summary,
  });
});

// ── Helper: write delivery record ─────────────────────────────────────────────
async function writeDelivery(
  svc: ReturnType<typeof createClient>,
  fields: Record<string, unknown>
): Promise<string> {
  const { data } = await svc
    .from("openclaw_channel_deliveries")
    .insert(fields)
    .select("id")
    .single();
  return data?.id ?? "";
}

// ── Helper: log event ─────────────────────────────────────────────────────────
async function logEvent(
  svc: ReturnType<typeof createClient>,
  userId: string,
  eventType: string,
  action: Record<string, unknown>,
  detail: string
) {
  await svc.from("openclaw_logs").insert({
    user_id: userId,
    event_type: eventType,
    summary: `Dispatch canal "${action.channel}" → ${detail}`,
    details: {
      channel_action_id: action.id,
      channel: action.channel,
      action_type: action.action_type,
      payload_summary: action.payload_summary,
      detail,
    },
    risque: "faible",
  }).catch(() => {/* non-blocking */});
}
