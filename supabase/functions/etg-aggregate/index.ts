/**
 * etg-aggregate — Eternal Trust Graph Aggregator
 * ─────────────────────────────────────────────────
 * Anonymise et agrège en temps réel les événements métier
 * (introductions, gains, deals) pour alimenter le graphe ETG.
 *
 * POST /etg-aggregate
 * body: { action: "aggregate_anonymous_graph" | "ingest_event" | "get_stats", ... }
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

// deno-lint-ignore no-explicit-any
type AnyClient = any;

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY          = Deno.env.get("SUPABASE_ANON_KEY")!;

/** SHA-256 anonymisation helper */
async function sha256(input: string): Promise<string> {
  const data   = new TextEncoder().encode(input.toLowerCase().trim());
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Upsert an ETG person by canonical key (email or userId) */
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
    anon_hash:        anonHash,
    user_id:          userId,
    trust_index:      50,
    reliability_score:50,
    last_activity_at: new Date().toISOString(),
    ...patch,
  }).select("id").single();
  return created.id;
}

/** Upsert an ETG company by domain/name canonical key */
async function upsertCompany(
  db: AnyClient,
  domainOrName: string,
  patch: Record<string, unknown> = {}
): Promise<string> {
  const canonicalId = await sha256(domainOrName);
  const { data: existing } = await db
    .from("etg_companies")
    .select("id")
    .eq("canonical_id", canonicalId)
    .maybeSingle();

  if (existing) {
    await db.from("etg_companies")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    return existing.id;
  }

  const { data: created } = await db.from("etg_companies").insert({
    canonical_id: canonicalId,
    trust_index:  50,
    ...patch,
  }).select("id").single();
  return created.id;
}

/** Upsert an ETG link with weight accumulation */
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
    const newWeight     = Math.min(100, existing.weight + 1);
    const newTrust      = Math.round((existing.trust_score * 0.7) + (trustScore * 0.3));
    const newCommission = existing.commission_amount + commissionAmount;
    await db.from("etg_links").update({
      weight:           newWeight,
      trust_score:      newTrust,
      commission_amount: newCommission,
      updated_at:       new Date().toISOString(),
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

/** Infer hidden links: persons connected via ≥2 common intermediaries */
async function inferHiddenLinks(db: AnyClient, userId: string) {
  // Find pairs of persons sharing the same intermediary (from_id)
  const { data: links } = await db
    .from("etg_links")
    .select("from_id, to_id, trust_score")
    .eq("user_id",   userId)
    .eq("from_type", "person")
    .eq("to_type",   "person");

  if (!links || links.length < 2) return 0;

  // Group by from_id (intermediary)
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
        const a  = targets[i];
        const b  = targets[j];
        const strength    = Math.round((a.trust_score + b.trust_score) / 2);
        const confidence  = Math.min(95, strength + 10);
        const dealProb    = Math.min(0.9, strength / 100 * 0.85);
        const path        = [{ intermediary, link_a: a.to_id, link_b: b.to_id }];

        await db.from("etg_hidden_links").upsert({
          user_id:                    userId,
          person_a_id:                a.to_id,
          person_b_id:                b.to_id,
          strength,
          confidence,
          inference_path:             path,
          predicted_deal_probability: dealProb,
          inferred_by:                "etg-aggregate",
          expires_at:                 new Date(Date.now() + 30 * 86400_000).toISOString(),
          updated_at:                 new Date().toISOString(),
        }, { onConflict: "user_id,person_a_id,person_b_id" });
        inferred++;
      }
    }
  }
  return inferred;
}

/** aggregate_anonymous_graph: full pipeline */
async function aggregateAnonymousGraph(db: AnyClient, userId: string) {
  // Pull raw introductions + gains for this user
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

  const intros     = introsRes.data   || [];
  const gains      = gainsRes.data    || [];
  const facProfile = facProfileRes.data;

  let personsUpserted  = 0;
  let linksUpserted    = 0;

  // Upsert self as ETG person
  await upsertPerson(db, userId, userId, {
    intro_count:  intros.length,
    deal_count:   gains.filter((g: { statut: string }) => ["valide","recu","paye"].includes(g.statut)).length,
    sector:       facProfile?.secteur,
    zone:         facProfile?.zone,
    language:     facProfile?.languages?.[0],
  });
  personsUpserted++;

  for (const intro of intros) {
    // Upsert contact person (anonymised by email or name)
    const contactKey = intro.contact_email || `${intro.contact_nom}-${intro.mission_id}`;
    const contactId  = await upsertPerson(db, contactKey, null, { sector: facProfile?.secteur });
    personsUpserted++;

    // INTRODUCED_BY link: facilitator → contact
    await upsertLink(db, userId,
      (await upsertPerson(db, userId, userId)), "person",
      contactId, "person",
      "INTRODUCED_BY",
      intro.statut === "validee" ? 80 : 50
    );
    linksUpserted++;

    // TRUSTS link: if validated
    if (intro.statut === "validee") {
      await upsertLink(db, userId,
        (await upsertPerson(db, userId, userId)), "person",
        contactId, "person",
        "TRUSTS",
        85
      );
      linksUpserted++;
    }
  }

  // DEAL_CLOSED links for confirmed gains
  for (const gain of gains) {
    if (!["valide","recu","paye"].includes(gain.statut)) continue;
    const commission = (gain.montant || 0) * 0.07;
    const selfId     = await upsertPerson(db, userId, userId);
    await upsertLink(db, userId,
      selfId, "person",
      selfId, "person",  // self-loop represents a closed deal
      "DEAL_CLOSED",
      90,
      commission,
      "gain_confirmed"
    );
    linksUpserted++;
  }

  const hiddenInferred = await inferHiddenLinks(db, userId);

  // Write audit
  await db.from("etg_audit_log").insert({
    user_id:      userId,
    action:       "aggregate_anonymous_graph",
    entity_type:  "etg",
    before_state: null,
    after_state:  { persons_upserted: personsUpserted, links_upserted: linksUpserted, hidden_inferred: hiddenInferred },
    function_name:"etg-aggregate",
  });

  return { persons_upserted: personsUpserted, links_upserted: linksUpserted, hidden_inferred: hiddenInferred };
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

  // Validate JWT
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
    const body   = await req.json().catch(() => ({}));
    const action = body.action || "aggregate_anonymous_graph";

    let result: Record<string, unknown> = {};

    if (action === "aggregate_anonymous_graph") {
      result = await aggregateAnonymousGraph(db, user.id);

    } else if (action === "get_stats") {
      const { data } = await db.rpc("etg_graph_stats", { p_user_id: user.id });
      result = data || {};

    } else {
      result = { error: "Unknown action", available: ["aggregate_anonymous_graph", "get_stats"] };
    }

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[etg-aggregate]", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
