/**
 * openclaw-job-executor
 * ─────────────────────
 * Real execution engine for OpenClaw business jobs.
 * Produces actual business outputs: recommendations, actions,
 * briefs, trust updates, opportunity rescoring.
 *
 * Job types:
 *   radar_scan | hot_opportunity_rescore | passive_offer_refresh
 *   facilitator_match_refresh | approval_reminder | trust_recompute
 *   daily_brief_generate | passive_alert_digest
 *   next_best_action_generate | stuck_pipeline_recheck
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface JobRequest {
  job_type: string;
  job_id?: string;
  session_id?: string;
  trigger_source?: string;
  gateway_url?: string;
}

interface ExecutionResult {
  execution_id: string;
  status: "termine" | "erreur" | "bloque";
  output_summary: string;
  output_count: number;
  recommendations_created: number;
  actions_created: number;
  alerts_created: number;
  trust_updates: number;
  opportunities_rescored: number;
  error?: string;
  result_payload?: Record<string, unknown>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function now() { return new Date().toISOString(); }

function nextDayAt(hour: number) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")!;

    // User client (respects RLS)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Service client (bypass RLS for cross-table writes)
    const svc = createClient(supabaseUrl, serviceKey);

    // Verify user
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const body: JobRequest = await req.json();
    const { job_type, job_id, session_id, trigger_source = "manual" } = body;

    if (!job_type) {
      return new Response(JSON.stringify({ error: "Missing job_type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── 1. Create execution record ──────────────────────────────────────────

    const { data: exec, error: execErr } = await svc
      .from("openclaw_job_executions")
      .insert({
        user_id: user.id,
        job_id: job_id || null,
        session_id: session_id || null,
        job_type,
        trigger_source,
        status: "en_cours",
        started_at: now(),
      })
      .select()
      .single();

    if (execErr || !exec) {
      return new Response(JSON.stringify({ error: "Failed to create execution", detail: execErr?.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const executionId = exec.id;

    // ── 2. Load user context ────────────────────────────────────────────────

    const [dossierRes, configRes, missionsRes, introsRes] = await Promise.all([
      svc.from("openclaw_dossier").select("*").eq("user_id", user.id).maybeSingle(),
      svc.from("openclaw_config").select("*").eq("user_id", user.id).maybeSingle(),
      svc.from("missions").select("id, titre, statut, secteur, zone").eq("entreprise_id", user.id).eq("statut", "active").limit(10),
      svc.from("introductions").select("id, contact_nom, statut, created_at, mission_id").eq("entreprise_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);

    const dossier = dossierRes.data;
    const config  = configRes.data;
    const missions = missionsRes.data || [];
    const introductions = introsRes.data || [];

    // ── 3. Execute job logic ────────────────────────────────────────────────

    let result: ExecutionResult = {
      execution_id: executionId,
      status: "termine",
      output_summary: "",
      output_count: 0,
      recommendations_created: 0,
      actions_created: 0,
      alerts_created: 0,
      trust_updates: 0,
      opportunities_rescored: 0,
    };

    switch (job_type) {

      // ── RADAR SCAN ──────────────────────────────────────────────────────
      case "radar_scan": {
        const recs: Record<string, unknown>[] = [];

        // For each active mission, create/refresh a hot radar recommendation
        for (const mission of missions.slice(0, 5)) {
          const existingRes = await svc
            .from("openclaw_recommendations")
            .select("id")
            .eq("user_id", user.id)
            .eq("type", "radar_signal")
            .eq("linked_entity_id", mission.id)
            .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .maybeSingle();

          if (!existingRes.data) {
            recs.push({
              user_id: user.id,
              type: "radar_signal",
              title: `Radar actif — ${mission.titre}`,
              summary: dossier
                ? `Le moteur surveille les signaux pour votre mission "${mission.titre}"${dossier.cible_ideale ? ` ciblant ${dossier.cible_ideale}` : ""}.`
                : `Scan radar en cours pour "${mission.titre}".`,
              agent_name: "signal_hunter",
              priority: "normale",
              status: "nouvelle",
              linked_entity_id: mission.id,
              linked_entity_type: "mission",
              execution_id: executionId,
              recommended_action: "Vérifier les opportunités remontées",
            });
          }
        }

        if (recs.length > 0) {
          await svc.from("openclaw_recommendations").insert(recs);
        }

        // Update job's next_run_at
        if (job_id) {
          await svc.from("openclaw_jobs").update({ last_run_at: now(), next_run_at: nextDayAt(8) }).eq("id", job_id);
        }

        result.recommendations_created = recs.length;
        result.output_count = recs.length;
        result.output_summary = recs.length > 0
          ? `${recs.length} signal${recs.length > 1 ? "s" : ""} radar créé${recs.length > 1 ? "s" : ""} pour vos missions actives.`
          : "Radar à jour — aucun nouveau signal à cette heure.";
        break;
      }

      // ── HOT OPPORTUNITY RESCORE ─────────────────────────────────────────
      case "hot_opportunity_rescore": {
        const oppsRes = await svc
          .from("opportunities")
          .select("id, title, intent_label, contact_name, context")
          .eq("user_id", user.id)
          .neq("status", "archivee")
          .limit(20);

        const opps = oppsRes.data || [];
        let rescored = 0;
        const hotRecs: Record<string, unknown>[] = [];

        for (const opp of opps) {
          // If opportunity is "eleve" intent, create a hot recommendation
          if (opp.intent_label === "eleve" || opp.intent_label === "moyen") {
            rescored++;
            hotRecs.push({
              user_id: user.id,
              type: "opportunite_chaude",
              title: `Opportunité chaude : ${opp.title ?? opp.contact_name ?? "Piste détectée"}`,
              summary: `Le moteur a reclassé cette opportunité comme prioritaire. Action recommandée : relance rapide.`,
              agent_name: "opportunity_builder",
              priority: opp.intent_label === "eleve" ? "haute" : "normale",
              status: "nouvelle",
              linked_entity_id: opp.id,
              linked_entity_type: "opportunity",
              execution_id: executionId,
              recommended_action: "Relancer ce contact",
            });
          }
        }

        if (hotRecs.length > 0) {
          // Deduplicate by linked_entity_id (only create if no recent one exists)
          const recentRes = await svc
            .from("openclaw_recommendations")
            .select("linked_entity_id")
            .eq("user_id", user.id)
            .eq("type", "opportunite_chaude")
            .gte("created_at", new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString());

          const recentIds = new Set((recentRes.data || []).map((r: { linked_entity_id: string }) => r.linked_entity_id));
          const newRecs = hotRecs.filter(r => !recentIds.has(r.linked_entity_id as string));

          if (newRecs.length > 0) {
            await svc.from("openclaw_recommendations").insert(newRecs);
          }
          rescored = newRecs.length;
        }

        if (job_id) {
          await svc.from("openclaw_jobs").update({ last_run_at: now(), next_run_at: nextDayAt(9) }).eq("id", job_id);
        }

        result.opportunities_rescored = rescored;
        result.recommendations_created = rescored;
        result.output_count = rescored;
        result.output_summary = rescored > 0
          ? `${rescored} opportunité${rescored > 1 ? "s" : ""} reclassée${rescored > 1 ? "s" : ""} comme prioritaire${rescored > 1 ? "s" : ""}.`
          : "Toutes vos opportunités sont déjà à jour.";
        break;
      }

      // ── APPROVAL REMINDER ───────────────────────────────────────────────
      case "approval_reminder": {
        // Count pending validations and create a reminder action if needed
        const validRes = await svc
          .from("openclaw_validations")
          .select("id, titre", { count: "exact" })
          .eq("user_id", user.id)
          .eq("statut", "en_attente");

        const pendingCount = validRes.count || 0;
        let actionsCreated = 0;

        if (pendingCount > 0) {
          // Create an action reminder
          const { error: actionErr } = await svc.from("actions").insert({
            owner_user_id: user.id,
            type_action: "relance",
            titre: `${pendingCount} validation${pendingCount > 1 ? "s" : ""} en attente — accord requis`,
            description: `Le moteur a détecté ${pendingCount} action${pendingCount > 1 ? "s" : ""} qui attendent votre accord pour être exécutée${pendingCount > 1 ? "s" : ""}. Consultez la page Approbations.`,
            statut: "a_faire",
            priorite: "haute",
          });
          if (!actionErr) actionsCreated = 1;

          // Also create a recommendation
          await svc.from("openclaw_recommendations").insert({
            user_id: user.id,
            type: "relance_validation",
            title: `${pendingCount} action${pendingCount > 1 ? "s" : ""} attend${pendingCount > 1 ? "ent" : ""} votre accord`,
            summary: `Vos agents ont préparé ${pendingCount} action${pendingCount > 1 ? "s" : ""} qui nécessite${pendingCount > 1 ? "nt" : ""} votre validation avant exécution.`,
            agent_name: "validator",
            priority: "haute",
            status: "nouvelle",
            execution_id: executionId,
            recommended_action: "Consulter les approbations",
          });
        }

        if (job_id) {
          await svc.from("openclaw_jobs").update({ last_run_at: now(), next_run_at: nextDayAt(10) }).eq("id", job_id);
        }

        result.actions_created = actionsCreated;
        result.recommendations_created = pendingCount > 0 ? 1 : 0;
        result.output_count = actionsCreated;
        result.output_summary = pendingCount > 0
          ? `Rappel créé : ${pendingCount} validation${pendingCount > 1 ? "s" : ""} en attente de votre accord.`
          : "Aucune validation en attente. Tout est à jour.";
        break;
      }

      // ── TRUST RECOMPUTE ─────────────────────────────────────────────────
      case "trust_recompute": {
        // Refresh trust score for the current user
        const { error: trustErr } = await svc.rpc("refresh_trust_score", { p_facilitator_id: user.id });

        // Log a trust event
        const { error: eventErr } = await svc.from("trust_events").insert({
          user_id: user.id,
          event_type: "recompute_planifie",
          impact_score: 0,
          summary: "Réévaluation périodique du score de confiance.",
        });

        if (job_id) {
          await svc.from("openclaw_jobs").update({
            last_run_at: now(),
            next_run_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          }).eq("id", job_id);
        }

        result.trust_updates = trustErr ? 0 : 1;
        result.output_count = result.trust_updates;
        result.output_summary = trustErr
          ? "Réévaluation confiance échouée. Relance prévue."
          : "Score de confiance recalculé avec succès.";
        break;
      }

      // ── DAILY BRIEF GENERATE ─────────────────────────────────────────────
      case "daily_brief_generate": {
        // Load recent activity
        const [recsRes, validRes, introsCountRes] = await Promise.all([
          svc.from("openclaw_recommendations").select("title, type, priority").eq("user_id", user.id).eq("status", "nouvelle").limit(5),
          svc.from("openclaw_validations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("statut", "en_attente"),
          svc.from("introductions").select("id", { count: "exact", head: true }).eq("entreprise_id", user.id).eq("statut", "en_attente"),
        ]);

        const newRecs   = recsRes.data || [];
        const pendingV  = validRes.count || 0;
        const pendingI  = introsCountRes.count || 0;

        const priorityItems = [
          ...(pendingV > 0 ? [{ type: "validation", count: pendingV, label: `${pendingV} approbation${pendingV > 1 ? "s" : ""} en attente` }] : []),
          ...(pendingI > 0 ? [{ type: "introduction", count: pendingI, label: `${pendingI} introduction${pendingI > 1 ? "s" : ""} à valider` }] : []),
          ...newRecs.slice(0, 3).map(r => ({ type: r.type, label: r.title, priority: r.priority })),
        ];

        const suggestedActions = [
          ...(pendingV > 0 ? [{ action: "Valider les approbations en attente", link: "/validations", priority: "haute" }] : []),
          ...(pendingI > 0 ? [{ action: "Valider les introductions reçues", link: "/entreprise/introductions", priority: "haute" }] : []),
          { action: "Consulter le radar d'opportunités", link: "/radar", priority: "normale" },
          { action: "Vérifier les alertes passives", link: "/chaud", priority: "normale" },
        ];

        const briefDate = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

        const { error: briefErr } = await svc.from("openclaw_briefs").insert({
          user_id: user.id,
          title: `Brief du ${briefDate}`,
          summary: `Le moteur a analysé votre activité. ${priorityItems.length > 0 ? `${priorityItems.length} point${priorityItems.length > 1 ? "s" : ""} prioritaire${priorityItems.length > 1 ? "s" : ""} à traiter.` : "Tout est à jour."}`,
          priority_items: priorityItems,
          suggested_actions: suggestedActions,
          stats: {
            missions_actives: missions.length,
            introductions_en_attente: pendingI,
            approbations_en_attente: pendingV,
            recommendations_nouvelles: newRecs.length,
          },
        });

        if (job_id) {
          await svc.from("openclaw_jobs").update({ last_run_at: now(), next_run_at: nextDayAt(7) }).eq("id", job_id);
        }

        result.output_count = briefErr ? 0 : 1;
        result.output_summary = briefErr
          ? "Brief quotidien : génération échouée. Relance prévue."
          : `Brief du jour généré. ${priorityItems.length} point${priorityItems.length > 1 ? "s" : ""} à traiter.`;
        break;
      }

      // ── PASSIVE ALERT DIGEST ─────────────────────────────────────────────
      case "passive_alert_digest": {
        const alertsRes = await svc
          .from("passive_alerts")
          .select("id, title, message, type, read")
          .eq("user_id", user.id)
          .eq("read", false)
          .limit(10);

        const unreadAlerts = alertsRes.data || [];

        let newAlerts = 0;
        if (unreadAlerts.length > 0) {
          // Create a digest recommendation
          await svc.from("openclaw_recommendations").insert({
            user_id: user.id,
            type: "alerte_passive",
            title: `${unreadAlerts.length} alerte${unreadAlerts.length > 1 ? "s" : ""} passive${unreadAlerts.length > 1 ? "s" : ""} non lue${unreadAlerts.length > 1 ? "s" : ""}`,
            summary: `Le moteur passif a détecté ${unreadAlerts.length} signal${unreadAlerts.length > 1 ? "s" : ""} non consulté${unreadAlerts.length > 1 ? "s" : ""}. Vérifiez vos alertes pour ne pas manquer une opportunité.`,
            agent_name: "passive_distributor",
            priority: unreadAlerts.length >= 3 ? "haute" : "normale",
            status: "nouvelle",
            execution_id: executionId,
            recommended_action: "Consulter les alertes",
          });
          newAlerts = 1;
        }

        if (job_id) {
          await svc.from("openclaw_jobs").update({ last_run_at: now(), next_run_at: nextDayAt(12) }).eq("id", job_id);
        }

        result.alerts_created = newAlerts;
        result.recommendations_created = newAlerts;
        result.output_count = unreadAlerts.length;
        result.output_summary = unreadAlerts.length > 0
          ? `${unreadAlerts.length} alerte${unreadAlerts.length > 1 ? "s" : ""} passive${unreadAlerts.length > 1 ? "s" : ""} détectée${unreadAlerts.length > 1 ? "s" : ""}.`
          : "Aucune alerte passive non lue.";
        break;
      }

      // ── NEXT BEST ACTION ─────────────────────────────────────────────────
      case "next_best_action_generate": {
        const actionsCreated: string[] = [];

        // Create actions for stuck introductions > 3 days
        const stuckIntros = introductions.filter(i => {
          if (i.statut !== "en_attente") return false;
          const age = Date.now() - new Date(i.created_at).getTime();
          return age > 3 * 24 * 60 * 60 * 1000;
        });

        for (const intro of stuckIntros.slice(0, 3)) {
          const { error: actErr } = await svc.from("actions").insert({
            owner_user_id: user.id,
            type_action: "relance",
            titre: `Relancer : introduction de ${intro.contact_nom} en attente`,
            description: `Cette introduction est en attente depuis plus de 3 jours. Le moteur recommande une relance pour débloquer le pipeline.`,
            statut: "a_faire",
            priorite: "normale",
            introduction_id: intro.id,
          });
          if (!actErr) actionsCreated.push(intro.id);
        }

        if (job_id) {
          await svc.from("openclaw_jobs").update({ last_run_at: now(), next_run_at: nextDayAt(9) }).eq("id", job_id);
        }

        result.actions_created = actionsCreated.length;
        result.output_count = actionsCreated.length;
        result.output_summary = actionsCreated.length > 0
          ? `${actionsCreated.length} action${actionsCreated.length > 1 ? "s" : ""} de relance créée${actionsCreated.length > 1 ? "s" : ""} par le moteur.`
          : "Aucune relance nécessaire à ce stade.";
        break;
      }

      // ── STUCK PIPELINE RECHECK ───────────────────────────────────────────
      case "stuck_pipeline_recheck": {
        // Find introductions > 7 days old and still pending
        const stuckOld = introductions.filter(i => {
          if (i.statut !== "en_attente") return false;
          const age = Date.now() - new Date(i.created_at).getTime();
          return age > 7 * 24 * 60 * 60 * 1000;
        });

        let recs = 0;
        if (stuckOld.length > 0) {
          await svc.from("openclaw_recommendations").insert({
            user_id: user.id,
            type: "pipeline_bloque",
            title: `${stuckOld.length} introduction${stuckOld.length > 1 ? "s" : ""} bloquée${stuckOld.length > 1 ? "s" : ""} depuis + de 7 jours`,
            summary: `Le moteur a détecté des introductions sans réponse depuis plus d'une semaine. Une action est recommandée pour débloquer le pipeline.`,
            agent_name: "validator",
            priority: "haute",
            status: "nouvelle",
            execution_id: executionId,
            recommended_action: "Vérifier et relancer ces introductions",
          });
          recs = 1;
        }

        if (job_id) {
          await svc.from("openclaw_jobs").update({ last_run_at: now(), next_run_at: nextDayAt(11) }).eq("id", job_id);
        }

        result.recommendations_created = recs;
        result.output_count = stuckOld.length;
        result.output_summary = stuckOld.length > 0
          ? `Pipeline : ${stuckOld.length} introduction${stuckOld.length > 1 ? "s" : ""} bloquée${stuckOld.length > 1 ? "s" : ""} identifiée${stuckOld.length > 1 ? "s" : ""}.`
          : "Pipeline fluide — aucun blocage détecté.";
        break;
      }

      // ── FACILITATOR MATCH REFRESH ────────────────────────────────────────
      case "facilitator_match_refresh": {
        // Check for missions without any facilitator requests
        const missionsWithNoRequests: string[] = [];
        for (const mission of missions.slice(0, 5)) {
          const reqRes = await svc
            .from("facilitator_requests")
            .select("id", { count: "exact", head: true })
            .eq("mission_id", mission.id);
          if ((reqRes.count || 0) === 0) {
            missionsWithNoRequests.push(mission.titre);
          }
        }

        let recsCreated = 0;
        if (missionsWithNoRequests.length > 0) {
          await svc.from("openclaw_recommendations").insert({
            user_id: user.id,
            type: "match_facilitateur",
            title: `${missionsWithNoRequests.length} mission${missionsWithNoRequests.length > 1 ? "s" : ""} sans facilitateur actif`,
            summary: `Ces missions n'ont pas encore de facilitateur associé : ${missionsWithNoRequests.join(", ")}. Le moteur recommande d'inviter des apporteurs d'affaires.`,
            agent_name: "matchmaker",
            priority: "normale",
            status: "nouvelle",
            execution_id: executionId,
            recommended_action: "Explorer les facilitateurs disponibles",
          });
          recsCreated = 1;
        }

        if (job_id) {
          await svc.from("openclaw_jobs").update({ last_run_at: now(), next_run_at: nextDayAt(10) }).eq("id", job_id);
        }

        result.recommendations_created = recsCreated;
        result.output_count = missionsWithNoRequests.length;
        result.output_summary = missionsWithNoRequests.length > 0
          ? `${missionsWithNoRequests.length} mission${missionsWithNoRequests.length > 1 ? "s" : ""} identifiée${missionsWithNoRequests.length > 1 ? "s" : ""} sans facilitateur actif.`
          : "Toutes vos missions ont des facilitateurs actifs.";
        break;
      }

      // ── PASSIVE OFFER REFRESH ────────────────────────────────────────────
      case "passive_offer_refresh": {
        const offersRes = await svc
          .from("offers")
          .select("id, title, status")
          .eq("company_id", user.id)
          .in("status", ["active", "ready"])
          .limit(10);

        const activeOffers = offersRes.data || [];
        let recsCreated = 0;

        if (activeOffers.length > 0) {
          await svc.from("openclaw_recommendations").insert({
            user_id: user.id,
            type: "offre_passive",
            title: `${activeOffers.length} offre${activeOffers.length > 1 ? "s" : ""} passive${activeOffers.length > 1 ? "s" : ""} active${activeOffers.length > 1 ? "s" : ""}`,
            summary: `Le moteur a vérifié vos offres passives. ${activeOffers.length} offre${activeOffers.length > 1 ? "s sont" : " est"} actuellement visible${activeOffers.length > 1 ? "s" : ""} par les facilitateurs.`,
            agent_name: "passive_distributor",
            priority: "faible",
            status: "nouvelle",
            execution_id: executionId,
            recommended_action: "Vérifier les performances",
          });
          recsCreated = 1;
        }

        if (job_id) {
          await svc.from("openclaw_jobs").update({ last_run_at: now(), next_run_at: nextDayAt(12) }).eq("id", job_id);
        }

        result.recommendations_created = recsCreated;
        result.output_count = activeOffers.length;
        result.output_summary = activeOffers.length > 0
          ? `${activeOffers.length} offre${activeOffers.length > 1 ? "s" : ""} passive${activeOffers.length > 1 ? "s" : ""} vérifiée${activeOffers.length > 1 ? "s" : ""}.`
          : "Aucune offre passive active en ce moment.";
        break;
      }

      default: {
        result.status = "erreur";
        result.output_summary = `Type de job inconnu : ${job_type}`;
        result.error = `Unknown job type: ${job_type}`;
      }
    }

    // ── 4. Complete the execution record ─────────────────────────────────

    await svc.rpc("complete_job_execution", {
      p_execution_id:    executionId,
      p_status:          result.status,
      p_output_summary:  result.output_summary,
      p_output_count:    result.output_count,
      p_recommendations: result.recommendations_created,
      p_actions:         result.actions_created,
      p_alerts:          result.alerts_created,
      p_trust_updates:   result.trust_updates,
      p_opportunities:   result.opportunities_rescored,
      p_error:           result.error || null,
      p_result_payload:  result.result_payload || {},
    });

    // ── 5. Create a run record for traceability ────────────────────────────

    await svc.from("openclaw_runs").insert({
      user_id: user.id,
      run_type: job_type,
      trigger_source: trigger_source,
      status: result.status === "termine" ? "termine" : "erreur",
      summary: result.output_summary,
      execution_id: executionId,
      started_at: exec.started_at,
      ended_at: now(),
      agent_names: [getAgentForJobType(job_type)],
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[openclaw-job-executor] Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", detail: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getAgentForJobType(jobType: string): string {
  const map: Record<string, string> = {
    radar_scan:                "signal_hunter",
    hot_opportunity_rescore:   "opportunity_builder",
    approval_reminder:         "validator",
    trust_recompute:           "trust_sentinel",
    daily_brief_generate:      "brief_writer",
    passive_alert_digest:      "passive_distributor",
    next_best_action_generate: "matchmaker",
    stuck_pipeline_recheck:    "validator",
    facilitator_match_refresh: "matchmaker",
    passive_offer_refresh:     "passive_distributor",
  };
  return map[jobType] ?? "signal_hunter";
}
