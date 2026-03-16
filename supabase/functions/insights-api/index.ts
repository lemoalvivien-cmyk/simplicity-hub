// AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : requireAuth obligatoire
// insights-api désactivée pour le lancement GTM — retourne 503 propre.
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

  // Feature disabled for GTM launch — re-enable after v2
  return new Response(
    JSON.stringify({
      error: "Insights API non disponible sur cette offre.",
      code: "FEATURE_DISABLED",
    }),
    {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
