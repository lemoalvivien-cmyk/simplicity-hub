/**
 * ADA Training Pipeline — DÉSACTIVÉE pour le lancement GTM
 * AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : requireAuth obligatoire
 */
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireAuth, unauthorizedResponse } from "../_shared/authGuard.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : requireAuth obligatoire
  try { await requireAuth(req); } catch { return unauthorizedResponse(corsHeaders); }

  return new Response(
    JSON.stringify({ error: "ADA Training non disponible.", code: "FEATURE_DISABLED" }),
    { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
