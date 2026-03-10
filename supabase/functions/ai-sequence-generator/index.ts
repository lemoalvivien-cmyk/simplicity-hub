import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SequenceStep {
  step: number;
  type: "email" | "linkedin" | "appel";
  delay_days: number;
  subject: string;
  body: string;
  rationale: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { target_description, sector, num_steps = 3, tone = "decontracte" } = await req.json();

    if (!target_description || target_description.length < 10) {
      return new Response(
        JSON.stringify({ error: "target_description doit faire au moins 10 caractères." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY non configurée." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stepsNum = Math.min(5, Math.max(2, Number(num_steps)));
    const toneMap: Record<string, string> = {
      formel: "professionnel et formel, vouvoiement, langage corporate",
      decontracte: "chaleureux et décontracté, tutoiement possible, ton humain",
      direct: "direct et concis, aller droit au but, pas de fioritures",
    };
    const toneDesc = toneMap[tone] ?? toneMap.decontracte;

    const systemPrompt = `Tu es un expert en prospection B2B et copywriting commercial. 
Tu génères des séquences de messages de prospection en français, persuasives, personnalisées et éthiques.
Chaque message doit être naturel, apporter de la valeur, et respecter les bonnes pratiques anti-spam.
Tu retournes UNIQUEMENT un JSON valide, sans markdown, sans texte autour.`;

    const userPrompt = `Génère une séquence de prospection B2B de ${stepsNum} étapes.

Contexte :
- Cible : ${target_description}
- Secteur : ${sector || "non précisé"}
- Ton : ${toneDesc}
- Nombre d'étapes : ${stepsNum}

Règles :
1. Étape 1 = premier contact (délai 0 jours)
2. Étapes suivantes = relances progressives avec délais croissants (3-5-7 jours)
3. Utilise les placeholders : {{prenom}}, {{entreprise}}, {{secteur}}
4. Chaque message doit être différent et progresser dans la relation
5. Inclure des objets email accrocheurs
6. Dernier message = fermeture douce (pas de rancune si pas de réponse)

Retourne ce JSON exact :
{
  "sequence_name": "string (nom court de la séquence)",
  "steps": [
    {
      "step": 1,
      "type": "email",
      "delay_days": 0,
      "subject": "string",
      "body": "string (corps du message avec retours à la ligne \\n)",
      "rationale": "string (1 phrase expliquant le choix)"
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans quelques minutes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants pour l'IA." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errText = await response.text();
      console.error("AI Gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiData = await response.json() as {
      choices?: { message?: { content?: string } }[];
    };

    const rawContent = aiData.choices?.[0]?.message?.content ?? "";

    // Strip possible markdown code fences
    const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed: { sequence_name?: string; steps?: SequenceStep[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("JSON parse error:", cleaned);
      return new Response(
        JSON.stringify({ error: "L'IA a retourné un format invalide. Réessayez." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!parsed.steps || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      return new Response(
        JSON.stringify({ error: "Séquence générée vide. Réessayez." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        sequence_name: parsed.sequence_name ?? `Séquence ${sector ?? "B2B"}`,
        steps: parsed.steps,
        meta: { num_steps: parsed.steps.length, tone, sector, generated_at: new Date().toISOString() },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("ai-sequence-generator error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erreur inconnue." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
