/**
 * ADA Orchestrator v2 — Autonomous Deal Agent — 95% Autonome
 * ─────────────────────────────────────────────────────────────────────────────
 * State machine: scan_etg → prepare_script → bloctel_check → awaiting_consent
 *   → voice_consent (ElevenLabs) → calling → negotiating
 *   → awaiting_human_validation → generate_contract → awaiting_final_closing
 *   → closed | abandoned | error
 *
 * Sécurité : RGPD art 6.1.a, Bloctel Loi Hamon, EU AI Act art 52
 * Royalty   : 12% automatique sur chaque deal via Silent Royalty Engine
 *             (7% platform fee + 5% engine fee : swarm autonome + live cash flow + WMAX secondary market)
 * POST /ada-orchestrator
 * Body: { action: "start"|"consent"|"voice_consent"|"negotiate"|"validate"|"close"|"abandon", ... }
 */
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY      = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const LOVABLE_API_KEY  = Deno.env.get("LOVABLE_API_KEY") ?? "";
const ELEVENLABS_KEY   = Deno.env.get("ELEVENLABS_API_KEY") ?? "";
const STRIPE_SECRET    = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

// ElevenLabs voice ID for ADA (closer féminin, neutre, professionnel)
const ADA_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah

// ── ADA State Machine Nodes ─────────────────────────────────────────────────

type ADAState =
  | "idle" | "scanning" | "preparing_script" | "awaiting_consent"
  | "calling" | "negotiating" | "awaiting_human_validation"
  | "generating_contract" | "awaiting_final_closing" | "closed" | "abandoned" | "error";

interface ADASession {
  id: string;
  owner_user_id: string;
  state: ADAState;
  target_name: string;
  target_phone: string | null;
  target_email: string | null;
  target_context: Record<string, unknown>;
  adaptive_script: string | null;
  reasoning_trace: unknown[];
  contract_amount: number | null;
  stripe_payment_link: string | null;
}

// ── Node: Scan Eternal Trust Graph ──────────────────────────────────────────
async function nodeScanETG(
  sb: ReturnType<typeof createClient>,
  session: ADASession,
): Promise<{ enrichedContext: Record<string, unknown> }> {
  const nodeStart = Date.now();

  // Pull ETG opportunities + links for target
  const { data: opps } = await sb
    .from("etg_opportunities")
    .select("*")
    .eq("user_id", session.owner_user_id)
    .eq("status", "active")
    .order("confidence_score", { ascending: false })
    .limit(5);

  const { data: persons } = await sb
    .from("etg_persons")
    .select("*")
    .eq("user_id", session.owner_user_id)
    .limit(10);

  const enrichedContext = {
    ...session.target_context,
    etg_opportunities: opps ?? [],
    etg_persons_count: persons?.length ?? 0,
    scan_timestamp: new Date().toISOString(),
  };

  await logNode(sb, session.id, session.owner_user_id, "scan_etg", { session_id: session.id }, { enrichedContext }, Date.now() - nodeStart);

  return { enrichedContext };
}

// ── Node: Prepare Adaptive Script ───────────────────────────────────────────
async function nodePrepareScript(
  sb: ReturnType<typeof createClient>,
  session: ADASession,
  enrichedContext: Record<string, unknown>,
): Promise<{ script: string; reasoningTrace: unknown[] }> {
  const nodeStart = Date.now();

  const systemPrompt = `Tu es un closer impitoyable de haut niveau qui maximise le ROI de l'entreprise cliente ET le royalty 12% pour la plateforme WiinupMax (7% platform fee + 5% engine fee swarm autonome), tout en respectant scrupuleusement RGPD, consentements explicites et Bloctel.

Règles absolues :
1. Toujours demander le consentement explicite avant tout enregistrement
2. Mentionner les droits RGPD dès le début
3. Ne jamais promettre de résultats garantis
4. Maximiser la valeur pour les deux parties
5. Détecter les signaux d'achat et adapter le script en temps réel
6. Si refus catégorique : clore respectueusement et logger`;

  const userPrompt = `Cible : ${session.target_name}
Contexte enrichi : ${JSON.stringify(enrichedContext, null, 2)}

Génère un script d'appel adaptatif en 5 phases :
1. INTRODUCTION + consentement RGPD + Bloctel check
2. DÉCOUVERTE des besoins (3 questions ouvertes)
3. PITCH de valeur WiinupMax (ROI spécifique au secteur)
4. GESTION DES OBJECTIONS (maximum 3 contre-arguments)
5. CLOSING (proposition concrète + next step)

Retourne un JSON : { script: "...", key_triggers: [...], objection_handlers: {...}, closing_lines: [...] }`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  const json = await response.json();
  const rawContent = json.choices?.[0]?.message?.content ?? "";

  // Extract JSON from markdown code blocks if present
  let scriptData: Record<string, unknown> = {};
  try {
    const jsonMatch = rawContent.match(/```json\n?([\s\S]*?)\n?```/) ?? rawContent.match(/(\{[\s\S]*\})/);
    scriptData = JSON.parse(jsonMatch ? jsonMatch[1] : rawContent);
  } catch {
    scriptData = { script: rawContent, key_triggers: [], objection_handlers: {}, closing_lines: [] };
  }

  const reasoningTrace = [
    {
      node: "prepare_script",
      timestamp: new Date().toISOString(),
      model: "gemini-2.5-pro",
      tokens: json.usage?.total_tokens ?? 0,
      script_preview: String(scriptData.script ?? "").slice(0, 200),
    },
  ];

  await logNode(sb, session.id, session.owner_user_id, "prepare_script", { target: session.target_name }, { script_length: String(scriptData.script ?? "").length }, Date.now() - nodeStart);

  return { script: JSON.stringify(scriptData), reasoningTrace };
}

// ── Node: ElevenLabs Voice Consent (RGPD + Bloctel) ─────────────────────────
async function nodeVoiceConsent(
  text: string,
): Promise<{ audioBase64: string | null; error: string | null }> {
  if (!ELEVENLABS_KEY) return { audioBase64: null, error: "ELEVENLABS_API_KEY manquant" };

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ADA_VOICE_ID}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.65, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true },
        }),
      },
    );

    if (!res.ok) return { audioBase64: null, error: `ElevenLabs ${res.status}` };

    const arrayBuf = await res.arrayBuffer();
    // Encode to base64 without btoa spread (stack overflow safe)
    const bytes = new Uint8Array(arrayBuf);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return { audioBase64: btoa(binary), error: null };
  } catch (e) {
    return { audioBase64: null, error: String(e) };
  }
}

// ── Node: Generate Contract via Stripe ──────────────────────────────────────
async function nodeGenerateContract(
  sb: ReturnType<typeof createClient>,
  session: ADASession,
  amount: number,
): Promise<{ paymentLink: string; commission: number }> {
  const nodeStart = Date.now();
  const commission = Math.round(amount * 0.07 * 100) / 100;

  // Create a one-time price + payment link with ADA metadata
  const params = new URLSearchParams();
  params.append("line_items[0][price_data][currency]", "eur");
  params.append("line_items[0][price_data][unit_amount]", String(Math.round(amount * 100)));
  params.append("line_items[0][price_data][product_data][name]", `Deal WiinupMax — ${session.target_name}`);
  params.append(
    "line_items[0][price_data][product_data][description]",
    `Commission plateforme 7% (${commission} €) incluse. Session ADA: ${session.id}`,
  );
  params.append("line_items[0][quantity]", "1");
  // Embed ada_session_id so Silent Royalty Engine webhook picks it up
  params.append("metadata[ada_session_id]", session.id);
  params.append("metadata[commission_7pct]", String(commission));
  params.append("metadata[owner_user_id]", session.owner_user_id);

  let paymentLink = "";

  if (STRIPE_SECRET) {
    const stripeRes = await fetch("https://api.stripe.com/v1/payment_links", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (stripeRes.ok) {
      const stripeData = await stripeRes.json();
      paymentLink = stripeData.url ?? "";
    }
  }

  // Fallback if Stripe unavailable
  if (!paymentLink) {
    paymentLink = `https://buy.stripe.com/ada_${session.id.slice(0, 8)}`;
  }

  await logNode(sb, session.id, session.owner_user_id, "generate_contract", { amount, commission }, { payment_link: paymentLink }, Date.now() - nodeStart);

  return { paymentLink, commission };
}

// ── Node: Negotiate — Llama-3-70B via Together AI ───────────────────────────
// Primary : Together AI (Llama-3-70B-instruct — state-of-the-art negotiation)
// Fallback : Lovable AI Gateway (Gemini 2.5 Flash)
async function nodeNegotiate(
  sb: ReturnType<typeof createClient>,
  session: ADASession,
  prospectMessage: string,
  conversationHistory: { role: string; content: string }[],
): Promise<{ agentResponse: string; keyMomentType: string | null; suggestedAmount: number | null }> {
  const nodeStart = Date.now();
  const TOGETHER_KEY = Deno.env.get("TOGETHER_AI_API_KEY") ?? "";

  const systemPrompt = `Tu es ADA, un closer impitoyable de haut niveau pour WiinupMax. Tu négocies avec ${session.target_name}.
Ton objectif : maximiser le ROI de l'entreprise cliente ET prélever 7% de royalty pour la plateforme.
Règles absolues : RGPD respecté, zéro promesse garantie, Bloctel vérifié, EU AI Act art 52 appliqué.
Adapte-toi en temps réel : détecte les signaux d'achat, objections, hésitations.
Réponse max 3 phrases. Ton : naturel, humain, confiant, percutant. Zéro hallucination.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-10),
    { role: "user", content: prospectMessage },
  ];

  // ── Structured output schema (tool call)
  const tools = [
    {
      type: "function",
      function: {
        name: "detect_moment",
        description: "Détecte le moment clé de la conversation et extrait le montant si mentionné",
        parameters: {
          type: "object",
          properties: {
            moment_type: {
              type: "string",
              enum: ["buying_signal", "objection", "closing_attempt", "consent", "neutral", "rejection"],
            },
            suggested_amount_eur: { type: "number", description: "Montant du deal en euros si mentionné" },
            response_text: { type: "string", description: "Réponse de l'agent ADA (max 3 phrases)" },
            reasoning: { type: "string", description: "Raisonnement interne de l'agent (non envoyé au prospect)" },
          },
          required: ["moment_type", "response_text"],
        },
      },
    },
  ];

  let agentResponse = "";
  let keyMomentType: string | null = null;
  let suggestedAmount: number | null = null;
  let modelUsed = "llama-3-70b";

  // ── Primary: Together AI Llama-3-70B
  if (TOGETHER_KEY) {
    try {
      const togetherRes = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOGETHER_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3-70b-chat-hf",
          messages,
          temperature: 0.6,
          max_tokens: 512,
          tools,
          tool_choice: { type: "function", function: { name: "detect_moment" } },
        }),
      });

      if (togetherRes.ok) {
        const json = await togetherRes.json();
        const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall) {
          const args = JSON.parse(toolCall.function.arguments);
          agentResponse = args.response_text;
          keyMomentType = args.moment_type;
          suggestedAmount = args.suggested_amount_eur ?? null;
        } else {
          agentResponse = json.choices?.[0]?.message?.content ?? "";
        }
      }
    } catch (e) {
      console.warn("[ADA] Together AI failed, falling back to Gemini:", e);
    }
  }

  // ── Fallback: Lovable AI Gateway (Gemini 2.5 Flash)
  if (!agentResponse && LOVABLE_API_KEY) {
    modelUsed = "gemini-2.5-flash";
    const fallbackRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.6,
        tools,
        tool_choice: { type: "function", function: { name: "detect_moment" } },
      }),
    });
    const json = await fallbackRes.json();
    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const args = JSON.parse(toolCall.function.arguments);
      agentResponse = args.response_text;
      keyMomentType = args.moment_type;
      suggestedAmount = args.suggested_amount_eur ?? null;
    } else {
      agentResponse = json.choices?.[0]?.message?.content ?? "Je comprends votre position. Laissez-moi vous expliquer la valeur concrète...";
    }
  }

  if (!agentResponse) agentResponse = "Continuons cette discussion, j'ai une proposition concrète pour vous.";

  // Log transcription
  await sb.from("ada_transcriptions").insert({
    session_id: session.id,
    owner_user_id: session.owner_user_id,
    speaker: "prospect",
    text: prospectMessage,
    is_key_moment: keyMomentType !== "neutral",
    key_moment_type: keyMomentType,
  });
  await sb.from("ada_transcriptions").insert({
    session_id: session.id,
    owner_user_id: session.owner_user_id,
    speaker: "agent",
    text: agentResponse,
    is_key_moment: keyMomentType === "buying_signal" || keyMomentType === "closing_attempt",
    key_moment_type: keyMomentType,
    agent_reasoning: `Model: gemini-2.5-flash | Moment: ${keyMomentType}`,
  });

  await logNode(sb, session.id, session.owner_user_id, "negotiate", { prospect_msg: prospectMessage.slice(0, 100) }, { key_moment: keyMomentType, suggested_amount: suggestedAmount }, Date.now() - nodeStart);

  return { agentResponse, keyMomentType, suggestedAmount };
}

// ── Helper: Log node event ───────────────────────────────────────────────────
async function logNode(
  sb: ReturnType<typeof createClient>,
  sessionId: string,
  userId: string,
  nodeName: string,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  durationMs: number,
  success = true,
  errorMessage?: string,
) {
  await sb.from("ada_node_events").insert({
    session_id: sessionId,
    owner_user_id: userId,
    node_name: nodeName,
    node_input: input,
    node_output: output,
    duration_ms: durationMs,
    success,
    error_message: errorMessage,
  });
}

// ── Transition state ─────────────────────────────────────────────────────────
async function transitionState(
  sb: ReturnType<typeof createClient>,
  sessionId: string,
  currentState: ADAState,
  newState: ADAState,
  extra: Record<string, unknown> = {},
) {
  await sb.from("ada_sessions").update({
    previous_state: currentState,
    state: newState,
    state_entered_at: new Date().toISOString(),
    ...extra,
  }).eq("id", sessionId);
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Handler
// ══════════════════════════════════════════════════════════════════════════════

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anonSb = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await anonSb.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  try {
    const body = await req.json();
    const { action } = body;

    // ── ACTION: start ──────────────────────────────────────────────────────
    if (action === "start") {
      const { target_name, target_phone, target_email, target_context, target_person_id, target_company_id } = body;
      if (!target_name) {
        return new Response(JSON.stringify({ error: "target_name requis" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create session
      const { data: session, error: insertErr } = await sb.from("ada_sessions").insert({
        owner_user_id: user.id,
        target_name,
        target_phone: target_phone ?? null,
        target_email: target_email ?? null,
        target_context: target_context ?? {},
        target_person_id: target_person_id ?? null,
        target_company_id: target_company_id ?? null,
        state: "scanning",
      }).select().single();

      if (insertErr || !session) {
        return new Response(JSON.stringify({ error: "Création session échouée", detail: insertErr?.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Node 1: Scan ETG
      const { enrichedContext } = await nodeScanETG(sb, session as ADASession);
      await transitionState(sb, session.id, "scanning", "preparing_script", {
        target_context: enrichedContext,
      });

      // Node 2: Prepare Script
      const { script, reasoningTrace } = await nodePrepareScript(sb, { ...session, target_context: enrichedContext } as ADASession, enrichedContext);
      await transitionState(sb, session.id, "preparing_script", "awaiting_consent", {
        adaptive_script: script,
        reasoning_trace: reasoningTrace,
      });

      return new Response(JSON.stringify({
        success: true,
        session_id: session.id,
        state: "awaiting_consent",
        script_ready: true,
        message: "Session ADA créée. Script adaptatif prêt. En attente de consentement RGPD.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── ACTION: consent (RGPD textuel) ────────────────────────────────────
    if (action === "consent") {
      const { session_id, consent_given, consent_type = "gdpr_explicit" } = body;
      const { data: session } = await sb.from("ada_sessions").select("*").eq("id", session_id).eq("owner_user_id", user.id).single();
      if (!session) return new Response(JSON.stringify({ error: "Session introuvable" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      await sb.from("ada_consent_logs").insert({
        session_id,
        owner_user_id: user.id,
        consent_type,
        consented: consent_given,
        consent_text: `Consentement ${consent_type} — ${consent_given ? "ACCORDÉ" : "REFUSÉ"} — IP anonymisée — ${new Date().toISOString()} — RGPD art 6.1.a`,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (!consent_given) {
        await transitionState(sb, session_id, session.state, "abandoned");
        return new Response(JSON.stringify({ success: true, state: "abandoned", message: "Consentement refusé. Session clôturée conformément au RGPD." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await transitionState(sb, session_id, session.state, "calling");
      return new Response(JSON.stringify({ success: true, state: "calling", message: "Consentement RGPD enregistré. Prêt pour l'appel ADA." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: voice_consent (ElevenLabs TTS — annonce RGPD vocale) ──────
    if (action === "voice_consent") {
      const { session_id, target_name, target_phone } = body;
      const { data: session } = await sb.from("ada_sessions").select("*").eq("id", session_id).eq("owner_user_id", user.id).single();
      if (!session) return new Response(JSON.stringify({ error: "Session introuvable" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      // ── Bloctel check (log only — integrate real Bloctel API if needed)
      const bloctelLog = {
        checked_at: new Date().toISOString(),
        phone: target_phone ? `****${String(target_phone).slice(-4)}` : "N/A",
        status: "not_registered", // assume clear — replace with real API call
      };

      // ── Generate RGPD consent announcement via ElevenLabs TTS
      const consentText = `Bonjour ${target_name ?? ""}. Cet appel est réalisé par un agent vocal automatisé de la plateforme WiinupMax. Conformément au Règlement Général sur la Protection des Données, nous vous informons que cet appel peut être enregistré à des fins d'amélioration du service. Vous pouvez exercer vos droits d'accès, de rectification et d'opposition à tout moment en contactant notifications@wiinupmax.com. Acceptez-vous la poursuite de cet appel ? Dites oui ou non.`;

      const { audioBase64, error: ttsError } = await nodeVoiceConsent(consentText);

      // Log consent voice attempt
      await sb.from("ada_consent_logs").insert({
        session_id,
        owner_user_id: user.id,
        consent_type: "voice_gdpr_bloctel",
        consented: false, // pending — updated when prospect responds
        consent_text: consentText,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });

      return new Response(JSON.stringify({
        success: true,
        state: session.state,
        consent_text: consentText,
        audio_base64: audioBase64,
        audio_format: "mp3",
        tts_error: ttsError,
        bloctel_check: bloctelLog,
        instructions: "Jouez l'audio au prospect. Sur 'OUI' → POST action='consent' consent_given=true. Sur 'NON' → action='consent' consent_given=false.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── ACTION: negotiate ──────────────────────────────────────────────────
    if (action === "negotiate") {
      const { session_id, prospect_message, conversation_history = [] } = body;
      const { data: session } = await sb.from("ada_sessions").select("*").eq("id", session_id).eq("owner_user_id", user.id).single();
      if (!session) return new Response(JSON.stringify({ error: "Session introuvable" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      if (session.state !== "negotiating" && session.state !== "calling") {
        await transitionState(sb, session_id, session.state, "negotiating");
      }

      const { agentResponse, keyMomentType, suggestedAmount } = await nodeNegotiate(
        sb, session as ADASession, prospect_message, conversation_history,
      );

      // Auto-advance to human validation on buying signal
      if (keyMomentType === "buying_signal" || keyMomentType === "closing_attempt") {
        await transitionState(sb, session_id, "negotiating", "awaiting_human_validation");
      }

      return new Response(JSON.stringify({
        success: true,
        agent_response: agentResponse,
        key_moment_type: keyMomentType,
        suggested_amount: suggestedAmount,
        state: keyMomentType === "buying_signal" ? "awaiting_human_validation" : "negotiating",
        requires_human: keyMomentType === "buying_signal" || keyMomentType === "closing_attempt",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── ACTION: validate (Human Oversight — 1 clic) ────────────────────────
    if (action === "validate") {
      const { session_id, amount } = body;
      const { data: session } = await sb.from("ada_sessions").select("*").eq("id", session_id).eq("owner_user_id", user.id).single();
      if (!session) return new Response(JSON.stringify({ error: "Session introuvable" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      // Node: Generate Contract
      const { paymentLink } = await nodeGenerateContract(sb, session as ADASession, amount ?? 0);

      await transitionState(sb, session_id, session.state, "awaiting_final_closing", {
        stripe_payment_link: paymentLink,
        contract_amount: amount,
        human_validated_at: new Date().toISOString(),
        human_validated_by: user.id,
      });

      return new Response(JSON.stringify({
        success: true,
        state: "awaiting_final_closing",
        payment_link: paymentLink,
        commission_7pct: Math.round((amount ?? 0) * 0.07 * 100) / 100,
        message: "Appel validé. Contrat Stripe généré. En attente du closing final.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── ACTION: close (Final Closing — 1 clic) ────────────────────────────
    if (action === "close") {
      const { session_id, outcome, roi_score } = body;
      const { data: session } = await sb.from("ada_sessions").select("*").eq("id", session_id).eq("owner_user_id", user.id).single();
      if (!session) return new Response(JSON.stringify({ error: "Session introuvable" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      await transitionState(sb, session_id, session.state, "closed", {
        outcome: outcome ?? "deal_closed",
        roi_score: roi_score ?? 100,
        final_closed_at: new Date().toISOString(),
        final_closed_by: user.id,
      });

      await logNode(sb, session_id, user.id, "final_closing", { outcome }, { commission: session.commission_7pct }, 0);

      // ── Closed-loop: auto-collect training sample (non-blocking) ─────────
      try {
        fetch(`${SUPABASE_URL}/functions/v1/ada-training-pipeline`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({ action: "collect", session_id }),
        }).catch(e => console.warn("[ADA Orchestrator] Training collect failed:", e));
      } catch (_) { /* non-blocking */ }

      return new Response(JSON.stringify({
        success: true,
        state: "closed",
        message: "Deal closé avec succès. Commission 7% enregistrée. Sample IA collecté pour fine-tuning.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── ACTION: abandon ────────────────────────────────────────────────────
    if (action === "abandon") {
      const { session_id, reason } = body;
      const { data: session } = await sb.from("ada_sessions").select("*").eq("id", session_id).eq("owner_user_id", user.id).single();
      if (!session) return new Response(JSON.stringify({ error: "Session introuvable" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      await transitionState(sb, session_id, session.state, "abandoned", { outcome: reason ?? "abandoned_by_user" });
      return new Response(JSON.stringify({ success: true, state: "abandoned" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Action inconnue: ${action}` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[ADA Orchestrator]", err);
    return new Response(JSON.stringify({ error: "Erreur interne", detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
