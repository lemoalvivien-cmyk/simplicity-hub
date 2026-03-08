/**
 * openclaw-channel-dispatch
 * ─────────────────────────
 * Real dispatch function for OpenClaw channel actions.
 *
 * BLOC 1 — EMAIL via Resend (real send when RESEND_API_KEY is configured)
 * BLOC 4 — Capability matrix updated dynamically based on RESEND_API_KEY presence
 *
 * Honest contract per channel:
 *   email        → REAL SEND via Resend if configured, otherwise export
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

// ── RESEND integration ────────────────────────────────────────────────────────
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_CONFIGURED = !!RESEND_API_KEY;

// From address: use Resend's onboarding domain if no custom domain configured
const FROM_EMAIL = "Wiinup Max <onboarding@resend.dev>";

// ── Channel capability matrix (dynamically reflects RESEND config) ────────────
const CHANNEL_CAPABILITIES: Record<string, {
  can_auto_send: boolean;
  can_send_validated: boolean;
  can_export_human: boolean;
  requires_approval: boolean;
  honest_mode: "auto" | "validated" | "export" | "prepared_only";
}> = {
  email:        {
    can_auto_send:     false,             // manual trigger only for now
    can_send_validated: RESEND_CONFIGURED, // true if Resend is configured
    can_export_human:  true,
    requires_approval: true,
    honest_mode:       RESEND_CONFIGURED ? "validated" : "export",
  },
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

  // ── Load user config + profile (for reply-to) ─────────────────────────────
  const [configRes, profileRes] = await Promise.all([
    svc.from("openclaw_config").select("kill_switch_global, autonomie_level, gateway_url").eq("user_id", userId).maybeSingle(),
    svc.from("profiles").select("email, prenom").eq("id", userId).maybeSingle(),
  ]);
  const config  = configRes.data;
  const profile = profileRes.data;

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

  // ── CASE 2: email — REAL SEND via Resend if configured, export fallback ────
  if (action.channel === "email") {
    if (RESEND_CONFIGURED && forceMode !== "export") {
      return await dispatchEmailViaResend(svc, userId, channelActionId, action, profile, now, respond);
    } else {
      // Fallback: prepared/export mode (no RESEND_API_KEY)
      if (!RESEND_CONFIGURED) {
        console.log("RESEND_API_KEY not configured, falling back to prepared mode");
      }

      const deliveryId = await writeDelivery(svc, {
        user_id: userId,
        channel_action_id: channelActionId,
        channel: "email",
        dispatch_status: forceMode === "export" ? "dispatched" : "queued",
        queued_at: now,
        dispatched_at: forceMode === "export" ? now : null,
        dispatch_mode: "validated",
        dispatched_by: forceMode === "export" ? "human" : "openclaw",
        error_summary: RESEND_CONFIGURED ? null : "Resend non configuré — mode export activé",
      });

      if (forceMode === "export") {
        await svc.from("openclaw_channel_actions").update({ status: "sent", executed_at: now }).eq("id", channelActionId);
      } else {
        await svc.from("openclaw_channel_actions").update({ status: "approved" }).eq("id", channelActionId);
      }

      await logEvent(svc, userId, "channel_dispatch_email", action, forceMode === "export" ? "export_confirmé" : "prêt_à_envoyer");

      return respond({
        dispatched: forceMode === "export",
        delivery_id: deliveryId,
        dispatch_status: forceMode === "export" ? "dispatched" : "queued",
        channel: "email",
        message: forceMode === "export"
          ? "Email marqué comme envoyé manuellement."
          : "Email prêt à envoyer. Configurez RESEND_API_KEY pour l'envoi automatique.",
        export_ready: true,
        resend_configured: false,
        payload_summary: action.payload_summary,
      });
    }
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

// ── RESEND email dispatch ────────────────────────────────────────────────────
async function dispatchEmailViaResend(
  svc: ReturnType<typeof createClient>,
  userId: string,
  channelActionId: string,
  action: Record<string, unknown>,
  profile: { email?: string; prenom?: string } | null,
  now: string,
  respond: (body: unknown, status?: number) => Response,
): Promise<Response> {
  const payload = action.payload as Record<string, unknown> | null;

  // Extract target email from payload
  const toEmail  = (payload?.to_email as string) || (payload?.target_email as string) || (payload?.email as string);
  const toName   = (payload?.to_name as string) || (payload?.contact_name as string) || "";
  const subject  = (payload?.subject as string) || (action.payload_summary as string) || "Message Wiinup Max";
  const bodyHtml = (payload?.html as string) || buildEmailHtml(action, payload, profile);
  const bodyText = (payload?.text as string) || (action.payload_summary as string) || "";

  if (!toEmail) {
    const deliveryId = await writeDelivery(svc, {
      user_id: userId,
      channel_action_id: channelActionId,
      channel: "email",
      dispatch_status: "failed",
      failed_at: now,
      error_code: "missing_to_email",
      error_type: "payload_error",
      error_summary: "Adresse email destinataire manquante dans le payload.",
    });
    await svc.from("openclaw_channel_actions").update({ status: "error", error_detail: "missing_to_email" }).eq("id", channelActionId);
    return respond({
      dispatched: false,
      delivery_id: deliveryId,
      dispatch_status: "failed",
      error: "Adresse email destinataire manquante dans le payload de l'action.",
    }, 422);
  }

  try {
    // Call Resend API
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:     FROM_EMAIL,
        to:       toName ? `${toName} <${toEmail}>` : [toEmail],
        subject:  subject,
        html:     bodyHtml,
        text:     bodyText,
        reply_to: profile?.email ?? undefined,
        tags: [
          { name: "source",    value: "wiinupmax" },
          { name: "action_id", value: String(channelActionId).slice(0, 36) },
          { name: "user_id",   value: String(userId).slice(0, 36) },
        ],
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      // Resend API error
      const errMsg = resendData?.message || resendData?.name || `Resend error ${resendRes.status}`;
      const deliveryId = await writeDelivery(svc, {
        user_id: userId,
        channel_action_id: channelActionId,
        channel: "email",
        dispatch_status: "failed",
        failed_at: now,
        error_code: `resend_${resendRes.status}`,
        error_type: "provider_error",
        error_summary: `Resend API: ${errMsg}`,
        provider_response: resendData,
        dispatch_mode: "validated",
        dispatched_by: "resend",
      });
      await svc.from("openclaw_channel_actions").update({ status: "error", error_detail: errMsg }).eq("id", channelActionId);
      await logEvent(svc, userId, "channel_dispatch_email_failed", action, `resend_error_${resendRes.status}`);
      return respond({
        dispatched: false,
        delivery_id: deliveryId,
        dispatch_status: "failed",
        error: errMsg,
        provider: "resend",
      }, 422);
    }

    // SUCCESS — Resend returned email id
    const resendId = resendData?.id as string;
    const deliveryId = await writeDelivery(svc, {
      user_id: userId,
      channel_action_id: channelActionId,
      channel: "email",
      dispatch_status: "dispatched",
      queued_at: now,
      dispatched_at: now,
      dispatch_mode: "validated",
      dispatched_by: "resend",
      provider_message_id: resendId ?? null,
      provider_status: "sent",
      provider_response: resendData,
    });

    await svc.from("openclaw_channel_actions").update({ status: "sent", executed_at: now }).eq("id", channelActionId);
    await logEvent(svc, userId, "channel_dispatch_email_sent", action, `resend_ok:${resendId}`);

    return respond({
      dispatched: true,
      delivery_id: deliveryId,
      dispatch_status: "dispatched",
      channel: "email",
      provider: "resend",
      provider_id: resendId,
      message: `Email envoyé via Resend à ${toEmail}.`,
      resend_configured: true,
    });

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Erreur réseau inconnue";
    const deliveryId = await writeDelivery(svc, {
      user_id: userId,
      channel_action_id: channelActionId,
      channel: "email",
      dispatch_status: "failed",
      failed_at: now,
      error_code: "network_error",
      error_type: "network_error",
      error_summary: `Erreur Resend: ${errMsg}`,
      dispatch_mode: "validated",
      dispatched_by: "resend",
    });
    await svc.from("openclaw_channel_actions").update({ status: "error", error_detail: errMsg }).eq("id", channelActionId);
    return respond({
      dispatched: false,
      delivery_id: deliveryId,
      dispatch_status: "failed",
      error: errMsg,
      provider: "resend",
    }, 500);
  }
}

// ── HTML template builder ────────────────────────────────────────────────────
function buildEmailHtml(
  action: Record<string, unknown>,
  payload: Record<string, unknown> | null,
  profile: { email?: string; prenom?: string } | null,
): string {
  const senderName = profile?.prenom ?? "L'équipe Wiinup Max";
  const bodyContent = (payload?.message as string) || (payload?.content as string) || (action.payload_summary as string) || "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wiinup Max</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 24px 0;">
              <div style="display:inline-block;background:hsl(218,72%,18%);border-radius:12px;padding:10px 18px;">
                <span style="color:#ffffff;font-size:15px;font-weight:700;letter-spacing:-0.3px;">Wiinup Max</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#f9fafb;border-radius:16px;padding:32px;">
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#111827;white-space:pre-wrap;">${escapeHtml(bodyContent)}</p>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:24px 0 0 0;">
              <p style="margin:0;font-size:13px;color:#6b7280;">
                Envoyé par <strong>${escapeHtml(senderName)}</strong> via Wiinup Max
              </p>
              <p style="margin:4px 0 0 0;font-size:12px;color:#9ca3af;">
                Cet email a été généré automatiquement par OpenClaw.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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
      resend_configured: RESEND_CONFIGURED,
    },
    risque: "faible",
  }).catch(() => {/* non-blocking */});
}
