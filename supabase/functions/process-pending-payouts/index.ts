import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";
import { sendGainPayeEmail } from "../_shared/emailNotifications.ts";

const log = (step: string, details?: unknown) => {
  const d = details ? ` — ${JSON.stringify(details)}` : "";
  console.log(`[PROCESS-PAYOUTS] ${step}${d}`);
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  if (!STRIPE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ error: "STRIPE_SECRET_KEY not set" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // ── Auth + Role check ────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  let actorUserId: string | null = null;
  let isCron = false;

  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      actorUserId = user.id;
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleData) {
        return new Response(
          JSON.stringify({ error: "Admin role required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Rate-limit: 100 req/min for admin users ──────────────────────────
      const rl = await checkRateLimit(user.id, "process-pending-payouts", 100);
      if (!rl.allowed) {
        log("Rate limit exceeded", { userId: user.id });
        return rateLimitResponse(corsHeaders);
      }
    } else {
      isCron = true;
    }
  } else {
    isCron = true;
  }

  log("Function invoked", { isCron, actorUserId });

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });

  // Parse optional body: { payout_ids?: string[], min_amount?: number }
  let requestedIds: string[] | null = null;
  let minAmount = 100;
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      const body = await req.json();
      if (Array.isArray(body.payout_ids)) requestedIds = body.payout_ids;
      if (typeof body.min_amount === "number") minAmount = body.min_amount;
    }
  } catch { /* no body */ }

  // ── Fetch pending payouts ─────────────────────────────────────────────────
  let query = supabase
    .from("payouts")
    .select("id, facilitator_id, amount, currency, gain_id, notes, stripe_connect_account_id")
    .eq("status", "pending")
    .gte("amount", minAmount);

  if (requestedIds && requestedIds.length > 0) {
    query = query.in("id", requestedIds);
  }

  const { data: pendingPayouts, error: fetchErr } = await query;

  if (fetchErr) {
    log("Error fetching payouts", fetchErr);
    return new Response(
      JSON.stringify({ error: fetchErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  log("Pending payouts fetched", { count: pendingPayouts?.length ?? 0 });

  const results: Array<{
    payout_id: string;
    status: "paid" | "failed" | "skipped";
    transfer_id?: string;
    reason?: string;
  }> = [];

  let paidCount = 0;
  let totalPaid = 0;

  for (const payout of pendingPayouts ?? []) {
    const connectAccountId =
      payout.stripe_connect_account_id ||
      (payout.facilitateur_profiles as { stripe_connect_account_id: string | null })
        ?.stripe_connect_account_id;

    // ── No Stripe Connect account — skip ───────────────────────────────────
    if (!connectAccountId) {
      log("Skipping payout — no Stripe Connect account", { payoutId: payout.id });

      await supabase.from("payout_audit_log").insert({
        payout_id: payout.id,
        batch_id: null,
        actor_id: payout.facilitator_id,
        action: "skipped_no_connect",
        old_status: "pending",
        new_status: "pending",
        note: "Facilitateur sans compte Stripe Connect configuré — payout différé",
      });

      results.push({
        payout_id: payout.id,
        status: "skipped",
        reason: "no_stripe_connect_account",
      });
      continue;
    }

    // ── Execute Stripe Transfer ────────────────────────────────────────────
    try {
      const amountCents = Math.round(Number(payout.amount) * 100);
      const currency = (payout.currency || "eur").toLowerCase();

      log("Creating Stripe transfer", {
        payoutId: payout.id,
        amountCents,
        currency,
        destination: connectAccountId,
      });

      const transfer = await stripe.transfers.create({
        amount: amountCents,
        currency,
        destination: connectAccountId,
        metadata: {
          payout_id: payout.id,
          gain_id: payout.gain_id ?? "",
          facilitator_id: payout.facilitator_id,
        },
        description: `WIINUP MAX — Paiement gain facilitateur ${payout.id}`,
      });

      log("Stripe transfer created", { transferId: transfer.id, payoutId: payout.id });

      // ── Update payout status → paid ────────────────────────────────────
      await supabase
        .from("payouts")
        .update({
          status: "paid",
          stripe_transfer_id: transfer.id,
          stripe_connect_account_id: connectAccountId,
          paid_at: new Date().toISOString(),
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", payout.id);

      // ── Update linked gain statut → recu ──────────────────────────────
      if (payout.gain_id) {
        await supabase
          .from("gains")
          .update({ statut: "recu", updated_at: new Date().toISOString() })
          .eq("id", payout.gain_id);
      }

      // ── Audit log ──────────────────────────────────────────────────────
      await supabase.from("payout_audit_log").insert({
        payout_id: payout.id,
        batch_id: null,
        actor_id: payout.facilitator_id,
        action: "transfer_executed",
        old_status: "pending",
        new_status: "paid",
        note: `Stripe transfer: ${transfer.id}`,
      });

      // ── In-app notification ────────────────────────────────────────────
      await supabase.from("notifications").insert({
        user_id: payout.facilitator_id,
        type: "gain_valide",
        title: `Gain payé — ${payout.amount} €`,
        body: `Votre gain de ${payout.amount} ${payout.currency?.toUpperCase() ?? "EUR"} a été transféré. Référence : ${transfer.id}`,
        href: "/gains",
      });

      // ── Real email notification via Resend ─────────────────────────────
      // Fetch facilitator email from profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, prenom")
        .eq("id", payout.facilitator_id)
        .maybeSingle();

      if (profile?.email) {
        await sendGainPayeEmail({
          to: profile.email,
          facilitatorName: profile.prenom || "Facilitateur",
          amount: Number(payout.amount),
          currency: payout.currency || "EUR",
          transferId: transfer.id,
          payoutId: payout.id,
        });
        log("Email notification sent", { to: profile.email, transferId: transfer.id });
      }

      results.push({ payout_id: payout.id, status: "paid", transfer_id: transfer.id });
      paidCount++;
      totalPaid += Number(payout.amount);
    } catch (stripeErr) {
      const errMsg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr);
      log("Stripe transfer failed", { payoutId: payout.id, error: errMsg });

      await supabase
        .from("payouts")
        .update({
          status: "failed",
          failure_reason: errMsg,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payout.id);

      await supabase.from("payout_audit_log").insert({
        payout_id: payout.id,
        batch_id: null,
        actor_id: payout.facilitator_id,
        action: "transfer_failed",
        old_status: "pending",
        new_status: "failed",
        note: errMsg,
      });

      results.push({ payout_id: payout.id, status: "failed", reason: errMsg });
    }
  }

  log("Batch complete", { paidCount, totalPaid });

  return new Response(
    JSON.stringify({
      processed: results.length,
      paid: paidCount,
      total_paid_eur: totalPaid,
      skipped: results.filter((r) => r.status === "skipped").length,
      failed: results.filter((r) => r.status === "failed").length,
      results,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
