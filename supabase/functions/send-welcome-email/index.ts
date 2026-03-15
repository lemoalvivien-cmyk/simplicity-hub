/**
 * send-welcome-email
 * ─────────────────────────────────────────────────────────────────────────────
 * Triggered by DB hook (auth.users INSERT via profiles trigger) after a new
 * user confirms their account. Sends a branded welcome email via Resend.
 *
 * POST body: { user_id: string, email: string, prenom?: string }
 *
 * SECURITY: Internal function called by pg_net (DB trigger).
 * Requires x-internal-secret header matching INTERNAL_FUNCTION_SECRET env var.
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { sendWelcomeEmail } from "../_shared/emailNotifications.ts";

const SUPABASE_URL    = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// SECURITY: Shared secret for internal pg_net → edge function calls.
const INTERNAL_SECRET = Deno.env.get("INTERNAL_FUNCTION_SECRET") ?? "";

const log = (step: string, d?: unknown) =>
  console.log(`[send-welcome-email] ${step}${d ? " — " + JSON.stringify(d) : ""}`);

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // ── SECURITY: Internal secret validation — fail-closed ────────────────────
  // If INTERNAL_FUNCTION_SECRET not configured, reject all calls (misconfiguration).
  if (!INTERNAL_SECRET || INTERNAL_SECRET.trim().length < 16) {
    console.error("[send-welcome-email] SECURITY: INTERNAL_FUNCTION_SECRET not configured — fail-closed");
    return new Response(JSON.stringify({ error: "Internal endpoint not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const callerSecret = req.headers.get("x-internal-secret");
  if (!callerSecret || callerSecret !== INTERNAL_SECRET) {
    console.warn("[send-welcome-email] SECURITY: Invalid or missing x-internal-secret — rejected");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId: string | null  = body.user_id ?? null;
    const email: string | null   = body.email ?? null;
    const prenom: string         = body.prenom ?? "là";

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: "user_id and email required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // De-duplicate: check if welcome was already sent
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const { data: existing } = await sb
      .from("analytics_events")
      .select("id")
      .eq("user_id", userId)
      .eq("event_type", "welcome_email_sent")
      .maybeSingle();

    if (existing) {
      log("Already sent — skipping", { userId });
      return new Response(
        JSON.stringify({ skipped: true, reason: "already_sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailSent = await sendWelcomeEmail({ to: email, prenom });
    log("Welcome email sent", { to: email, success: emailSent });

    // Track event
    if (emailSent) {
      await sb.from("analytics_events").insert({
        user_id: userId,
        event_type: "welcome_email_sent",
        session_id: `welcome_${userId}`,
        properties: { email, prenom },
      }).catch(() => null);
    }

    return new Response(
      JSON.stringify({ success: true, email_sent: emailSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", { msg });
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
