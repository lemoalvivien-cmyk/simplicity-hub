import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const PRICE_LAUNCH = Deno.env.get("STRIPE_PRICE_LAUNCH") ?? "price_1T8GOWEG497aCUFxjNjFjk4t";
const LAUNCH_SLOTS = 100;

const ALLOWED_ORIGINS = [
  "https://wiinupmax.com",
  "https://wiinupmax.lovable.app",
  "https://id-preview--7ccca0da-8e02-461c-8a27-4774fed14e51.lovable.app",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const isLocal = origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1");
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) || isLocal ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }


  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

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

    // Determine safe origin
    const origin = req.headers.get("origin") ?? "";
    const safeOrigin = ALLOWED_ORIGINS.includes(origin)
      ? origin
      : "http://localhost:5173";

    // Read quota for marketing display only — price is ALWAYS PRICE_LAUNCH
    const { data: quotaData } = await supabase
      .from("launch_quota")
      .select("used_slots, total_slots")
      .limit(1)
      .maybeSingle();

    const usedSlots = quotaData?.used_slots ?? 0;
    const totalSlots = quotaData?.total_slots ?? LAUNCH_SLOTS;

    // Prix TOUJOURS 99€/an — la quota sert uniquement à l'affichage marketing
    const selectedPriceId = PRICE_LAUNCH;
    const offerType = "launch";

    logStep("Offer type determined", { offerType, usedSlots, totalSlots, selectedPriceId });

    // Check existing customer
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      line_items: [{ price: selectedPriceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${safeOrigin}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}&offer=${offerType}`,
      cancel_url: `${safeOrigin}/checkout?canceled=true`,
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
