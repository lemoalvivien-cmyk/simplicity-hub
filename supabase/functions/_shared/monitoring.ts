/**
 * WIINUP MAX – Pro Monitoring Module
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralises:
 *  • Rate-limiting with configurable caps per function
 *  • Structured error logging to business_alerts table
 *  • High-load email alert if concurrent users > threshold (500 default)
 *  • Performance timing helper
 */
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const ALERT_EMAIL   = "notifications@wiinupmax.com";

// ── Rate limits per function (requests / minute / user) ──────────────────────
export const RATE_LIMITS: Record<string, number> = {
  "bank-webhook":              30,   // PSD2 banking — conservative
  "openclaw-autonomous-swarm": 20,   // heavy AI orchestration
  "stripe-webhook":            60,   // payment events
  "ai-matching":               50,
  "ai-prospection":            50,
  "ai-jarvis":                 40,
  "ada-orchestrator":          20,
  "ada-voice-call":            10,   // ElevenLabs TTS — expensive
  "elevenlabs-tts":            10,
  "elevenlabs-voice-token":    20,
  "etg-ingest":                60,
  "etg-predict":               60,
  "openclaw-gateway":          40,
  "openclaw-lead-generator":   40,
  "openclaw-scheduler":        30,
  "insights-api":              100,
  "create-checkout":           20,
  "check-subscription":        120,
  "default":                   100,
};

// ── Active concurrent-users tracking (in-memory per instance) ─────────────────
let _activeConcurrent = 0;
const HIGH_LOAD_THRESHOLD = 500;
let _alertSentAt: number | null = null;
const ALERT_COOLDOWN_MS = 15 * 60 * 1000; // 15 min between alerts

// ── Rate limit check ─────────────────────────────────────────────────────────
export async function enforceRateLimit(
  userId: string,
  functionName: string,
): Promise<{ allowed: boolean; remaining: number; status: number } | null> {
  const maxPerMin = RATE_LIMITS[functionName] ?? RATE_LIMITS["default"];

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data, error } = await sb.rpc("check_rate_limit", {
    p_user_id:       userId,
    p_function_name: functionName,
    p_max_per_min:   maxPerMin,
  });

  if (error) {
    console.warn(`[monitoring] rate-limit DB error for ${functionName}:`, error.message);
    return null; // fail-open
  }

  const allowed = data as boolean;
  if (!allowed) {
    // Log to business_alerts (best-effort)
    sb.from("business_alerts").insert({
      alert_type:  "rate_limit_exceeded",
      title:       `Rate limit hit: ${functionName}`,
      message:     `User ${userId} exceeded ${maxPerMin} req/min on ${functionName}`,
      severity:    "warning",
      threshold:   maxPerMin,
      value:       maxPerMin + 1,
    }).then(() => {}).catch(() => {});

    return { allowed: false, remaining: 0, status: 429 };
  }

  return { allowed: true, remaining: maxPerMin, status: 200 };
}

// ── Build 429 response ────────────────────────────────────────────────────────
export function build429(corsHeaders: Record<string, string>, functionName: string): Response {
  const maxPerMin = RATE_LIMITS[functionName] ?? 100;
  return new Response(
    JSON.stringify({
      error:       "rate_limit_exceeded",
      message:     `Trop de requêtes — limite : ${maxPerMin}/min. Réessayez dans 60 secondes.`,
      retry_after: 60,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type":       "application/json",
        "Retry-After":        "60",
        "X-RateLimit-Limit":  String(maxPerMin),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}

// ── Concurrent load tracking ─────────────────────────────────────────────────
export function trackRequest(): () => void {
  _activeConcurrent++;

  // Fire high-load alert if needed
  if (
    _activeConcurrent >= HIGH_LOAD_THRESHOLD &&
    RESEND_API_KEY &&
    (!_alertSentAt || Date.now() - _alertSentAt > ALERT_COOLDOWN_MS)
  ) {
    _alertSentAt = Date.now();
    sendHighLoadAlert(_activeConcurrent).catch(() => {});

    // Log in DB too
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    sb.from("business_alerts").insert({
      alert_type: "high_load",
      title:      "⚠️ WIINUP MAX – High Load Detected",
      message:    `${_activeConcurrent} concurrent users detected (threshold: ${HIGH_LOAD_THRESHOLD})`,
      severity:   "critical",
      threshold:  HIGH_LOAD_THRESHOLD,
      value:      _activeConcurrent,
    }).then(() => {}).catch(() => {});
  }

  // Return cleanup function
  return () => {
    _activeConcurrent = Math.max(0, _activeConcurrent - 1);
  };
}

// ── Email alert (Resend) ─────────────────────────────────────────────────────
async function sendHighLoadAlert(count: number): Promise<void> {
  if (!RESEND_API_KEY) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:    "alerts@notify.wiinupmax.com",
      to:      [ALERT_EMAIL],
      subject: `🚨 WIINUP MAX – HIGH LOAD: ${count} concurrent users`,
      html: `
        <h2>⚠️ WIINUP MAX – High Load Alert</h2>
        <p><strong>${count} concurrent users</strong> detected (threshold: ${HIGH_LOAD_THRESHOLD}).</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <p>Check backend dashboard for details. Consider scaling.</p>
        <hr/>
        <small>WiinupMax Monitoring – Palantir-grade secured by design</small>
      `,
    }),
  });
}

// ── Structured function error logger ─────────────────────────────────────────
export async function logFunctionError(
  functionName: string,
  error: unknown,
  context?: Record<string, unknown>
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${functionName}] ERROR:`, message, context ?? "");

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  await sb.from("business_alerts").insert({
    alert_type: "function_error",
    title:      `Edge Function Error: ${functionName}`,
    message:    `${message}${context ? ` | context: ${JSON.stringify(context)}` : ""}`,
    severity:   "high",
    threshold:  null,
    value:      null,
  }).then(() => {}).catch(() => {});
}

// ── Performance timer ─────────────────────────────────────────────────────────
export function startTimer(): () => number {
  const t0 = performance.now();
  return () => Math.round(performance.now() - t0);
}
