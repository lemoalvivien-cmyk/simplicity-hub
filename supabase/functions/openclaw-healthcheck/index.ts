/**
 * openclaw-healthcheck
 * ────────────────────
 * Vérifie que le gateway OpenClaw de l'utilisateur est joignable.
 * Appelé périodiquement depuis l'UI pour mettre à jour openclaw_config.
 *
 * POST /openclaw-healthcheck
 * Authorization: Bearer <user_jwt>
 * Body: { gateway_url?: string }  (optionnel : utilise la config DB si absent)
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

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

  // ── Récupérer gateway_url ─────────────────────────────────────────────────
  let gatewayUrl: string | null = null;

  try {
    const body = await req.json().catch(() => ({}));
    gatewayUrl = body.gateway_url ?? null;
  } catch (_) { /* ignore */ }

  if (!gatewayUrl) {
    const { data: config } = await supabase
      .from("openclaw_config")
      .select("gateway_url")
      .eq("user_id", userId)
      .maybeSingle();
    gatewayUrl = config?.gateway_url ?? null;
  }

  if (!gatewayUrl) {
    return new Response(
      JSON.stringify({ connected: false, status: "no_gateway", message: "Aucune URL de gateway configurée." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Ping le gateway OpenClaw ───────────────────────────────────────────────
  // OpenClaw expose /status sur son gateway HTTP (même port que WS : 18789 par défaut)
  let connected = false;
  let gatewayInfo: Record<string, unknown> = {};

  try {
    const url = gatewayUrl.replace(/\/$/, "");
    const res = await fetch(`${url}/status`, {
      method: "GET",
      signal: AbortSignal.timeout(5000), // 5s timeout
      headers: { "Accept": "application/json" },
    });

    if (res.ok) {
      connected = true;
      try { gatewayInfo = await res.json(); } catch (_) { gatewayInfo = {}; }
    }
  } catch (err) {
    console.error("[openclaw-healthcheck] Gateway unreachable:", err);
  }

  const healthStatus = connected ? "ok" : "error";

  // ── Mettre à jour openclaw_config ─────────────────────────────────────────
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  await serviceClient.from("openclaw_config").upsert({
    user_id: userId,
    is_connected: connected,
    healthcheck_status: healthStatus,
    last_healthcheck_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  // ── Log de l'événement ────────────────────────────────────────────────────
  await serviceClient.from("openclaw_logs").insert({
    user_id: userId,
    event_type: "healthcheck",
    summary: connected
      ? `Gateway OpenClaw joignable : ${gatewayUrl}`
      : `Gateway OpenClaw inaccessible : ${gatewayUrl}`,
    details: { gateway_url: gatewayUrl, status: healthStatus, gateway_info: gatewayInfo },
    risque: "faible",
  });

  return new Response(
    JSON.stringify({
      connected,
      status: healthStatus,
      gateway_url: gatewayUrl,
      gateway_info: gatewayInfo,
      checked_at: new Date().toISOString(),
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
