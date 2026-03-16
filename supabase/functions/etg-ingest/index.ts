// AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : requireAuth obligatoire
// etg-ingest hardenée : JWT utilisateur requis pour ingestion dans le graphe.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireAuth, unauthorizedResponse } from "../_shared/authGuard.ts";

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : requireAuth obligatoire
  let claims: Awaited<ReturnType<typeof requireAuth>>;
  try {
    claims = await requireAuth(req);
  } catch {
    return unauthorizedResponse(corsHeaders);
  }

  const userId = claims.sub;

  try {
    const body = await req.json();
    const { event_type, entity_id, metadata } = body as {
      event_type: string;
      entity_id: string;
      metadata?: Record<string, unknown>;
    };

    if (!event_type || !entity_id) {
      return new Response(JSON.stringify({ error: "event_type and entity_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Log the ETG event scoped to this user
    const { error } = await db.from("etg_audit_log").insert({
      action: event_type,
      entity_id,
      entity_type: metadata?.entity_type as string ?? "unknown",
      user_id: userId,
      after_state: metadata ?? {},
      function_name: "etg-ingest",
    });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
