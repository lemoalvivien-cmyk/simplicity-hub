import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

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

    // Check promo code redemption first
    const now = new Date().toISOString();
    const { data: redemption } = await supabase
      .from("promo_code_redemptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gt("end_at", now)
      .maybeSingle();

    if (redemption) {
      logStep("Active promo redemption found", { end_at: redemption.end_at });
      return new Response(
        JSON.stringify({
          subscribed: true,
          status: "promo_active",
          subscription_end: redemption.end_at,
          access_type: "promo",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check Stripe subscription
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found");
      // Update subscription table
      await supabase.from("subscriptions").upsert(
        { user_id: user.id, status: "none", updated_at: now },
        { onConflict: "user_id" }
      );
      return new Response(
        JSON.stringify({ subscribed: false, status: "none", access_type: "none" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Customer found", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      expand: ["data.default_payment_method"],
    });

    if (subscriptions.data.length === 0) {
      await supabase.from("subscriptions").upsert(
        {
          user_id: user.id,
          stripe_customer_id: customerId,
          status: "none",
          updated_at: now,
        },
        { onConflict: "user_id" }
      );
      return new Response(
        JSON.stringify({ subscribed: false, status: "none", access_type: "none" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const sub = subscriptions.data[0];
    const isActive = sub.status === "active" || sub.status === "trialing";
    const subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();

    // Sync to database
    await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        stripe_price_id: sub.items.data[0]?.price.id,
        status: sub.status,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: subscriptionEnd,
        cancel_at_period_end: sub.cancel_at_period_end,
        updated_at: now,
      },
      { onConflict: "user_id" }
    );

    logStep("Subscription found", { status: sub.status, end: subscriptionEnd });

    return new Response(
      JSON.stringify({
        subscribed: isActive,
        status: sub.status,
        subscription_end: subscriptionEnd,
        cancel_at_period_end: sub.cancel_at_period_end,
        access_type: "stripe",
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
