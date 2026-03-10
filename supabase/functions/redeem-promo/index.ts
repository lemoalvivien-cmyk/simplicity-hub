
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[REDEEM-PROMO] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Check role — only entreprise role can redeem promo codes for platform access
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "facilitateur") {
      return new Response(
        JSON.stringify({ valid: false, message: "Les apporteurs d'affaires ont un accès gratuit permanent. Ce code n'est pas nécessaire." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const body = await req.json();
    const { code } = body;
    if (!code || typeof code !== "string") {
      throw new Error("Code manquant");
    }

    const codeUpper = code.trim().toUpperCase();
    logStep("Looking up code", { code: codeUpper });

    // Fetch promo code
    const { data: promoCode, error: promoError } = await supabaseAdmin
      .from("promo_codes")
      .select("*")
      .eq("code", codeUpper)
      .maybeSingle();

    if (promoError || !promoCode) {
      logStep("Code not found", { code: codeUpper });
      return new Response(
        JSON.stringify({ valid: false, message: "Ce code n'existe pas." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Status checks
    if (promoCode.status === "utilisé") {
      logStep("Code already used", { code: codeUpper });
      return new Response(
        JSON.stringify({ valid: false, message: "Ce code a déjà été utilisé." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    if (promoCode.status === "désactivé") {
      logStep("Code disabled", { code: codeUpper });
      return new Response(
        JSON.stringify({ valid: false, message: "Ce code n'est plus actif." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    if (promoCode.status === "expiré") {
      logStep("Code expired (status)", { code: codeUpper });
      return new Response(
        JSON.stringify({ valid: false, message: "Ce code a expiré." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      // Mark as expired
      await supabaseAdmin
        .from("promo_codes")
        .update({ status: "expiré" })
        .eq("id", promoCode.id);
      logStep("Code expired (date)", { code: codeUpper, expires_at: promoCode.expires_at });
      return new Response(
        JSON.stringify({ valid: false, message: "Ce code a expiré." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check if user already redeemed a code
    const { data: existingRedemption } = await supabaseAdmin
      .from("promo_code_redemptions")
      .select("id, end_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (existingRedemption) {
      const endDate = new Date(existingRedemption.end_at).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric"
      });
      return new Response(
        JSON.stringify({ valid: false, message: `Vous avez déjà un accès gratuit actif jusqu'au ${endDate}.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // All good — redeem
    const now = new Date();
    const endAt = new Date(now);
    endAt.setMonth(endAt.getMonth() + (promoCode.duration_months || 12));

    // Create redemption record
    const { error: redemptionError } = await supabaseAdmin.from("promo_code_redemptions").insert({
      promo_code_id: promoCode.id,
      user_id: user.id,
      start_at: now.toISOString(),
      end_at: endAt.toISOString(),
      status: "active",
    });

    if (redemptionError) {
      logStep("Redemption insert error", redemptionError);
      throw redemptionError;
    }

    // Mark promo code as used if usage_unique
    if (promoCode.usage_unique) {
      await supabaseAdmin
        .from("promo_codes")
        .update({
          status: "utilisé",
          used_by: user.id,
          used_at: now.toISOString(),
        })
        .eq("id", promoCode.id);
    }

    // Sync to subscriptions table — NO Stripe involvement
    await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: user.id,
        status: "promo_active",
        current_period_start: now.toISOString(),
        current_period_end: endAt.toISOString(),
        updated_at: now.toISOString(),
        offer_type: "promo",
        // Explicitly clear any Stripe refs so it's clean
        stripe_customer_id: null,
        stripe_subscription_id: null,
        stripe_price_id: null,
        cancel_at_period_end: false,
      },
      { onConflict: "user_id" }
    );

    logStep("Promo redeemed successfully", {
      userId: user.id,
      code: codeUpper,
      endAt: endAt.toISOString()
    });

    const endDateFormatted = endAt.toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric"
    });

    return new Response(
      JSON.stringify({
        valid: true,
        message: `Votre accès gratuit de 12 mois est activé. Il est valable jusqu'au ${endDateFormatted}.`,
        end_at: endAt.toISOString(),
        duration_months: promoCode.duration_months,
        access_type: "promo",
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
