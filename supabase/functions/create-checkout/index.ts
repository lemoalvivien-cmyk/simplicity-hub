import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_LAUNCH = "price_1T8GOWEG497aCUFxjNjFjk4t";   // 99€/an — 100 premières entreprises
const PRICE_STANDARD = "price_1T8GR0EG497aCUFxNS9BV3ko"; // 490€/an — tarif standard
const LAUNCH_SLOTS = 100;

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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
    if (userError || !userData.user?.email) {
      throw new Error("User not authenticated");
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Determine which price to use based on launch quota
    const { data: quotaData } = await supabase
      .from("launch_quota")
      .select("total_slots, used_slots")
      .single();

    const usedSlots = quotaData?.used_slots ?? 0;
    const totalSlots = quotaData?.total_slots ?? LAUNCH_SLOTS;
    const isLaunchAvailable = usedSlots < totalSlots;
    const selectedPriceId = isLaunchAvailable ? PRICE_LAUNCH : PRICE_STANDARD;
    const offerType = isLaunchAvailable ? "launch" : "standard";

    logStep("Offer type determined", { offerType, usedSlots, totalSlots, selectedPriceId });

    // Check existing customer
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const origin = req.headers.get("origin") || "https://wiinupmax.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      line_items: [{ price: selectedPriceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}&offer=${offerType}`,
      cancel_url: `${origin}/checkout?canceled=true`,
      metadata: { user_id: user.id, offer_type: offerType },
      subscription_data: { metadata: { user_id: user.id, offer_type: offerType } },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    logStep("Checkout session created", { sessionId: session.id, offerType });

    return new Response(JSON.stringify({ url: session.url, offer_type: offerType }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
