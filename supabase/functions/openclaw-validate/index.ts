/**
 * openclaw-validate — SECURITY HARDENED v2
 * SSRF fix: gateway_callback_url est ignoré.
 * L'exécution gateway passe uniquement par le gateway_url de openclaw_config
 * qui est configuré par l'utilisateur et validé côté serveur.
 * Aucun fetch arbitraire sur des URL fournies par les données DB.
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

// SECURITY: allowlist de schémas autorisés pour les gateway URLs
function isAllowedGatewayUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Uniquement HTTPS autorisé. HTTP bloqué (MITM risk).
    // Pas de localhost/loopback (SSRF interne).
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") return false;
    if (host.endsWith(".local") || host.endsWith(".internal")) return false;
    // Bloquer les IPs privées RFC1918
    const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4) {
      const [, a, b] = ipv4.map(Number);
      if (a === 10) return false;
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 192 && b === 168) return false;
    }
    return true;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

  const { data: validation, error: fetchError } = await serviceClient
    .from("openclaw_validations")
    .select("id, titre, agent_id, risque, payload, statut")
    .eq("id", body.validation_id)
    .eq("user_id", userId)
    .eq("statut", "en_attente")
    .maybeSingle();

  if (fetchError || !validation) {
    return new Response(
      JSON.stringify({ error: "Validation introuvable ou déjà traitée." }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const newStatut = body.decision === "approve" ? "validee" : "refusee";
  const eventType = body.decision === "approve" ? "validation_approved" : "validation_rejected";

  await serviceClient.from("openclaw_validations").update({
    statut: newStatut,
    validated_at: new Date().toISOString(),
    validated_by: userId,
  }).eq("id", body.validation_id);

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

  // SECURITY: SSRF fix — gateway_callback_url sur la validation est IGNORÉ.
  // Seul le gateway_url configuré par l'utilisateur dans openclaw_config est utilisé.
  // Ce gateway_url est validé contre l'allowlist HTTPS avant tout fetch.
  let gatewayExecuted = false;
  let gatewayResponse: unknown = null;

  if (body.decision === "approve") {
    const { data: config } = await serviceClient
      .from("openclaw_config")
      .select("gateway_url, gateway_secret, kill_switch_global, autonomie_level")
      .eq("user_id", userId)
      .maybeSingle();

    if (config?.gateway_url && !config.kill_switch_global) {
      // SECURITY: validate gateway_url against allowlist before fetching
      if (!isAllowedGatewayUrl(config.gateway_url)) {
        console.warn(`[openclaw-validate] Blocked gateway_url: ${config.gateway_url}`);
        gatewayResponse = { error: "gateway_url_blocked", reason: "URL non autorisée (doit être HTTPS publique)" };
      } else {
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
              body: JSON.stringify({ tool, action: "json", args, sessionKey: "main", dryRun: false }),
            });

            if (res.ok) {
              gatewayExecuted = true;
              gatewayResponse = await res.json().catch(() => ({}));
            } else {
              const txt = await res.text().catch(() => "");
              console.error(`[openclaw-validate] Gateway error ${res.status}: ${txt}`);
              gatewayResponse = { error: res.status, detail: txt };
            }
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            console.warn("[openclaw-validate] Gateway unreachable:", errMsg);
            gatewayResponse = { error: "unreachable", detail: errMsg };
          }
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
