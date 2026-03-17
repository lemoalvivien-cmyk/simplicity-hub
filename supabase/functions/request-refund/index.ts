/**
 * request-refund — Workflow remboursement 30 jours
 * Vérifie l'éligibilité, insère une demande et notifie l'admin.
 * Sécurité : requireAuth() obligatoire — fail-closed.
 */
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { requireAuth, unauthorizedResponse } from "../_shared/authGuard.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ── Auth guard ────────────────────────────────────────────────────────────
  let claims;
  try {
    claims = await requireAuth(req);
  } catch {
    return unauthorizedResponse(corsHeaders);
  }

  const userId = claims.sub;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({})) as { reason?: string };
    const reason = (body.reason ?? "").trim() || "Aucune raison fournie";

    // ── Check eligibility: active sub started < 30 days ago ──────────────────
    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("id, status, current_period_start")
      .eq("user_id", userId)
      .eq("status", "active")
      .gte("current_period_start", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (subError) {
      console.error("[request-refund] sub lookup error:", subError.message);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la vérification de l'abonnement." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!sub) {
      return new Response(
        JSON.stringify({
          eligible: false,
          message: "La période de remboursement de 30 jours est dépassée.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Insert refund request ─────────────────────────────────────────────────
    const { error: insertError } = await supabase
      .from("refund_requests")
      .insert({
        user_id: userId,
        subscription_id: sub.id,
        reason,
        status: "pending",
      });

    if (insertError) {
      console.error("[request-refund] insert error:", insertError.message);
      return new Response(
        JSON.stringify({ error: "Impossible d'enregistrer la demande." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Notify admin via notifications table ──────────────────────────────────
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "refund_request",
      title: "Nouvelle demande de remboursement",
      message: `Un utilisateur demande un remboursement. Raison : ${reason}`,
      read: false,
    }).then(({ error }) => {
      if (error) console.warn("[request-refund] admin notification insert error:", error.message);
    });

    return new Response(
      JSON.stringify({
        eligible: true,
        message: "Votre demande a été enregistrée. Nous vous répondrons sous 48h.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[request-refund] unexpected error:", msg);
    return new Response(
      JSON.stringify({ error: "Erreur interne." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
