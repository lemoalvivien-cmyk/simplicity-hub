/**
 * OpenClaw Autonomous Swarm
 * Orchestrates: cash-flow signal → AI matching → voice token → lead generation
 *
 * POST /openclaw-autonomous-swarm
 * Body: { user_id, tx: { description, amount, freq, counterparty } }
 */
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { enforceRateLimit, build429, trackRequest, logFunctionError } from "../_shared/monitoring.ts";

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY      = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const anonSb = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await anonSb.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // ── Rate limiting ───────────────────────────────────────────────────────────
  const rateCheck = await enforceRateLimit(user.id, "openclaw-autonomous-swarm");
  if (rateCheck && !rateCheck.allowed) return build429(corsHeaders, "openclaw-autonomous-swarm");

  const releaseTracker = trackRequest();
  const elapsed = startTimer();

  try {
    const body = await req.json();
    const { user_id, tx } = body;

    if (!tx) {
      return new Response(JSON.stringify({ error: "tx is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetUserId = user_id ?? user.id;
    const results: Record<string, unknown> = {};

    // ── Step 1: AI Matching — find relevant opportunities ────────────────────
    const { data: matchData, error: matchErr } = await sb.functions.invoke("ai-matching", {
      body: { cash_flow: tx, user_id: targetUserId },
    });
    if (matchErr) console.warn("[swarm] ai-matching error:", matchErr.message);
    results.match = matchData ?? null;

    // ── Step 2: Voice token (optional — ElevenLabs Conversational AI) ────────
    let voiceToken: string | null = null;
    if (matchData?.agent_id) {
      const { data: voiceData, error: voiceErr } = await sb.functions.invoke(
        "elevenlabs-voice-token",
        { body: { agentId: matchData.agent_id } }
      );
      if (voiceErr) console.warn("[swarm] voice-token error:", voiceErr.message);
      voiceToken = voiceData?.token ?? null;
    }
    results.voice_token = voiceToken;

    // ── Step 3: Lead generation based on cash-flow signal ────────────────────
    const { data: leadData, error: leadErr } = await sb.functions.invoke(
      "openclaw-lead-generator",
      {
        body: {
          user_id: targetUserId,
          source: "bank_webhook",
          context: { tx, match: matchData },
          voice_token: voiceToken,
        },
      }
    );
    if (leadErr) console.warn("[swarm] lead-generator error:", leadErr.message);
    results.lead = leadData ?? null;

    // ── Step 4: Record swarm execution in openclaw_job_queue ─────────────────
    const { error: jobErr } = await sb.from("openclaw_job_queue").insert({
      user_id: targetUserId,
      job_type: "autonomous_swarm",
      status: "completed",
      payload: { tx, match: matchData, lead_id: leadData?.lead_id ?? null },
      executed_at: new Date().toISOString(),
    });
    if (jobErr) console.warn("[swarm] job log error:", jobErr.message);

    releaseTracker();
    return new Response(
      JSON.stringify({ success: true, results, duration_ms: elapsed() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    releaseTracker();
    await logFunctionError("openclaw-autonomous-swarm", err);
    console.error("[openclaw-autonomous-swarm] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
