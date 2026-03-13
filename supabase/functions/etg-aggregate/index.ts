/**
 * etg-aggregate v2 — Eternal Trust Graph Aggregator
 * ─────────────────────────────────────────────────────
 * POST /etg-aggregate
 * body: { action: "aggregate_anonymous_graph" | "get_stats" }
 *
 * v2: vector similarity search for hidden 6-12 week opportunities
 *     via pgvector cosine distance on etg_opportunities.embedding
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

type AnyClient = ReturnType<typeof createClient>;

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY         = Deno.env.get("SUPABASE_ANON_KEY")!;
const OPENAI_KEY       = Deno.env.get("OPENAI_API_KEY") || "";

// ── SHA-256 anonymisation ─────────────────────────────────────────

async function sha256(input: string): Promise<string> {
  const data   = new TextEncoder().encode(input.toLowerCase().trim());
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── OpenAI embedding (text-embedding-3-small, 1536 dims) ──────────

async function getEmbedding(text: string): Promise<number[] | null> {
  if (!OPENAI_KEY || !text.trim()) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({ model: "text-embedding-3-small", input: text.slice(0, 2000) }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

function vecToSql(v: number[]): string {
  return `[${v.join(",")}]`;
}

// ── Upsert helpers ────────────────────────────────────────────────

async function upsertPerson(
  db: AnyClient,
  canonicalKey: string,
  userId: string | null,
  patch: Record<string, unknown> = {}
): Promise<string> {
  const anonHash = await sha256(canonicalKey);
  const { data: existing } = await db
    .from("etg_persons")
    .select("id")
    .eq("anon_hash", anonHash)
    .maybeSingle();

  if (existing) {
    await db.from("etg_persons").update({
      ...patch,
      last_activity_at: new Date().toISOString(),
      updated_at:       new Date().toISOString(),
    }).eq("id", existing.id);
    return existing.id;
  }

  const { data: created } = await db.from("etg_persons").insert({
    anon_hash:         anonHash,
    user_id:           userId,
    trust_index:       50,
    reliability_score: 50,
    last_activity_at:  new Date().toISOString(),
    ...patch,
  }).select("id").single();
  return created.id;
}

async function upsertLink(
  db: AnyClient,
  userId: string,
  fromId: string,
  fromType: "person" | "company",
  toId: string,
  toType: "person" | "company",
  linkType: "INTRODUCED_BY" | "TRUSTS" | "DEAL_CLOSED",
  trustScore: number,
  commissionAmount = 0,
  source = "etg-aggregate"
) {
  const { data: existing } = await db
    .from("etg_links")
    .select("id, weight, trust_score, commission_amount")
    .eq("user_id",   userId)
    .eq("from_id",   fromId)
    .eq("to_id",     toId)
    .eq("link_type", linkType)
    .maybeSingle();

  if (existing) {
    await db.from("etg_links").update({
      weight:            Math.min(100, existing.weight + 1),
      trust_score:       Math.round(existing.trust_score * 0.7 + trustScore * 0.3),
      commission_amount: existing.commission_amount + commissionAmount,
      updated_at:        new Date().toISOString(),
    }).eq("id", existing.id);
    return existing.id;
  }

  const { data: created } = await db.from("etg_links").insert({
    user_id:          userId,
    from_id:          fromId,
    from_type:        fromType,
    to_id:            toId,
    to_type:          toType,
    link_type:        linkType,
    trust_score:      trustScore,
    commission_rate:  0.07,
    commission_amount: commissionAmount,
    source,
  }).select("id").single();
  return created?.id;
}

// ── Infer hidden links (≥2 common intermediaries) ─────────────────

async function inferHiddenLinks(db: AnyClient, userId: string): Promise<number> {
  const { data: links } = await db
    .from("etg_links")
    .select("from_id, to_id, trust_score")
    .eq("user_id",   userId)
    .eq("from_type", "person")
    .eq("to_type",   "person");

  if (!links || links.length < 2) return 0;

  const byIntermediary = new Map<string, { to_id: string; trust_score: number }[]>();
  for (const l of links) {
    const arr = byIntermediary.get(l.from_id) || [];
    arr.push({ to_id: l.to_id, trust_score: l.trust_score });
    byIntermediary.set(l.from_id, arr);
  }

  let inferred = 0;
  for (const [intermediary, targets] of byIntermediary) {
    if (targets.length < 2) continue;
    for (let i = 0; i < targets.length; i++) {
      for (let j = i + 1; j < targets.length; j++) {
        const a        = targets[i];
        const b        = targets[j];
        const strength = Math.round((a.trust_score + b.trust_score) / 2);
        const conf     = Math.min(95, strength + 10);
        const dealProb = Math.min(0.9, strength / 100 * 0.85);

        await db.from("etg_hidden_links").upsert({
          user_id:                    userId,
          person_a_id:                a.to_id,
          person_b_id:                b.to_id,
          strength,
          confidence:                 conf,
          inference_path:             [{ intermediary, link_a: a.to_id, link_b: b.to_id }],
          predicted_deal_probability: dealProb,
          inferred_by:                "etg-aggregate-v2",
          expires_at:                 new Date(Date.now() + 30 * 86_400_000).toISOString(),
          updated_at:                 new Date().toISOString(),
        }, { onConflict: "user_id,person_a_id,person_b_id" });
        inferred++;
      }
    }
  }
  return inferred;
}

// ── Vector similarity: enrich opportunities with embeddings ────────

async function enrichOpportunitiesWithEmbeddings(
  db: AnyClient,
  userId: string
): Promise<number> {
  if (!OPENAI_KEY) return 0;

  // Fetch opportunities without embeddings
  const { data: opps } = await db
    .from("etg_opportunities")
    .select("id, sector, zone, reasoning, predicted_close_weeks_min, predicted_close_weeks_max")
    .eq("user_id", userId)
    .is("embedding", null)
    .limit(20);

  if (!opps || opps.length === 0) return 0;

  let enriched = 0;
  for (const opp of opps) {
    const text = [
      opp.sector || "",
      opp.zone || "",
      opp.reasoning || "",
      `fermeture ${opp.predicted_close_weeks_min}-${opp.predicted_close_weeks_max} semaines`,
    ].filter(Boolean).join(" · ");

    const embedding = await getEmbedding(text);
    if (!embedding) continue;

    await db.rpc("etg_set_opportunity_embedding", {
      p_id:        opp.id,
      p_embedding: vecToSql(embedding),
    }).catch(() => {
      // Fallback: raw update via service role
      return db.from("etg_opportunities")
        .update({ embedding: vecToSql(embedding) as unknown as null })
        .eq("id", opp.id);
    });
    enriched++;
  }
  return enriched;
}

// ── Main aggregation pipeline ─────────────────────────────────────

async function aggregateAnonymousGraph(db: AnyClient, userId: string) {
  const [introsRes, gainsRes, facProfileRes] = await Promise.all([
    db.from("introductions")
      .select("id, facilitateur_id, entreprise_id, contact_nom, contact_email, mission_id, statut, updated_at")
      .eq("facilitateur_id", userId),
    db.from("gains")
      .select("id, facilitateur_id, introduction_id, montant, statut, updated_at")
      .eq("facilitateur_id", userId),
    db.from("facilitateur_profiles")
      .select("secteur, zone, languages")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const intros     = introsRes.data  || [];
  const gains      = gainsRes.data   || [];
  const facProfile = facProfileRes.data;

  let personsUpserted = 0;
  let linksUpserted   = 0;

  // Upsert self
  await upsertPerson(db, userId, userId, {
    intro_count: intros.length,
    deal_count:  gains.filter((g: { statut: string }) => ["valide","recu","paye"].includes(g.statut)).length,
    sector:      facProfile?.secteur,
    zone:        facProfile?.zone,
    language:    facProfile?.languages?.[0],
  });
  personsUpserted++;

  const selfId = await upsertPerson(db, userId, userId);

  for (const intro of intros) {
    const contactKey = intro.contact_email || `${intro.contact_nom}-${intro.mission_id}`;
    const contactId  = await upsertPerson(db, contactKey, null, { sector: facProfile?.secteur });
    personsUpserted++;

    await upsertLink(db, userId, selfId, "person", contactId, "person",
      "INTRODUCED_BY", intro.statut === "validee" ? 80 : 50);
    linksUpserted++;

    if (intro.statut === "validee") {
      await upsertLink(db, userId, selfId, "person", contactId, "person", "TRUSTS", 85);
      linksUpserted++;
    }
  }

  for (const gain of gains) {
    if (!["valide","recu","paye"].includes(gain.statut)) continue;
    const commission = (gain.montant || 0) * 0.07;
    await upsertLink(db, userId, selfId, "person", selfId, "person",
      "DEAL_CLOSED", 90, commission, "gain_confirmed");
    linksUpserted++;
  }

  const hiddenInferred = await inferHiddenLinks(db, userId);

  // v2: enrich opportunities with vector embeddings for ANN search
  const embeddingsEnriched = await enrichOpportunitiesWithEmbeddings(db, userId);

  await db.from("etg_audit_log").insert({
    user_id:      userId,
    action:       "aggregate_anonymous_graph_v2",
    entity_type:  "etg",
    before_state: null,
    after_state: {
      persons_upserted:     personsUpserted,
      links_upserted:       linksUpserted,
      hidden_inferred:      hiddenInferred,
      embeddings_enriched:  embeddingsEnriched,
      vector_search_ready:  embeddingsEnriched > 0,
    },
    function_name: "etg-aggregate-v2",
  });

  return {
    persons_upserted:    personsUpserted,
    links_upserted:      linksUpserted,
    hidden_inferred:     hiddenInferred,
    embeddings_enriched: embeddingsEnriched,
    vector_search_ready: embeddingsEnriched > 0,
  };
}

// ── Deno handler ──────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const body   = await req.json().catch(() => ({}));
    const action = body.action || "aggregate_anonymous_graph";

    let result: Record<string, unknown> = {};

    if (action === "aggregate_anonymous_graph") {
      result = await aggregateAnonymousGraph(db, user.id);
    } else if (action === "get_stats") {
      const { data } = await db.rpc("etg_graph_stats", { p_user_id: user.id });
      result = data || {};
    } else if (action === "shortest_path") {
      const { from_hash, to_hash, max_hops = 5 } = body;
      const { data } = await db.rpc("shortest_path_trust", {
        p_user_id:   user.id,
        p_from_hash: from_hash,
        p_to_hash:   to_hash,
        p_max_hops:  max_hops,
        p_min_trust: 30,
      });
      result = { path: data || [] };
    } else {
      result = { error: "Unknown action", available: ["aggregate_anonymous_graph", "get_stats", "shortest_path"] };
    }

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[etg-aggregate-v2]", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
