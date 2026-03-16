/**
 * submit-introduction — Transactional Edge Function.
 * Atomically inserts: introduction + gain + intro_escrow + introduction_proof.
 * AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : requireAuth obligatoire
 * SECURITY: userId is always derived from JWT. No user_id override allowed.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireAuth, unauthorizedResponse } from "../_shared/authGuard.ts";

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : requireAuth obligatoire
  let claims: Awaited<ReturnType<typeof requireAuth>>;
  try {
    claims = await requireAuth(req);
  } catch {
    return unauthorizedResponse(corsHeaders);
  }

  // SECURITY: no user_id override allowed — derived from JWT only
  const facilitateurId = claims.sub;

  try {

    const body = await req.json();
    const {
      entreprise_id,
      mission_id,
      contact_nom,
      contact_email,
      contact_telephone,
      contexte,
      pertinence,
    } = body;

    if (!entreprise_id || !contact_nom || !contexte) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: entreprise_id, contact_nom, contexte" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for the transactional writes
    const adminSb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Step 1: Insert introduction ──────────────────────────────────────────
    const { data: intro, error: introErr } = await adminSb
      .from("introductions")
      .insert({
        facilitateur_id: facilitateurId,
        entreprise_id,
        mission_id: mission_id ?? null,
        contact_nom: contact_nom.trim().slice(0, 150),
        contact_email: contact_email?.trim().slice(0, 254) || null,
        contact_telephone: contact_telephone?.trim().slice(0, 20) || null,
        contexte: contexte.trim().slice(0, 2000),
        pertinence: pertinence?.trim().slice(0, 1000) || null,
        statut: "en_attente",
      })
      .select("id")
      .single();

    if (introErr || !intro) {
      console.error("intro insert error:", introErr);
      return new Response(
        JSON.stringify({ error: "Failed to create introduction", detail: introErr?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const introId = intro.id;

    // ── Steps 2-4: Parallel inserts (gain + escrow + proof) ─────────────────
    const [gainRes, escrowRes, proofRes] = await Promise.allSettled([
      adminSb.from("gains").insert({
        facilitateur_id: facilitateurId,
        introduction_id: introId,
        mission_id: mission_id ?? null,
        source: "mission_directe",
        statut: "en_attente",
        montant: null,
      }),
      adminSb.from("intro_escrow").insert({
        facilitator_id: facilitateurId,
        company_id: entreprise_id,
        introduction_id: introId,
        status: "demandee",
        protected: true,
      }),
      adminSb.from("introduction_proofs").insert({
        facilitator_id: facilitateurId,
        company_id: entreprise_id,
        introduction_id: introId,
        proof_status: "brouillon",
        validation_status: "en_attente",
      }),
    ]);

    // Log any non-fatal errors (intro is already created — compensate in the future)
    if (gainRes.status === "rejected") {
      console.error("gain insert failed:", gainRes.reason);
    }
    if (escrowRes.status === "rejected") {
      console.error("escrow insert failed:", escrowRes.reason);
    }
    if (proofRes.status === "rejected") {
      console.error("proof insert failed:", proofRes.reason);
    }

    return new Response(
      JSON.stringify({ success: true, introduction_id: introId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("submit-introduction error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
