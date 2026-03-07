/**
 * openclaw-gateway
 * ─────────────────
 * Proxy sécurisé entre WIINUP MAX et le vrai gateway OpenClaw de l'utilisateur.
 * - Vérifie l'authentification WIINUP
 * - Vérifie le kill switch global
 * - Vérifie le niveau d'autonomie
 * - Appelle le vrai gateway OpenClaw via son Tools Invoke HTTP API
 * - Journalise chaque appel dans openclaw_logs
 * - Retourne la réponse au frontend
 *
 * POST /openclaw-gateway
 * Authorization: Bearer <user_jwt>
 * Body: {
 *   tool: string,           // outil OpenClaw à invoquer (ex: "sessions_list", "agent_run")
 *   args: object,           // arguments de l'outil
 *   agent_id?: string,      // agent concerné
 *   session_key?: string,   // clé de session OpenClaw (défaut: "main")
 *   dry_run?: boolean,      // simulation sans exécution réelle
 * }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Outils autorisés par niveau d'autonomie
// (protection externe : OpenClaw ne peut pas dépasser le niveau configuré)
const TOOLS_BY_AUTONOMIE: Record<string, string[]> = {
  lecture: [
    "sessions_list", "sessions_get", "contacts_list", "contacts_get",
    "config_get", "skills_list", "agent_status",
  ],
  preparation: [
    "sessions_list", "sessions_get", "contacts_list", "contacts_get",
    "config_get", "skills_list", "agent_status",
    "agent_prepare", "message_draft", "plan_create", "analysis_run",
  ],
  assiste: [
    "sessions_list", "sessions_get", "contacts_list", "contacts_get",
    "config_get", "skills_list", "agent_status",
    "agent_prepare", "message_draft", "plan_create", "analysis_run",
    "agent_run",  // avec validation humaine obligatoire
  ],
  "semi-auto": [
    "sessions_list", "sessions_get", "contacts_list", "contacts_get",
    "config_get", "skills_list", "agent_status",
    "agent_prepare", "message_draft", "plan_create", "analysis_run",
    "agent_run", "message_send", "campaign_start",
  ],
  etendu: [
    // Tous les outils — mais les actions financières/critiques restent avec validation
    "sessions_list", "sessions_get", "contacts_list", "contacts_get",
    "config_get", "skills_list", "agent_status",
    "agent_prepare", "message_draft", "plan_create", "analysis_run",
    "agent_run", "message_send", "campaign_start",
    "contact_create", "contact_update", "list_manage",
    "opportunity_create", "introduction_create",
  ],
};

// Outils qui nécessitent TOUJOURS une validation humaine, peu importe le niveau
const ALWAYS_REQUIRE_VALIDATION = [
  "payment_action", "bulk_send", "mass_campaign", "data_export", "contact_delete",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // ── Auth WIINUP ────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claimsData.claims.sub;

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: {
    tool: string;
    args?: Record<string, unknown>;
    agent_id?: string;
    session_key?: string;
    dry_run?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!body.tool) {
    return new Response(JSON.stringify({ error: "Missing required field: tool" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ── Récupérer la config OpenClaw ───────────────────────────────────────────
  const { data: config } = await serviceClient
    .from("openclaw_config")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // ── Kill Switch global ─────────────────────────────────────────────────────
  if (config?.kill_switch_global) {
    await serviceClient.from("openclaw_logs").insert({
      user_id: userId,
      agent_id: body.agent_id ?? null,
      event_type: "rule_blocked",
      summary: `Action bloquée par le Kill Switch global : ${body.tool}`,
      details: { tool: body.tool, args: body.args, reason: "kill_switch_global" },
      risque: "eleve",
    });
    return new Response(
      JSON.stringify({
        blocked: true,
        reason: "kill_switch_global",
        message: "Le Kill Switch global est activé. Aucune action ne peut être exécutée.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Vérifier le niveau d'autonomie ────────────────────────────────────────
  const autonomieLevel = config?.autonomie_level ?? "preparation";
  const allowedTools = TOOLS_BY_AUTONOMIE[autonomieLevel] ?? TOOLS_BY_AUTONOMIE["preparation"];

  if (!allowedTools.includes(body.tool)) {
    await serviceClient.from("openclaw_logs").insert({
      user_id: userId,
      agent_id: body.agent_id ?? null,
      event_type: "rule_blocked",
      summary: `Outil "${body.tool}" non autorisé au niveau "${autonomieLevel}"`,
      details: { tool: body.tool, autonomie_level: autonomieLevel, allowed_tools: allowedTools },
      risque: "moyen",
    });
    return new Response(
      JSON.stringify({
        blocked: true,
        reason: "autonomie_level",
        message: `L'outil "${body.tool}" n'est pas autorisé au niveau d'autonomie "${autonomieLevel}". Augmentez le niveau dans vos réglages.`,
        current_level: autonomieLevel,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Vérifier si validation humaine requise ────────────────────────────────
  if (ALWAYS_REQUIRE_VALIDATION.includes(body.tool) && !body.dry_run) {
    // Créer une demande de validation
    const { data: validation } = await serviceClient.from("openclaw_validations").insert({
      user_id: userId,
      agent_id: body.agent_id ?? "system",
      type_validation: "action",
      titre: `Action critique : ${body.tool}`,
      description: `L'outil "${body.tool}" nécessite votre validation avant exécution.`,
      consequence_valide: "L'action sera transmise à OpenClaw pour exécution.",
      consequence_refuse: "L'action sera annulée.",
      risque: "eleve",
      payload: { tool: body.tool, args: body.args ?? {} },
    }).select().single();

    return new Response(
      JSON.stringify({
        blocked: false,
        requires_validation: true,
        validation_id: validation?.id,
        message: "Cette action nécessite votre validation. Consultez la Boîte de validation.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Vérifier gateway configuré ────────────────────────────────────────────
  const gatewayUrl = config?.gateway_url;
  if (!gatewayUrl) {
    return new Response(
      JSON.stringify({
        connected: false,
        message: "Aucun gateway OpenClaw configuré. Installez OpenClaw sur votre serveur et configurez l'URL.",
        setup_required: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Appel réel au gateway OpenClaw via Tools Invoke HTTP API ───────────────
  // Doc: https://docs.openclaw.ai/gateway/tools-invoke-http-api/
  const requestId = crypto.randomUUID();
  let gatewayResponse: unknown = null;
  let callSuccess = false;

  // Log de l'appel sortant
  await serviceClient.from("openclaw_logs").insert({
    user_id: userId,
    agent_id: body.agent_id ?? null,
    event_type: "gateway_call",
    summary: `Appel gateway → outil "${body.tool}"`,
    details: {
      tool: body.tool,
      args: body.args ?? {},
      session_key: body.session_key ?? "main",
      dry_run: body.dry_run ?? false,
      request_id: requestId,
    },
    risque: "faible",
    gateway_request_id: requestId,
  });

  try {
    const gatewaySecret = config?.gateway_secret;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
    // Authentification gateway OpenClaw (si configurée)
    if (gatewaySecret) {
      headers["X-Gateway-Secret"] = gatewaySecret;
    }

    const url = gatewayUrl.replace(/\/$/, "");
    const res = await fetch(`${url}/tools/invoke`, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(30000), // 30s timeout
      body: JSON.stringify({
        tool: body.tool,
        action: "json",
        args: body.args ?? {},
        sessionKey: body.session_key ?? "main",
        dryRun: body.dry_run ?? false,
      }),
    });

    if (res.ok) {
      callSuccess = true;
      try {
        gatewayResponse = await res.json();
      } catch {
        gatewayResponse = await res.text();
      }
    } else {
      const errorText = await res.text().catch(() => "unknown error");
      console.error(`[openclaw-gateway] Gateway returned ${res.status}: ${errorText}`);
      gatewayResponse = { error: `Gateway error ${res.status}`, detail: errorText };
    }
  } catch (err) {
    console.error("[openclaw-gateway] Failed to reach gateway:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    gatewayResponse = { error: "Gateway unreachable", detail: errMsg };
  }

  // Log de la réponse
  await serviceClient.from("openclaw_logs").insert({
    user_id: userId,
    agent_id: body.agent_id ?? null,
    event_type: "gateway_response",
    summary: callSuccess
      ? `Réponse reçue de OpenClaw pour "${body.tool}"`
      : `Erreur gateway pour "${body.tool}"`,
    details: { response: gatewayResponse, success: callSuccess, request_id: requestId },
    risque: callSuccess ? "faible" : "moyen",
    gateway_request_id: requestId,
  });

  return new Response(
    JSON.stringify({
      success: callSuccess,
      tool: body.tool,
      response: gatewayResponse,
      request_id: requestId,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
