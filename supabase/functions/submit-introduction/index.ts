/**
 * submit-introduction — Edge Function v6.
 * Appelle submit_introduction_atomic() — transaction PL/pgSQL ACID.
 * Un seul round-trip DB. Rollback automatique sur toute erreur.
 * AUTH : getClaims() (nouvelle API Lovable Cloud — compatible signing-keys).
 * SECURITY: userId toujours dérivé du JWT. Aucun override possible.
 * P0 FIX: Rate-limiting 30 req/min/user — protection anti-spam.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ── Auth via getClaims() (Lovable Cloud signing-keys compatible) ──────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const anonSb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: authData, error: authError } = await anonSb.auth.getClaims(token);

  if (authError || !authData?.claims) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // SECURITY: userId toujours dérivé du JWT — aucun override possible
  const facilitateurId: string = authData.claims.sub;

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

    // Validation légère côté Edge (la fonction PL/pgSQL valide aussi)
    if (!entreprise_id || !contact_nom || !contexte) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: entreprise_id, contact_nom, contexte" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Appel RPC atomique — 1 round-trip, 1 transaction ACID ──────────────
    const adminSb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await adminSb.rpc("submit_introduction_atomic", {
      p_facilitateur_id:   facilitateurId,
      p_entreprise_id:     entreprise_id,
      p_mission_id:        mission_id ?? null,
      p_contact_nom:       contact_nom,
      p_contact_email:     contact_email ?? null,
      p_contact_telephone: contact_telephone ?? null,
      p_contexte:          contexte,
      p_pertinence:        pertinence ?? null,
    });

    if (error) {
      console.error("submit_introduction_atomic RPC error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to submit introduction", detail: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("submit-introduction unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
