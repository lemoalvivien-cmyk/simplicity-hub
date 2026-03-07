/**
 * openclaw-validate
 * ──────────────────
 * Approuve ou refuse une validation en attente.
 * - Met à jour openclaw_validations
 * - Si validation approuvée + gateway_callback_url → exécute l'action sur OpenClaw
 * - Journalise la décision humaine
 *
 * POST /openclaw-validate
 * Authorization: Bearer <user_jwt>
 * Body: {
 *   validation_id: string,
 *   decision: "approve" | "reject",
 *   note?: string
 * }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  let body: { validation_id: string; decision: "approve" | "reject"; note?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!body.validation_id || !body.decision) {
    return new Response(JSON.stringify({ error: "Missing validation_id or decision" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ── Récupérer la validation ────────────────────────────────────────────────
  const { data: validation, error: fetchError } = await serviceClient
    .from("openclaw_validations")
    .select("*")
    .eq("id", body.validation_id)
    .eq("user_id", userId)          // sécurité : seul le propriétaire peut valider
    .eq("statut", "en_attente")     // ne traiter que les validations en attente
    .maybeSingle();

  if (fetchError || !validation) {
    return new Response(
      JSON.stringify({ error: "Validation introuvable ou déjà traitée." }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const newStatut = body.decision === "approve" ? "validee" : "refusee";
  const eventType = body.decision === "approve" ? "validation_approved" : "validation_rejected";

  // ── Mettre à jour la validation ───────────────────────────────────────────
  await serviceClient.from("openclaw_validations").update({
    statut: newStatut,
    validated_at: new Date().toISOString(),
    validated_by: userId,
  }).eq("id", body.validation_id);

  // ── Log de la décision humaine ─────────────────────────────────────────────
  await serviceClient.from("openclaw_logs").insert({
    user_id: userId,
    agent_id: validation.agent_id,
    event_type: eventType,
    summary: `Validation ${body.decision === "approve" ? "approuvée" : "refusée"} : ${validation.titre}`,
    details: {
      validation_id: body.validation_id,
      titre: validation.titre,
      agent_id: validation.agent_id,
      decision: body.decision,
      note: body.note ?? null,
      payload: validation.payload,
    },
    risque: validation.risque,
  });

  // ── Si approuvée et gateway disponible → exécuter sur OpenClaw ─────────────
  let gatewayExecuted = false;
  let gatewayResponse: unknown = null;

  if (body.decision === "approve") {
    const { data: config } = await serviceClient
      .from("openclaw_config")
      .select("gateway_url, gateway_secret, kill_switch_global, autonomie_level")
      .eq("user_id", userId)
      .maybeSingle();

    if (config?.gateway_url && !config.kill_switch_global) {
      const payload = validation.payload as Record<string, unknown>;
      const tool = (payload?.tool as string) ?? null;
      const args = (payload?.args as Record<string, unknown>) ?? {};

      if (tool) {
        try {
          const url = config.gateway_url.replace(/\/$/, "");
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "Accept": "application/json",
          };
          if (config.gateway_secret) headers["X-Gateway-Secret"] = config.gateway_secret;

          const res = await fetch(`${url}/tools/invoke`, {
            method: "POST",
            headers,
            signal: AbortSignal.timeout(30000),
            body: JSON.stringify({
              tool,
              action: "json",
              args,
              sessionKey: "main",
              dryRun: false,
            }),
          });

          if (res.ok) {
            gatewayExecuted = true;
            gatewayResponse = await res.json().catch(() => ({}));
          } else {
            const txt = await res.text().catch(() => "");
            console.error(`[openclaw-validate] Gateway execution failed ${res.status}: ${txt}`);
            gatewayResponse = { error: res.status, detail: txt };
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn("[openclaw-validate] Could not execute on gateway:", errMsg);
          gatewayResponse = { error: "unreachable", detail: errMsg };
        }
      }

      // Callback personnalisé si défini
      if (validation.gateway_callback_url && !gatewayExecuted) {
        try {
          await fetch(validation.gateway_callback_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(10000),
            body: JSON.stringify({
              validation_id: body.validation_id,
              decision: body.decision,
              approved: true,
            }),
          });
          gatewayExecuted = true;
        } catch (err) {
          console.warn("[openclaw-validate] Callback failed:", err);
        }
      }
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      decision: body.decision,
      statut: newStatut,
      validation_id: body.validation_id,
      gateway_executed: gatewayExecuted,
      gateway_response: gatewayResponse,
      message: body.decision === "approve"
        ? `Action approuvée${gatewayExecuted ? " et transmise à OpenClaw." : ". Elle sera exécutée dès que possible."}`
        : "Action refusée. Vos agents en ont été informés.",
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
