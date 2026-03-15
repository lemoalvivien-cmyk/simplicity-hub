/**
 * notify-intro-validated
 * ─────────────────────────────────────────────────────────────────────────────
 * Sends real email + in-app notification when an introduction is validated.
 * Called by the DB trigger on_introduction_validated_pipeline via pg_net.
 *
 * POST body: { introduction_id: string }
 *
 * SECURITY: Internal function called exclusively by pg_net (DB trigger).
 * Requires x-internal-secret header matching INTERNAL_FUNCTION_SECRET env var.
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { sendIntroValideeEmail } from "../_shared/emailNotifications.ts";

const SUPABASE_URL    = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// SECURITY: Shared secret for internal pg_net → edge function calls.
const INTERNAL_SECRET = Deno.env.get("INTERNAL_FUNCTION_SECRET") ?? "";

const log = (step: string, d?: unknown) =>
  console.log(`[notify-intro-validated] ${step}${d ? " — " + JSON.stringify(d) : ""}`);

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // ── SECURITY: Internal secret validation — fail-closed ────────────────────
  if (!INTERNAL_SECRET || INTERNAL_SECRET.trim().length < 16) {
    console.error("[notify-intro-validated] SECURITY: INTERNAL_FUNCTION_SECRET not configured — fail-closed");
    return new Response(JSON.stringify({ error: "Internal endpoint not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const callerSecret = req.headers.get("x-internal-secret");
  if (!callerSecret || callerSecret !== INTERNAL_SECRET) {
    console.warn("[notify-intro-validated] SECURITY: Invalid or missing x-internal-secret — rejected");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  try {
    const body = await req.json().catch(() => ({}));
    const introductionId: string | null = body.introduction_id ?? null;

    if (!introductionId) {
      return new Response(
        JSON.stringify({ error: "introduction_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Fetch introduction + mission + facilitator profile ───────────────────
    const { data: intro, error: introErr } = await sb
      .from("introductions")
      .select(`
        id, contact_nom, facilitateur_id, mission_id, entreprise_id, statut,
        missions!mission_id(titre, recompense, entreprise_id)
      `)
      .eq("id", introductionId)
      .maybeSingle();

    if (introErr || !intro) {
      log("Introduction not found", { introductionId, error: introErr?.message });
      return new Response(
        JSON.stringify({ error: "Introduction not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (intro.statut !== "validee") {
      log("Introduction not validated — skipping", { statut: intro.statut });
      return new Response(
        JSON.stringify({ skipped: true, reason: "not_validated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Fetch facilitator email ──────────────────────────────────────────────
    const { data: facilitatorProfile } = await sb
      .from("profiles")
      .select("email, prenom")
      .eq("id", intro.facilitateur_id)
      .maybeSingle();

    const missionData = intro.missions as {
      titre: string;
      recompense: string | null;
      entreprise_id: string;
    } | null;

    // ── Parse gain estimate from recompense string (e.g. "500 €") ───────────
    let gainEstimate: number | undefined;
    if (missionData?.recompense) {
      const match = missionData.recompense.match(/(\d+(?:[.,]\d+)?)/);
      if (match) gainEstimate = parseFloat(match[1].replace(",", "."));
    }

    // ── Send real email to facilitator ───────────────────────────────────────
    let emailSent = false;
    if (facilitatorProfile?.email) {
      emailSent = await sendIntroValideeEmail({
        to: facilitatorProfile.email,
        facilitatorName: facilitatorProfile.prenom || "Facilitateur",
        contactName: intro.contact_nom,
        missionTitre: missionData?.titre || "Mission",
        introductionId: intro.id,
        gainEstimate,
      });
      log("Email sent", { to: facilitatorProfile.email, introId: intro.id, emailSent });
    } else {
      log("No email for facilitator", { facilitateur_id: intro.facilitateur_id });
    }

    // ── In-app notification for facilitator ─────────────────────────────────
    await sb.from("notifications").insert({
      user_id: intro.facilitateur_id,
      type: "intro_validee",
      title: "✅ Introduction validée !",
      body: `Votre introduction de ${intro.contact_nom} a été validée${gainEstimate ? ` — Gain attendu : ${gainEstimate} €` : ""}`,
      href: `/introductions/${intro.id}`,
    }).catch(() => null);

    // ── In-app notification for entreprise ──────────────────────────────────
    if (intro.entreprise_id || missionData?.entreprise_id) {
      const entrepriseId = intro.entreprise_id || missionData?.entreprise_id;
      await sb.from("notifications").insert({
        user_id: entrepriseId,
        type: "intro_validee_entreprise",
        title: "🤝 Introduction confirmée",
        body: `Vous avez validé l'introduction de ${intro.contact_nom} pour la mission "${missionData?.titre || "Mission"}"`,
        href: "/introductions",
      }).catch(() => null);
    }

    return new Response(
      JSON.stringify({
        success: true,
        email_sent: emailSent,
        introduction_id: intro.id,
        facilitator_notified: !!facilitatorProfile?.email,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", { msg });
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
