/**
 * openclaw-generate
 * ─────────────────
 * Analyse le dossier entreprise de l'utilisateur, l'état de ses agents,
 * ses validations et campagnes, puis génère via Gemini :
 *   • des recommandations concrètes (openclaw_recommendations)
 *   • un brief du jour (openclaw_briefs)
 *
 * POST body:
 *   { force?: boolean }   // force même si brief du jour existe déjà
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const SUPABASE_URL    = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// ── Helper : call Lovable AI Gateway ─────────────────────────────────────────
async function callAI(prompt: string, systemPrompt: string): Promise<string> {
  const res = await fetch("https://api.lovable.app/ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    }),
  });
  if (!res.ok) throw new Error(`AI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getUserFromToken(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE);
  const { data } = await sb.auth.getUser(token);
  return data.user ?? null;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await getUserFromToken(req);
    if (!user) return new Response(JSON.stringify({ error: "Non authentifié" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const body = await req.json().catch(() => ({}));
    const force = body?.force === true;

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE);

    // ── 1. Charger le contexte utilisateur ─────────────────────────────────
    const [dossierRes, agentsRes, validationsRes, logsRes, configRes] = await Promise.all([
      sb.from("openclaw_dossier").select("*").eq("user_id", user.id).maybeSingle(),
      sb.from("openclaw_agents").select("*").eq("user_id", user.id),
      sb.from("openclaw_validations").select("*").eq("user_id", user.id)
         .eq("statut", "en_attente").order("created_at", { ascending: false }).limit(10),
      sb.from("openclaw_logs").select("*").eq("user_id", user.id)
         .order("created_at", { ascending: false }).limit(20),
      sb.from("openclaw_config").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

    // ── 2. Brief du jour déjà généré aujourd'hui ? ─────────────────────────
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: existingBrief } = await sb.from("openclaw_briefs")
      .select("id, created_at")
      .eq("user_id", user.id)
      .gte("created_at", todayStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingBrief && !force) {
      // Brief déjà là, on renvoie juste le résumé sans régénérer
      const { data: recs } = await sb.from("openclaw_recommendations")
        .select("*").eq("user_id", user.id)
        .eq("status", "nouvelle").order("created_at", { ascending: false }).limit(10);
      return new Response(JSON.stringify({
        success: true,
        generated: false,
        message: "Le brief du jour est déjà à jour.",
        recommendations_count: recs?.length ?? 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const dossier = dossierRes.data;
    const agents  = agentsRes.data ?? [];
    const validations = validationsRes.data ?? [];
    const logs    = logsRes.data ?? [];
    const config  = configRes.data;

    // ── 3. Construire le prompt de contexte ────────────────────────────────
    const contextSummary = `
DOSSIER ENTREPRISE :
- Activité : ${dossier?.activite ?? "non renseignée"}
- Offre : ${dossier?.offre ?? "non renseignée"}
- Valeur proposée : ${dossier?.valeur_proposee ?? "non renseignée"}
- Cible idéale : ${dossier?.cible_ideale ?? "non renseignée"}
- Secteurs : ${dossier?.secteurs_prioritaires ?? "non renseigné"}
- Zone géo : ${dossier?.zone_geo ?? "non renseignée"}
- Objectif opportunités/mois : ${dossier?.objectif_opportunites ?? "non défini"}
- Objectif introductions/mois : ${dossier?.objectif_introductions ?? "non défini"}
- Canaux autorisés : ${(dossier?.canaux_autorises ?? []).join(", ") || "LinkedIn, Email"}
- Canaux interdits : ${(dossier?.canaux_interdits ?? []).join(", ") || "aucun"}
- Ton des messages : ${dossier?.ton_messages ?? "professionnel"}
- Mode de prospection : ${dossier?.mode_prospection ?? "assiste"}
- Validation humaine requise : ${dossier?.validation_humaine_requise ? "oui" : "non"}

AGENTS OPENCLAW (${agents.length}) :
${agents.map((a: Record<string, unknown>) => `- ${a.nom} (${a.agent_id}) : ${a.statut}${a.kill_switch ? " [STOPPÉ]" : ""}${a.action_en_cours ? ` — en cours : ${a.action_en_cours}` : ""}`).join("\n") || "Aucun agent initialisé"}

VALIDATIONS EN ATTENTE : ${validations.length}
${validations.slice(0, 3).map((v: Record<string, unknown>) => `- ${v.titre} (risque: ${v.risque})`).join("\n") || "aucune"}

DERNIERS LOGS (${logs.length}) :
${logs.slice(0, 5).map((l: Record<string, unknown>) => `- ${l.event_type}: ${l.summary}`).join("\n") || "aucun log récent"}

CONNEXION GATEWAY : ${config?.is_connected ? "connectée" : "non connectée"}
NIVEAU D'AUTONOMIE : ${config?.autonomie_level ?? "preparation"}
SCORE DOSSIER : ${dossier?.completion_score ?? 0}%
`;

    const systemPrompt = `Tu es le cerveau agentique OpenClaw intégré à WIINUP MAX, une plateforme de prospection commerciale.
Tu analyses le contexte d'un utilisateur et génères des recommandations concrètes, actionnables, en français.
Tu réponds UNIQUEMENT en JSON valide, sans markdown, sans texte hors JSON.
Sois précis, humain, utile. Parle à la 1ère personne au nom de WIINUP MAX.
Chaque recommandation doit être exploitable immédiatement.`;

    const prompt = `Analyse ce contexte et génère exactement le JSON suivant :

${contextSummary}

Génère ce JSON (sans markdown, uniquement le JSON brut) :
{
  "brief": {
    "title": "Brief du [date du jour en format court ex: 7 mars]",
    "summary": "Une phrase résumant la situation et la prochaine priorité absolue (max 120 caractères)",
    "priority_items": [
      { "label": "libellé court de la priorité", "type": "validation|campagne|action|opportunite|dossier", "link": "/chemin-app", "urgent": true|false }
    ],
    "suggested_actions": [
      { "label": "action courte et concrète", "link": "/chemin-app", "priority": "urgente|haute|normale" }
    ],
    "stats": {
      "score_sante": 0-100,
      "prochaine_etape": "une phrase sur quoi faire maintenant"
    }
  },
  "recommendations": [
    {
      "agent_name": "stratege|sourcing|message|execution|qualification|controle",
      "type": "action|campagne|message|opportunite|relance|validation",
      "title": "Titre court et clair de la recommandation",
      "summary": "Explication humaine en 1-2 phrases de pourquoi c'est important",
      "priority": "urgente|haute|normale|basse",
      "recommended_action": "Ce que l'utilisateur doit faire concrètement",
      "linked_entity_type": "contact|campagne|mission|action|null",
      "payload": {}
    }
  ]
}

Règles :
- 3 à 6 recommandations maximum
- 2 à 4 priority_items dans le brief
- 2 à 3 suggested_actions
- Si le dossier est incomplet (score < 50%), ajoute une recommandation pour le compléter
- Si des validations sont en attente, mets-les en priorité urgente
- Sois concis, utile, humain
- Les liens doivent être valides dans l'app : /pilotage, /agents, /validations, /actions, /campagnes, /dossier, /contacts, /opportunites, /missions`;

    // ── 4. Appel IA ────────────────────────────────────────────────────────
    let aiResponse: string;
    try {
      aiResponse = await callAI(prompt, systemPrompt);
    } catch (err) {
      console.error("AI call failed:", err);
      // Fallback : brief générique si l'IA échoue
      aiResponse = JSON.stringify({
        brief: {
          title: `Brief du ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`,
          summary: "OpenClaw a analysé votre situation. Voici vos priorités du jour.",
          priority_items: validations.length > 0
            ? [{ label: `${validations.length} validation(s) en attente`, type: "validation", link: "/validations", urgent: true }]
            : [{ label: "Compléter votre dossier entreprise", type: "dossier", link: "/dossier", urgent: false }],
          suggested_actions: [
            { label: "Voir mes validations", link: "/validations", priority: "haute" },
            { label: "Consulter mes actions", link: "/actions", priority: "normale" },
          ],
          stats: { score_sante: dossier?.completion_score ?? 0, prochaine_etape: "Completez votre dossier pour recevoir des recommandations personnalisées." },
        },
        recommendations: [
          ...(dossier && (dossier.completion_score ?? 0) < 60 ? [{
            agent_name: "stratege",
            type: "dossier",
            title: "Compléter votre dossier entreprise",
            summary: "Votre dossier n'est pas encore complet. Les agents ne peuvent pas préparer efficacement votre prospection.",
            priority: "haute",
            recommended_action: "Rendez-vous dans votre dossier et complétez les sections manquantes.",
            linked_entity_type: null,
            payload: {},
          }] : []),
          ...(validations.length > 0 ? [{
            agent_name: "controle",
            type: "validation",
            title: `${validations.length} action(s) attendant votre accord`,
            summary: "Des agents ont préparé des actions qui nécessitent votre validation avant d'être exécutées.",
            priority: "urgente",
            recommended_action: "Consultez la boîte de validation et traitez les demandes en attente.",
            linked_entity_type: null,
            payload: {},
          }] : []),
        ],
      });
    }

    // ── 5. Parser le JSON de l'IA ──────────────────────────────────────────
    let parsed: { brief: Record<string, unknown>; recommendations: Record<string, unknown>[] };
    try {
      // Nettoyer le JSON si l'IA a ajouté des backticks
      const clean = aiResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      console.error("JSON parse error, raw:", aiResponse.substring(0, 500));
      return new Response(JSON.stringify({
        success: false,
        error: "Impossible d'analyser la réponse du cerveau. Réessayez dans quelques instants.",
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── 6. Sauvegarder le brief ────────────────────────────────────────────
    const { data: briefInsert } = await sb.from("openclaw_briefs").insert({
      user_id: user.id,
      title: parsed.brief?.title ?? "Brief du jour",
      summary: parsed.brief?.summary ?? "",
      priority_items: parsed.brief?.priority_items ?? [],
      suggested_actions: parsed.brief?.suggested_actions ?? [],
      stats: parsed.brief?.stats ?? {},
    }).select().single();

    // ── 7. Sauvegarder les recommandations ─────────────────────────────────
    const recs = (parsed.recommendations ?? []).map((r: Record<string, unknown>) => ({
      user_id: user.id,
      agent_name: r.agent_name ?? "stratege",
      type: r.type ?? "action",
      title: r.title ?? "Recommandation",
      summary: r.summary ?? "",
      priority: r.priority ?? "normale",
      status: "nouvelle",
      recommended_action: r.recommended_action ?? null,
      linked_entity_type: r.linked_entity_type ?? null,
      linked_entity_id: r.linked_entity_id ?? null,
      payload: r.payload ?? {},
    }));

    await sb.from("openclaw_recommendations").insert(recs);

    // ── 8. Log ─────────────────────────────────────────────────────────────
    await sb.from("openclaw_logs").insert({
      user_id: user.id,
      agent_id: "stratege",
      event_type: "brief_generated",
      summary: `Brief du jour généré — ${recs.length} recommandation(s)`,
      details: { brief_id: briefInsert?.id, recommendations_count: recs.length },
      risque: "faible",
    });

    return new Response(JSON.stringify({
      success: true,
      generated: true,
      brief_id: briefInsert?.id,
      recommendations_count: recs.length,
      message: `Brief généré avec ${recs.length} recommandation(s).`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("openclaw-generate error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : "Erreur interne",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
