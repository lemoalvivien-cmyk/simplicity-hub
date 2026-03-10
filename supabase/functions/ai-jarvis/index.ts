import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_MODEL = "google/gemini-2.5-flash";

const SYSTEM_PROMPT = `Tu es JARVIS, l'assistant IA de WiinupMax. Tu aides les entreprises à trouver plus de clients et les facilitateurs à générer des revenus passifs. Tu es expert en prospection B2B, apport d'affaires, et stratégie commerciale.

Règles :
- Réponds TOUJOURS en français
- Sois concis et actionnable (max 3-4 phrases)
- Si l'utilisateur demande quelque chose que la plateforme peut faire, guide-le vers la bonne page
- Tu connais ces pages : /dashboard, /missions, /introductions, /contacts, /campagnes, /actions, /agents, /operations, /radar, /pilotage, /gains, /validations, /chaud, /trust, /offres, /dossier, /assistant

Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "response": "ta réponse ici",
  "suggested_actions": [
    { "label": "Nom du bouton", "href": "/chemin" }
  ]
}
suggested_actions doit être un tableau vide [] si aucune action n'est pertinente. Maximum 3 actions suggérées.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      message,
      context = "dashboard",
      user_role = "facilitateur",
      history = [] as ChatMessage[],
    } = body;

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "Missing message" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build messages array: system + last 5 from history + current message
    const historySlice: ChatMessage[] = (history as ChatMessage[]).slice(-5);
    const messages = [
      { role: "system", content: SYSTEM_PROMPT + `\n\nContexte actuel : page "${context}", rôle utilisateur : "${user_role}".` },
      ...historySlice.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const aiRes = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited", message: "Limite de requêtes atteinte, réessayez dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "payment_required", message: "Crédits IA insuffisants." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiRes.text().catch(() => "");
      console.error("[ai-jarvis] AI gateway error:", aiRes.status, errText);
      return new Response(JSON.stringify({ error: "ai_gateway_error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const rawContent: string = aiData.choices?.[0]?.message?.content ?? "";

    // Parse JSON from AI response
    let response = rawContent;
    let suggested_actions: Array<{ label: string; href: string }> = [];

    try {
      const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)```/) ?? rawContent.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : rawContent;
      const parsed = JSON.parse(jsonStr.trim());
      response = parsed.response ?? rawContent;
      suggested_actions = Array.isArray(parsed.suggested_actions) ? parsed.suggested_actions.slice(0, 3) : [];
    } catch {
      // If not valid JSON, use raw content as response
      response = rawContent;
      suggested_actions = [];
    }

    return new Response(
      JSON.stringify({ response, suggested_actions, model: AI_MODEL }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[ai-jarvis] Error:", err);
    return new Response(JSON.stringify({ error: "internal_error", detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
