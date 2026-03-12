/**
 * notify-gain-paye
 * ─────────────────────────────────────────────────────────────────────────────
 * Sends a real "Gain payé" email via Resend when gains.statut → 'paye'.
 * Triggered by the DB trigger trg_notify_gain_paye via pg_net.
 *
 * POST body: { gain_id: string, facilitateur_id: string, montant: number }
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { sendGainPayeEmail } from "../_shared/emailNotifications.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const log = (step: string, d?: unknown) =>
  console.log(`[notify-gain-paye] ${step}${d ? " — " + JSON.stringify(d) : ""}`);

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  try {
    const body = await req.json().catch(() => ({}));
    const gainId: string | null        = body.gain_id ?? null;
    const facilitateurId: string | null = body.facilitateur_id ?? null;
    const montant: number               = body.montant ?? 0;

    if (!gainId || !facilitateurId) {
      return new Response(
        JSON.stringify({ error: "gain_id and facilitateur_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch gain details (may include payout reference)
    const { data: gain } = await sb
      .from("gains")
      .select("id, montant, source")
      .eq("id", gainId)
      .maybeSingle();

    // Fetch facilitator email + name
    const { data: profile } = await sb
      .from("profiles")
      .select("email, prenom")
      .eq("id", facilitateurId)
      .maybeSingle();

    if (!profile?.email) {
      log("No facilitator email", { facilitateurId });
      return new Response(
        JSON.stringify({ skipped: true, reason: "no_email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailSent = await sendGainPayeEmail({
      to: profile.email,
      facilitatorName: profile.prenom || "Facilitateur",
      amount: gain?.montant ?? montant,
      currency: "EUR",
      transferId: `gain_${gainId.substring(0, 8)}`,
      payoutId: gainId,
    });

    log("Email sent", { to: profile.email, gainId, emailSent });

    // Track event
    await sb.from("analytics_events").insert({
      user_id: facilitateurId,
      event_type: "gain_paye_email_sent",
      session_id: `gain_${gainId}`,
      properties: { gain_id: gainId, montant: gain?.montant ?? montant },
    }).catch(() => null);

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
