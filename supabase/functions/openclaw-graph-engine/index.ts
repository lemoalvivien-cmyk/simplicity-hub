/**
 * openclaw-graph-engine
 * ─────────────────────
 * SECURITY HARDENED v2:
 *   - user JWT can ONLY access/mutate data for their own user_id
 *   - body.user_id from a non-service-role call is REJECTED with 403
 *   - service_role can pass body.user_id to target any user
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Channel capability matrix (honest) ─────────────────────────
const CHANNEL_MATRIX: Record<string, { can_send: boolean; mode: string }> = {
  email:        { can_send: true,  mode: "validated" },
  introduction: { can_send: true,  mode: "validated" },
  whatsapp:     { can_send: false, mode: "prepared" },
  linkedin:     { can_send: false, mode: "export" },
  telegram:     { can_send: false, mode: "prepared" },
  slack:        { can_send: false, mode: "prepared" },
  default:      { can_send: false, mode: "prepared" },
};
// Suppress unused variable warning
void CHANNEL_MATRIX;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const isServiceRole = authHeader === `Bearer ${serviceKey}`;
  let jwtUserId: string | null = null;

  if (!isServiceRole) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    jwtUserId = user.id;
  }

  // Use service_role client for all DB operations
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const { action, context = {}, event_type, entity_type, entity_id, target_type, target_label } = body;

    // ── SECURITY GUARD: user_id spoofing prevention ───────────────────────────
    // User JWTs CANNOT target another user's data via body.user_id.
    // If a user JWT sends body.user_id != their own jwtUserId → 403.
    let uid: string;
    if (isServiceRole) {
      // Service_role: may specify any user_id in body
      if (!body.user_id) {
        return new Response(JSON.stringify({ error: "service_role call requires user_id in body" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      uid = body.user_id;
    } else {
      // User JWT: body.user_id MUST match their JWT or be absent
      if (body.user_id && body.user_id !== jwtUserId) {
        return new Response(JSON.stringify({ error: "Forbidden: cannot target another user's graph data" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      uid = jwtUserId!;
    }

    let result: Record<string, unknown> = {};

    if (action === "find_best_paths") {
      const paths = await findBestPaths(supabase, uid, context);
      if (target_label) {
        await cacheBestPath(supabase, uid, target_type || "general", target_label, paths);
      }
      result = paths;

    } else if (action === "feed_graph") {
      result = await feedGraphFromEvent(supabase, uid, event_type, entity_type, entity_id);

    } else if (action === "compute_match") {
      const { facilitator_id } = body;
      const match = await computeMatch(supabase, uid, facilitator_id, context);
      result = { match };

    } else if (action === "get_cached_path") {
      const { data } = await supabase
        .from("graph_best_paths")
        .select("*")
        .eq("user_id", uid)
        .gt("expires_at", new Date().toISOString())
        .order("computed_at", { ascending: false })
        .limit(3);
      result = { paths: data || [] };

    } else if (action === "get_graph_stats") {
      const [edgesRes, eventsRes] = await Promise.all([
        supabase.from("graph_edges").select("id, relationship_type, total_weight, strength_score").eq("user_id", uid).limit(200),
        supabase.from("graph_events").select("id, event_type, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(20),
      ]);
      const edges = edgesRes.data || [];
      const events = eventsRes.data || [];
      const byType: Record<string, number> = {};
      edges.forEach((e: { relationship_type: string }) => { byType[e.relationship_type] = (byType[e.relationship_type] || 0) + 1; });
      const avgWeight = edges.length > 0
        ? Math.round(edges.reduce((s: number, e: { total_weight: number }) => s + (e.total_weight || 50), 0) / edges.length)
        : 0;
      result = { total_edges: edges.length, avg_weight: avgWeight, by_type: byType, recent_events: events };

    } else {
      result = { error: "Unknown action", available: ["find_best_paths", "feed_graph", "compute_match", "get_cached_path", "get_graph_stats"] };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[openclaw-graph-engine]", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

// ── Helpers ─────────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

async function computeMatch(
  supabase: SupabaseClient,
  userId: string,
  facId: string,
  context: { sector?: string; zone?: string; corridor?: string; language?: string }
) {
  const { data: result } = await supabase.rpc("compute_facilitator_match", {
    p_user_id:          userId,
    p_facilitator_id:   facId,
    p_target_sector:    context.sector   || null,
    p_target_zone:      context.zone     || null,
    p_target_corridor:  context.corridor || null,
    p_target_language:  context.language || null,
  });
  return result as Record<string, unknown> | null;
}

async function feedGraphFromEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: string,
  entityType: string,
  entityId: string
) {
  await supabase.from("graph_events").insert({
    user_id:     userId,
    event_type:  eventType,
    entity_type: entityType,
    entity_id:   entityId,
    summary:     `${eventType} — ${entityType} ${entityId}`,
  });

  if (eventType === "introduction_validee") {
    const { data: intro } = await supabase
      .from("introductions")
      .select("facilitateur_id, entreprise_id, mission_id")
      .eq("id", entityId)
      .single();

    if (intro?.facilitateur_id && intro?.entreprise_id) {
      await supabase.rpc("upsert_graph_edge", {
        p_user_id:      userId,
        p_from_id:      intro.facilitateur_id,
        p_from_type:    "facilitateur",
        p_to_id:        intro.entreprise_id,
        p_to_type:      "entreprise",
        p_relationship: "introduced",
        p_source:       "introduction_validee",
        p_confidence:   85,
        p_trust:        80,
        p_conversion:   70,
      });
    }
  }

  if (eventType === "gain_confirme") {
    const { data: gain } = await supabase
      .from("gains")
      .select("facilitateur_id, introduction_id, montant")
      .eq("id", entityId)
      .single();

    if (gain?.facilitateur_id) {
      const revenueScore = Math.min(100, Math.round((gain.montant || 0) / 100));
      await supabase.rpc("upsert_graph_edge", {
        p_user_id:      gain.facilitateur_id,
        p_from_id:      gain.facilitateur_id,
        p_from_type:    "facilitateur",
        p_to_id:        gain.facilitateur_id,
        p_to_type:      "facilitateur",
        p_relationship: "converted_with",
        p_source:       "gain_confirme",
        p_confidence:   90,
        p_trust:        90,
        p_conversion:   90,
        p_revenue:      revenueScore,
      });
    }
  }

  return { ok: true };
}

async function findBestPaths(
  supabase: SupabaseClient,
  userId: string,
  context: { sector?: string; zone?: string; corridor?: string; language?: string; limit?: number }
) {
  const { data: facs } = await supabase
    .from("facilitateur_profiles")
    .select("user_id, secteur, zone, business_corridors, languages, average_rating, response_rate")
    .eq("statut", "actif")
    .limit(40);

  if (!facs || facs.length === 0) return { paths: [], count: 0 };

  const facIds = facs.map((f: { user_id: string }) => f.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, prenom")
    .in("id", facIds);

  const nameMap: Record<string, string> = {};
  (profiles || []).forEach((p: { id: string; prenom: string }) => { nameMap[p.id] = p.prenom; });

  const scored = await Promise.all(
    facs.map(async (fac: { user_id: string }) => {
      const match = await computeMatch(supabase, userId, fac.user_id, context);
      return {
        facilitator_id:   fac.user_id,
        facilitator_name: nameMap[fac.user_id] || "Facilitateur",
        global_score:     (match as Record<string, number>)?.global_score ?? 0,
        trust_score:      (match as Record<string, number>)?.trust_score ?? 50,
        conversion_score: (match as Record<string, number>)?.conversion_score ?? 0,
        corridor_score:   (match as Record<string, number>)?.corridor_score ?? 0,
        language_score:   (match as Record<string, number>)?.language_score ?? 0,
        sector_score:     (match as Record<string, number>)?.sector_score ?? 0,
        zone_score:       (match as Record<string, number>)?.zone_score ?? 0,
        response_score:   (match as Record<string, number>)?.response_score ?? 50,
        total_intros:     (match as Record<string, number>)?.total_intros ?? 0,
        intros_validees:  (match as Record<string, number>)?.intros_validees ?? 0,
        revenue:          (match as Record<string, number>)?.revenue ?? 0,
        explanation:      (match as Record<string, unknown>)?.explanation ?? [],
      };
    })
  );

  scored.sort((a, b) => b.global_score - a.global_score);
  const limit = context.limit || 5;
  const top = scored.slice(0, limit);

  const paths = top.map((p, idx) => ({
    ...p,
    rank: idx + 1,
    confidence_label:
      p.global_score >= 80 ? "Très haute" :
      p.global_score >= 60 ? "Haute" :
      p.global_score >= 40 ? "Moyenne" : "Faible",
    next_action:
      p.total_intros === 0
        ? "Premier contact — demandez une introduction"
        : p.intros_validees > 0
        ? "Relance prioritaire — déjà converti"
        : "Activer via OpenClaw",
    recommended_channel:
      p.language_score > 0 ? "introduction" : "email",
  }));

  return { paths, count: paths.length };
}

async function cacheBestPath(
  supabase: SupabaseClient,
  userId: string,
  targetType: string,
  targetLabel: string,
  paths: { paths: unknown[]; count: number }
) {
  if (!paths.paths || paths.paths.length === 0) return;

  const best = paths.paths[0] as {
    facilitator_id: string;
    facilitator_name: string;
    global_score: number;
    explanation: string[];
    recommended_channel?: string;
    next_action?: string;
  };
  const alternatives = paths.paths.slice(1).map((p: unknown) => {
    const pp = p as { facilitator_name: string; global_score: number };
    return { name: pp.facilitator_name, score: pp.global_score };
  });

  await supabase.from("graph_best_paths").upsert({
    user_id:               userId,
    target_type:           targetType,
    target_id:             targetLabel,
    target_label:          targetLabel,
    best_facilitator_id:   best.facilitator_id,
    best_facilitator_name: best.facilitator_name,
    path_confidence:       best.global_score,
    path_explanation:      best.explanation,
    alternative_paths:     alternatives,
    next_action:           best.next_action || null,
    computed_at:           new Date().toISOString(),
    expires_at:            new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  }, { onConflict: "user_id,target_type,target_id" });
}
