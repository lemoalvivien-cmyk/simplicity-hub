// AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : authGuard centralisé
// Utilise getClaims() (vérification locale JWT ES256, sans round-trip réseau).
// À utiliser en tête de TOUTES les edge functions authentifiées.
// Référence : https://supabase.com/docs/guides/functions/auth

import { createClient } from "npm:@supabase/supabase-js@2.57.2";

export interface AuthClaims {
  sub: string;      // userId
  email?: string;
  role?: string;
  exp?: number;
}

/**
 * requireAuth — vérifie le Bearer JWT et retourne les claims.
 * Lance une Error("Unauthorized") si le header est absent ou le token invalide.
 * Pattern correct Lovable Cloud / Supabase signing-keys (ES256).
 */
export async function requireAuth(req: Request): Promise<AuthClaims> {
  // AUDIT 16/03/2026 – SÉCURITÉ FORCÉE : requireAuth obligatoire
  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized – missing or malformed Authorization header");
  }

  const token = authHeader.replace("Bearer ", "").trim();

  // Crée un client anon pour valider le token via getClaims (local, ES256-safe)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    throw new Error("Unauthorized – invalid or expired token");
  }

  return {
    sub:   data.claims.sub as string,
    email: data.claims.email as string | undefined,
    role:  data.claims.role as string | undefined,
    exp:   data.claims.exp as number | undefined,
  };
}

/**
 * unauthorizedResponse — réponse 401 standardisée.
 */
export function unauthorizedResponse(corsHeaders: Record<string, string>, message = "Unauthorized"): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
