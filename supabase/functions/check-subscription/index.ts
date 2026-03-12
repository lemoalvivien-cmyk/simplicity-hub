import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

const LAUNCH_PRICE_ID = "price_1T8GOWEG497aCUFxjNjFjk4t";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    // ── 1. Check profile role ─────────────────────────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "facilitateur" || profile?.role === "admin") {
      logStep("Free role detected", { role: profile.role });
      return new Response(
        JSON.stringify({
          subscribed: true,
          status: "active",
          subscription_end: null,
          access_type: "free",
          offer_type: null,
          launch_available: true,
          launch_slots_remaining: 100,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const now = new Date().toISOString();

    // ── 2. Check active promo redemption ─────────────────────────────────
    const { data: redemption } = await supabase
      .from("promo_code_redemptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gt("end_at", now)
      .maybeSingle();

    if (redemption) {
      logStep("Active promo redemption found", { end_at: redemption.end_at });
      await supabase.from("subscriptions").upsert(
        {
          user_id: user.id,
          status: "promo_active",
          current_period_start: redemption.start_at,
          current_period_end: redemption.end_at,
          offer_type: "promo",
          cancel_at_period_end: false,
          updated_at: now,
        },
        { onConflict: "user_id" }
      );
      return new Response(
        JSON.stringify({
          subscribed: true,
          status: "promo_active",
          subscription_end: redemption.end_at,
          access_type: "promo",
          offer_type: "promo",
          cancel_at_period_end: false,
          launch_available: true,
          launch_slots_remaining: 100,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── 3. DB-first: read subscriptions table (webhook already synced it) ──
    //    This avoids a round-trip to Stripe on every check after a webhook.
    const { data: dbSub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const ACTIVE_STATUSES = ["active", "trialing"];

    if (dbSub && ACTIVE_STATUSES.includes(dbSub.status)) {
      logStep("Active subscription found in DB", { status: dbSub.status, sub_id: dbSub.stripe_subscription_id });

      const offerType = dbSub.stripe_price_id === LAUNCH_PRICE_ID ? "launch" : (dbSub.offer_type ?? "standard");

      // Still fetch quota for display
      const { data: quota } = await supabase
        .from("launch_quota")
        .select("used_slots, total_slots")
        .limit(1)
        .maybeSingle();
      const remaining = Math.max(0, (quota?.total_slots ?? 100) - (quota?.used_slots ?? 0));

      return new Response(
        JSON.stringify({
          subscribed: true,
          status: dbSub.status,
          subscription_end: dbSub.current_period_end,
          cancel_at_period_end: dbSub.cancel_at_period_end ?? false,
          access_type: "stripe",
          offer_type: offerType,
          launch_available: remaining > 0,
          launch_slots_remaining: remaining,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── 4. Fallback: verify live with Stripe (catches webhook delays) ─────
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("No Stripe key — returning DB state");
      const statusVal = dbSub?.status ?? "none";
      return new Response(
        JSON.stringify({
          subscribed: false,
          status: statusVal,
          access_type: "none",
          launch_available: true,
          launch_slots_remaining: 100,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      await supabase.from("subscriptions").upsert(
        { user_id: user.id, status: "none", updated_at: now },
        { onConflict: "user_id" }
      );

      const { data: quota } = await supabase
        .from("launch_quota")
        .select("used_slots, total_slots")
        .limit(1)
        .maybeSingle();
      const remaining = Math.max(0, (quota?.total_slots ?? 100) - (quota?.used_slots ?? 0));

      return new Response(
        JSON.stringify({
          subscribed: false,
          status: "none",
          access_type: "none",
          launch_available: remaining > 0,
          launch_slots_remaining: remaining,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Stripe customer found", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      expand: ["data.default_payment_method"],
    });

    const { data: quota } = await supabase
      .from("launch_quota")
      .select("used_slots, total_slots")
      .limit(1)
      .maybeSingle();
    const remaining = Math.max(0, (quota?.total_slots ?? 100) - (quota?.used_slots ?? 0));

    if (subscriptions.data.length === 0) {
      await supabase.from("subscriptions").upsert(
        { user_id: user.id, stripe_customer_id: customerId, status: "none", updated_at: now },
        { onConflict: "user_id" }
      );
      return new Response(
        JSON.stringify({
          subscribed: false,
          status: "none",
          access_type: "none",
          launch_available: remaining > 0,
          launch_slots_remaining: remaining,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const sub = subscriptions.data[0];
    const isActive = sub.status === "active" || sub.status === "trialing";
    const subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
    const priceId = sub.items.data[0]?.price.id;
    const offerType = priceId === LAUNCH_PRICE_ID ? "launch" : "standard";

    // Sync live Stripe data back to DB
    await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        stripe_price_id: priceId,
        status: sub.status,
        offer_type: offerType,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: subscriptionEnd,
        cancel_at_period_end: sub.cancel_at_period_end,
        updated_at: now,
      },
      { onConflict: "user_id" }
    );

    logStep("Stripe subscription found", { status: sub.status, end: subscriptionEnd, offerType });

    return new Response(
      JSON.stringify({
        subscribed: isActive,
        status: sub.status,
        subscription_end: subscriptionEnd,
        cancel_at_period_end: sub.cancel_at_period_end,
        access_type: "stripe",
        offer_type: offerType,
        launch_available: remaining > 0,
        launch_slots_remaining: remaining,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
