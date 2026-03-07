/**
 * openclaw-channel-probe
 * ──────────────────────
 * Sonde un canal OpenClaw via le gateway réel de l'utilisateur.
 * - Si gateway configuré → appel réel /channels/{channel_id}/probe
 * - Si gateway absent   → retourne status "no_gateway" explicite
 * - Jamais de simulation, jamais de latence aléatoire
 *
 * POST /openclaw-channel-probe
 * Authorization: Bearer <user_jwt>
 * Body: { channel_id: string }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Canaux qui sont opérationnels côté plateforme WIINUP
// sans nécessiter de gateway externe (intégration native)
const NATIVE_CHANNELS = ["email", "introduction"];

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
  let channelId: string;
  try {
    const body = await req.json();
    if (!body.channel_id) throw new Error("Missing channel_id");
    channelId = body.channel_id;
  } catch {
    return new Response(JSON.stringify({ error: "Missing required field: channel_id" }), {
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
    .select("gateway_url, gateway_secret, kill_switch_global")
    .eq("user_id", userId)
    .maybeSingle();

  const probeStart = Date.now();
  let probeStatus: string;
  let probeDetail: string;
  let isReady = false;
  let latencyMs: number | null = null;
  let probeSource: "live_gateway" | "native_platform" | "no_gateway";

  // ── Canal natif WIINUP (email, introductions) ──────────────────────────────
  if (NATIVE_CHANNELS.includes(channelId)) {
    // Ces canaux sont gérés directement par WIINUP — pas besoin de gateway
    probeSource = "native_platform";
    isReady = true;
    probeStatus = "pret";
    probeDetail = "Canal intégré WIINUP — opérationnel sans gateway externe.";
    latencyMs = Date.now() - probeStart; // mesure réelle (quelques ms)
  }

  // ── Kill switch actif ──────────────────────────────────────────────────────
  else if (config?.kill_switch_global) {
    probeSource = "live_gateway";
    isReady = false;
    probeStatus = "erreur";
    probeDetail = "Kill Switch global activé. Canal suspendu.";
    latencyMs = null;
  }

  // ── Pas de gateway configuré ───────────────────────────────────────────────
  else if (!config?.gateway_url) {
    probeSource = "no_gateway";
    isReady = false;
    probeStatus = "non_configure";
    probeDetail = "Aucun gateway OpenClaw configuré. Installez OpenClaw sur votre serveur pour activer ce canal.";
    latencyMs = null;
  }

  // ── Appel réel au gateway ──────────────────────────────────────────────────
  else {
    probeSource = "live_gateway";
    try {
      const gatewayUrl = config.gateway_url.replace(/\/$/, "");
      const headers: Record<string, string> = {
        "Accept": "application/json",
        "Content-Type": "application/json",
      };
      if (config.gateway_secret) {
        headers["X-Gateway-Secret"] = config.gateway_secret;
      }

      const res = await fetch(`${gatewayUrl}/channels/${channelId}/probe`, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(8000),
      });

      latencyMs = Date.now() - probeStart;

      if (res.ok) {
        let body: Record<string, unknown> = {};
        try { body = await res.json(); } catch { /* ignore */ }
        isReady = body.ready === true || body.status === "ready" || body.status === "pret";
        probeStatus = isReady ? "pret" : (body.status as string) || "assiste";
        probeDetail = (body.detail as string) || (body.message as string) || "Canal sondé via gateway OpenClaw.";
      } else {
        isReady = false;
        probeStatus = "erreur";
        const errText = await res.text().catch(() => "");
        probeDetail = `Gateway a retourné ${res.status}${errText ? ` : ${errText.slice(0, 80)}` : ""}.`;
      }
    } catch (err) {
      latencyMs = Date.now() - probeStart;
      isReady = false;
      probeStatus = "erreur";
      const msg = err instanceof Error ? err.message : String(err);
      probeDetail = `Gateway inaccessible : ${msg.slice(0, 100)}.`;
    }
  }

  const probedAt = new Date().toISOString();

  // ── Mettre à jour le canal en base ────────────────────────────────────────
  await serviceClient
    .from("openclaw_channels")
    .update({
      status: probeStatus,
      is_ready: isReady,
      probe_latency_ms: latencyMs,
      probe_detail: probeDetail,
      last_probe_at: probedAt,
      // Stocker la source dans le config JSON
      config: { probe_source: probeSource },
    })
    .eq("user_id", userId)
    .eq("channel_id", channelId);

  // ── Log de l'événement ────────────────────────────────────────────────────
  await serviceClient.from("openclaw_logs").insert({
    user_id: userId,
    event_type: "channel_probe",
    summary: `Probe canal "${channelId}" → ${probeStatus} (${probeSource})`,
    details: {
      channel_id: channelId,
      status: probeStatus,
      is_ready: isReady,
      latency_ms: latencyMs,
      probe_source: probeSource,
      detail: probeDetail,
    },
    risque: "faible",
  });

  return new Response(
    JSON.stringify({
      channel_id: channelId,
      status: probeStatus,
      is_ready: isReady,
      latency_ms: latencyMs,
      probe_source: probeSource,
      detail: probeDetail,
      probed_at: probedAt,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
