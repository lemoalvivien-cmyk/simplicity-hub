// AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : requireAuth obligatoire
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireAuth, unauthorizedResponse } from "../_shared/authGuard.ts";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[REDEEM-PROMO] ${step}${detailsStr}`);
};

/** Always returns 200 with { valid, message } — NEVER trusts client for validation */
Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });

  // AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : requireAuth obligatoire
  let claims: Awaited<ReturnType<typeof requireAuth>>;
  try {
    claims = await requireAuth(req);
  } catch {
    return json({ valid: false, message: "Non authentifié." }, 401);
  }

  try {
    logStep("Function started");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const userId    = claims.sub;
    const userEmail = claims.email ?? "";
    logStep("User authenticated", { userId, email: userEmail });

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // ── 2. Role guard — facilitateurs have permanent free access ──
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "facilitateur") {
      return json({
        valid: false,
        message: "Les apporteurs d'affaires ont un accès gratuit permanent. Ce code n'est pas nécessaire.",
      });
    }

    // ── 3. Parse & sanitize body — code comes from DB, never from client logic ──
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ valid: false, message: "Requête invalide." }, 400);
    }

    const rawCode = body?.code;
    if (!rawCode || typeof rawCode !== "string" || rawCode.trim().length === 0) {
      return json({ valid: false, message: "Code manquant." }, 400);
    }

    const codeUpper = rawCode.trim().toUpperCase().slice(0, 100); // cap length — no injection surface
    logStep("Looking up code", { code: codeUpper });

    // ── 4. Fetch promo code — single source of truth is the DB ──
    const { data: promoCode, error: promoError } = await supabaseAdmin
      .from("promo_codes")
      .select("id, code, status, expires_at, usage_unique, max_uses, duration_months")
      .eq("code", codeUpper)
      .maybeSingle();

    if (promoError) {
      logStep("DB error fetching code", promoError);
      throw promoError;
    }

    if (!promoCode) {
      logStep("Code not found", { code: codeUpper });
      return json({ valid: false, message: "Ce code n'existe pas ou n'est plus valide." });
    }

    // ── 5. Status checks — server owns all validation logic ──
    if (promoCode.status === "utilisé") {
      logStep("Code already fully used", { code: codeUpper });
      return json({ valid: false, message: "Ce code a déjà été utilisé." });
    }
    if (promoCode.status === "désactivé") {
      logStep("Code disabled", { code: codeUpper });
      return json({ valid: false, message: "Ce code n'est plus actif." });
    }
    if (promoCode.status === "expiré") {
      logStep("Code expired (status field)", { code: codeUpper });
      return json({ valid: false, message: "Ce code a expiré." });
    }

    // ── 6. Date expiry check ──
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      await supabaseAdmin
        .from("promo_codes")
        .update({ status: "expiré" })
        .eq("id", promoCode.id);
      logStep("Code expired (date)", { code: codeUpper, expires_at: promoCode.expires_at });
      return json({ valid: false, message: "Ce code a expiré." });
    }

    // ── 7. Max-uses cap (for multi-use codes) ──
    if (promoCode.max_uses !== null && promoCode.max_uses !== undefined) {
      const { count: usageCount, error: countError } = await supabaseAdmin
        .from("promo_code_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("promo_code_id", promoCode.id);

      if (countError) {
        logStep("DB error counting redemptions", countError);
        throw countError;
      }

      if ((usageCount ?? 0) >= promoCode.max_uses) {
        logStep("Code max_uses reached", { code: codeUpper, max_uses: promoCode.max_uses, usageCount });
        return json({ valid: false, message: "Ce code a atteint sa limite d'utilisation." });
      }
    }

    // ── 8. Check this user already used THIS specific code ──
    const { data: thisCodeRedemption } = await supabaseAdmin
      .from("promo_code_redemptions")
      .select("id, end_at")
      .eq("promo_code_id", promoCode.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (thisCodeRedemption) {
      const endDate = new Date(thisCodeRedemption.end_at).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      });
      logStep("User already used this code", { userId: user.id, code: codeUpper });
      return json({ valid: false, message: `Vous avez déjà utilisé ce code. Accès valable jusqu'au ${endDate}.` });
    }

    // ── 9. Check user already has ANY active promo redemption ──
    const { data: activeRedemption } = await supabaseAdmin
      .from("promo_code_redemptions")
      .select("id, end_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (activeRedemption) {
      const endDate = new Date(activeRedemption.end_at).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      });
      logStep("User already has active promo", { userId: user.id });
      return json({ valid: false, message: `Vous avez déjà un accès gratuit actif jusqu'au ${endDate}.` });
    }

    // ── 10. All checks passed — write redemption atomically ──
    // SECURITY: The INSERT is protected by a UNIQUE(promo_code_id, user_id)
    // constraint on promo_code_redemptions. If two concurrent requests both
    // pass the application-level checks above, only one INSERT will succeed;
    // the other will receive PG error 23505 (unique_violation) and be rejected
    // here with a clear human-readable message — no double-redemption possible.
    const now = new Date();
    const endAt = new Date(now);
    endAt.setMonth(endAt.getMonth() + (promoCode.duration_months ?? 12));

    const { error: redemptionError } = await supabaseAdmin
      .from("promo_code_redemptions")
      .insert({
        promo_code_id: promoCode.id,
        user_id: user.id,
        start_at: now.toISOString(),
        end_at: endAt.toISOString(),
        status: "active",
      });

    if (redemptionError) {
      // SECURITY: Detect pg unique_violation (23505) — race condition double-spend attempt.
      const isRace = redemptionError.code === "23505" ||
        redemptionError.message?.includes("unique") ||
        redemptionError.message?.includes("duplicate");

      if (isRace) {
        logStep("Race condition detected — duplicate redemption blocked", {
          userId: user.id,
          code: codeUpper,
          pgCode: redemptionError.code,
        });
        // Fetch the existing redemption to show the end date
        const { data: existing } = await supabaseAdmin
          .from("promo_code_redemptions")
          .select("end_at")
          .eq("promo_code_id", promoCode.id)
          .eq("user_id", user.id)
          .maybeSingle();

        const endDateDisplay = existing?.end_at
          ? new Date(existing.end_at).toLocaleDateString("fr-FR", {
              day: "numeric", month: "long", year: "numeric",
            })
          : "bientôt";

        return json({
          valid: false,
          message: `Ce code a déjà été utilisé sur votre compte. Accès valable jusqu'au ${endDateDisplay}.`,
        });
      }

      logStep("Redemption insert error", redemptionError);
      throw redemptionError;
    }

    // ── 11. Mark code as used if usage_unique ──
    if (promoCode.usage_unique) {
      await supabaseAdmin
        .from("promo_codes")
        .update({ status: "utilisé", used_by: user.id, used_at: now.toISOString() })
        .eq("id", promoCode.id);
    }

    // ── 12. Sync subscriptions table — no Stripe involvement ──
    await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: user.id,
        status: "promo_active",
        current_period_start: now.toISOString(),
        current_period_end: endAt.toISOString(),
        updated_at: now.toISOString(),
        offer_type: "promo",
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
      endAt: endAt.toISOString(),
    });

    const endDateFormatted = endAt.toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });

    return json({
      valid: true,
      message: `Votre accès gratuit de ${promoCode.duration_months ?? 12} mois est activé. Il est valable jusqu'au ${endDateFormatted}.`,
      end_at: endAt.toISOString(),
      duration_months: promoCode.duration_months ?? 12,
      access_type: "promo",
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("UNHANDLED ERROR", { message });
    // Return a safe generic message — never expose internal error details to client
    return new Response(
      JSON.stringify({ valid: false, message: "Une erreur serveur est survenue. Réessayez." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
