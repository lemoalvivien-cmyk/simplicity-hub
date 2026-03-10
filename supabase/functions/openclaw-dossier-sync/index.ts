/**
 * openclaw-dossier-sync
 * ──────────────────────
 * Synchronise le dossier entreprise WIINUP MAX avec le vrai gateway OpenClaw.
 * 
 * 1. Lit le dossier depuis openclaw_dossier
 * 2. Structure le contexte pour OpenClaw
 * 3. L'envoie au gateway via un skill "wiinup-context"
 * 4. Met à jour derniere_sync_openclaw_at + openclaw_session_id
 * 5. Crée les agents dans openclaw_agents si pas encore présents
 *
 * POST /openclaw-dossier-sync
 * Authorization: Bearer <user_jwt>
 * Body: { force?: boolean }  // force resync même si récente
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Définition des 6 agents spécialisés avec leurs outils par défaut
const DEFAULT_AGENTS = [
  {
    agent_id: "stratege",
    nom: "Agent Stratège",
    role: "Analyse & Priorités",
    outils_autorises: [
      { label: "Dossier entreprise", niveau: "lecture" },
      { label: "Contacts", niveau: "lecture" },
      { label: "Missions", niveau: "lecture" },
      { label: "Campagnes", niveau: "preparation" },
      { label: "Messages", niveau: "bloque" },
      { label: "Envoi email", niveau: "bloque" },
    ],
  },
  {
    agent_id: "sourcing",
    nom: "Agent Sourcing",
    role: "Recherche & Opportunités",
    outils_autorises: [
      { label: "Contacts", niveau: "lecture" },
      { label: "Listes", niveau: "preparation" },
      { label: "Missions", niveau: "lecture" },
      { label: "Introductions", niveau: "preparation" },
      { label: "Envoi email", niveau: "bloque" },
      { label: "LinkedIn", niveau: "bloque" },
    ],
  },
  {
    agent_id: "message",
    nom: "Agent Message",
    role: "Rédaction & Personnalisation",
    outils_autorises: [
      { label: "Contacts", niveau: "lecture" },
      { label: "Messages", niveau: "preparation" },
      { label: "Campagnes", niveau: "lecture" },
      { label: "Envoi email", niveau: "assiste" },
      { label: "LinkedIn", niveau: "assiste" },
      { label: "Téléphone", niveau: "bloque" },
    ],
  },
  {
    agent_id: "execution",
    nom: "Agent Exécution",
    role: "Actions & Lancement",
    outils_autorises: [
      { label: "Campagnes", niveau: "assiste" },
      { label: "Actions", niveau: "assiste" },
      { label: "Envoi email", niveau: "assiste" },
      { label: "LinkedIn", niveau: "assiste" },
      { label: "Contacts", niveau: "lecture" },
      { label: "Imports", niveau: "bloque" },
    ],
  },
  {
    agent_id: "qualification",
    nom: "Agent Qualification",
    role: "Tri & Détection",
    outils_autorises: [
      { label: "Contacts", niveau: "preparation" },
      { label: "Opportunités", niveau: "preparation" },
      { label: "Introductions", niveau: "assiste" },
      { label: "Gains", niveau: "lecture" },
      { label: "Missions", niveau: "lecture" },
      { label: "Envoi email", niveau: "bloque" },
    ],
  },
  {
    agent_id: "controle",
    nom: "Agent Contrôle",
    role: "Sécurité & Surveillance",
    outils_autorises: [
      { label: "Tous les agents", niveau: "lecture" },
      { label: "Logs & Audit", niveau: "lecture" },
      { label: "Règles de sécurité", niveau: "preparation" },
      { label: "Kill Switch", niveau: "execution" },
      { label: "Validations", niveau: "execution" },
      { label: "Envoi email", niveau: "bloque" },
    ],
  },
];

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

  // ── Récupérer dossier + config ─────────────────────────────────────────────
  const [{ data: dossier }, { data: config }] = await Promise.all([
    serviceClient.from("openclaw_dossier").select("*").eq("user_id", userId).maybeSingle(),
    serviceClient.from("openclaw_config").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  // ── Créer/mettre à jour les agents dans la DB ──────────────────────────────
  for (const agent of DEFAULT_AGENTS) {
    await serviceClient.from("openclaw_agents").upsert(
      {
        user_id: userId,
        ...agent,
        statut: config?.kill_switch_global ? "pause" : "pause", // démarrent en pause
      },
      { onConflict: "user_id,agent_id", ignoreDuplicates: false }
    );
  }

  // ── Si pas de gateway configuré, on s'arrête ici (agents créés en DB) ──────
  if (!config?.gateway_url) {
    await serviceClient.from("openclaw_logs").insert({
      user_id: userId,
      event_type: "dossier_sent",
      summary: "Agents initialisés en base. Gateway OpenClaw non encore configuré.",
      details: {
        agents_created: DEFAULT_AGENTS.map((a) => a.agent_id),
        dossier_available: !!dossier,
        note: "Configurez l'URL du gateway OpenClaw pour activer la synchronisation réelle.",
      },
      risque: "faible",
    });

    return new Response(
      JSON.stringify({
        success: true,
        gateway_connected: false,
        agents_initialized: DEFAULT_AGENTS.length,
        message: "Agents initialisés en base. Configurez votre gateway OpenClaw pour activer le cerveau central.",
        setup_required: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Structurer le contexte OpenClaw depuis le dossier ─────────────────────
  const wiinupContext = {
    // Identité
    platform: "WIINUP MAX",
    user_id: userId,
    session_label: `wiinup_${userId.slice(0, 8)}`,

    // Dossier entreprise
    company: {
      activity: dossier?.activite ?? "Non renseigné",
      offer: dossier?.offre ?? "Non renseigné",
      value_proposition: dossier?.valeur_proposee ?? "Non renseigné",
      use_cases: dossier?.cas_usage ?? "Non renseigné",
    },
    target: {
      ideal_client: dossier?.cible_ideale ?? "Non renseigné",
      company_type: dossier?.type_entreprise ?? "Non renseigné",
      company_size: dossier?.taille_cible ?? "Non renseigné",
      decision_maker: dossier?.type_decideur ?? "Non renseigné",
    },
    geography: {
      zone: dossier?.zone_geo ?? "France",
      cities: dossier?.villes ?? "Non renseigné",
      priority_sectors: dossier?.secteurs_prioritaires ?? "Non renseigné",
      exclusions: dossier?.exclusions_geo ?? "Aucune",
    },
    prospecting: {
      mode: dossier?.mode_prospection ?? "assiste",
      allowed_channels: dossier?.canaux_autorises ?? [],
      forbidden_channels: dossier?.canaux_interdits ?? [],
    },
    goals: {
      opportunities: dossier?.objectif_opportunites ?? 0,
      introductions: dossier?.objectif_introductions ?? 0,
      meetings: dossier?.objectif_rdv ?? 0,
      priority_sector: dossier?.priorite_secteur ?? "Non renseigné",
    },
    tone: {
      style: dossier?.ton_messages ?? "professionnel",
      formality: dossier?.niveau_formalite ?? "formel",
      commercial_style: dossier?.style_commercial ?? "Non renseigné",
      main_angle: dossier?.angle_principal ?? "Non renseigné",
    },
    constraints: {
      forbidden_clients: dossier?.clients_interdits ?? "Aucun",
      sensitive_actions: dossier?.actions_sensibles ?? "Aucune",
      human_validation_required: dossier?.validation_humaine_requise ?? true,
      autonomy_level: config?.autonomie_level ?? "preparation",
      kill_switch_active: config?.kill_switch_global ?? false,
    },

    // Agents disponibles
    agents: DEFAULT_AGENTS.map((a) => ({
      id: a.agent_id,
      name: a.nom,
      role: a.role,
      tools: a.outils_autorises,
    })),
  };

  // ── Envoyer le contexte au vrai gateway OpenClaw ───────────────────────────
  // On utilise le skill "memory_write" ou "context_set" pour injecter le dossier
  let syncSuccess = false;
  let sessionId: string | null = config?.openclaw_session_id ?? null;
  let gatewayDetail: unknown = null;

  try {
    const url = config.gateway_url.replace(/\/$/, "");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
    if (config?.gateway_secret) {
      headers["X-Gateway-Secret"] = config.gateway_secret;
    }

    // Envoyer le contexte via Tools Invoke API
    const res = await fetch(`${url}/tools/invoke`, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        tool: "memory_write",
        action: "json",
        args: {
          key: "wiinup_context",
          value: wiinupContext,
          namespace: "wiinup_max",
        },
        sessionKey: "main",
        dryRun: false,
      }),
    });

    if (res.ok) {
      syncSuccess = true;
      gatewayDetail = await res.json().catch(() => ({}));
      // Extraire l'ID de session si présent dans la réponse
      if (typeof gatewayDetail === "object" && gatewayDetail !== null) {
        const detail = gatewayDetail as Record<string, unknown>;
        sessionId = (detail.session_id as string) ?? (detail.sessionId as string) ?? sessionId;
      }
    } else {
      const txt = await res.text().catch(() => "");
      console.error(`[openclaw-dossier-sync] Gateway error ${res.status}: ${txt}`);
      gatewayDetail = { error: `${res.status}`, detail: txt };
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[openclaw-dossier-sync] Failed:", errMsg);
    gatewayDetail = { error: "unreachable", detail: errMsg };
  }

  // ── Mettre à jour les métadonnées ──────────────────────────────────────────
  if (syncSuccess) {
    await serviceClient.from("openclaw_dossier").upsert({
      user_id: userId,
      derniere_sync_openclaw_at: new Date().toISOString(),
      openclaw_session_id: sessionId,
    }, { onConflict: "user_id" });
  }

  // ── Log ───────────────────────────────────────────────────────────────────
  await serviceClient.from("openclaw_logs").insert({
    user_id: userId,
    event_type: "dossier_sent",
    summary: syncSuccess
      ? "Dossier entreprise synchronisé avec OpenClaw"
      : "Échec de synchronisation du dossier avec OpenClaw",
    details: {
      gateway_url: config.gateway_url,
      sync_success: syncSuccess,
      session_id: sessionId,
      context_keys: Object.keys(wiinupContext),
      gateway_response: gatewayDetail,
    },
    risque: syncSuccess ? "faible" : "moyen",
  });

  return new Response(
    JSON.stringify({
      success: syncSuccess,
      gateway_connected: syncSuccess,
      session_id: sessionId,
      context_sent: wiinupContext,
      agents_count: DEFAULT_AGENTS.length,
      message: syncSuccess
        ? "Dossier entreprise envoyé à OpenClaw. Les agents sont prêts."
        : "Le gateway est configuré mais n'a pas répondu correctement. Vérifiez qu'OpenClaw est démarré.",
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
