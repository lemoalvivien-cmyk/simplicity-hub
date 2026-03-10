// Allowed origins — browser clients only; Stripe-style server calls don't use CORS
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
    const { company_name, sector, target_description } = await req.json();

    if (!company_name || !sector || !target_description) {
      return new Response(
        JSON.stringify({ error: "company_name, sector et target_description sont requis." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Tu es un expert en prospection B2B pour WiinupMax. Tu génères des messages de prospection personnalisés, percutants et professionnels en français.`;

    const userPrompt = `Génère exactement 3 messages de prospection B2B distincts pour :
- Entreprise qui prospecte : ${company_name}
- Secteur : ${sector}
- Cible / Description : ${target_description}

Chaque message doit :
- Être court (5-8 lignes max)
- Commencer par une accroche personnalisée et percutante
- Mettre en valeur la proposition de valeur
- Inclure un call-to-action clair
- Avoir un ton professionnel mais direct

Réponds en JSON avec ce format exact :
{
  "messages": [
    { "id": 1, "subject": "Objet du message", "body": "Corps du message" },
    { "id": 2, "subject": "Objet du message", "body": "Corps du message" },
    { "id": 3, "subject": "Objet du message", "body": "Corps du message" }
  ]
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
        temperature: 0.8,
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
    if (!jsonMatch) {
      throw new Error("Impossible d'extraire le JSON de la réponse IA.");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-prospection error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erreur inconnue" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
