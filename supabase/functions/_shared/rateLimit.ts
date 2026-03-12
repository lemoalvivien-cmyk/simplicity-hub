/**
 * Rate-limit helper — 100 requests / minute / user
 * Uses the api_rate_limits table via a SECURITY DEFINER DB function.
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
    // On DB error, allow (fail-open to avoid blocking legit users)
    console.warn("[rate-limit] DB error, failing open:", error.message);
    return { allowed: true, remaining: maxPerMin };
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
