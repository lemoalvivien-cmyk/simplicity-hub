/**
 * etg-predict — Eternal Trust Graph Predictive Engine
 * ─────────────────────────────────────────────────────
 * Génère des opportunités prédictives 6-12 semaines avec un scoring
 * de précision croissant basé sur les signaux graphiques.
 *
 * POST /etg-predict
 * body: { action: "generate_predictions" | "get_predictions", weeks_min?, weeks_max?, min_confidence? }
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

// deno-lint-ignore no-explicit-any
type AnyClient = any;

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY         = Deno.env.get("SUPABASE_ANON_KEY")!;

// ── Scoring constants ────────────────────────────────────────────
const WEIGHTS = {
  trust_score:          0.35,
  hidden_link_strength: 0.20,
  deal_count_signal:    0.15,
  sector_match:         0.15,
  zone_match:           0.10,
  recency:              0.05,
};

/** Compute precision delta: how much confidence increases per new signal */
function computePrecisionDelta(signalCount: number, baseConfidence: number): number {
  const diminishingReturns = Math.log(1 + signalCount) / Math.log(10);
  const delta = Math.round((100 - baseConfidence) * diminishingReturns * 0.15 * 10) / 10;
  return Math.min(delta, 25);
}

/** Estimate deal value based on sector + trust scores */
function estimateDealValue(sector: string | null, trustScore: number): number {
  const sectorBase: Record<string, number> = {
    "SaaS / Tech": 15000, "Finance":  25000, "Industrie": 20000,
    "Healthcare":  30000, "Retail":   10000, "Consulting":18000,
  };
  const base  = sectorBase[sector || ""] || 12000;
  const multiplier = 0.5 + (trustScore / 100);
  return Math.round(base * multiplier);
}

/** Core prediction engine: score hidden links and build opportunities */
async function generatePredictions(
  db: AnyClient,
  userId: string,
  weeksMin = 6,
  weeksMax = 12
): Promise<{ generated: number; skipped: number }> {
  // 1. Load hidden links with high probability
  const { data: hiddenLinks } = await db
    .from("etg_hidden_links")
    .select(`
      id, person_a_id, person_b_id,
      strength, confidence, predicted_deal_probability,
      inference_path
    `)
    .eq("user_id", userId)
    .gte("predicted_deal_probability", 0.30)
    .order("predicted_deal_probability", { ascending: false })
    .limit(50);

  // 2. Load links for context
  const { data: links } = await db
    .from("etg_links")
    .select("from_id, to_id, link_type, trust_score, hidden_link_strength, weight, metadata")
    .eq("user_id", userId);

  // 3. Load user profile for sector/zone matching
  const { data: facProfile } = await db
    .from("facilitateur_profiles")
    .select("secteur, zone, languages")
    .eq("user_id", userId)
    .maybeSingle();

  const userSector = facProfile?.secteur || null;
  const userZone   = facProfile?.zone    || null;

  // 4. Load persons for context
  const { data: persons } = await db
    .from("etg_persons")
    .select("id, sector, zone, trust_index, deal_count, intro_count")
    .limit(200);

  const personMap = new Map((persons || []).map((p: { id: string }) => [p.id, p]));
  const linkMap   = new Map<string, number>();
  for (const l of (links || [])) {
    const key = `${l.from_id}→${l.to_id}:${l.link_type}`;
    linkMap.set(key, l.trust_score);
  }

  let generated = 0;
  let skipped   = 0;

  for (const hl of (hiddenLinks || [])) {
    const personA = personMap.get(hl.person_a_id);
    const personB = personMap.get(hl.person_b_id);
    if (!personA || !personB) { skipped++; continue; }

    // Compute composite confidence score
    const trustSignal        = (personA.trust_index + personB.trust_index) / 2;
    const hiddenStrength     = hl.strength;
    const dealSignal         = Math.min(100, (personA.deal_count + personB.deal_count) * 10);
    const sectorMatch        = (personA.sector === userSector || personB.sector === userSector) ? 100 : 40;
    const zoneMatch          = (personA.zone   === userZone   || personB.zone   === userZone  ) ? 100 : 40;
    const recencySignal      = 60; // static for now — will use last_activity_at in v2

    const confidenceScore = Math.round(
      trustSignal         * WEIGHTS.trust_score +
      hiddenStrength      * WEIGHTS.hidden_link_strength +
      dealSignal          * WEIGHTS.deal_count_signal +
      sectorMatch         * WEIGHTS.sector_match +
      zoneMatch           * WEIGHTS.zone_match +
      recencySignal       * WEIGHTS.recency
    );

    if (confidenceScore < 20) { skipped++; continue; }

    const signalCount     = (personA.intro_count || 0) + (personB.intro_count || 0);
    const precisionDelta  = computePrecisionDelta(signalCount, confidenceScore);
    const dealValue       = estimateDealValue(personA.sector || userSector, trustSignal);
    const commission      = Math.round(dealValue * 0.07);

    // Build trust path
    const trustPath = hl.inference_path || [];

    // Generate reasoning text
    const confidence_label =
      confidenceScore >= 75 ? "Très haute" :
      confidenceScore >= 55 ? "Haute"      :
      confidenceScore >= 35 ? "Moyenne"    : "Faible";

    const reasoning = [
      `Confiance ${confidence_label} (${confidenceScore}/100).`,
      `Lien latent détecté avec force ${hiddenStrength}/100.`,
      `Secteur ${sectorMatch === 100 ? "✓ aligné" : "partiel"}, Zone ${zoneMatch === 100 ? "✓ alignée" : "partielle"}.`,
      `Valeur estimée : ${dealValue.toLocaleString("fr-FR")} € — Commission 7% : ${commission.toLocaleString("fr-FR")} €.`,
      `Précision progresse de +${precisionDelta}% par nouveau signal.`,
    ].join(" ");

    // Upsert opportunity
    await db.from("etg_opportunities").upsert({
      user_id:                     userId,
      target_person_id:            hl.person_a_id,
      predicted_close_weeks_min:   weeksMin,
      predicted_close_weeks_max:   weeksMax,
      confidence_score:            confidenceScore,
      precision_delta:             precisionDelta,
      trust_path:                  trustPath,
      recommended_intro_person_id: hl.person_b_id,
      deal_value_estimate:         dealValue,
      commission_estimate:         commission,
      sector:                      personA.sector || userSector,
      zone:                        personA.zone   || userZone,
      status:                      "predicted",
      reasoning,
      scoring_version:             "v1",
      updated_at:                  new Date().toISOString(),
    }, {
      onConflict:        "id",
      ignoreDuplicates:  false,
    });
    generated++;
  }

  // Audit
  await db.from("etg_audit_log").insert({
    user_id:      userId,
    action:       "generate_predictions",
    entity_type:  "etg_opportunities",
    after_state:  { generated, skipped, weeks_min: weeksMin, weeks_max: weeksMax },
    function_name:"etg-predict",
  });

  return { generated, skipped };
}

// ── Main handler ─────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const body       = await req.json().catch(() => ({}));
    const action     = body.action     || "generate_predictions";
    const weeksMin   = body.weeks_min  || 6;
    const weeksMax   = body.weeks_max  || 12;
    const minConf    = body.min_confidence || 20;

    let result: Record<string, unknown> = {};

    if (action === "generate_predictions") {
      result = await generatePredictions(db, user.id, weeksMin, weeksMax);

    } else if (action === "get_predictions") {
      const { data, error } = await db.rpc("etg_predict_opportunities", {
        p_user_id:        user.id,
        p_weeks_min:      weeksMin,
        p_weeks_max:      weeksMax,
        p_min_confidence: minConf,
        p_limit:          body.limit || 20,
      });
      if (error) throw error;
      result = { predictions: data || [], count: (data || []).length };

    } else {
      result = { error: "Unknown action", available: ["generate_predictions", "get_predictions"] };
    }

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[etg-predict]", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
