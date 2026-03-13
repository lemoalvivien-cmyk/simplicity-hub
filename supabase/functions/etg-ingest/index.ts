/**
 * etg-ingest — Eternal Trust Graph Event Ingestion
 * ──────────────────────────────────────────────────
 * Ingère des événements en temps réel dans le graphe ETG.
 * Supporte les événements : introduction_validee, gain_confirme, deal_closed, trust_update
 *
 * POST /etg-ingest
 * body: { event_type, entity_id, metadata? }
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

// deno-lint-ignore no-explicit-any
type AnyClient = any;

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY         = Deno.env.get("SUPABASE_ANON_KEY")!;

async function sha256(input: string): Promise<string> {
  const data   = new TextEncoder().encode(input.toLowerCase().trim());
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function upsertPerson(db: AnyClient, canonicalKey: string, userId: string | null): Promise<string> {
  const anonHash = await sha256(canonicalKey);
  const { data } = await db.from("etg_persons").select("id")
    .eq("anon_hash", anonHash).maybeSingle();
  if (data) return data.id;
  const { data: created } = await db.from("etg_persons").insert({
    anon_hash:    anonHash,
    user_id:      userId,
    trust_index:  50,
    reliability_score: 50,
    last_activity_at: new Date().toISOString(),
  }).select("id").single();
  return created.id;
}

async function upsertLink(
  db: AnyClient, userId: string,
  fromId: string, fromType: "person" | "company",
  toId: string,   toType: "person" | "company",
  linkType: "INTRODUCED_BY" | "TRUSTS" | "DEAL_CLOSED",
  trustScore: number, commissionAmount = 0, source = "etg-ingest"
) {
  const { data: existing } = await db.from("etg_links")
    .select("id, weight, trust_score, commission_amount")
    .eq("user_id", userId).eq("from_id", fromId).eq("to_id", toId).eq("link_type", linkType)
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
    user_id: userId, from_id: fromId, from_type: fromType,
    to_id: toId, to_type: toType, link_type: linkType,
    trust_score: trustScore, commission_rate: 0.07, commission_amount: commissionAmount, source,
  }).select("id").single();
  return created?.id;
}

/** Update trust_index on an ETG person */
async function updatePersonTrust(db: AnyClient, anonHash: string, delta: number) {
  const { data: p } = await db.from("etg_persons").select("id, trust_index")
    .eq("anon_hash", anonHash).maybeSingle();
  if (!p) return;
  const newTrust = Math.min(100, Math.max(0, (p.trust_index || 50) + delta));
  await db.from("etg_persons").update({
    trust_index:      newTrust,
    last_activity_at: new Date().toISOString(),
    updated_at:       new Date().toISOString(),
  }).eq("id", p.id);
}

// ── Event handlers ───────────────────────────────────────────────

async function handleIntroductionValidee(db: AnyClient, userId: string, entityId: string) {
  const { data: intro } = await db.from("introductions")
    .select("facilitateur_id, entreprise_id, contact_nom, contact_email, mission_id, statut")
    .eq("id", entityId).single();
  if (!intro) return { error: "intro_not_found" };

  const contactKey = intro.contact_email || `${intro.contact_nom}-${intro.mission_id}`;
  const [selfId, contactId] = await Promise.all([
    upsertPerson(db, intro.facilitateur_id, intro.facilitateur_id),
    upsertPerson(db, contactKey, null),
  ]);

  await Promise.all([
    upsertLink(db, userId, selfId, "person", contactId, "person", "INTRODUCED_BY", 80),
    upsertLink(db, userId, selfId, "person", contactId, "person", "TRUSTS",        85),
  ]);

  await updatePersonTrust(db, await sha256(intro.facilitateur_id), +5);
  return { ok: true, person_a: selfId, person_b: contactId };
}

async function sha256Local(input: string): Promise<string> {
  const data   = new TextEncoder().encode(input.toLowerCase().trim());
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function handleGainConfirme(db: AnyClient, userId: string, entityId: string) {
  const { data: gain } = await db.from("gains")
    .select("facilitateur_id, montant, statut, introduction_id")
    .eq("id", entityId).single();
  if (!gain) return { error: "gain_not_found" };

  const commission = (gain.montant || 0) * 0.07;
  const selfId     = await upsertPerson(db, gain.facilitateur_id, gain.facilitateur_id);

  await upsertLink(db, userId, selfId, "person", selfId, "person", "DEAL_CLOSED", 90, commission, "gain_confirme");
  await updatePersonTrust(db, await sha256Local(gain.facilitateur_id), +10);

  // Update person stats
  const { data: p } = await db.from("etg_persons").select("id, deal_count, total_commission")
    .eq("anon_hash", await sha256Local(gain.facilitateur_id)).maybeSingle();
  if (p) {
    await db.from("etg_persons").update({
      deal_count:       (p.deal_count || 0) + 1,
      total_commission: (p.total_commission || 0) + commission,
      updated_at:       new Date().toISOString(),
    }).eq("id", p.id);
  }

  return { ok: true, commission };
}

async function handleDealClosed(
  db: AnyClient,
  userId: string,
  entityId: string,
  metadata: { amount?: number; company_domain?: string; sector?: string; zone?: string } = {}
) {
  const selfId      = await upsertPerson(db, userId, userId);
  const commission  = (metadata.amount || 0) * 0.07;

  if (metadata.company_domain) {
    const canonicalId = await sha256Local(metadata.company_domain);
    const { data: existing } = await db.from("etg_companies")
      .select("id").eq("canonical_id", canonicalId).maybeSingle();

    let companyId: string;
    if (existing) {
      companyId = existing.id;
      await db.from("etg_companies").update({
        deal_count:  db.rpc ? undefined : undefined, // incremented via separate update
        updated_at:  new Date().toISOString(),
      }).eq("id", existing.id);
      await db.from("etg_companies").update({
        deal_count: (await db.from("etg_companies").select("deal_count").eq("id", existing.id).single())?.data?.deal_count + 1,
      }).eq("id", existing.id);
    } else {
      const { data: created } = await db.from("etg_companies").insert({
        canonical_id: canonicalId,
        sector:       metadata.sector,
        zone:         metadata.zone,
        deal_count:   1,
        trust_index:  60,
      }).select("id").single();
      companyId = created.id;
    }

    await upsertLink(db, userId, selfId, "person", companyId, "company",
      "DEAL_CLOSED", 88, commission, `entity:${entityId}`);
  } else {
    await upsertLink(db, userId, selfId, "person", selfId, "person",
      "DEAL_CLOSED", 88, commission, `entity:${entityId}`);
  }

  await updatePersonTrust(db, await sha256Local(userId), +8);
  return { ok: true, commission };
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
    const body        = await req.json();
    const { event_type, entity_id, metadata = {} } = body;

    if (!event_type) {
      return new Response(JSON.stringify({ error: "event_type required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let result: Record<string, unknown> = {};

    switch (event_type) {
      case "introduction_validee":
        result = await handleIntroductionValidee(db, user.id, entity_id);
        break;
      case "gain_confirme":
        result = await handleGainConfirme(db, user.id, entity_id);
        break;
      case "deal_closed":
        result = await handleDealClosed(db, user.id, entity_id, metadata);
        break;
      default:
        result = { error: "Unknown event_type", available: ["introduction_validee","gain_confirme","deal_closed"] };
    }

    // Audit every ingest
    await db.from("etg_audit_log").insert({
      user_id:      user.id,
      action:       `ingest:${event_type}`,
      entity_type:  "etg",
      entity_id:    entity_id || null,
      after_state:  { ...result, metadata },
      function_name:"etg-ingest",
    });

    return new Response(JSON.stringify({ ok: true, event_type, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[etg-ingest]", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
