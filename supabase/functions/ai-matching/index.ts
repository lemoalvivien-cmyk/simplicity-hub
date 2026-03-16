// AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : requireAuth obligatoire
// ai-matching hardenée : toutes requêtes utilisateurs exigent JWT valide.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireAuth, unauthorizedResponse } from "../_shared/authGuard.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
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

  const userId = claims.sub;

  try {
    const body = await req.json();
    const { mission_id, company_user_id, mode } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch mission
    const { data: mission, error: mErr } = await adminClient
      .from("missions")
      .select("*")
      .eq("id", mission_id || "")
      .eq("owner_user_id", company_user_id || userId)
      .maybeSingle();

    if (mErr || !mission) {
      return new Response(JSON.stringify({ error: "Mission introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch facilitators
    const { data: facilitators } = await adminClient
      .from("facilitateur_profiles")
      .select("user_id, secteur, zone, business_corridors, languages, description_reseau")
      .eq("statut", "actif")
      .limit(20);

    if (!facilitators?.length) {
      return new Response(JSON.stringify({ matches: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Simple scoring: sector + zone match
    const matches = facilitators
      .map((f) => {
        let score = 0;
        if (f.secteur === mission.secteur) score += 40;
        if (f.zone === mission.zone) score += 30;
        if (f.business_corridors?.includes(mission.secteur)) score += 20;
        return { facilitator_user_id: f.user_id, score, reason: score > 50 ? "Secteur + zone correspondants" : "Profil partiel" };
      })
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return new Response(JSON.stringify({ matches, mission_id: mission.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
