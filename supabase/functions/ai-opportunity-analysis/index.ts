// Allowed origins — browser clients only
const ALLOWED_ORIGINS = [
  "https://wiinupmax.com",
  "https://wiinupmax.lovable.app",
  "https://id-preview--7ccca0da-8e02-461c-8a27-4774fed14e51.lovable.app",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const isLocal = origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1");
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) || isLocal ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { opportunity_description, target_company, estimated_value } = await req.json();

    if (!opportunity_description) {
      return new Response(
        JSON.stringify({ error: "opportunity_description est requis." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Tu es un expert en business development et apport d'affaires.
Tu analyses les opportunités business et tu donnes:
- potential_score: score 1-10
- estimated_commission: fourchette estimée en euros
- success_factors: 3 facteurs clés de succès
- risks: 2 risques principaux
- recommended_approach: approche recommandée en 2 phrases
Réponds en JSON, en français.`;

    const userPrompt = `Analyse cette opportunité business :

Entreprise cible : ${target_company ?? "Non précisée"}
Description : ${opportunity_description}
Valeur estimée du deal : ${estimated_value != null ? estimated_value + " €" : "Non précisée"}

Réponds UNIQUEMENT en JSON valide avec ce format exact :
{
  "potential_score": <nombre entre 1 et 10>,
  "estimated_commission": "<fourchette en euros, ex: 500 – 1 500 €>",
  "success_factors": ["<facteur 1>", "<facteur 2>", "<facteur 3>"],
  "risks": ["<risque 1>", "<risque 2>"],
  "recommended_approach": "<2 phrases max>"
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
    const rawContent: string = aiData.choices?.[0]?.message?.content ?? "";

    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Impossible d'extraire le JSON de la réponse IA.");

    const parsed = JSON.parse(jsonMatch[0]);

    const result = {
      potential_score: Math.min(10, Math.max(1, Math.round(Number(parsed.potential_score) || 5))),
      estimated_commission: String(parsed.estimated_commission ?? "N/A"),
      success_factors: Array.isArray(parsed.success_factors)
        ? parsed.success_factors.slice(0, 3).map((s: unknown) => String(s))
        : [],
      risks: Array.isArray(parsed.risks)
        ? parsed.risks.slice(0, 2).map((r: unknown) => String(r))
        : [],
      recommended_approach: String(parsed.recommended_approach ?? "").slice(0, 400),
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-opportunity-analysis error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erreur inconnue" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
