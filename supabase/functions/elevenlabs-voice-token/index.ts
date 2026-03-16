// AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : requireAuth obligatoire
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireAuth, unauthorizedResponse } from "../_shared/authGuard.ts";

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : requireAuth obligatoire
  try { await requireAuth(req); } catch { return unauthorizedResponse(corsHeaders); }

  return new Response(
    JSON.stringify({ error: "Fonctionnalité vocale non disponible.", code: "FEATURE_DISABLED" }),
    { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

// Legacy preserved below (disabled)
// deno-lint-ignore no-unused-vars
const _authHeader = req?.headers?.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
