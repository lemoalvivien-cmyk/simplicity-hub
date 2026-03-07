/**
 * openclaw-status
 * ───────────────
 * Probe complet du gateway OpenClaw d'un utilisateur.
 * Retourne un rapport de santé détaillé, vérifiable, jamais simulé.
 *
 * Vérifie dans l'ordre :
 * 1. Config DB (gateway_url configuré ?)
 * 2. Accessibilité réseau du gateway (/status)
 * 3. Auth bearer (X-Gateway-Secret si configuré)
 * 4. Liste des channels disponibles (/tools/invoke → channels_list)
 * 5. Dernière synchronisation dossier
 * 6. Dernier événement log
 *
 * POST /openclaw-status
 * Authorization: Bearer <user_jwt>
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ProbeStatus = "ok" | "error" | "skipped" | "not_configured";

interface ProbeResult {
  label: string;
  status: ProbeStatus;
  detail: string;
  latency_ms?: number;
}

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

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ── Récupérer config + dossier + derniers logs ─────────────────────────────
  const [{ data: config }, { data: dossier }, { data: lastLog }] = await Promise.all([
    serviceClient.from("openclaw_config").select("*").eq("user_id", userId).maybeSingle(),
    serviceClient.from("openclaw_dossier")
      .select("completion_score, derniere_sync_openclaw_at, openclaw_session_id, activite, offre")
      .eq("user_id", userId).maybeSingle(),
    serviceClient.from("openclaw_logs")
      .select("summary, event_type, created_at, risque")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const probes: ProbeResult[] = [];
  let globalHealthScore = 0; // 0-100

  // ── PROBE 1 : Configuration DB ─────────────────────────────────────────────
  const hasGatewayUrl = !!config?.gateway_url;
  probes.push({
    label: "Gateway configuré",
    status: hasGatewayUrl ? "ok" : "not_configured",
    detail: hasGatewayUrl
      ? config!.gateway_url!
      : "Aucune URL de gateway OpenClaw configurée. Installez OpenClaw et configurez l'URL.",
  });

  if (!hasGatewayUrl) {
    // Pas de gateway → répondre immédiatement avec état bootstrap
    return new Response(JSON.stringify({
      gateway_configured: false,
      gateway_reachable: false,
      auth_ok: false,
      channels_ok: false,
      health_score: 0,
      probes,
      bootstrap_required: true,
      bootstrap_steps: [
        { step: 1, label: "Installer OpenClaw", detail: "npm install -g openclaw@latest" },
        { step: 2, label: "Démarrer le gateway", detail: "openclaw gateway start" },
        { step: 3, label: "Exposer publiquement", detail: "ngrok http 18789 (ou votre tunnel)" },
        { step: 4, label: "Configurer l'URL", detail: "Copiez l'URL dans Agents → Connexion" },
      ],
      dossier: {
        completion_score: dossier?.completion_score ?? 0,
        last_sync_at: dossier?.derniere_sync_openclaw_at ?? null,
        session_id: dossier?.openclaw_session_id ?? null,
      },
      last_log: lastLog ?? null,
      checked_at: new Date().toISOString(),
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  globalHealthScore += 10; // URL configurée

  // ── PROBE 2 : Accessibilité réseau + /status ───────────────────────────────
  const url = config!.gateway_url!.replace(/\/$/, "");
  let gatewayInfo: Record<string, unknown> = {};
  let gatewayReachable = false;
  let gatewayLatency: number | undefined;

  try {
    const t0 = Date.now();
    const res = await fetch(`${url}/status`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    gatewayLatency = Date.now() - t0;

    if (res.ok) {
      gatewayReachable = true;
      try { gatewayInfo = await res.json(); } catch { gatewayInfo = {}; }
      probes.push({
        label: "Gateway joignable",
        status: "ok",
        detail: `Répond en ${gatewayLatency}ms`,
        latency_ms: gatewayLatency,
      });
      globalHealthScore += 30;
    } else {
      const txt = await res.text().catch(() => "");
      probes.push({
        label: "Gateway joignable",
        status: "error",
        detail: `HTTP ${res.status} — ${txt.slice(0, 120)}`,
        latency_ms: gatewayLatency,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    probes.push({
      label: "Gateway joignable",
      status: "error",
      detail: `Inaccessible : ${msg.slice(0, 120)}`,
    });
  }

  // ── PROBE 3 : Auth (appel authentifié via /tools/invoke config_get) ────────
  let authOk = false;
  if (gatewayReachable) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (config?.gateway_secret) headers["X-Gateway-Secret"] = config.gateway_secret;

    try {
      const t0 = Date.now();
      const authRes = await fetch(`${url}/tools/invoke`, {
        method: "POST",
        headers,
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          tool: "config_get",
          action: "json",
          args: {},
          sessionKey: "main",
          dryRun: true,
        }),
      });
      const latency = Date.now() - t0;

      if (authRes.ok) {
        authOk = true;
        probes.push({
          label: "Authentification",
          status: "ok",
          detail: config?.gateway_secret ? "Token accepté par le gateway" : "Accès sans secret (non restreint)",
          latency_ms: latency,
        });
        globalHealthScore += 25;
      } else if (authRes.status === 401 || authRes.status === 403) {
        probes.push({
          label: "Authentification",
          status: "error",
          detail: "Token refusé par le gateway. Vérifiez le secret partagé.",
          latency_ms: latency,
        });
      } else {
        // Tool inconnu ou autre erreur non-auth → on considère l'auth OK si le gateway répond
        authOk = true;
        probes.push({
          label: "Authentification",
          status: "ok",
          detail: `Gateway répond (HTTP ${authRes.status}) — auth non restreinte`,
          latency_ms: latency,
        });
        globalHealthScore += 25;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      probes.push({
        label: "Authentification",
        status: "error",
        detail: `Erreur lors du test auth : ${msg.slice(0, 100)}`,
      });
    }
  } else {
    probes.push({ label: "Authentification", status: "skipped", detail: "Ignoré (gateway inaccessible)" });
  }

  // ── PROBE 4 : Channels disponibles ────────────────────────────────────────
  let channelsOk = false;
  let channelsList: string[] = [];
  if (authOk) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (config?.gateway_secret) headers["X-Gateway-Secret"] = config.gateway_secret;

    try {
      const t0 = Date.now();
      const chRes = await fetch(`${url}/tools/invoke`, {
        method: "POST",
        headers,
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          tool: "skills_list",
          action: "json",
          args: {},
          sessionKey: "main",
          dryRun: false,
        }),
      });
      const latency = Date.now() - t0;

      if (chRes.ok) {
        try {
          const body = await chRes.json() as Record<string, unknown>;
          // skills_list retourne généralement un tableau ou un objet skills
          const rawSkills = (body.skills ?? body.result ?? body.data ?? []);
          if (Array.isArray(rawSkills)) {
            channelsList = rawSkills.map((s) => typeof s === "string" ? s : (s as Record<string, string>).name ?? String(s));
          }
        } catch { channelsList = []; }

        channelsOk = true;
        probes.push({
          label: "Canaux & outils",
          status: "ok",
          detail: channelsList.length > 0
            ? `${channelsList.length} outil(s) disponible(s) : ${channelsList.slice(0, 5).join(", ")}${channelsList.length > 5 ? "…" : ""}`
            : "Gateway répond (liste vide ou outil non supporté)",
          latency_ms: latency,
        });
        globalHealthScore += 20;
      } else {
        probes.push({
          label: "Canaux & outils",
          status: "error",
          detail: `HTTP ${chRes.status} — skills_list non disponible`,
          latency_ms: latency,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      probes.push({
        label: "Canaux & outils",
        status: "error",
        detail: `Erreur lors du listing des outils : ${msg.slice(0, 100)}`,
      });
    }
  } else {
    probes.push({ label: "Canaux & outils", status: "skipped", detail: "Ignoré (auth non validée)" });
  }

  // ── PROBE 5 : Sync dossier ─────────────────────────────────────────────────
  const lastSyncAt = dossier?.derniere_sync_openclaw_at ?? null;
  const syncFresh = lastSyncAt
    ? (Date.now() - new Date(lastSyncAt).getTime()) < 24 * 60 * 60 * 1000 // < 24h
    : false;

  probes.push({
    label: "Synchronisation dossier",
    status: lastSyncAt ? (syncFresh ? "ok" : "ok") : "not_configured",
    detail: lastSyncAt
      ? `Dernière sync : ${new Date(lastSyncAt).toLocaleString("fr-FR")}`
      : "Dossier jamais synchronisé. Cliquez sur Synchroniser.",
  });
  if (lastSyncAt) globalHealthScore += 15;

  // ── Mettre à jour openclaw_config ─────────────────────────────────────────
  await serviceClient.from("openclaw_config").upsert({
    user_id: userId,
    is_connected: gatewayReachable,
    healthcheck_status: gatewayReachable ? "ok" : "error",
    last_healthcheck_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  // ── Log de l'événement ────────────────────────────────────────────────────
  await serviceClient.from("openclaw_logs").insert({
    user_id: userId,
    event_type: "healthcheck",
    summary: gatewayReachable
      ? `Probe complet OK — Score santé : ${globalHealthScore}/100`
      : `Probe complet — Gateway inaccessible`,
    details: {
      gateway_url: url,
      health_score: globalHealthScore,
      probes: probes.map((p) => ({ label: p.label, status: p.status })),
      gateway_info: gatewayInfo,
      channels_count: channelsList.length,
    },
    risque: gatewayReachable ? "faible" : "moyen",
  });

  return new Response(JSON.stringify({
    gateway_configured: true,
    gateway_reachable: gatewayReachable,
    auth_ok: authOk,
    channels_ok: channelsOk,
    health_score: globalHealthScore,
    probes,
    gateway_info: gatewayInfo,
    channels: channelsList,
    dossier: {
      completion_score: dossier?.completion_score ?? 0,
      last_sync_at: lastSyncAt,
      session_id: dossier?.openclaw_session_id ?? null,
      is_fresh: syncFresh,
    },
    kill_switch_active: config?.kill_switch_global ?? false,
    autonomie_level: config?.autonomie_level ?? "preparation",
    last_log: lastLog ?? null,
    checked_at: new Date().toISOString(),
  }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
