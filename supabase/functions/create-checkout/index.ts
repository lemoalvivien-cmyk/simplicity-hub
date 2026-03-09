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

/**
 * Origin allowlist strategy:
 *
 * PRIMARY (env var): ALLOWED_EXTRA_ORIGINS — comma-separated list injected at
 *   deploy time via Supabase secrets. Add new preview/custom domains there
 *   without touching code. Example value:
 *     "https://staging.wiinup.com,https://other-preview.lovable.app"
 *
 * BUILT-IN (immutable prod domains): always accepted regardless of env var.
 *
 * LOCALHOST: accepted only when DENO_DEPLOYMENT_ID is absent (local Deno / CI).
 *   Edge Runtime always sets this env var in deployed functions.
 *
 * DEFAULT FALLBACK: if origin header is missing, use CANONICAL_ORIGIN.
 *   This keeps server-side calls working without an Origin header.
 */
const CANONICAL_ORIGIN = "https://wiinupmax.com";

// Hard-coded prod domains — never deleted from allowlist.
// POLICY: Lovable preview origins (*.lovable.app) are NOT hardcoded here.
//   They must be added via the ALLOWED_EXTRA_ORIGINS secret (Lovable Cloud > Secrets):
//     ALLOWED_EXTRA_ORIGINS=https://wiinupmax.lovable.app,https://id-preview--7ccca0da-8e02-461c-8a27-4774fed14e51.lovable.app
//   This keeps the production function code free of transient preview domains.
//   Reason: preview URLs can change between Lovable redeployments; secrets can be updated without code changes.
const BUILTIN_ORIGINS = new Set([
  "https://wiinupmax.com", // CANONICAL — production only
]);

function buildAllowedOrigins(): Set<string> {
  const set = new Set(BUILTIN_ORIGINS);
  // Extra origins injected via secret (no code change needed for new domains)
  const extra = Deno.env.get("ALLOWED_EXTRA_ORIGINS") ?? "";
  for (const o of extra.split(",").map((s) => s.trim()).filter(Boolean)) {
    set.add(o);
  }
  return set;
}

function resolveOrigin(requestedOrigin: string | null): string {
  if (!requestedOrigin) return CANONICAL_ORIGIN;

  // Allow localhost only in non-deployed environment (CI, local dev)
  const isDeployed = !!Deno.env.get("DENO_DEPLOYMENT_ID");
  if (!isDeployed && (
    requestedOrigin.startsWith("http://localhost") ||
    requestedOrigin.startsWith("http://127.0.0.1")
  )) {
    return requestedOrigin;
  }

  const allowed = buildAllowedOrigins();
  if (allowed.has(requestedOrigin)) return requestedOrigin;

  // Origin not in allowlist — signal rejection to caller
  return "";
}

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

    // TASK a74d936b: Validate origin before doing any work
    const requestedOrigin = req.headers.get("origin");
    const safeOrigin = resolveOrigin(requestedOrigin);
    if (!safeOrigin) {
      logStep("REJECTED: origin not in allowlist", { origin: requestedOrigin });
      return new Response(
        JSON.stringify({ error: "Origin not authorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    logStep("Origin validated", { origin: safeOrigin });

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

    // safeOrigin is now guaranteed to be in the allowlist (or localhost in dev)
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
