import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user from JWT
    const supabaseAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) return new Response(JSON.stringify({ error: "Token invalide" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const { action } = body;

    // ── ACTION: create_signal ──────────────────────────────────
    if (action === "create_signal") {
      const { company_name, signal_type, source, raw_summary, signal_strength } = body;

      // Upsert company
      let companyId: string | null = null;
      const { data: existing } = await supabase.from("companies").select("id").ilike("name", company_name).limit(1).single();
      if (existing) {
        companyId = existing.id;
      } else {
        const { data: newCo } = await supabase.from("companies").insert({ name: company_name }).select("id").single();
        if (newCo) companyId = newCo.id;
      }

      // Create signal
      const { data: signal, error: sigErr } = await supabase.from("signals").insert({
        user_id: user.id,
        company_name,
        company_id: companyId,
        signal_type: signal_type || "autre",
        source: source || "manuel",
        signal_strength: signal_strength || 60,
        raw_summary: raw_summary || "",
        normalized_summary: raw_summary || "",
        status: "nouveau",
      }).select().single();

      if (sigErr) return new Response(JSON.stringify({ error: sigErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      // Auto-generate opportunity from signal
      const opportunity = await generateOpportunity(supabase, user.id, signal, null);

      return new Response(JSON.stringify({ signal, opportunity }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── ACTION: score_opportunity ──────────────────────────────
    if (action === "score_opportunity") {
      const { opportunity_id } = body;
      const { data: opp } = await supabase.from("opportunities").select("*").eq("id", opportunity_id).eq("user_id", user.id).single();
      if (!opp) return new Response(JSON.stringify({ error: "Opportunité introuvable" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      // Fetch user dossier for matching
      const { data: dossier } = await supabase.from("openclaw_dossier").select("*").eq("user_id", user.id).single();

      const scored = scoreAgainstDossier(opp, dossier);
      const facilitators = await rankFacilitators(supabase, opp);

      const { data: updated } = await supabase.from("opportunities").update({
        ...scored,
        suggested_facilitators: facilitators,
      }).eq("id", opportunity_id).select().single();

      return new Response(JSON.stringify({ opportunity: updated }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── ACTION: generate_from_dossier ─────────────────────────
    // Creates demo signals + opportunities based on dossier profile
    if (action === "generate_from_dossier") {
      const { data: dossier } = await supabase.from("openclaw_dossier").select("*").eq("user_id", user.id).single();
      if (!dossier) return new Response(JSON.stringify({ error: "Dossier introuvable" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const generated = await generateDemoSignals(supabase, user.id, dossier);
      return new Response(JSON.stringify(generated), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Action inconnue" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("deal-radar-score error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Helpers ────────────────────────────────────────────────────

async function generateOpportunity(supabase: any, userId: string, signal: any, dossier: any) {
  const { signal_type, company_name, raw_summary, signal_id } = signal;

  const summaryMap: Record<string, string> = {
    recrutement: `${company_name} recrute activement — signe de croissance.`,
    levee_fonds: `${company_name} vient de lever des fonds — budget disponible.`,
    actualite: `${company_name} fait l'actualité — moment d'attention idéal.`,
    lancement: `${company_name} lance quelque chose de nouveau — bonne fenêtre d'entrée.`,
    croissance: `${company_name} est en forte croissance — appétit pour de nouveaux partenaires.`,
    autre: `${company_name} émet un signal fort — opportunité à explorer.`,
  };

  const summary = summaryMap[signal_type] || summaryMap.autre;
  const strengthScore = signal.signal_strength || 60;

  const intentScore = Math.min(100, Math.max(0, strengthScore + Math.floor(Math.random() * 20) - 10));
  const intentLabel = intentScore >= 70 ? "eleve" : intentScore >= 40 ? "moyen" : "faible";

  const actionMap: Record<string, string> = {
    recrutement: "Identifier un facilitateur RH / commercial dans ce secteur",
    levee_fonds: "Prendre contact via un facilitateur financier ou VC",
    actualite: "Envoyer un message de félicitations personnalisé",
    lancement: "Proposer un partenariat ou une démonstration",
    croissance: "Introduire un facilitateur expert en développement commercial",
    autre: "Analyser la piste et identifier la meilleure approche",
  };

  const { data: opp } = await supabase.from("opportunities").insert({
    user_id: userId,
    company_name,
    company_id: signal.company_id || null,
    signal_id: signal.id || null,
    origin: "radar",
    summary: raw_summary || summary,
    intent_score: intentScore,
    intent_label: intentLabel,
    status: "nouvelle",
    recommended_next_action: actionMap[signal_type] || actionMap.autre,
  }).select().single();

  return opp;
}

function scoreAgainstDossier(opp: any, dossier: any) {
  if (!dossier) {
    return { dossier_match_label: "Non évalué", dossier_match_reason: "Complétez votre dossier pour obtenir un score de pertinence." };
  }

  let matchScore = 0;
  const reasons: string[] = [];

  // Sector match
  if (dossier.secteurs_prioritaires && opp.recommended_sector) {
    const sectors = (dossier.secteurs_prioritaires as string).toLowerCase();
    if (sectors.includes((opp.recommended_sector as string).toLowerCase())) {
      matchScore += 30;
      reasons.push("Secteur aligné avec vos priorités");
    }
  }

  // Zone match
  if (dossier.zone_geo && opp.company_name) {
    matchScore += 20; // Simplified — real impl would check location
    reasons.push("Zone géographique compatible");
  }

  // Intent score weight
  if (opp.intent_score >= 70) {
    matchScore += 30;
    reasons.push("Signal très fort");
  } else if (opp.intent_score >= 40) {
    matchScore += 15;
    reasons.push("Signal modéré");
  }

  // Cible match
  if (dossier.cible_ideale) {
    matchScore += 20;
    reasons.push("Profil correspondant à votre cible déclarée");
  }

  const label = matchScore >= 70 ? "Très proche de votre cible" : matchScore >= 40 ? "Pertinence moyenne" : "Hors cible principale";
  const reason = reasons.length > 0 ? reasons.slice(0, 2).join(" · ") : "Données insuffisantes pour évaluer la pertinence.";

  return { dossier_match_label: label, dossier_match_reason: reason };
}

async function rankFacilitators(supabase: any, opp: any) {
  // Get facilitateur profiles
  const { data: facilitateurs } = await supabase
    .from("facilitateur_profiles")
    .select("user_id, secteur, zone, types_contacts")
    .limit(10);

  if (!facilitateurs || facilitateurs.length === 0) return [];

  // Get names from profiles
  const userIds = facilitateurs.map((f: any) => f.user_id);
  const { data: profiles } = await supabase.from("profiles").select("id, prenom").in("id", userIds);
  const profileMap: Record<string, string> = {};
  (profiles || []).forEach((p: any) => { profileMap[p.id] = p.prenom || "Facilitateur"; });

  // Score each facilitateur
  return facilitateurs.slice(0, 3).map((f: any, i: number) => ({
    user_id: f.user_id,
    prenom: profileMap[f.user_id] || "Facilitateur",
    score: Math.max(30, 90 - i * 20),
    reason: f.secteur ? `Spécialisé en ${f.secteur}` : "Profil généraliste",
    zone: f.zone || "France",
  }));
}

async function generateDemoSignals(supabase: any, userId: string, dossier: any) {
  const sector = dossier?.secteurs_prioritaires || "B2B";
  const zone = dossier?.zone_geo || "France";

  const demoSignals = [
    { company_name: "TechPME Solutions", signal_type: "recrutement", source: "radar", signal_strength: 78, raw_summary: `TechPME Solutions recrute 5 commerciaux en ${zone} — signe clair de développement commercial.` },
    { company_name: "Groupe Novalis", signal_type: "levee_fonds", source: "radar", signal_strength: 85, raw_summary: `Groupe Novalis vient de boucler une levée de fonds Série A — budget disponible pour de nouveaux outils.` },
    { company_name: "Atelier Créatif RH", signal_type: "actualite", source: "radar", signal_strength: 62, raw_summary: `Atelier Créatif RH est cité dans Les Échos pour sa croissance dans le secteur ${sector}.` },
  ];

  const created = [];
  for (const sig of demoSignals) {
    // Upsert company
    let companyId: string | null = null;
    const { data: existing } = await supabase.from("companies").select("id").ilike("name", sig.company_name).limit(1).single();
    if (existing) {
      companyId = existing.id;
    } else {
      const { data: newCo } = await supabase.from("companies").insert({ name: sig.company_name, industry: sector, location: zone }).select("id").single();
      if (newCo) companyId = newCo.id;
    }

    const { data: signal } = await supabase.from("signals").insert({
      user_id: userId,
      company_name: sig.company_name,
      company_id: companyId,
      signal_type: sig.signal_type,
      source: sig.source,
      signal_strength: sig.signal_strength,
      raw_summary: sig.raw_summary,
      normalized_summary: sig.raw_summary,
      status: "nouveau",
    }).select().single();

    if (signal) {
      const opp = await generateOpportunity(supabase, userId, signal, dossier);
      if (opp) {
        const scored = scoreAgainstDossier(opp, dossier);
        await supabase.from("opportunities").update(scored).eq("id", opp.id);
        created.push({ signal, opportunity: { ...opp, ...scored } });
      }
    }
  }

  return { created, count: created.length };
}
