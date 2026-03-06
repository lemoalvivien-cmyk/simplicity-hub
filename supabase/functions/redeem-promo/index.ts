import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[REDEEM-PROMO] ${step}${detailsStr}`);
};

serve(async (req) => {
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
      return new Response(
        JSON.stringify({ valid: false, message: "Ce code n'existe pas." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Status checks
    if (promoCode.status === "utilisé") {
      return new Response(
        JSON.stringify({ valid: false, message: "Ce code a déjà été utilisé." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    if (promoCode.status === "désactivé") {
      return new Response(
        JSON.stringify({ valid: false, message: "Ce code n'est plus actif." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    if (promoCode.status === "expiré") {
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
      return new Response(
        JSON.stringify({ valid: false, message: "Ce code a expiré." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check if user already redeemed a code
    const { data: existingRedemption } = await supabaseAdmin
      .from("promo_code_redemptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (existingRedemption) {
      return new Response(
        JSON.stringify({ valid: false, message: "Vous avez déjà un accès promo actif." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // All good — redeem
    const now = new Date();
    const endAt = new Date(now);
    endAt.setMonth(endAt.getMonth() + (promoCode.duration_months || 12));

    // Create redemption
    await supabaseAdmin.from("promo_code_redemptions").insert({
      promo_code_id: promoCode.id,
      user_id: user.id,
      start_at: now.toISOString(),
      end_at: endAt.toISOString(),
      status: "active",
    });

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

    // Update subscription record
    await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: user.id,
        status: "promo_active",
        current_period_start: now.toISOString(),
        current_period_end: endAt.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" }
    );

    logStep("Promo redeemed successfully", { userId: user.id, endAt: endAt.toISOString() });

    return new Response(
      JSON.stringify({
        valid: true,
        message: `Code activé ! Votre accès gratuit est valable jusqu'au ${endAt.toLocaleDateString("fr-FR")}.`,
        end_at: endAt.toISOString(),
        duration_months: promoCode.duration_months,
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
