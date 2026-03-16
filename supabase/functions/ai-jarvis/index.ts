// AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : requireAuth obligatoire
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireAuth, unauthorizedResponse } from "../_shared/authGuard.ts";
import { enforceRateLimit, build429, trackRequest, logFunctionError } from "../_shared/monitoring.ts";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_MODEL = "google/gemini-2.5-flash";

const SYSTEM_PROMPT_BASE = `Tu es JARVIS, le copilote commercial IA de WiinupMax. Tu aides les entreprises à trouver plus de clients et les facilitateurs à générer des revenus passifs. Tu es expert en prospection B2B, apport d'affaires, et stratégie commerciale.

Règles :
- Réponds TOUJOURS en français
- Sois concis et actionnable (max 3-4 phrases)
- Utilise le CONTEXTE TEMPS RÉEL ci-dessous pour donner des conseils PRÉCIS basés sur les données réelles de l'utilisateur, pas des généralités
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

interface UserContext {
  missionsActives: number;
  introsEnAttente: number;
  actionsAFaire: number;
  dernierBrief: string | null;
  trustScore: number | null;
  role: string;
}

// ── Load real-time user context ───────────────────────────────
async function loadUserContext(
  supabaseUrl: string,
  serviceKey: string,
  userId: string,
  userRole: string,
): Promise<UserContext> {
  const adminClient = createClient(supabaseUrl, serviceKey);

  const [missionsRes, introsRes, actionsRes, briefRes, trustRes] = await Promise.allSettled([
    // Missions actives
    adminClient
      .from("missions")
      .select("id", { count: "exact", head: true })
      .eq("entreprise_id", userId)
      .eq("statut", "active"),

    // Introductions en attente
    adminClient
      .from("introductions")
      .select("id", { count: "exact", head: true })
      .eq("entreprise_id", userId)
      .eq("statut", "en_attente"),

    // Actions à faire (user_actions table)
    adminClient
      .from("user_actions" as never)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "a_faire"),

    // Dernier brief OpenClaw
    adminClient
      .from("openclaw_briefs" as never)
      .select("summary")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),

    // Trust score (si facilitateur)
    userRole === "facilitateur"
      ? adminClient
          .from("trust_scores")
          .select("global_score")
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const missionsCount =
    missionsRes.status === "fulfilled" ? (missionsRes.value.count ?? 0) : 0;

  const introsCount =
    introsRes.status === "fulfilled" ? (introsRes.value.count ?? 0) : 0;

  const actionsCount =
    actionsRes.status === "fulfilled"
      ? ((actionsRes.value as { count: number | null }).count ?? 0)
      : 0;

  const briefSummary =
    briefRes.status === "fulfilled"
      ? ((briefRes.value.data as Array<{ summary: string }> | null)?.[0]?.summary ?? null)
      : null;

  const trustScore =
    trustRes.status === "fulfilled"
      ? ((trustRes.value as { data: { global_score: number } | null }).data?.global_score ?? null)
      : null;

  return {
    missionsActives: missionsCount,
    introsEnAttente: introsCount,
    actionsAFaire: actionsCount,
    dernierBrief: briefSummary,
    trustScore,
    role: userRole,
  };
}

// ── Build context block for system prompt ─────────────────────
function buildContextBlock(ctx: UserContext): string {
  const lines: string[] = [
    "",
    "━━━ CONTEXTE TEMPS RÉEL DE L'UTILISATEUR ━━━",
    `- Rôle : ${ctx.role}`,
    `- Missions actives : ${ctx.missionsActives}`,
    `- Introductions en attente de validation : ${ctx.introsEnAttente}`,
    `- Actions commerciales à faire : ${ctx.actionsAFaire}`,
  ];

  if (ctx.dernierBrief) {
    lines.push(`- Dernier brief IA : "${ctx.dernierBrief}"`);
  } else {
    lines.push("- Dernier brief IA : aucun disponible");
  }

  if (ctx.role === "facilitateur" && ctx.trustScore !== null) {
    lines.push(`- Score de confiance : ${ctx.trustScore}/100`);
  }

  lines.push(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "Utilise ces données pour donner des conseils PRÉCIS et ACTIONNABLES. Ne dis jamais 'vous avez des missions' si le compte est 0.",
    "",
  );

  return lines.join("\n");
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Auth ────────────────────────────────────────────────
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

    // ── Rate limiting ────────────────────────────────────────────────────────
    const rateCheck = await enforceRateLimit(user.id, "ai-jarvis");
    if (rateCheck && !rateCheck.allowed) return build429(corsHeaders, "ai-jarvis");
    const releaseTracker = trackRequest();

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

    // ── Load user context in parallel with building messages ─
    const userCtx = await loadUserContext(supabaseUrl, serviceKey, user.id, user_role);
    const contextBlock = buildContextBlock(userCtx);

    // ── Build messages array ─────────────────────────────────
    const historySlice: ChatMessage[] = (history as ChatMessage[]).slice(-10);
    const systemContent =
      SYSTEM_PROMPT_BASE +
      contextBlock +
      `\nContexte de page actuel : "${context}".`;

    const messages = [
      { role: "system", content: systemContent },
      ...historySlice.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    // ── Call AI gateway ──────────────────────────────────────
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
        max_tokens: 600,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "rate_limited", message: "Limite de requêtes atteinte, réessayez dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "payment_required", message: "Crédits IA insuffisants." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errText = await aiRes.text().catch(() => "");
      console.error("[ai-jarvis] AI gateway error:", aiRes.status, errText);
      return new Response(JSON.stringify({ error: "ai_gateway_error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Parse AI response ────────────────────────────────────
    const aiData = await aiRes.json();
    const rawContent: string = aiData.choices?.[0]?.message?.content ?? "";

    let response = rawContent;
    let suggested_actions: Array<{ label: string; href: string }> = [];

    try {
      const jsonMatch =
        rawContent.match(/```json\s*([\s\S]*?)```/) ??
        rawContent.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : rawContent;
      const parsed = JSON.parse(jsonStr.trim());
      response = parsed.response ?? rawContent;
      suggested_actions = Array.isArray(parsed.suggested_actions)
        ? parsed.suggested_actions.slice(0, 3)
        : [];
    } catch {
      response = rawContent;
      suggested_actions = [];
    }

    return new Response(
      JSON.stringify({ response, suggested_actions, model: AI_MODEL }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[ai-jarvis] Error:", err);
    return new Response(
      JSON.stringify({ error: "internal_error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
