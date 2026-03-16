// AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : requireAuth obligatoire
// openclaw-gateway désactivé pour le lancement GTM — retourne 503 propre.
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireAuth, unauthorizedResponse } from "../_shared/authGuard.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : requireAuth obligatoire (même si désactivée)
  try {
    await requireAuth(req);
  } catch {
    return unauthorizedResponse(corsHeaders);
  }

  return new Response(
    JSON.stringify({
      error: "OpenClaw non disponible sur cette offre.",
      code: "FEATURE_DISABLED",
    }),
    {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
