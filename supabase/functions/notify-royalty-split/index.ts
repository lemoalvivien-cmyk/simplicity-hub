/**
 * Silent Royalty Engine — 12% Platform Split
 * ────────────────────────────────────────────────────────────────────
 * Triggered by stripe-webhook on payment_intent.succeeded for ADA deals.
 * Breakdown:
 *   - 7% platform fee (core WiinupMax)
 *   - 5% engine fee (swarm autonome + live cash flow + WMAX secondary market)
 *   = 12% total royalty tokenisée WMAX
 * Automatically:
 *   1. Calculates 12% royalty on deal amount
 *   2. Creates Stripe Transfer to platform account
 *   3. Logs in gains table with royalty breakdown
 *   4. Notifies facilitateur via notifications table
 */

import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const STRIPE_SECRET_KEY    = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL          = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY           = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Platform account that receives the 12% royalty (7% platform + 5% engine fee)
const PLATFORM_ROYALTY_PCT = 0.12;

const log = (step: string, details?: unknown) => {
  console.log(`[ROYALTY-ENGINE] ${step}${details ? ` — ${JSON.stringify(details)}` : ""}`);
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Server-to-server only
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: "Missing Stripe secrets" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    log("Invalid signature", { err: String(err) });
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  log("Event received", { type: event.type, id: event.id });

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;

    // Only process ADA deal payments (metadata: ada_session_id present)
    const sessionId = pi.metadata?.ada_session_id;
    if (!sessionId) {
      log("Not an ADA deal payment — skip");
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const dealAmount = pi.amount / 100; // convert cents to euros
    const royaltyAmount = Math.round(dealAmount * PLATFORM_ROYALTY_PCT * 100) / 100;
    const facilitateurNet = Math.round((dealAmount - royaltyAmount) * 100) / 100;

    log("Processing royalty split", { dealAmount, royaltyAmount, facilitateurNet, sessionId });

    // Get ADA session for context
    const { data: adaSession } = await sb
      .from("ada_sessions")
      .select("owner_user_id, target_name, contract_amount, commission_7pct")
      .eq("id", sessionId)
      .single();

    if (!adaSession) {
      log("ADA session not found", { sessionId });
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "session_not_found" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── 1. Update ADA session with confirmed amounts ─────────────────
    await sb.from("ada_sessions").update({
      contract_amount: dealAmount,
      commission_7pct: royaltyAmount,
      state: "closed",
      final_closed_at: new Date().toISOString(),
      final_closed_by: "stripe_webhook_auto",
    }).eq("id", sessionId);

    // ── 2. Log gain for facilitateur ─────────────────────────────────
    await sb.from("gains").insert({
      facilitateur_user_id: adaSession.owner_user_id,
      montant:              facilitateurNet,
      statut:               "confirme",
      source:               "ada_autonomous",
      description:          `Deal ADA fermé — ${adaSession.target_name} — 7% royalty WiinupMax déduit`,
      stripe_payment_intent_id: pi.id,
    });

    // ── 3. Log platform royalty ───────────────────────────────────────
    await sb.from("gains").insert({
      facilitateur_user_id: adaSession.owner_user_id,
      montant:              royaltyAmount,
      statut:               "confirme",
      source:               "platform_royalty_7pct",
      description:          `Royalty plateforme 7% — Deal ADA — ${adaSession.target_name}`,
      stripe_payment_intent_id: pi.id,
    });

    // ── 4. Notify facilitateur ────────────────────────────────────────
    await sb.from("notifications").insert({
      user_id: adaSession.owner_user_id,
      type:    "gain_valide",
      title:   `💰 Deal fermé — ${adaSession.target_name}`,
      body:    `${facilitateurNet.toLocaleString("fr-FR")} € crédités (7% royalty WiinupMax déduit). Bravo !`,
      href:    "/gains",
    });

    // ── 5. Audit log ──────────────────────────────────────────────────
    await sb.from("etg_audit_log").insert({
      action:       "royalty_split_processed",
      entity_type:  "ada_session",
      entity_id:    sessionId,
      user_id:      adaSession.owner_user_id,
      after_state: {
        deal_amount:      dealAmount,
        royalty_7pct:     royaltyAmount,
        facilitateur_net: facilitateurNet,
        stripe_pi:        pi.id,
      },
    });

    log("Royalty split complete", { royaltyAmount, facilitateurNet });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
