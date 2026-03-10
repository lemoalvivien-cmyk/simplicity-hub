import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    // ── Config check — no key configured ─────────────────────────────────────
    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "elevenlabs_not_configured",
          fallback: "browser",
          message: "Configurez ELEVENLABS_API_KEY dans les secrets du projet.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));

    // ── Health check probe (no agentId needed) ────────────────────────────────
    if (body?.check === true) {
      return new Response(
        JSON.stringify({ ok: true, configured: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { agentId } = body;

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: "agentId requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
      { headers: { "xi-api-key": ELEVENLABS_API_KEY } }
    );

    if (!response.ok) {
      const err = await response.text();
      return new Response(
        JSON.stringify({ error: "Erreur ElevenLabs", detail: err, fallback: "browser" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { token } = await response.json();
    return new Response(
      JSON.stringify({ token, configured: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erreur interne", detail: String(err), fallback: "browser" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
