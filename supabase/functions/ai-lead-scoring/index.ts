import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lead_data, intake_id } = await req.json();

    if (!lead_data) {
      return new Response(
        JSON.stringify({ error: "lead_data est requis." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const systemPrompt = `Tu es un expert en qualification de leads B2B. Tu analyses les leads et tu les scores de 1 à 10 avec une justification courte en français. Tu retournes: score (number), label (Froid/Tiède/Chaud/Brûlant), reasoning (string max 50 mots), recommended_action (string).`;

    const userPrompt = `Analyse et score ce lead B2B :

Nom : ${lead_data.name || "Inconnu"}
Entreprise : ${lead_data.company || "Non précisée"}
Message/Contexte : ${lead_data.message || "Aucun contexte"}
Source : ${lead_data.source || "Inconnue"}

Réponds uniquement en JSON valide avec ce format exact :
{
  "score": <nombre entre 1 et 10>,
  "label": "<Froid|Tiède|Chaud|Brûlant>",
  "reasoning": "<justification en moins de 50 mots>",
  "recommended_action": "<action recommandée courte>"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants. Contactez le support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error ${response.status}`);
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content ?? "";

    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Impossible d'extraire le JSON de la réponse IA.");

    const scoring = JSON.parse(jsonMatch[0]);

    // Validate the score value
    const score = Math.min(10, Math.max(1, Math.round(Number(scoring.score) || 1)));
    const label = ["Froid", "Tiède", "Chaud", "Brûlant"].includes(scoring.label)
      ? scoring.label
      : score <= 3 ? "Froid" : score <= 5 ? "Tiède" : score <= 7 ? "Chaud" : "Brûlant";

    const result = {
      score,
      label,
      reasoning: String(scoring.reasoning || "").slice(0, 300),
      recommended_action: String(scoring.recommended_action || ""),
    };

    // If intake_id is provided, persist the score back to lead_intakes via service role
    if (intake_id && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { error: updateError } = await adminClient
        .from("lead_intakes")
        .update({
          ai_score: result.score,
          ai_label: result.label,
          ai_reasoning: result.reasoning,
          ai_scored_at: new Date().toISOString(),
        })
        .eq("id", intake_id);

      if (updateError) {
        console.error("Failed to persist AI score:", updateError.message);
        // Non-fatal — still return the score
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-lead-scoring error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
