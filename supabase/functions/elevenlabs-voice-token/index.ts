// AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : requireAuth obligatoire
// Fonctionnalité vocale désactivée pour le lancement GTM.
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireAuth, unauthorizedResponse } from "../_shared/authGuard.ts";

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await requireAuth(req);
  } catch {
    return unauthorizedResponse(corsHeaders);
  }

  return new Response(
    JSON.stringify({ error: "Fonctionnalité vocale non disponible.", code: "FEATURE_DISABLED" }),
    { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
