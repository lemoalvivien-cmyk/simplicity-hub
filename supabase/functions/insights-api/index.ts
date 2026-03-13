/**
 * Eternal Insights Licensing API
 * ────────────────────────────────────────────────────────────────────
 * Endpoint protégé par API key (Bearer eil_<prefix>_<secret>)
 * Retourne signaux anonymisés du graphe de confiance (ETG)
 *
 * Tiers :
 *   starter    → 10 000 req/mois — probabilités & patterns basiques
 *   growth     → 50 000 req/mois — liens cachés + corridors cross-market
 *   enterprise → illimité        — full graph, prédictions LoRA, webhooks
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL       = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const API_VERSION        = "v1";
const RATE_WINDOW_SEC    = 60;
const RATE_LIMIT_PER_MIN = 120;

// ── Types ────────────────────────────────────────────────────────────

interface ApiKeyRow {
  id: string;
  tier: "starter" | "growth" | "enterprise";
  owner_user_id: string;
  requests_this_month: number;
  monthly_limit: number;
  is_active: boolean;
  expires_at: string | null;
}

interface InsightSignal {
  signal_id: string;           // anonymous uuid
  signal_type: string;
  confidence_score: number;    // 0–100
  probability: number;         // 0.0–1.0
  timing_weeks_min: number;
  timing_weeks_max: number;
  sector: string | null;
  zone: string | null;
  pattern_tag: string;
  precision_delta: number;
  anon_node_a: string;         // SHA-256 prefix only
  anon_node_b: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────

async function sha256hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function truncateHash(h: string): string {
  return h.substring(0, 16) + "…";
}

// ── Rate limiter (sliding window in-memory per instance + DB count) ──

const reqWindows = new Map<string, number[]>();

function checkInMemoryRateLimit(keyId: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_SEC * 1000;
  const times = (reqWindows.get(keyId) || []).filter((t) => t > cutoff);
  if (times.length >= RATE_LIMIT_PER_MIN) return false;
  times.push(now);
  reqWindows.set(keyId, times);
  return true;
}

// ── Auth: resolve API key ─────────────────────────────────────────────

async function resolveApiKey(
  db: ReturnType<typeof createClient>,
  rawKey: string
): Promise<ApiKeyRow | null> {
  const hash = await sha256hex(rawKey);
  const { data, error } = await db
    .from("insights_api_keys")
    .select("id, tier, owner_user_id, requests_this_month, monthly_limit, is_active, expires_at")
    .eq("key_hash", hash)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  if (data.tier !== "enterprise" && data.requests_this_month >= data.monthly_limit) return null;
  return data as ApiKeyRow;
}

// ── Signal builders by tier ──────────────────────────────────────────

// deno-lint-ignore no-explicit-any
async function buildStarterSignals(db: ReturnType<typeof createClient>, userId: string): Promise<InsightSignal[]> {
  const { data: opps } = await db
    .from("etg_opportunities")
    .select("id, confidence_score, precision_delta, sector, zone, predicted_close_weeks_min, predicted_close_weeks_max, target_person_id, status")
    .eq("user_id", userId)
    .eq("status", "predicted")
    .order("confidence_score", { ascending: false })
    .limit(25);

  const signals: InsightSignal[] = [];
  for (const o of (opps || [])) {
    const personHash = o.target_person_id ? await sha256hex(o.target_person_id) : "anon";
    signals.push({
      signal_id:      o.id,
      signal_type:    "opportunity_predicted",
      confidence_score: o.confidence_score,
      probability:    Math.round((o.confidence_score / 100) * 1000) / 1000,
      timing_weeks_min: o.predicted_close_weeks_min,
      timing_weeks_max: o.predicted_close_weeks_max,
      sector:         o.sector,
      zone:           o.zone,
      pattern_tag:    "TRUST_PATH_CONVERGENCE",
      precision_delta: o.precision_delta,
      anon_node_a:    truncateHash(personHash),
      anon_node_b:    null,
    });
  }
  return signals;
}

// deno-lint-ignore no-explicit-any
async function buildGrowthSignals(db: ReturnType<typeof createClient>, userId: string): Promise<InsightSignal[]> {
  const base = await buildStarterSignals(db, userId);

  // Add hidden link signals
  const { data: hidden } = await db
    .from("etg_hidden_links")
    .select("id, strength, confidence, predicted_deal_probability, person_a_id, person_b_id")
    .eq("user_id", userId)
    .gte("predicted_deal_probability", 0.4)
    .order("predicted_deal_probability", { ascending: false })
    .limit(25);

  for (const h of (hidden || [])) {
    const hashA = h.person_a_id ? await sha256hex(h.person_a_id) : "anon";
    const hashB = h.person_b_id ? await sha256hex(h.person_b_id) : "anon";
    base.push({
      signal_id:      h.id,
      signal_type:    "hidden_link_detected",
      confidence_score: Math.round(h.confidence * 100),
      probability:    h.predicted_deal_probability,
      timing_weeks_min: 4,
      timing_weeks_max: 10,
      sector:         null,
      zone:           null,
      pattern_tag:    "LATENT_TRUST_BRIDGE",
      precision_delta: Math.round(h.strength / 10),
      anon_node_a:    truncateHash(hashA),
      anon_node_b:    truncateHash(hashB),
    });
  }
  return base;
}

// deno-lint-ignore no-explicit-any
async function buildEnterpriseSignals(db: ReturnType<typeof createClient>, userId: string): Promise<InsightSignal[]> {
  const base = await buildGrowthSignals(db, userId);

  // Add graph-level aggregate signals (full link scan)
  const { data: links } = await db
    .from("etg_links")
    .select("id, trust_score, hidden_link_strength, link_type, from_id, to_id, weight, commission_rate")
    .eq("user_id", userId)
    .gte("trust_score", 70)
    .order("trust_score", { ascending: false })
    .limit(50);

  for (const l of (links || [])) {
    const hashA = await sha256hex(l.from_id);
    const hashB = await sha256hex(l.to_id);
    base.push({
      signal_id:       l.id,
      signal_type:     `graph_edge_${l.link_type.toLowerCase()}`,
      confidence_score: l.trust_score,
      probability:     Math.round((l.trust_score / 100) * (1 + l.hidden_link_strength / 200) * 1000) / 1000,
      timing_weeks_min: 2,
      timing_weeks_max: 8,
      sector:          null,
      zone:            null,
      pattern_tag:     `CORRIDOR_${l.link_type}`,
      precision_delta: Math.round(l.hidden_link_strength * 0.3),
      anon_node_a:     truncateHash(hashA),
      anon_node_b:     truncateHash(hashB),
    });
  }
  return base;
}

// ── Aggregated metadata response ─────────────────────────────────────

function buildMeta(tier: string, signals: InsightSignal[], apiKeyId: string) {
  const avgConf = signals.length
    ? Math.round(signals.reduce((s, x) => s + x.confidence_score, 0) / signals.length)
    : 0;
  const maxProb = signals.length
    ? Math.max(...signals.map((s) => s.probability))
    : 0;
  const patternMap: Record<string, number> = {};
  for (const s of signals) patternMap[s.pattern_tag] = (patternMap[s.pattern_tag] || 0) + 1;

  return {
    api_version: API_VERSION,
    tier,
    key_id:        apiKeyId.substring(0, 8) + "…",
    signals_count: signals.length,
    avg_confidence: avgConf,
    max_probability: Math.round(maxProb * 1000) / 1000,
    pattern_distribution: patternMap,
    anonymization: "SHA-256-truncated-16chars",
    generated_at: new Date().toISOString(),
  };
}

// ── Main handler ──────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startMs = Date.now();
  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // ── Extract API key from Authorization header
  const authHeader = req.headers.get("Authorization") || "";
  const rawKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!rawKey || !rawKey.startsWith("eil_")) {
    return new Response(
      JSON.stringify({ error: "missing_api_key", message: "Provide your Eternal Insights API key as: Authorization: Bearer eil_<key>" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Resolve & validate key
  const apiKey = await resolveApiKey(db, rawKey);
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "invalid_api_key", message: "API key is invalid, inactive, expired, or quota exceeded." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── In-memory rate limit
  if (!checkInMemoryRateLimit(apiKey.id)) {
    return new Response(
      JSON.stringify({ error: "rate_limit_exceeded", message: "120 req/min per key. Retry after 60s.", retry_after: 60 }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } }
    );
  }

  // ── Parse request
  const url    = new URL(req.url);
  const action = url.searchParams.get("action") || "signals";
  const body   = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const userId = apiKey.owner_user_id;

  let responseData: Record<string, unknown> = {};
  let signalsReturned = 0;

  try {
    if (action === "signals" || action === "insights") {
      let signals: InsightSignal[] = [];
      if (apiKey.tier === "starter")    signals = await buildStarterSignals(db, userId);
      else if (apiKey.tier === "growth") signals = await buildGrowthSignals(db, userId);
      else                               signals = await buildEnterpriseSignals(db, userId);

      signalsReturned = signals.length;
      responseData = {
        ok: true,
        meta: buildMeta(apiKey.tier, signals, apiKey.id),
        signals,
      };

    } else if (action === "stats") {
      const { data: stats } = await db.rpc("etg_graph_stats", { p_user_id: userId });
      responseData = { ok: true, stats: stats || {} };

    } else if (action === "quota") {
      responseData = {
        ok:                    true,
        tier:                  apiKey.tier,
        requests_this_month:   apiKey.requests_this_month,
        monthly_limit:         apiKey.monthly_limit,
        remaining:             apiKey.tier === "enterprise"
          ? "unlimited"
          : Math.max(0, apiKey.monthly_limit - apiKey.requests_this_month),
      };

    } else if (action === "openapi") {
      // Return embedded OpenAPI spec
      responseData = buildOpenApiSpec();

    } else {
      responseData = { error: "unknown_action", available: ["signals", "insights", "stats", "quota", "openapi"] };
    }

  } catch (err) {
    console.error("[insights-api]", err);
    // Log error usage
    await db.from("insights_api_usage").insert({
      api_key_id: apiKey.id, endpoint: action, tier: apiKey.tier,
      response_time_ms: Date.now() - startMs,
      signals_returned: 0, error_code: "internal_error",
      ip_hash: await sha256hex(req.headers.get("x-forwarded-for") || "unknown"),
    });
    return new Response(JSON.stringify({ error: "internal_error", message: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // ── Increment usage counter
  await Promise.all([
    db.from("insights_api_keys").update({
      requests_this_month: apiKey.requests_this_month + 1,
      last_used_at: new Date().toISOString(),
    }).eq("id", apiKey.id),
    db.from("insights_api_usage").insert({
      api_key_id:       apiKey.id,
      endpoint:         action,
      tier:             apiKey.tier,
      response_time_ms: Date.now() - startMs,
      signals_returned: signalsReturned,
      ip_hash:          await sha256hex(req.headers.get("x-forwarded-for") || "unknown"),
    }),
  ]);

  return new Response(JSON.stringify(responseData), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-RateLimit-Limit":     String(RATE_LIMIT_PER_MIN),
      "X-RateLimit-Remaining": String(Math.max(0, RATE_LIMIT_PER_MIN - 1)),
      "X-API-Tier":            apiKey.tier,
      "X-Response-Time":       `${Date.now() - startMs}ms`,
    },
  });
});

// ── OpenAPI Spec (embedded) ───────────────────────────────────────────

function buildOpenApiSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title:       "Eternal Insights API",
      version:     "1.0.0",
      description: "Anonymized trust-graph signals for institutional investors, banks and corporates.",
      contact:     { email: "api@wiinupmax.com" },
    },
    servers: [{ url: `${SUPABASE_URL}/functions/v1/insights-api`, description: "Production" }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type:         "http",
          scheme:       "bearer",
          description:  "API key prefixed with `eil_`. Obtain via the Eternal Insights sales portal.",
        },
      },
      schemas: {
        InsightSignal: {
          type: "object",
          properties: {
            signal_id:        { type: "string", format: "uuid" },
            signal_type:      { type: "string", example: "opportunity_predicted" },
            confidence_score: { type: "integer", minimum: 0, maximum: 100 },
            probability:      { type: "number",  minimum: 0, maximum: 1 },
            timing_weeks_min: { type: "integer" },
            timing_weeks_max: { type: "integer" },
            sector:           { type: "string",  nullable: true },
            zone:             { type: "string",  nullable: true },
            pattern_tag:      { type: "string",  example: "TRUST_PATH_CONVERGENCE" },
            precision_delta:  { type: "integer" },
            anon_node_a:      { type: "string",  description: "SHA-256 truncated (16 chars)" },
            anon_node_b:      { type: "string",  nullable: true },
          },
        },
      },
    },
    paths: {
      "/?action=signals": {
        get: {
          summary:     "Get anonymized trust graph signals",
          description: "Returns predictive signals extracted from the Eternal Trust Graph. Signal depth depends on your subscription tier.",
          parameters: [
            { in: "query", name: "action", schema: { type: "string", enum: ["signals"] }, required: true },
          ],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok:      { type: "boolean" },
                      meta:    { type: "object" },
                      signals: { type: "array", items: { "$ref": "#/components/schemas/InsightSignal" } },
                    },
                  },
                },
              },
            },
            "401": { description: "Invalid or missing API key" },
            "429": { description: "Rate limit exceeded — 120 req/min" },
          },
        },
      },
      "/?action=stats": {
        get: {
          summary: "Graph statistics snapshot",
          description: "Returns aggregated graph statistics (Enterprise + Growth).",
          parameters: [{ in: "query", name: "action", schema: { type: "string", enum: ["stats"] } }],
          responses: { "200": { description: "Stats object" } },
        },
      },
      "/?action=quota": {
        get: {
          summary: "Check API quota",
          description: "Returns current usage and remaining quota for the authenticated key.",
          parameters: [{ in: "query", name: "action", schema: { type: "string", enum: ["quota"] } }],
          responses: { "200": { description: "Quota object" } },
        },
      },
    },
  };
}
