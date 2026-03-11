import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_MODEL = "google/gemini-2.5-flash";

interface Dossier {
  secteur_activite: string | null;
  cible_ideale: string | null;
  proposition_valeur: string | null;
  zone_geographique: string | null;
  points_forts: string | null;
}

// ── Load OpenClaw dossier for the authenticated user ──────────
async function loadDossier(
  supabaseUrl: string,
  serviceKey: string,
  userId: string,
): Promise<Dossier | null> {
  const admin = createClient(supabaseUrl, serviceKey);
  const { data, error } = await admin
    .from("openclaw_dossier" as never)
    .select("secteur_activite, cible_ideale, proposition_valeur, zone_geographique, points_forts")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Dossier;
}

// ── Compute personalization score ────────────────────────────
function computePersonalizationScore(
  dossier: Dossier | null,
  target_description: string,
): number {
  let score = 20; // base: company_name + sector + target always provided

  if (target_description.length > 80) score += 10;

  if (dossier) {
    if (dossier.proposition_valeur) score += 20;
    if (dossier.cible_ideale) score += 15;
    if (dossier.points_forts) score += 15;
    if (dossier.zone_geographique) score += 10;
    if (dossier.secteur_activite) score += 10;
  }

  return Math.min(100, score);
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Auth (required) ──────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const userId: string | null = user.id;

    const body = await req.json();
    const { company_name, sector, target_description } = body;

    if (!company_name || !sector || !target_description) {
      return new Response(
        JSON.stringify({ error: "company_name, sector et target_description sont requis." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Load dossier in parallel with auth ───────────────────
    const dossier = userId ? await loadDossier(supabaseUrl, serviceKey, userId) : null;

    const personalization_score = computePersonalizationScore(dossier, target_description);

    // ── Build enriched context block ─────────────────────────
    const dossierBlock = dossier
      ? `
PROFIL DE L'ENTREPRISE (depuis le dossier stratégique) :
- Secteur d'activité : ${dossier.secteur_activite ?? sector}
- Proposition de valeur : ${dossier.proposition_valeur ?? "Non renseignée"}
- Points forts : ${dossier.points_forts ?? "Non renseignés"}
- Zone géographique : ${dossier.zone_geographique ?? "Non renseignée"}
- Cible idéale : ${dossier.cible_ideale ?? "Non renseignée"}`
      : `
PROFIL DE L'ENTREPRISE :
- Secteur d'activité : ${sector}`;

    const systemPrompt = `Tu es un expert senior en prospection B2B. Tu génères des messages de prospection ultra-personnalisés, percutants et professionnels en français. Ton objectif est d'obtenir une réponse, pas de vendre immédiatement.`;

    const userPrompt = `Génère 4 messages de prospection B2B distincts pour :

ENTREPRISE : ${company_name}
${dossierBlock}
DESCRIPTION DE LA CIBLE SPÉCIFIQUE : ${target_description}

Instructions pour les 3 premiers messages (email/LinkedIn message) :
- Mentionner UN problème spécifique et douloureux du secteur cible (basé sur la réalité du secteur)
- Utiliser la proposition de valeur comme solution directe à ce problème
- Inclure un CTA concret avec une offre sans risque (audit gratuit, démo 20min, benchmark offert)
- Maximum 5 lignes chacun
- Ton direct et professionnel — JAMAIS "Cher Monsieur/Madame"
- Commencer par le problème ou un fait frappant, pas par une présentation

Le 4ème message doit être une DEMANDE DE CONNEXION LINKEDIN :
- 2-3 lignes maximum
- Expliquer pourquoi la connexion est pertinente
- Mentionner un point commun ou un intérêt partagé
- Pas de pitch commercial direct

Réponds en JSON avec ce format exact :
{
  "messages": [
    { "id": 1, "type": "email", "subject": "Objet du message", "body": "Corps du message" },
    { "id": 2, "type": "email", "subject": "Objet du message", "body": "Corps du message" },
    { "id": 3, "type": "linkedin_message", "subject": null, "body": "Corps du message" },
    { "id": 4, "type": "linkedin_connection", "subject": null, "body": "Note de connexion courte 2-3 lignes" }
  ]
}`;

    // ── Call AI ──────────────────────────────────────────────
    const aiRes = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.75,
        max_tokens: 1500,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants. Contactez le support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errText = await aiRes.text().catch(() => "");
      console.error("[ai-prospection] AI gateway error:", aiRes.status, errText);
      throw new Error(`AI gateway error ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const rawContent: string = aiData.choices?.[0]?.message?.content ?? "";

    // Extract JSON from response
    const jsonMatch =
      rawContent.match(/```json\s*([\s\S]*?)```/) ??
      rawContent.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      throw new Error("Impossible d'extraire le JSON de la réponse IA.");
    }

    const parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);

    return new Response(
      JSON.stringify({
        ...parsed,
        personalization_score,
        dossier_used: dossier !== null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[ai-prospection] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erreur inconnue" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
    );
  }
});
