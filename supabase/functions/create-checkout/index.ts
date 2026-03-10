import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_LAUNCH = Deno.env.get("STRIPE_PRICE_LAUNCH") ?? "price_1T8GOWEG497aCUFxjNjFjk4t"; // 99€/an — prix unique
const LAUNCH_SLOTS = 100;
...
    const totalSlots = quotaData?.total_slots ?? LAUNCH_SLOTS;
    const isLaunchAvailable = usedSlots < totalSlots;
    // Prix TOUJOURS 99€/an — la quota sert uniquement à l'affichage marketing des places restantes
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
