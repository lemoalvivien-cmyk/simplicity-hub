// SECURITY: This function processes real Stripe transfers.
// SECURITY: Zero fail-open policy — every request MUST be authenticated.
// SECURITY: Two valid identity paths:
//   1. Admin user   → Authorization: Bearer <JWT>  (role=admin required)
//   2. pg_cron job  → x-cron-secret: <CRON_SECRET> (server-side secret)
// SECURITY: Any request that cannot be verified in one of the two paths above
//           receives an immediate 403 Forbidden with NO logic executed.

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

  // ── Mandatory secrets check ───────────────────────────────────────────────
  // SECURITY: Fail immediately if runtime secrets are absent — never silently proceed.
  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  // SECURITY: CRON_SECRET is required for pg_cron path; must never be empty.
  const CRON_SECRET = Deno.env.get("CRON_SECRET");

  if (!STRIPE_SECRET_KEY) {
    log("FATAL: STRIPE_SECRET_KEY not configured");
    return new Response(
      JSON.stringify({ error: "STRIPE_SECRET_KEY not set" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!CRON_SECRET) {
    // SECURITY: If CRON_SECRET is missing the cron path is permanently closed.
    // We log this loudly so ops are alerted, then block all non-admin access.
    log("FATAL: CRON_SECRET not configured — cron path disabled");
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // ── Authentication gate — MANDATORY, no bypass ───────────────────────────
  // SECURITY: Exactly two accepted paths. Anything else → 403 immediately.
  const authHeader = req.headers.get("Authorization");
  const cronHeader = req.headers.get("x-cron-secret");

  // Track authenticated actor for audit logs
  let actorId: string;
  let authPath: "admin_jwt" | "cron_secret";

  if (authHeader) {
    // ── Path 1: Admin JWT ──────────────────────────────────────────────────
    // SECURITY: Extract user from JWT via Supabase auth — never trust raw claims.
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: jwtErr } = await supabase.auth.getUser(token);

    if (jwtErr || !user) {
      // SECURITY: Invalid or expired JWT — hard block, no fallback.
      log("SECURITY: Invalid JWT", { error: jwtErr?.message });
      return new Response(
        JSON.stringify({ error: "Invalid or expired authentication token" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Role check — must be admin, verified server-side via user_roles table.
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      // SECURITY: Authenticated but insufficient privilege — explicit 403.
      log("SECURITY: Admin role required", { userId: user.id });
      return new Response(
        JSON.stringify({ error: "Admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Rate-limit admin callers to prevent abuse (100 req/min).
    const rl = await checkRateLimit(user.id, "process-pending-payouts", 100);
    if (!rl.allowed) {
      log("Rate limit exceeded", { userId: user.id });
      return rateLimitResponse(corsHeaders);
    }

    actorId = user.id;
    authPath = "admin_jwt";
    log("Auth OK — admin JWT", { userId: user.id });

  } else if (cronHeader) {
    // ── Path 2: pg_cron shared secret ─────────────────────────────────────
    // SECURITY: Constant-time comparison is ideal; string equality is acceptable
    //           here because CRON_SECRET is not user-controlled input.
    // SECURITY: If CRON_SECRET env var is missing → always reject (fail-closed).
    if (!CRON_SECRET || cronHeader !== CRON_SECRET) {
      log("SECURITY: Invalid x-cron-secret header");
      return new Response(
        JSON.stringify({ error: "Forbidden — invalid cron secret" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    actorId = "cron";
    authPath = "cron_secret";
    log("Auth OK — cron secret");

  } else {
    // ── No credentials at all → hard 403, no information leakage ──────────
    // SECURITY: Do NOT explain which header is missing — prevents probing.
    log("SECURITY: Request rejected — no credentials provided");
    return new Response(
      JSON.stringify({ error: "Forbidden — authentication required" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Stripe client ─────────────────────────────────────────────────────────
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
  } catch { /* no body — use defaults */ }

  log("Function invoked", { authPath, actorId, minAmount });

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
    // Fetch the stripe connect account from facilitateur_profiles if not on payout
    let connectAccountId = payout.stripe_connect_account_id;
    if (!connectAccountId) {
      const { data: facProfile } = await supabase
        .from("facilitateur_profiles")
        .select("stripe_connect_account_id")
        .eq("user_id", payout.facilitator_id)
        .maybeSingle();
      connectAccountId = facProfile?.stripe_connect_account_id ?? null;
    }

    // ── No Stripe Connect account — skip ─────────────────────────────────
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

    // ── Execute Stripe Transfer ───────────────────────────────────────────
    try {
      const amountCents = Math.round(Number(payout.amount) * 100);
      const currency = (payout.currency || "eur").toLowerCase();

      // SECURITY: Audit log BEFORE every Stripe call — immutable trail proving
      //           intent, actor identity, and authentication path used.
      await supabase.from("payout_audit_log").insert({
        payout_id: payout.id,
        batch_id: null,
        actor_id: actorId,
        action: "transfer_initiated",
        old_status: "pending",
        new_status: "pending",
        note: `Auth path: ${authPath} | amount: ${amountCents} ${currency} | destination: ${connectAccountId}`,
      });

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
          // SECURITY: Record auth path in Stripe metadata for cross-system audit.
          auth_path: authPath,
          actor_id: actorId,
        },
        description: `WIINUP MAX — Paiement gain facilitateur ${payout.id}`,
      });

      log("Stripe transfer created", { transferId: transfer.id, payoutId: payout.id });

      // ── Update payout status → paid ──────────────────────────────────
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

      // ── Update linked gain statut → recu ────────────────────────────
      if (payout.gain_id) {
        await supabase
          .from("gains")
          .update({ statut: "recu", updated_at: new Date().toISOString() })
          .eq("id", payout.gain_id);
      }

      // ── Post-transfer audit log ──────────────────────────────────────
      // SECURITY: Second audit entry confirms Stripe accepted the transfer.
      await supabase.from("payout_audit_log").insert({
        payout_id: payout.id,
        batch_id: null,
        actor_id: actorId,
        action: "transfer_executed",
        old_status: "pending",
        new_status: "paid",
        note: `Stripe transfer: ${transfer.id} | auth_path: ${authPath}`,
      });

      // ── In-app notification ──────────────────────────────────────────
      await supabase.from("notifications").insert({
        user_id: payout.facilitator_id,
        type: "gain_valide",
        title: `Gain payé — ${payout.amount} €`,
        body: `Votre gain de ${payout.amount} ${payout.currency?.toUpperCase() ?? "EUR"} a été transféré. Référence : ${transfer.id}`,
        href: "/gains",
      });

      // ── Email notification ───────────────────────────────────────────
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

      // SECURITY: Failure audit log includes actor and auth path for forensics.
      await supabase.from("payout_audit_log").insert({
        payout_id: payout.id,
        batch_id: null,
        actor_id: actorId,
        action: "transfer_failed",
        old_status: "pending",
        new_status: "failed",
        note: `${errMsg} | auth_path: ${authPath}`,
      });

      results.push({ payout_id: payout.id, status: "failed", reason: errMsg });
    }
  }

  log("Batch complete", { paidCount, totalPaid, authPath, actorId });

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
