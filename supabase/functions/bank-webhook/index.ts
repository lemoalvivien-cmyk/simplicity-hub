import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL    = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// SECURITY: BANK_WEBHOOK_SECRET is REQUIRED. Empty secret = fail-closed (500).
const WEBHOOK_SECRET  = Deno.env.get("BANK_WEBHOOK_SECRET") ?? "";

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // Reject preflight — this is a server-to-server webhook, no browser calls
  if (req.method === "OPTIONS") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // ── SECURITY: Fail-closed — secret MUST be configured ───────────────────
  // If BANK_WEBHOOK_SECRET is empty or not set, reject ALL requests.
  // This prevents any data ingestion when the server is misconfigured.
  if (!WEBHOOK_SECRET || WEBHOOK_SECRET.trim().length < 16) {
    console.error("[bank-webhook] SECURITY: BANK_WEBHOOK_SECRET not configured or too short — fail-closed");
    return new Response(
      JSON.stringify({ error: "Webhook endpoint not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // ── SECURITY: Webhook signature validation — mandatory, no bypass ─────────
  const sig = req.headers.get("x-bank-signature");
  if (!sig) {
    console.warn("[bank-webhook] SECURITY: Missing x-bank-signature header");
    return new Response(JSON.stringify({ error: "Missing webhook signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (sig !== WEBHOOK_SECRET) {
    console.warn("[bank-webhook] SECURITY: Invalid webhook signature — rejected");
    return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.json();
    const { user_id, transaction } = payload;

    if (!user_id || !transaction) {
      return new Response(JSON.stringify({ error: "user_id and transaction are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // ── Generate embedding via ai-prospection ─────────────────────────────────
    let vector: number[] | null = null;
    try {
      const embRes = await fetch(
        `${SUPABASE_URL}/functions/v1/ai-prospection`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${SERVICE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: transaction.description ?? "" }),
        }
      );
      if (embRes.ok) {
        const embData = await embRes.json();
        vector = embData.embedding ?? null;
      }
    } catch (embErr) {
      console.warn("[bank-webhook] Embedding skipped:", embErr);
    }

    // ── Insert cash flow row ──────────────────────────────────────────────────
    const cash_weight =
      typeof transaction.amount === "number" && typeof transaction.freq === "number"
        ? transaction.amount * transaction.freq * 0.85
        : null;

    const { error: insertErr } = await supabase.from("live_cash_flow").insert({
      user_id,
      amount:       transaction.amount       ?? null,
      counterparty: transaction.counterparty ?? transaction.description ?? null,
      vector,
      cash_weight,
    });

    if (insertErr) {
      console.error("[bank-webhook] Insert error:", insertErr);
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Audit log ─────────────────────────────────────────────────────────────
    await supabase.from("etg_audit_log").insert({
      action:      "bank_webhook_received",
      entity_type: "live_cash_flow",
      user_id,
      after_state: {
        amount:       transaction.amount ?? null,
        counterparty: transaction.counterparty ?? transaction.description ?? null,
        cash_weight,
        auth_path:    "x-bank-signature",
      },
    }).catch(() => null);

    // ── Trigger OpenClaw analysis (best-effort) ───────────────────────────────
    try {
      await supabase.functions.invoke("openclaw-gateway", {
        body: { action: "bank_tx_received", user_id, tx: transaction },
      });
    } catch (swarmErr) {
      console.warn("[bank-webhook] OpenClaw trigger skipped:", swarmErr);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Bank webhook processed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[bank-webhook] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
