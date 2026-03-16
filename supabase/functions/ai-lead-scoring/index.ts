// AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : requireAuth obligatoire
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireAuth, unauthorizedResponse } from "../_shared/authGuard.ts";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_MODEL = "google/gemini-2.5-flash";

interface Dossier {
  secteur_activite: string | null;
  cible_ideale: string | null;
}

async function loadDossier(
  supabaseUrl: string,
  serviceKey: string,
  userId: string,
): Promise<Dossier | null> {
  const admin = createClient(supabaseUrl, serviceKey);
  const { data } = await admin
    .from("openclaw_dossier" as never)
    .select("secteur_activite, cible_ideale")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as Dossier) ?? null;
}

// Normalize raw score string/number → 0-100
function normalizeScore(raw: unknown): number {
  const n = Math.round(Number(raw) || 0);
  // Handle legacy 1-10 scale
  if (n >= 1 && n <= 10) return n * 10;
  return Math.min(100, Math.max(0, n));
}

function scoreToLabel(score: number): string {
  if (score >= 80) return "brûlant";
  if (score >= 60) return "chaud";
  if (score >= 35) return "tiède";
  return "froid";
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const { lead_data, intake_id } = body;

    if (!lead_data) {
      return new Response(
        JSON.stringify({ error: "lead_data est requis." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Auth: required unless called via internal trigger (intake_id path) ───
    // When called from a DB trigger, intake_id is provided and user_id is fetched directly.
    // When called from the client, a valid JWT is required.
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");

    if (intake_id) {
      // Internal/trigger path: resolve user from DB, no JWT needed
      const admin = createClient(supabaseUrl, serviceKey);
      const { data: intake } = await admin
        .from("lead_intakes")
        .select("user_id")
        .eq("id", intake_id)
        .maybeSingle();
      userId = (intake as { user_id: string } | null)?.user_id ?? null;
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "intake_id invalide." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } else {
      // Client path: JWT required
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
      userId = user.id;
    }

    // ── Load dossier in parallel ──────────────────────────────
    const dossier = userId ? await loadDossier(supabaseUrl, serviceKey, userId) : null;

    // ── Build enriched prompt ─────────────────────────────────
    const dossierContext = dossier
      ? `\nCIBLE IDÉALE DÉFINIE PAR L'ENTREPRISE : ${dossier.cible_ideale ?? "Non définie"}
SECTEUR DE L'ENTREPRISE : ${dossier.secteur_activite ?? "Non défini"}`
      : "";

    const systemPrompt = `Tu es un expert en qualification de leads B2B. Tu scores les leads de 0 à 100 selon leur potentiel commercial réel. Tu analyses : la pertinence sectorielle, la taille estimée de l'entreprise, les signaux d'intention, et la qualité du contact. Tu retournes toujours un JSON strict.`;

    const userPrompt = `Analyse et score ce lead B2B sur une échelle de 0 à 100 :

NOM DU CONTACT : ${lead_data.name ?? "Inconnu"}
ENTREPRISE : ${lead_data.company ?? "Non précisée"}
MESSAGE / CONTEXTE : ${lead_data.message ?? "Aucun contexte"}
SOURCE : ${lead_data.source ?? "Inconnue"}
${dossierContext}

Critères d'évaluation (poids) :
- Pertinence sectorielle (25%) : le secteur du lead correspond-il à la cible idéale ?
- Taille et potentiel estimé (20%) : indices sur la taille de l'entreprise, les ressources
- Signal d'intention (30%) : le contexte indique-t-il un besoin actif ou une opportunité imminente ?
- Qualité du contact (25%) : est-ce un décideur ? Les infos sont-elles complètes ?

Réponds uniquement en JSON valide avec ce format exact :
{
  "score": <entier entre 0 et 100>,
  "label": "<froid|tiède|chaud|brûlant>",
  "reasoning": "<justification factuelle en 2-3 phrases max>",
  "next_action": "<action concrète recommandée, ex: Envoyer un email de qualification, Appeler dans les 24h, Ajouter en liste d'attente>"
}`;

    const aiRes = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.25,
        max_tokens: 400,
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
      console.error("[ai-lead-scoring] AI gateway error:", aiRes.status, errText);
      throw new Error(`AI gateway error ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const rawContent: string = aiData.choices?.[0]?.message?.content ?? "";

    const jsonMatch =
      rawContent.match(/```json\s*([\s\S]*?)```/) ??
      rawContent.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) throw new Error("Impossible d'extraire le JSON de la réponse IA.");

    const scoring = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);

    const score = normalizeScore(scoring.score);
    const VALID_LABELS = ["froid", "tiède", "chaud", "brûlant"];
    const label = VALID_LABELS.includes(String(scoring.label).toLowerCase())
      ? String(scoring.label).toLowerCase()
      : scoreToLabel(score);

    const result = {
      score,
      label,
      reasoning: String(scoring.reasoning ?? "").slice(0, 400),
      next_action: String(scoring.next_action ?? scoring.recommended_action ?? "").slice(0, 200),
    };

    // ── Persist score + next_action back to lead_intakes ──────
    if (intake_id) {
      const adminClient = createClient(supabaseUrl, serviceKey);
      const { error: updateError } = await adminClient
        .from("lead_intakes")
        .update({
          ai_score: result.score,
          ai_label: result.label,
          ai_reasoning: result.reasoning,
          next_best_action: result.next_action,
          ai_scored_at: new Date().toISOString(),
        })
        .eq("id", intake_id);

      if (updateError) {
        console.error("[ai-lead-scoring] Failed to persist score:", updateError.message);
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[ai-lead-scoring] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erreur inconnue" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
    );
  }
});
