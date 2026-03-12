/**
 * openclaw-lead-generator
 * ──────────────────────────────────────────────────────────────────────────────
 * Génère 1 lead qualifié via IA (Lovable AI / Gemini) en s'appuyant sur le
 * dossier entreprise de l'utilisateur. Insère le résultat dans lead_intakes
 * avec source_type = 'openclaw_ai'.
 *
 * POST body:
 *   { user_id?: string }  // si absent, utilise le JWT (mode cron = service_role)
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";

const LOVABLE_API_KEY   = Deno.env.get("LOVABLE_API_KEY") ?? "";
const SUPABASE_URL      = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY          = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

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

// ── AI helper ─────────────────────────────────────────────────────────────────
async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   },
      ],
      temperature: 0.6,
      max_tokens: 1500,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${errText}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE);

  try {
    // ── Resolve target user_id ──────────────────────────────────────────────
    let userId: string | null = null;

    // Mode 1: authenticated user via JWT
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ") &&
        authHeader !== `Bearer ${SUPABASE_SERVICE}`) {
      userId = await getUserFromToken(req);
    }

    // Mode 2: cron / internal call passes user_id in body
    let bodyUsed = false;
    if (!userId) {
      const body = await req.json().catch(() => ({}));
      userId = body?.user_id ?? null;
      bodyUsed = true;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized — user_id required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Rate-limit: 100 req/min per user ────────────────────────────────────
    const rl = await checkRateLimit(userId, "openclaw-lead-generator", 100);
    if (!rl.allowed) {
      console.warn("[openclaw-lead-generator] Rate limit exceeded", { userId });
      return rateLimitResponse(corsHeaders);
    }

    // ── 1. Load user dossier ────────────────────────────────────────────────
    const { data: dossier } = await sb
      .from("openclaw_dossier")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!dossier || (dossier.completion_score ?? 0) < 20) {
      return new Response(JSON.stringify({
        success: false,
        skipped: true,
        reason: "Dossier incomplet — score < 20%. Complétez votre dossier pour activer OpenClaw.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── 2. Check subscription ────────────────────────────────────────────────
    const { data: sub } = await sb
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (!sub) {
      return new Response(JSON.stringify({
        success: false,
        skipped: true,
        reason: "Abonnement inactif.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── 3. Check daily lead generation limit (max 3/day) ────────────────────
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: todayCount } = await sb
      .from("lead_intakes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("source_type", "openclaw_ai")
      .gte("created_at", todayStart.toISOString());

    if ((todayCount ?? 0) >= 3) {
      return new Response(JSON.stringify({
        success: false,
        skipped: true,
        reason: "Limite quotidienne atteinte (3 leads/jour par OpenClaw).",
        leads_generated_today: todayCount,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── 4. Build persona context ─────────────────────────────────────────────
    const context = `
PROFIL ENTREPRISE :
- Activité : ${dossier.activite ?? "non renseignée"}
- Offre : ${dossier.offre ?? "non renseignée"}
- Valeur proposée : ${dossier.valeur_proposee ?? "non renseignée"}
- Cible idéale : ${dossier.cible_ideale ?? "non renseignée"}
- Type de décideur visé : ${dossier.type_decideur ?? "DG / Directeur Commercial"}
- Secteurs prioritaires : ${dossier.secteurs_prioritaires ?? "Tous secteurs"}
- Zone géographique : ${dossier.zone_geo ?? "France"}
- Ton des messages : ${dossier.ton_messages ?? "professionnel et direct"}
- Taille cible : ${dossier.taille_cible ?? "PME/ETI"}
- Angle principal : ${dossier.angle_principal ?? "ROI et gain de temps"}
`;

    // ── 5. AI prompt ─────────────────────────────────────────────────────────
    const systemPrompt = `Tu es OpenClaw, le moteur de prospection IA de WIINUP MAX.
Tu génères des leads B2B réalistes, plausibles et directement actionnables.
Tu réponds UNIQUEMENT en JSON valide, sans markdown, sans commentaire hors JSON.
Les noms de personnes et d'entreprises sont fictifs mais crédibles (style entreprise française/européenne réelle).`;

    const userPrompt = `Sur la base de ce profil client, génère 1 lead B2B qualifié.

${context}

Réponds UNIQUEMENT avec ce JSON (raw, sans backtick) :
{
  "person_name": "Prénom Nom réaliste",
  "person_email": "prenom.nom@domaine-entreprise.fr (domaine plausible)",
  "company_name": "Nom d'entreprise réaliste",
  "linkedin_url": "https://www.linkedin.com/in/prenom-nom-123456 (format LinkedIn valide)",
  "phone": "+33 6 XX XX XX XX",
  "free_text_context": "2-3 phrases contextualisées expliquant pourquoi ce contact est pertinent pour l'offre, avec un signal business concret (ex: croissance, recrutement, levée, refonte IT...)",
  "ai_label": "Froid|Tiède|Chaud|Brûlant",
  "ai_score": 40-92,
  "ai_reasoning": "1 phrase sur le signal clé qui justifie ce score",
  "next_best_action": "contact_email_draft|linkedin_connect|phone_call|enrichment_needed",
  "suggested_message_draft": "Un message d'approche court (3-4 phrases max) personnalisé selon le ton et l'offre de l'entreprise"
}

Règles :
- ai_score entre 65-92 si label Chaud/Brûlant, 40-64 si Froid/Tiède
- Le domaine email doit correspondre à l'entreprise
- Le contexte doit inclure un signal business réel (pas générique)
- Le message doit mentionner l'offre ou la valeur proposée sans être commercial poussif`;

    // ── 6. Call AI ────────────────────────────────────────────────────────────
    const rawAI = await callAI(systemPrompt, userPrompt);

    // ── 7. Parse JSON ─────────────────────────────────────────────────────────
    let lead: Record<string, unknown>;
    try {
      const clean = rawAI.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      lead = JSON.parse(clean);
    } catch {
      console.error("JSON parse error:", rawAI.substring(0, 500));
      return new Response(JSON.stringify({
        success: false,
        error: "Impossible de parser la réponse IA. Réessayez.",
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── 8. Create lead_source_event ───────────────────────────────────────────
    const { data: srcEvent } = await sb
      .from("lead_source_events")
      .insert({
        user_id: userId,
        source_type: "openclaw_ai",
        source_ref_type: "ai_generated",
        raw_payload: {
          generated_by: "openclaw-lead-generator",
          model: "gemini-2.5-flash",
          dossier_score: dossier.completion_score,
          suggested_message_draft: lead.suggested_message_draft ?? null,
        },
        processed: false,
      })
      .select("id")
      .single();

    // ── 9. Insert lead_intake ─────────────────────────────────────────────────
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
          generated_by: "openclaw_ai",
          generated_at: new Date().toISOString(),
        },
        ai_scored_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (intakeError) {
      console.error("lead_intake insert error:", intakeError);
      throw new Error(intakeError.message);
    }

    // Mark source event as processed
    if (srcEvent?.id) {
      await sb.from("lead_source_events")
        .update({ processed: true, intake_id: intake?.id })
        .eq("id", srcEvent.id);
    }

    // ── 10. Log to openclaw_logs ──────────────────────────────────────────────
    await sb.from("openclaw_logs").insert({
      user_id: userId,
      agent_id: "sourcing",
      event_type: "lead_generated",
      summary: `Lead IA généré : ${lead.person_name as string} @ ${lead.company_name as string} — Score ${lead.ai_score}`,
      details: {
        intake_id: intake?.id,
        person_name: lead.person_name,
        company_name: lead.company_name,
        ai_score: lead.ai_score,
        ai_label: lead.ai_label,
        model: "gemini-2.5-flash",
      },
      risque: "faible",
    }).catch(() => null);

    // ── 11. In-app notification ───────────────────────────────────────────────
    await sb.from("notifications").insert({
      user_id: userId,
      type: "lead_openclaw",
      title: "🎯 OpenClaw a trouvé un nouveau lead",
      body: `${lead.person_name as string} chez ${lead.company_name as string} — Score ${lead.ai_score}/100 (${lead.ai_label})`,
      href: "/leads",
    }).catch(() => null);

    return new Response(JSON.stringify({
      success: true,
      intake_id: intake?.id,
      lead: {
        person_name: lead.person_name,
        company_name: lead.company_name,
        ai_score: lead.ai_score,
        ai_label: lead.ai_label,
        next_best_action: lead.next_best_action,
      },
      message: `Lead généré : ${lead.person_name as string} @ ${lead.company_name as string}`,
      rate_limit_remaining: rl.remaining,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("openclaw-lead-generator error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : "Erreur interne",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
