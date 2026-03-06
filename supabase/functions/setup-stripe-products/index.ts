import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Create product
    const product = await stripe.products.create({
      name: "WIINUP MAX — Entreprise",
      description: "Accès complet à toutes les fonctionnalités WIINUP MAX. Prospection, missions, introductions, JARVIS IA.",
    });

    // Create price: 29€ TTC / month
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 2900, // 29.00 EUR in cents
      currency: "eur",
      recurring: { interval: "month" },
      nickname: "WIINUP MAX Entreprise 29€/mois",
    });

    return new Response(
      JSON.stringify({ product_id: product.id, price_id: price.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
