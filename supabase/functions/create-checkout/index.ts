import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const PRICE_LAUNCH = Deno.env.get("STRIPE_PRICE_LAUNCH") ?? "price_1T8GOWEG497aCUFxjNjFjk4t";
const LAUNCH_SLOTS = 100;

const ALLOWED_ORIGINS = [
  "https://wiinupmax.com",
  "https://wiinupmax.lovable.app",
  "https://id-preview--7ccca0da-8e02-461c-8a27-4774fed14e51.lovable.app",
];

function isOriginAllowed(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow any lovable.app preview subdomain in dev/staging
  if (/^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(origin)) return true;
  // Allow localhost only (never 0.0.0.0 or other bindings)
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (/^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return true;
  return false;
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = isOriginAllowed(origin) ? origin : "null";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

function assertOrigin(req: Request): void {
  const origin = req.headers.get("origin") ?? "";
  // For non-browser server-to-server calls origin may be absent — allow
  if (origin === "") return;
  if (!isOriginAllowed(origin)) {
    throw new Error(`Origin not allowed: ${origin}`);
  }
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

  // Reject requests from non-allowed origins immediately (before any work).
  const origin = req.headers.get("origin") ?? "";
  if (origin !== "" && !isOriginAllowed(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 403,
    });
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
