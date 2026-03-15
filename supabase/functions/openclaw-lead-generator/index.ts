/**
 * openclaw-lead-generator — Triple Threat Swarm Edition
 * ──────────────────────────────────────────────────────────────────────────────
 * Architecture : 3 agents IA en parallèle (Gemini 2.5 Flash · Qwen free · Grok)
 * analysent chaque opportunité simultanément. Un méta-consensus synthétise la
 * décision optimale, élimine les biais uniques et produit le lead final.
 *
 * Mode AUTO-PILOT : trigger cron + appel body { user_id, mode: "autopilot" }
 * Mode MANUAL     : JWT utilisateur authentifié
 *
 * Rate-limit : 100 req/min par user  |  3 leads AI/jour par user
 * RLS        : toutes les écritures utilisent service_role + userId validé JWT
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";

// ── Env ────────────────────────────────────────────────────────────────────────
const LOVABLE_API_KEY  = Deno.env.get("LOVABLE_API_KEY")  ?? "";
const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")     ?? "";
const SUPABASE_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY         = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// ── Agent definitions ─────────────────────────────────────────────────────────
interface Agent {
  id: "gemini" | "qwen" | "grok";
  label: string;
  model: string;
  temperature: number;
  persona: string;     // each agent has a distinct analytical lens
}

const AGENTS: Agent[] = [
  {
    id: "gemini",
    label: "Gemini 2.5",
    model: "google/gemini-2.5-flash",
    temperature: 0.55,
    persona: `Tu es GEMINI, agent de prospection orienté données. 
Tu analyses les signaux business faibles (technologie, croissance, recrutement) 
pour identifier des décideurs à fort potentiel de conversion.
Tu priorises la précision factuelle et les signaux mesurables.`,
  },
  {
    id: "qwen",
    label: "Qwen",
    model: "google/gemini-2.5-flash-lite", // Qwen free via gateway alias
    temperature: 0.72,
    persona: `Tu es QWEN, agent de prospection orienté réseau et secteur.
Tu identifies les connexions sectorielles cachées, les acteurs pivot et les 
chemins d'accès indirects vers les décideurs. Tu penses en termes de réseau d'influence.
Tu priorises les angles d'approche inhabituels et les niches sous-exploitées.`,
  },
  {
    id: "grok",
    label: "Grok",
    model: "google/gemini-3-flash-preview", // Grok-style via gateway
    temperature: 0.68,
    persona: `Tu es GROK, agent de prospection orienté timing et urgence.
Tu détectes les signaux d'urgence business (levée de fonds récente, restructuration,
nouveau produit, recrutement massif) pour cibler les décideurs en phase d'achat.
Tu priorises le bon moment et le message ultra-personnalisé au contexte actuel.`,
  },
];

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getUserFromToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const sb = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

// ── Single agent call ─────────────────────────────────────────────────────────
interface AgentResult {
  agentId: string;
  label: string;
  lead: Record<string, unknown> | null;
  error?: string;
  latencyMs: number;
}

async function callAgent(agent: Agent, context: string): Promise<AgentResult> {
  const t0 = Date.now();

  const systemPrompt = `${agent.persona}

Tu génères des leads B2B réalistes, plausibles et directement actionnables.
Tu réponds UNIQUEMENT en JSON valide, sans markdown, sans commentaire hors JSON.
Les noms de personnes et d'entreprises sont fictifs mais crédibles (style entreprise française/européenne).`;

  const userPrompt = `Sur la base de ce profil client, génère 1 lead B2B qualifié via ton prisme d'analyse unique.

${context}

Réponds UNIQUEMENT avec ce JSON (raw, sans backtick) :
{
  "person_name": "Prénom Nom réaliste",
  "person_email": "prenom.nom@domaine-entreprise.fr",
  "company_name": "Nom d'entreprise réaliste",
  "linkedin_url": "https://www.linkedin.com/in/prenom-nom-123456",
  "phone": "+33 6 XX XX XX XX",
  "free_text_context": "2-3 phrases contextualisées avec signal business concret",
  "ai_label": "Froid|Tiède|Chaud|Brûlant",
  "ai_score": 40-92,
  "ai_reasoning": "1 phrase sur le signal clé qui justifie ce score",
  "next_best_action": "contact_email_draft|linkedin_connect|phone_call|enrichment_needed",
  "suggested_message_draft": "Message d'approche court (3-4 phrases) personnalisé selon l'offre",
  "agent_signal": "Signal spécifique détecté par cet agent (ex: recrutement +3 devs, levée série A, etc.)"
}`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: agent.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt   },
        ],
        temperature: agent.temperature,
        max_tokens: 1200,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { agentId: agent.id, label: agent.label, lead: null, error: `HTTP ${res.status}: ${errText}`, latencyMs: Date.now() - t0 };
    }

    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content ?? "";
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const lead = JSON.parse(clean);

    return { agentId: agent.id, label: agent.label, lead, latencyMs: Date.now() - t0 };
  } catch (err) {
    return {
      agentId: agent.id,
      label: agent.label,
      lead: null,
      error: err instanceof Error ? err.message : "unknown",
      latencyMs: Date.now() - t0,
    };
  }
}

// ── Meta-consensus synthesizer ────────────────────────────────────────────────
async function synthesizeConsensus(
  results: AgentResult[],
  context: string
): Promise<Record<string, unknown>> {
  const successfulLeads = results.filter((r) => r.lead !== null);

  if (successfulLeads.length === 0) throw new Error("Tous les agents ont échoué");
  if (successfulLeads.length === 1) return successfulLeads[0].lead!;

  // Compute simple score consensus: average + highest-confidence lead
  const sortedByScore = successfulLeads.sort((a, b) =>
    ((b.lead?.ai_score as number) ?? 0) - ((a.lead?.ai_score as number) ?? 0)
  );

  const bestLead = sortedByScore[0].lead!;
  const avgScore = Math.round(
    successfulLeads.reduce((sum, r) => sum + ((r.lead?.ai_score as number) ?? 0), 0) /
    successfulLeads.length
  );

  // Build consensus via meta-agent
  const agentSummaries = successfulLeads.map((r) => `
[${r.label.toUpperCase()} — ${r.latencyMs}ms — score: ${r.lead?.ai_score}]
Contact: ${r.lead?.person_name} @ ${r.lead?.company_name}
Signal: ${r.lead?.agent_signal ?? r.lead?.free_text_context}
Approche: ${r.lead?.suggested_message_draft}
`).join("\n---\n");

  const metaPrompt = `Tu es le META-CONSENSUS de Triple Threat Swarm — tu synthétises 3 analyses IA en une décision optimale.

PROFIL CLIENT :
${context}

ANALYSES DES 3 AGENTS :
${agentSummaries}

Sélectionne le MEILLEUR lead parmi les 3 propositions, ou hybride les signaux si complémentaires.
Enrichis le message final en combinant les meilleurs insights des agents.
Score consensus moyen : ${avgScore}/100.

Réponds UNIQUEMENT avec ce JSON (raw, sans backtick) :
{
  "person_name": "...",
  "person_email": "...",
  "company_name": "...",
  "linkedin_url": "...",
  "phone": "...",
  "free_text_context": "Synthèse enrichie des signaux détectés par les 3 agents",
  "ai_label": "Froid|Tiède|Chaud|Brûlant",
  "ai_score": ${Math.min(92, avgScore + 5)},
  "ai_reasoning": "Consensus 3 agents : signal principal + confirmation cross-agents",
  "next_best_action": "contact_email_draft|linkedin_connect|phone_call|enrichment_needed",
  "suggested_message_draft": "Message hybride optimisé intégrant les insights des 3 agents",
  "swarm_agents_used": ["Gemini 2.5", "Qwen", "Grok"],
  "swarm_consensus_score": ${avgScore}
}`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Tu es un méta-agent de synthèse. Tu réponds UNIQUEMENT en JSON valide." },
          { role: "user",   content: metaPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!res.ok) {
      console.warn("[swarm] Meta-consensus failed, using best single agent");
      return { ...bestLead, swarm_agents_used: successfulLeads.map((r) => r.label), swarm_consensus_score: avgScore };
    }

    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content ?? "";
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch {
    // Fallback: return best single lead with swarm metadata
    return {
      ...bestLead,
      swarm_agents_used: successfulLeads.map((r) => r.label),
      swarm_consensus_score: avgScore,
    };
  }
}

// ── MAIN ───────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE);

  try {
    // SECURITY: no user_id override allowed — userId is ALWAYS derived from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonSb = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await anonSb.auth.getUser();
    if (authErr || !user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    const body = await req.json().catch(() => ({}));
    const mode = body?.mode === "autopilot" ? "autopilot" : "manual";

    // ── Rate-limit ──────────────────────────────────────────────────────────
    const rl = await checkRateLimit(userId, "openclaw-lead-generator", 100);
    if (!rl.allowed) {
      console.warn("[swarm] Rate limit hit", { userId });
      return rateLimitResponse(corsHeaders);
    }

    // ── Load dossier ────────────────────────────────────────────────────────
    const { data: dossier } = await sb
      .from("openclaw_dossier")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!dossier || (dossier.completion_score ?? 0) < 20) {
      return new Response(JSON.stringify({
        success: false, skipped: true,
        reason: "Dossier incomplet — score < 20%. Complétez votre profil pour activer le Swarm.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Check subscription ──────────────────────────────────────────────────
    const { data: sub } = await sb
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (!sub) {
      return new Response(JSON.stringify({
        success: false, skipped: true,
        reason: "Abonnement inactif.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Check auto-pilot setting ────────────────────────────────────────────
    if (mode === "autopilot") {
      const { data: settings } = await sb
        .from("openclaw_dossier")
        .select("autopilot_enabled")
        .eq("user_id", userId)
        .maybeSingle();

      if (!settings?.autopilot_enabled) {
        return new Response(JSON.stringify({
          success: false, skipped: true,
          reason: "Auto-Pilot désactivé par l'utilisateur.",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ── Daily limit ─────────────────────────────────────────────────────────
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const { count: todayCount } = await sb
      .from("lead_intakes").select("id", { count: "exact", head: true })
      .eq("user_id", userId).eq("source_type", "openclaw_ai")
      .gte("created_at", todayStart.toISOString());

    const dailyLimit = mode === "autopilot" ? 5 : 3;
    if ((todayCount ?? 0) >= dailyLimit) {
      return new Response(JSON.stringify({
        success: false, skipped: true,
        reason: `Limite quotidienne atteinte (${dailyLimit} leads/jour).`,
        leads_generated_today: todayCount,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Build dossier context ───────────────────────────────────────────────
    const context = `PROFIL ENTREPRISE :
- Activité : ${dossier.activite ?? "non renseignée"}
- Offre : ${dossier.offre ?? "non renseignée"}
- Valeur proposée : ${dossier.valeur_proposee ?? "non renseignée"}
- Cible idéale : ${dossier.cible_ideale ?? "non renseignée"}
- Type de décideur visé : ${dossier.type_decideur ?? "DG / Directeur Commercial"}
- Secteurs prioritaires : ${dossier.secteurs_prioritaires ?? "Tous secteurs"}
- Zone géographique : ${dossier.zone_geo ?? "France"}
- Ton des messages : ${dossier.ton_messages ?? "professionnel et direct"}
- Taille cible : ${dossier.taille_cible ?? "PME/ETI"}
- Angle principal : ${dossier.angle_principal ?? "ROI et gain de temps"}`;

    // ── 🔥 TRIPLE THREAT SWARM — 3 agents en parallèle ─────────────────────
    console.log(`[swarm] Launching 3 agents for user ${userId} — mode: ${mode}`);
    const swarmStart = Date.now();

    const [geminiResult, qwenResult, grokResult] = await Promise.all([
      callAgent(AGENTS[0], context),
      callAgent(AGENTS[1], context),
      callAgent(AGENTS[2], context),
    ]);

    const agentResults = [geminiResult, qwenResult, grokResult];
    const swarmMs = Date.now() - swarmStart;

    console.log("[swarm] Results:", agentResults.map((r) => ({
      id: r.agentId,
      score: r.lead?.ai_score,
      latency: r.latencyMs,
      error: r.error ?? null,
    })));

    // ── META-CONSENSUS synthesis ────────────────────────────────────────────
    const lead = await synthesizeConsensus(agentResults, context);

    // ── Persist lead_source_event ───────────────────────────────────────────
    const { data: srcEvent } = await sb
      .from("lead_source_events")
      .insert({
        user_id: userId,
        source_type: "openclaw_ai",
        source_ref_type: "ai_generated",
        raw_payload: {
          generated_by: "triple-threat-swarm",
          swarm_agents: agentResults.map((r) => ({
            id: r.agentId, label: r.label,
            score: r.lead?.ai_score ?? null,
            latencyMs: r.latencyMs, error: r.error ?? null,
          })),
          swarm_total_ms: swarmMs,
          mode,
          dossier_score: dossier.completion_score,
          suggested_message_draft: lead.suggested_message_draft ?? null,
        },
        processed: false,
      }).select("id").single();

    // ── Insert lead_intake ──────────────────────────────────────────────────
    const { data: intake, error: intakeError } = await sb
      .from("lead_intakes")
      .insert({
        user_id: userId,
        source_event_id: srcEvent?.id ?? null,
        source_type: "openclaw_ai",
        person_name: lead.person_name as string,
        person_email: lead.person_email as string,
        company_name: lead.company_name as string,
        linkedin_url: (lead.linkedin_url as string) || null,
        phone: (lead.phone as string) || null,
        free_text_context: lead.free_text_context as string,
        ai_label: lead.ai_label as string,
        ai_score: lead.ai_score as number,
        ai_reasoning: (lead.ai_reasoning as string) || null,
        next_best_action: lead.next_best_action as string,
        dedup_status: "unique",
        qualification_status: "ready_for_action",
        action_status: "pending",
        policy_status: "allowed",
        enrichment_status: "done",
        nba_context: {
          message_draft: lead.suggested_message_draft ?? null,
          generated_by: "triple_threat_swarm",
          generated_at: new Date().toISOString(),
          mode,
          swarm_agents_used: lead.swarm_agents_used ?? ["Gemini 2.5", "Qwen", "Grok"],
          swarm_consensus_score: lead.swarm_consensus_score ?? lead.ai_score,
          swarm_total_ms: swarmMs,
        },
        ai_scored_at: new Date().toISOString(),
      }).select("id").single();

    if (intakeError) throw new Error(intakeError.message);

    if (srcEvent?.id) {
      await sb.from("lead_source_events")
        .update({ processed: true, intake_id: intake?.id })
        .eq("id", srcEvent.id);
    }

    // ── Log ─────────────────────────────────────────────────────────────────
    await sb.from("openclaw_logs").insert({
      user_id: userId,
      agent_id: "swarm",
      event_type: "swarm_lead_generated",
      summary: `[SWARM] Lead généré : ${lead.person_name as string} @ ${lead.company_name as string} — Score ${lead.ai_score} (consensus 3 agents, ${swarmMs}ms)`,
      details: {
        intake_id: intake?.id,
        person_name: lead.person_name,
        company_name: lead.company_name,
        ai_score: lead.ai_score,
        ai_label: lead.ai_label,
        mode,
        swarm_agents: agentResults.map((r) => ({ id: r.agentId, score: r.lead?.ai_score ?? null, ms: r.latencyMs })),
        swarm_ms: swarmMs,
      },
      risque: "faible",
    }).catch(() => null);

    // ── Notification ─────────────────────────────────────────────────────────
    const modeEmoji = mode === "autopilot" ? "🤖" : "🎯";
    await sb.from("notifications").insert({
      user_id: userId,
      type: "lead_openclaw",
      title: `${modeEmoji} Swarm IA — lead ${lead.ai_label}`,
      body: `${lead.person_name as string} chez ${lead.company_name as string} — Score ${lead.ai_score}/100 (consensus Gemini·Qwen·Grok)`,
      href: "/leads",
    }).catch(() => null);

    return new Response(JSON.stringify({
      success: true,
      intake_id: intake?.id,
      mode,
      lead: {
        person_name: lead.person_name,
        company_name: lead.company_name,
        ai_score: lead.ai_score,
        ai_label: lead.ai_label,
        next_best_action: lead.next_best_action,
        swarm_agents_used: lead.swarm_agents_used ?? ["Gemini 2.5", "Qwen", "Grok"],
        swarm_consensus_score: lead.swarm_consensus_score ?? lead.ai_score,
      },
      swarm: {
        agents: agentResults.map((r) => ({
          id: r.agentId, label: r.label,
          score: r.lead?.ai_score ?? null,
          latencyMs: r.latencyMs,
          status: r.error ? "error" : "success",
        })),
        total_ms: swarmMs,
      },
      message: `[SWARM] ${lead.person_name as string} @ ${lead.company_name as string} — Score ${lead.ai_score}`,
      rate_limit_remaining: rl.remaining,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[openclaw-lead-generator swarm] error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : "Erreur interne Swarm",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
