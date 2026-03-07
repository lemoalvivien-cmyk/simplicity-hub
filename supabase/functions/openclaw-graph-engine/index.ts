import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

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

// ── Compute full match score for one facilitator ────────────────
async function computeMatch(
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

// ── Feed graph from a business event ───────────────────────────
async function feedGraphFromEvent(
  userId: string,
  eventType: string,
  entityType: string,
  entityId: string
) {
  // Create graph event record
  await supabase.from("graph_events").insert({
    user_id:     userId,
    event_type:  eventType,
    entity_type: entityType,
    entity_id:   entityId,
    summary:     `${eventType} — ${entityType} ${entityId}`,
  });

  // Map event to graph edge enrichment
  if (eventType === "introduction_validee") {
    // Strengthen introduced → validated edge
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
        p_to_id:        gain.facilitateur_id, // self-loop for revenue tracking
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

// ── Find best access paths for user context ─────────────────────
async function findBestPaths(
  userId: string,
  context: { sector?: string; zone?: string; corridor?: string; language?: string; limit?: number }
) {
  // Get active facilitators
  const { data: facs } = await supabase
    .from("facilitateur_profiles")
    .select("user_id, secteur, zone, business_corridors, languages, average_rating, response_rate")
    .eq("statut", "actif")
    .limit(40);

  if (!facs || facs.length === 0) {
    return { paths: [], count: 0 };
  }

  // Get profiles for names
  const facIds = facs.map((f: { user_id: string }) => f.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, prenom")
    .in("id", facIds);

  const nameMap: Record<string, string> = {};
  (profiles || []).forEach((p: { id: string; prenom: string }) => { nameMap[p.id] = p.prenom; });

  // Score each facilitator
  const scored = await Promise.all(
    facs.map(async (fac: { user_id: string }) => {
      const match = await computeMatch(userId, fac.user_id, context);
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

  // Sort by global score
  scored.sort((a, b) => b.global_score - a.global_score);

  const limit = context.limit || 5;
  const top = scored.slice(0, limit);

  // Enrich with next action suggestion
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

// ── Cache best path result ──────────────────────────────────────
async function cacheBestPath(
  userId: string,
  targetType: string,
  targetLabel: string,
  paths: ReturnType<typeof findBestPaths> extends Promise<infer T> ? T : never
) {
  if (!("paths" in paths) || !Array.isArray(paths.paths) || paths.paths.length === 0) return;

  const best = paths.paths[0] as {
    facilitator_id: string;
    facilitator_name: string;
    global_score: number;
    explanation: string[];
    recommended_channel?: string;
    next_action?: string;
  };
  const alternatives = paths.paths.slice(1).map((p: { facilitator_name: string; global_score: number }) => ({
    name: p.facilitator_name,
    score: p.global_score,
  }));

  await supabase.from("graph_best_paths").upsert({
    user_id:              userId,
    target_type:          targetType,
    target_id:            targetLabel,
    target_label:         targetLabel,
    best_facilitator_id:  best.facilitator_id,
    best_facilitator_name: best.facilitator_name,
    path_confidence:      best.global_score,
    path_explanation:     best.explanation,
    alternative_paths:    alternatives,
    next_action:          best.next_action || null,
    computed_at:          new Date().toISOString(),
    expires_at:           new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  }, { onConflict: "user_id,target_type,target_id" });
}

// ═══════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  let userId: string | null = null;

  if (authHeader) {
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    userId = user?.id ?? null;
  }

  try {
    const body = await req.json();
    const { action, context = {}, event_type, entity_type, entity_id, target_type, target_label } = body;

    const uid = body.user_id || userId;
    if (!uid) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let result: Record<string, unknown> = {};

    if (action === "find_best_paths") {
      const paths = await findBestPaths(uid, context);
      // Cache the result
      if (target_label) {
        await cacheBestPath(uid, target_type || "general", target_label, paths);
      }
      result = paths;

    } else if (action === "feed_graph") {
      result = await feedGraphFromEvent(uid, event_type, entity_type, entity_id);

    } else if (action === "compute_match") {
      const { facilitator_id } = body;
      const match = await computeMatch(uid, facilitator_id, context);
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
        supabase.from("graph_edges").select("id, relationship_type, total_weight, strength_score").eq("user_id", uid),
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
