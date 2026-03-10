/**
 * openclaw-job-executor
 * ─────────────────────
 * Real execution engine for OpenClaw business jobs.
 *
 * 🧠 INTERNAL BRAIN MODE (new):
 *   Jobs next_best_action_generate, daily_brief_generate, radar_scan
 *   now call the Lovable AI Gateway for real AI-powered analysis.
 *   No external gateway required — uses LOVABLE_API_KEY (auto-provisioned).
 *
 * Dual-auth:
 *   1. Bearer <SERVICE_ROLE_KEY> + x-scheduler-user-id → pg_cron / scheduler
 *   2. Bearer <user JWT>                              → direct user call
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_MODEL = "google/gemini-3-flash-preview";

// ── AI Brain helper ─────────────────────────────────────────────────────────
async function callInternalBrain(
  systemPrompt: string,
  userPrompt: string,
  lovableApiKey: string,
): Promise<string | null> {
  try {
    const res = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      console.error("[brain] AI gateway error:", res.status, await res.text().catch(() => ""));
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error("[brain] AI call failed:", err);
    return null;
  }
}

// ── Parse JSON from AI response safely ─────────────────────────────────────
function parseJsonFromAI(text: string): Record<string, unknown> | null {
  try {
    const match = text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/);
    const raw = match ? match[1] : text;
    return JSON.parse(raw.trim());
  } catch {
    return null;
  }
}

interface JobRequest {
  job_type: string;
  job_id?: string;
  queue_job_id?: string;
  session_id?: string;
  trigger_source?: string;
  gateway_url?: string;
  lead_intake_id?: string; // for next_best_action_generate
  _scheduled_user_id?: string;
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
  channel_actions_created: number;
  ai_powered?: boolean;
  error?: string;
  result_payload?: Record<string, unknown>;
}

interface ChannelActionInsert {
  user_id: string;
  channel: string;
  action_type: string;
  job_type: string;
  execution_id: string;
  source_entity_id?: string;
  source_entity_type?: string;
  status: string;
  trigger_mode: string;
  approval_required: boolean;
  payload_summary: string;
  payload: Record<string, unknown>;
}

function now() { return new Date().toISOString(); }
function nextDayAt(hour: number) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function getChannelActionStatus(channel: string, autonomieLevel: string) {
  if (channel === "whatsapp") return { status: "pending_approval", trigger_mode: "assisted", approval_required: true };
  if (autonomieLevel === "autonome" && (channel === "email" || channel === "introduction"))
    return { status: "prepared", trigger_mode: "auto", approval_required: false };
  if (autonomieLevel === "assiste") return { status: "pending_approval", trigger_mode: "assisted", approval_required: true };
  return { status: "prepared", trigger_mode: "assisted", approval_required: false };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const schedulerUserId = req.headers.get("x-scheduler-user-id");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY") ?? "";

    const svc = createClient(supabaseUrl, serviceKey);
    const isServiceRole = authHeader === `Bearer ${serviceKey}`;
    let userId: string;

    if (isServiceRole && schedulerUserId) {
      userId = schedulerUserId;
    } else if (!isServiceRole) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user }, error: authErr } = await userClient.auth.getUser();
      if (authErr || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      userId = user.id;
    } else {
      return new Response(JSON.stringify({ error: "Service-role call requires x-scheduler-user-id header" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const body: JobRequest = await req.json();
    const { job_type, job_id, queue_job_id, session_id, trigger_source = "manual", lead_intake_id } = body;

    if (!job_type) {
      return new Response(JSON.stringify({ error: "Missing job_type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── 1. Create execution record ──────────────────────────────────────────
    const { data: exec, error: execErr } = await svc
      .from("openclaw_job_executions")
      .insert({
        user_id: userId,
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
    const [dossierRes, configRes, missionsRes, introsRes, channelsRes] = await Promise.all([
      svc.from("openclaw_dossier").select("*").eq("user_id", userId).maybeSingle(),
      svc.from("openclaw_config").select("*").eq("user_id", userId).maybeSingle(),
      svc.from("missions").select("id, titre, statut, secteur, zone").eq("entreprise_id", userId).eq("statut", "active").limit(10),
      svc.from("introductions").select("id, contact_nom, statut, created_at, mission_id").eq("entreprise_id", userId).order("created_at", { ascending: false }).limit(20),
      svc.from("openclaw_channels").select("channel_id, is_ready, is_openclaw_enabled, status").eq("user_id", userId),
    ]);

    const dossier        = dossierRes.data;
    const config         = configRes.data;
    const missions       = missionsRes.data || [];
    const introductions  = introsRes.data || [];
    const channels       = (channelsRes.data || []) as Array<{ channel_id: string; is_ready: boolean; is_openclaw_enabled: boolean; status: string }>;
    const autonomieLevel = config?.autonomie_level || "preparation";

    const channelActionBatch: ChannelActionInsert[] = [];

    function prepareChannelAction(
      channel: string,
      actionType: string,
      payloadSummary: string,
      payload: Record<string, unknown>,
      entityId?: string,
      entityType?: string,
    ) {
      const ch = channels.find(c => c.channel_id === channel);
      if (!ch || !ch.is_ready || !ch.is_openclaw_enabled) return false;
      const { status, trigger_mode, approval_required } = getChannelActionStatus(channel, autonomieLevel);
      channelActionBatch.push({
        user_id: userId, channel, action_type: actionType, job_type,
        execution_id: executionId, source_entity_id: entityId, source_entity_type: entityType,
        status, trigger_mode, approval_required, payload_summary: payloadSummary, payload,
      });
      return true;
    }

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
      channel_actions_created: 0,
      ai_powered: false,
    };

    switch (job_type) {

      // ── 🧠 NEXT BEST ACTION (AI-powered) ─────────────────────────────────
      case "next_best_action_generate": {
        // If a specific lead_intake_id is provided, use AI to analyze it
        if (lead_intake_id && lovableApiKey) {
          const [intakeRes, relatedIntroRes] = await Promise.all([
            svc.from("lead_intakes")
              .select("*, lead_source_events(source_type, raw_payload)")
              .eq("id", lead_intake_id)
              .maybeSingle(),
            svc.from("introductions")
              .select("id, contact_nom, contexte, statut, mission_id")
              .eq("id", (await svc.from("lead_intakes").select("introduction_id").eq("id", lead_intake_id).maybeSingle()).data?.introduction_id ?? "")
              .maybeSingle(),
          ]);

          const intake = intakeRes.data;
          if (intake) {
            const missionContext = missions.find(m => m.id === intake.mission_id);
            const intro = relatedIntroRes.data;

            const systemPrompt = `Tu es un expert en développement commercial B2B français.
Analyse ce lead et recommande UNE seule prochaine action concrète.
Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "action_type": "contact_email_draft" | "contact_manual_call" | "promote_to_opportunity" | "enrich_lead" | "review_lead" | "request_facilitator_precision",
  "priority": "high" | "normal" | "low",
  "reason": "explication courte en français (max 80 mots)",
  "confidence": 0-100,
  "payload": { "draft_subject": "...", "key_points": ["..."] }
}`;

            const userPrompt = `Lead B2B à analyser :
- Nom : ${intake.person_name ?? "Inconnu"}
- Email : ${intake.person_email ?? "non fourni"}
- Entreprise : ${intake.company_name ?? "non fournie"}
- Source : ${intake.source_type}
- Statut pipeline : ${intake.qualification_status}
- Contexte : ${intake.free_text_context ?? ""}
${intro ? `- Introduction via : ${intro.contexte ?? ""}` : ""}
${missionContext ? `- Mission cible : ${missionContext.titre} (${missionContext.secteur ?? ""} / ${missionContext.zone ?? ""})` : ""}
${dossier ? `- Profil entreprise : ${dossier.secteur_activite ?? ""}, cible idéale : ${dossier.cible_ideale ?? ""}` : ""}`;

            const aiResponse = await callInternalBrain(systemPrompt, userPrompt, lovableApiKey);
            let aiParsed: Record<string, unknown> | null = null;
            if (aiResponse) aiParsed = parseJsonFromAI(aiResponse);

            if (aiParsed) {
              const actionType = (aiParsed.action_type as string) || "review_lead";
              const priority   = (aiParsed.priority as string) || "normal";
              const reason     = (aiParsed.reason as string) || "Analyse IA — action recommandée";
              const aiPayload  = (aiParsed.payload as Record<string, unknown>) || {};
              const confidence = (aiParsed.confidence as number) || 70;

              // Upsert via RPC
              await svc.rpc("upsert_lead_action", {
                p_intake_id:   lead_intake_id,
                p_actor_id:    userId,
                p_action_type: actionType,
                p_priority:    priority,
                p_reason:      reason,
                p_payload:     { ...aiPayload, ai_generated: true, confidence, model: AI_MODEL },
              });

              // Update nba_context on the lead_intake
              await svc.from("lead_intakes")
                .update({
                  next_best_action: actionType,
                  nba_context: {
                    ai_generated:  true,
                    action_type:   actionType,
                    priority,
                    reason,
                    confidence,
                    payload:       aiPayload,
                    generated_at:  now(),
                    model:         AI_MODEL,
                  },
                  updated_at: now(),
                })
                .eq("id", lead_intake_id);

              // Write recommendation
              const { data: recData } = await svc.from("openclaw_recommendations").insert({
                user_id:            userId,
                type:               "nba_ai",
                title:              `Action IA recommandée : ${actionType.replace(/_/g, " ")}`,
                summary:            reason,
                agent_name:         "brain_internal",
                priority:           priority === "high" ? "haute" : "normale",
                status:             "nouvelle",
                linked_entity_id:   lead_intake_id,
                linked_entity_type: "lead_intake",
                execution_id:       executionId,
                recommended_action: actionType,
                ai_generated:       true,
              }).select("id").single();

              // Mirror to user_actions
              const nbaTypeMap: Record<string, string> = {
                contact_email_draft:              "envoyer",
                contact_manual_call:              "appeler",
                promote_to_opportunity:           "valider",
                enrich_lead:                      "verifier",
                review_lead:                      "analyser",
                request_facilitator_precision:    "verifier",
              };
              await svc.from("user_actions").insert({
                user_id:        userId,
                type:           nbaTypeMap[actionType] ?? "analyser",
                title:          `Action IA : ${actionType.replace(/_/g, " ")}`,
                description:    reason,
                priority:       priority === "high" ? "haute" : "normale",
                source:         "openclaw",
                source_ref_id:  recData?.id ?? null,
                status:         "a_faire",
              });

              result.actions_created          = 1;
              result.recommendations_created  = 1;
              result.output_count             = 1;
              result.ai_powered               = true;
              result.output_summary           = `Cerveau IA : "${reason.slice(0, 80)}"`;
              break;
            }
          }
        }

        // Fallback: rule-based (stale intros)
        const actionsCreatedIds: string[] = [];
        const stuckIntros = introductions.filter(i => {
          if (i.statut !== "en_attente") return false;
          return Date.now() - new Date(i.created_at).getTime() > 3 * 24 * 60 * 60 * 1000;
        });

        for (const intro of stuckIntros.slice(0, 3)) {
          const { error: actErr } = await svc.from("actions").insert({
            owner_user_id: userId,
            type_action: "relance",
            titre: `Relancer : introduction de ${intro.contact_nom} en attente`,
            description: `Cette introduction est en attente depuis plus de 3 jours.`,
            statut: "a_faire",
            priorite: "normale",
            introduction_id: intro.id,
          });
          if (!actErr) {
            actionsCreatedIds.push(intro.id);
            prepareChannelAction("email", "relance",
              `Relance préparée pour l'introduction de ${intro.contact_nom}`,
              { intro_id: intro.id, contact_nom: intro.contact_nom, type: "pipeline_relance" },
              intro.id, "introduction");
          }
        }

        if (job_id) await svc.from("openclaw_jobs").update({ last_run_at: now(), next_run_at: nextDayAt(9) }).eq("id", job_id);
        result.actions_created  = actionsCreatedIds.length;
        result.output_count     = actionsCreatedIds.length;
        result.output_summary   = actionsCreatedIds.length > 0
          ? `${actionsCreatedIds.length} action(s) de relance créée(s) par le moteur.`
          : "Aucune relance nécessaire à ce stade.";
        break;
      }

      // ── 🧠 DAILY BRIEF GENERATE (AI-enhanced) ────────────────────────────
      case "daily_brief_generate": {
        const [recsRes, validRes, introsCountRes, oppsRes] = await Promise.all([
          svc.from("openclaw_recommendations").select("title, type, priority").eq("user_id", userId).eq("status", "nouvelle").limit(5),
          svc.from("openclaw_validations").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("statut", "en_attente"),
          svc.from("introductions").select("id", { count: "exact", head: true }).eq("entreprise_id", userId).eq("statut", "en_attente"),
          svc.from("opportunities").select("id", { count: "exact", head: true }).eq("user_id", userId).neq("status", "archivee"),
        ]);

        const newRecs   = recsRes.data || [];
        const pendingV  = validRes.count || 0;
        const pendingI  = introsCountRes.count || 0;
        const oppsTotal = oppsRes.count || 0;

        const priorityItems = [
          ...(pendingV > 0 ? [{ type: "validation", count: pendingV, label: `${pendingV} approbation(s) en attente` }] : []),
          ...(pendingI > 0 ? [{ type: "introduction", count: pendingI, label: `${pendingI} introduction(s) à valider` }] : []),
          ...newRecs.slice(0, 3).map(r => ({ type: r.type, label: r.title, priority: r.priority })),
        ];

        const suggestedActions = [
          ...(pendingV > 0 ? [{ action: "Valider les approbations en attente", link: "/validations", priority: "haute" }] : []),
          ...(pendingI > 0 ? [{ action: "Valider les introductions reçues", link: "/entreprise/introductions", priority: "haute" }] : []),
          { action: "Consulter le radar d'opportunités", link: "/radar", priority: "normale" },
          { action: "Vérifier les alertes passives", link: "/chaud", priority: "normale" },
        ];

        const briefDate = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

        // AI-enhanced summary if LOVABLE_API_KEY available
        let aiSummary: string | null = null;
        if (lovableApiKey) {
          const systemPrompt = `Tu es un assistant commercial B2B expert. Génère un brief matinal percutant et motivant en 2-3 phrases courtes en français. Sois direct et actionnable.`;
          const userPrompt = `Données du jour :
- Missions actives : ${missions.length}
- Introductions en attente : ${pendingI}
- Approbations requises : ${pendingV}
- Opportunités ouvertes : ${oppsTotal}
- Nouvelles recommandations IA : ${newRecs.length}
${dossier?.secteur_activite ? `- Secteur : ${dossier.secteur_activite}` : ""}
Génère le brief matinal.`;
          aiSummary = await callInternalBrain(systemPrompt, userPrompt, lovableApiKey);
        }

        const { error: briefErr } = await svc.from("openclaw_briefs").insert({
          user_id: userId,
          title: `Brief du ${briefDate}`,
          summary: aiSummary ?? `Le moteur a analysé votre activité. ${priorityItems.length > 0 ? `${priorityItems.length} point(s) prioritaire(s) à traiter.` : "Tout est à jour."}`,
          priority_items: priorityItems,
          suggested_actions: suggestedActions,
          ai_generated: !!aiSummary,
          stats: {
            missions_actives: missions.length,
            introductions_en_attente: pendingI,
            approbations_en_attente: pendingV,
            recommendations_nouvelles: newRecs.length,
            opportunites_ouvertes: oppsTotal,
          },
        });

        if (!briefErr) {
          prepareChannelAction("email", "brief",
            `Brief du ${briefDate} — ${priorityItems.length} point(s) à traiter`,
            { type: "daily_brief", date: briefDate, priority_count: priorityItems.length, missions_actives: missions.length, ai_generated: !!aiSummary },
          );
        }

        if (job_id) await svc.from("openclaw_jobs").update({ last_run_at: now(), next_run_at: nextDayAt(7) }).eq("id", job_id);

        result.output_count   = briefErr ? 0 : 1;
        result.ai_powered     = !!aiSummary;
        result.output_summary = briefErr
          ? "Brief quotidien : génération échouée."
          : `Brief du jour généré${aiSummary ? " (IA)" : ""}. ${priorityItems.length} point(s) à traiter.`;
        break;
      }

      // ── 🧠 RADAR SCAN (AI-enhanced signals) ──────────────────────────────
      case "radar_scan": {
        const recs: Record<string, unknown>[] = [];

        for (const mission of missions.slice(0, 5)) {
          const existingRes = await svc
            .from("openclaw_recommendations")
            .select("id")
            .eq("user_id", userId)
            .eq("type", "radar_signal")
            .eq("linked_entity_id", mission.id)
            .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .maybeSingle();

          if (!existingRes.data) {
            // AI-enhanced insight for this mission
            let aiInsight: string | null = null;
            if (lovableApiKey && dossier) {
              const systemPrompt = `Tu es un expert commercial B2B. Génère UNE phrase d'insight radar percutante (max 30 mots) pour une mission commerciale. Sois spécifique et actionnable.`;
              const userPrompt = `Mission : "${mission.titre}" | Secteur : ${mission.secteur ?? "N/A"} | Zone : ${mission.zone ?? "N/A"} | Profil entreprise : ${dossier.secteur_activite ?? ""} | Cible : ${dossier.cible_ideale ?? ""}`;
              aiInsight = await callInternalBrain(systemPrompt, userPrompt, lovableApiKey);
            }

            recs.push({
              user_id: userId,
              type: "radar_signal",
              title: `Radar actif — ${mission.titre}`,
              summary: aiInsight ?? (dossier
                ? `Le moteur surveille les signaux pour votre mission "${mission.titre}"${dossier.cible_ideale ? ` ciblant ${dossier.cible_ideale}` : ""}.`
                : `Scan radar en cours pour "${mission.titre}".`),
              agent_name: "signal_hunter",
              priority: "normale",
              status: "nouvelle",
              linked_entity_id: mission.id,
              linked_entity_type: "mission",
              execution_id: executionId,
              recommended_action: "Vérifier les opportunités remontées",
              ai_generated: !!aiInsight,
            });

            prepareChannelAction("email", "digest",
              `Résumé radar : signaux détectés pour "${mission.titre}"`,
              { mission_id: mission.id, mission_titre: mission.titre, type: "radar_digest" },
              mission.id, "mission");
          }
        }

        if (recs.length > 0) await svc.from("openclaw_recommendations").insert(recs);
        if (job_id) await svc.from("openclaw_jobs").update({ last_run_at: now(), next_run_at: nextDayAt(8) }).eq("id", job_id);

        result.recommendations_created = recs.length;
        result.output_count = recs.length;
        result.ai_powered   = recs.some(r => r.ai_generated);
        result.output_summary = recs.length > 0
          ? `${recs.length} signal(s) radar créé(s)${result.ai_powered ? " (analyse IA)" : ""}.`
          : "Radar à jour — aucun nouveau signal.";
        break;
      }

      // ── HOT OPPORTUNITY RESCORE ───────────────────────────────────────────
      case "hot_opportunity_rescore": {
        const oppsRes = await svc.from("opportunities").select("id, title, intent_label, contact_name, context").eq("user_id", userId).neq("status", "archivee").limit(20);
        const opps = oppsRes.data || [];
        let rescored = 0;
        const hotRecs: Record<string, unknown>[] = [];

        for (const opp of opps) {
          if (opp.intent_label === "eleve" || opp.intent_label === "moyen") {
            rescored++;
            hotRecs.push({
              user_id: userId, type: "opportunite_chaude",
              title: `Opportunité chaude : ${opp.title ?? opp.contact_name ?? "Piste détectée"}`,
              summary: `Le moteur a reclassé cette opportunité comme prioritaire. Action recommandée : relance rapide.`,
              agent_name: "opportunity_builder", priority: opp.intent_label === "eleve" ? "haute" : "normale",
              status: "nouvelle", linked_entity_id: opp.id, linked_entity_type: "opportunity",
              execution_id: executionId, recommended_action: "Relancer ce contact",
            });
            prepareChannelAction("email", "relance", `Relance préparée : ${opp.title ?? opp.contact_name ?? "Piste"}`,
              { opportunity_id: opp.id, type: "hot_relance", intent: opp.intent_label }, opp.id, "opportunity");
          }
        }

        if (hotRecs.length > 0) {
          const recentRes = await svc.from("openclaw_recommendations").select("linked_entity_id").eq("user_id", userId).eq("type", "opportunite_chaude").gte("created_at", new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString());
          const recentIds = new Set((recentRes.data || []).map((r: { linked_entity_id: string }) => r.linked_entity_id));
          const newRecs = hotRecs.filter(r => !recentIds.has(r.linked_entity_id as string));
          if (newRecs.length > 0) await svc.from("openclaw_recommendations").insert(newRecs);
          rescored = newRecs.length;
        }

        if (job_id) await svc.from("openclaw_jobs").update({ last_run_at: now(), next_run_at: nextDayAt(9) }).eq("id", job_id);
        result.opportunities_rescored = rescored; result.recommendations_created = rescored; result.output_count = rescored;
        result.output_summary = rescored > 0 ? `${rescored} opportunité(s) reclassée(s) comme prioritaire(s).` : "Toutes vos opportunités sont déjà à jour.";
        break;
      }

      // ── APPROVAL REMINDER ─────────────────────────────────────────────────
      case "approval_reminder": {
        const validRes = await svc.from("openclaw_validations").select("id, titre", { count: "exact" }).eq("user_id", userId).eq("statut", "en_attente");
        const pendingCount = validRes.count || 0;
        let actionsCreated = 0;
        if (pendingCount > 0) {
          const { error: actionErr } = await svc.from("actions").insert({
            owner_user_id: userId, type_action: "relance",
            titre: `${pendingCount} validation(s) en attente — accord requis`,
            description: `Le moteur a détecté ${pendingCount} action(s) qui attendent votre accord.`,
            statut: "a_faire", priorite: "haute",
          });
          if (!actionErr) actionsCreated = 1;
          await svc.from("openclaw_recommendations").insert({
            user_id: userId, type: "relance_validation",
            title: `${pendingCount} action(s) attend(ent) votre accord`,
            summary: `Vos agents ont préparé ${pendingCount} action(s) qui nécessite(nt) votre validation.`,
            agent_name: "validator", priority: "haute", status: "nouvelle",
            execution_id: executionId, recommended_action: "Consulter les approbations",
          });
          prepareChannelAction("email", "rappel", `Rappel : ${pendingCount} validation(s) en attente`, { pending_count: pendingCount, type: "approval_reminder" });
        }
        if (job_id) await svc.from("openclaw_jobs").update({ last_run_at: now(), next_run_at: nextDayAt(10) }).eq("id", job_id);
        result.actions_created = actionsCreated; result.recommendations_created = pendingCount > 0 ? 1 : 0;
        result.output_count = actionsCreated;
        result.output_summary = pendingCount > 0 ? `Rappel créé : ${pendingCount} validation(s) en attente.` : "Aucune validation en attente.";
        break;
      }

      // ── TRUST RECOMPUTE ───────────────────────────────────────────────────
      case "trust_recompute": {
        const { error: trustErr } = await svc.rpc("refresh_trust_score", { p_facilitator_id: userId });
        await svc.from("trust_events").insert({ user_id: userId, event_type: "recompute_planifie", impact_score: 0, summary: "Réévaluation périodique du score de confiance." });
        if (job_id) await svc.from("openclaw_jobs").update({ last_run_at: now(), next_run_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }).eq("id", job_id);
        result.trust_updates = trustErr ? 0 : 1; result.output_count = result.trust_updates;
        result.output_summary = trustErr ? "Réévaluation confiance échouée." : "Score de confiance recalculé avec succès.";
        break;
      }

      // ── PASSIVE ALERT DIGEST ──────────────────────────────────────────────
      case "passive_alert_digest": {
        const alertsRes = await svc.from("passive_alerts").select("id, title, message, type, read").eq("user_id", userId).eq("read", false).limit(10);
        const unreadAlerts = alertsRes.data || [];
        let newAlerts = 0;
        if (unreadAlerts.length > 0) {
          await svc.from("openclaw_recommendations").insert({
            user_id: userId, type: "alerte_passive",
            title: `${unreadAlerts.length} alerte(s) passive(s) non lue(s)`,
            summary: `Le moteur passif a détecté ${unreadAlerts.length} signal(s) non consulté(s).`,
            agent_name: "passive_distributor", priority: unreadAlerts.length >= 3 ? "haute" : "normale",
            status: "nouvelle", execution_id: executionId, recommended_action: "Consulter les alertes",
          });
          newAlerts = 1;
          prepareChannelAction("email", "digest", `${unreadAlerts.length} alerte(s) passive(s) à consulter`, { alert_count: unreadAlerts.length, type: "passive_digest" });
        }
        if (job_id) await svc.from("openclaw_jobs").update({ last_run_at: now(), next_run_at: nextDayAt(12) }).eq("id", job_id);
        result.alerts_created = newAlerts; result.recommendations_created = newAlerts; result.output_count = unreadAlerts.length;
        result.output_summary = unreadAlerts.length > 0 ? `${unreadAlerts.length} alerte(s) passive(s) détectée(s).` : "Aucune alerte passive non lue.";
        break;
      }

      // ── STUCK PIPELINE RECHECK ────────────────────────────────────────────
      case "stuck_pipeline_recheck": {
        const stuckOld = introductions.filter(i => i.statut !== "en_attente" ? false : Date.now() - new Date(i.created_at).getTime() > 7 * 24 * 60 * 60 * 1000);
        let recs = 0;
        if (stuckOld.length > 0) {
          await svc.from("openclaw_recommendations").insert({
            user_id: userId, type: "pipeline_bloque",
            title: `${stuckOld.length} introduction(s) bloquée(s) depuis + de 7 jours`,
            summary: `Le moteur a détecté des introductions sans réponse depuis plus d'une semaine.`,
            agent_name: "validator", priority: "haute", status: "nouvelle",
            execution_id: executionId, recommended_action: "Vérifier et relancer ces introductions",
          });
          recs = 1;
          prepareChannelAction("whatsapp", "relance", `${stuckOld.length} pipeline(s) bloqué(s) — relance préparée`, { stuck_count: stuckOld.length, type: "stuck_pipeline" });
        }
        if (job_id) await svc.from("openclaw_jobs").update({ last_run_at: now(), next_run_at: nextDayAt(11) }).eq("id", job_id);
        result.recommendations_created = recs; result.output_count = stuckOld.length;
        result.output_summary = stuckOld.length > 0 ? `Pipeline : ${stuckOld.length} introduction(s) bloquée(s) identifiée(s).` : "Pipeline fluide — aucun blocage détecté.";
        break;
      }

      // ── FACILITATOR MATCH REFRESH ─────────────────────────────────────────
      case "facilitator_match_refresh": {
        const missionsWithNoRequests: string[] = [];
        for (const mission of missions.slice(0, 5)) {
          const reqRes = await svc.from("facilitator_requests").select("id", { count: "exact", head: true }).eq("mission_id", mission.id);
          if ((reqRes.count || 0) === 0) {
            missionsWithNoRequests.push(mission.titre);
            prepareChannelAction("introduction", "outreach", `Invitation de facilitateur préparée pour "${mission.titre}"`,
              { mission_id: mission.id, mission_titre: mission.titre, type: "facilitator_invite" }, mission.id, "mission");
          }
        }
        let recsCreated = 0;
        if (missionsWithNoRequests.length > 0) {
          await svc.from("openclaw_recommendations").insert({
            user_id: userId, type: "match_facilitateur",
            title: `${missionsWithNoRequests.length} mission(s) sans facilitateur actif`,
            summary: `Ces missions n'ont pas encore de facilitateur associé : ${missionsWithNoRequests.join(", ")}.`,
            agent_name: "matchmaker", priority: "normale", status: "nouvelle",
            execution_id: executionId, recommended_action: "Explorer les facilitateurs disponibles",
          });
          recsCreated = 1;
        }
        if (job_id) await svc.from("openclaw_jobs").update({ last_run_at: now(), next_run_at: nextDayAt(10) }).eq("id", job_id);
        result.recommendations_created = recsCreated; result.output_count = missionsWithNoRequests.length;
        result.output_summary = missionsWithNoRequests.length > 0 ? `${missionsWithNoRequests.length} mission(s) identifiée(s) sans facilitateur actif.` : "Toutes vos missions ont des facilitateurs actifs.";
        break;
      }

      // ── PASSIVE OFFER REFRESH ─────────────────────────────────────────────
      case "passive_offer_refresh": {
        const offersRes = await svc.from("offers").select("id, title, status").eq("company_id", userId).in("status", ["active", "ready"]).limit(10);
        const activeOffers = offersRes.data || [];
        let recsCreated = 0;
        if (activeOffers.length > 0) {
          await svc.from("openclaw_recommendations").insert({
            user_id: userId, type: "offre_passive",
            title: `${activeOffers.length} offre(s) passive(s) active(s)`,
            summary: `Le moteur a vérifié vos offres passives. ${activeOffers.length} offre(s) est actuellement visible(s) par les facilitateurs.`,
            agent_name: "passive_distributor", priority: "faible", status: "nouvelle",
            execution_id: executionId, recommended_action: "Vérifier les performances",
          });
          recsCreated = 1;
          for (const offer of activeOffers.slice(0, 2)) {
            prepareChannelAction("introduction", "diffusion", `Diffusion passive préparée pour "${offer.title}"`,
              { offer_id: offer.id, offer_title: offer.title, type: "passive_diffusion" }, offer.id, "offer");
          }
        }
        if (job_id) await svc.from("openclaw_jobs").update({ last_run_at: now(), next_run_at: nextDayAt(12) }).eq("id", job_id);
        result.recommendations_created = recsCreated; result.output_count = activeOffers.length;
        result.output_summary = activeOffers.length > 0 ? `${activeOffers.length} offre(s) passive(s) vérifiée(s).` : "Aucune offre passive active.";
        break;
      }

      default: {
        result.status = "erreur";
        result.output_summary = `Type de job inconnu : ${job_type}`;
        result.error = `Unknown job type: ${job_type}`;
      }
    }

    // ── 4. Insert channel actions batch ──────────────────────────────────────
    if (channelActionBatch.length > 0) {
      await svc.from("openclaw_channel_actions").insert(channelActionBatch);
      result.channel_actions_created = channelActionBatch.length;
    }

    // ── 5. Complete the execution record ─────────────────────────────────────
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
      p_result_payload:  {
        ...(result.result_payload || {}),
        channel_actions_created: result.channel_actions_created,
        ai_powered: result.ai_powered,
        brain_mode: "internal",
        model: AI_MODEL,
      },
    });

    // ── 6. Run traceability ───────────────────────────────────────────────────
    await svc.from("openclaw_runs").insert({
      user_id: userId,
      run_type: job_type,
      trigger_source,
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
    next_best_action_generate: "brain_internal",
    stuck_pipeline_recheck:    "validator",
    facilitator_match_refresh: "matchmaker",
    passive_offer_refresh:     "passive_distributor",
  };
  return map[jobType] ?? "signal_hunter";
}
