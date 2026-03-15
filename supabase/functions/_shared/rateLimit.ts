/**
 * Rate-limit helper — configurable requests per minute per user.
 * Uses the api_rate_limits table via a SECURITY DEFINER DB function.
 *
 * SECURITY: Fail-CLOSED on DB error — if the rate-limit DB is unreachable we
 * block the request rather than allow it. This prevents an attacker from
 * triggering DB errors to bypass rate limiting.
 */
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export async function checkRateLimit(
  userId: string,
  functionName: string,
  maxPerMin = 100,
): Promise<{ allowed: boolean; remaining: number }> {
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await sb.rpc("check_rate_limit", {
    p_user_id:       userId,
    p_function_name: functionName,
    p_max_per_min:   maxPerMin,
  });

  if (error) {
    // SECURITY: Fail-CLOSED — DB error must never grant access.
    // An attacker who can cause DB errors would otherwise bypass rate limiting.
    console.error("[rate-limit] DB error — failing CLOSED:", error.message);
    return { allowed: false, remaining: 0 };
  }

  // data = boolean (true = allowed)
  const allowed = data as boolean;
  return { allowed, remaining: allowed ? maxPerMin : 0 };
}

/** Build a 429 Too Many Requests response */
export function rateLimitResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({
      error: "rate_limit_exceeded",
      message: "Trop de requêtes — limite : 100/minute. Réessayez dans 60 secondes.",
      retry_after: 60,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": "60",
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}
