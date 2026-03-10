/**
 * openclaw-kill-switch
 * ─────────────────────
 * Active / désactive le kill switch (global ou par agent).
 * - Met à jour openclaw_config ou openclaw_agents
 * - Si kill switch global → informe également le gateway OpenClaw (abort sessions)
 * - Journalise l'événement
 *
 * POST /openclaw-kill-switch
 * Authorization: Bearer <user_jwt>
 * Body: {
 *   type: "global" | "agent",
 *   agent_id?: string,       // requis si type = "agent"
 *   activate: boolean,       // true = activer le kill switch, false = désactiver
 *   reason?: string          // optionnel : raison humaine
 * }
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // ── Auth ──────────────────────────────────────────────────────────────────
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
    type: "global" | "agent";
    agent_id?: string;
    activate: boolean;
    reason?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (body.type === "agent" && !body.agent_id) {
    return new Response(JSON.stringify({ error: "agent_id required when type='agent'" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const eventType = body.activate ? "kill_switch_activated" : "kill_switch_deactivated";
  const action = body.activate ? "activé" : "désactivé";

  if (body.type === "global") {
    // ── Kill switch global ───────────────────────────────────────────────────
    await serviceClient.from("openclaw_config").upsert(
      { user_id: userId, kill_switch_global: body.activate },
      { onConflict: "user_id" }
    );

    // Si on active, mettre tous les agents en pause
    if (body.activate) {
      await serviceClient.from("openclaw_agents")
        .update({ statut: "pause" })
        .eq("user_id", userId);
    }

    // Informer le gateway si accessible (best-effort)
    const { data: config } = await serviceClient
      .from("openclaw_config").select("gateway_url, gateway_secret").eq("user_id", userId).maybeSingle();

    if (config?.gateway_url && body.activate) {
      try {
        const url = config.gateway_url.replace(/\/$/, "");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (config.gateway_secret) headers["X-Gateway-Secret"] = config.gateway_secret;

        // Tenter d'envoyer un signal d'arrêt au gateway OpenClaw
        // OpenClaw expose sessions_abort pour arrêter toutes les sessions
        await fetch(`${url}/tools/invoke`, {
          method: "POST",
          headers,
          signal: AbortSignal.timeout(5000),
          body: JSON.stringify({
            tool: "sessions_abort",
            action: "json",
            args: { reason: "wiinup_kill_switch", reason_human: body.reason ?? "Kill switch activé par l'utilisateur" },
            sessionKey: "main",
          }),
        });
      } catch (err) {
        console.warn("[kill-switch] Could not reach gateway to abort sessions:", err);
        // Non-bloquant : le kill switch DB est suffisant
      }
    }

    await serviceClient.from("openclaw_logs").insert({
      user_id: userId,
      event_type: eventType,
      summary: `Kill Switch global ${action}${body.reason ? ` : ${body.reason}` : ""}`,
      details: { type: "global", activate: body.activate, reason: body.reason ?? null },
      risque: body.activate ? "eleve" : "faible",
    });

    return new Response(
      JSON.stringify({
        success: true,
        type: "global",
        active: body.activate,
        message: body.activate
          ? "Kill Switch global activé. Tous les agents sont en pause. Aucune action ne sera exécutée."
          : "Kill Switch global désactivé. Vous pouvez réactiver vos agents.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } else {
    // ── Kill switch par agent ─────────────────────────────────────────────────
    await serviceClient.from("openclaw_agents")
      .update({
        kill_switch: body.activate,
        statut: body.activate ? "pause" : "pause", // reste en pause jusqu'à activation explicite
      })
      .eq("user_id", userId)
      .eq("agent_id", body.agent_id!);

    await serviceClient.from("openclaw_logs").insert({
      user_id: userId,
      agent_id: body.agent_id,
      event_type: eventType,
      summary: `Kill Switch ${action} pour l'agent ${body.agent_id}`,
      details: { type: "agent", agent_id: body.agent_id, activate: body.activate, reason: body.reason ?? null },
      risque: body.activate ? "moyen" : "faible",
    });

    return new Response(
      JSON.stringify({
        success: true,
        type: "agent",
        agent_id: body.agent_id,
        active: body.activate,
        message: body.activate
          ? `L'agent ${body.agent_id} a été mis en pause.`
          : `L'agent ${body.agent_id} peut être réactivé.`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
