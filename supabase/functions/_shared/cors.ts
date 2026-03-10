/**
 * Shared CORS helper — dynamic origin validation.
 * Never returns Access-Control-Allow-Origin: "*"
 */

const ALLOWED_ORIGINS = [
  "https://wiinupmax.com",
  "https://wiinupmax.lovable.app",
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const isLocal = origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1");
  const isPreview = origin.includes(".lovable.app") || origin.includes(".lovableproject.com");
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) || isLocal || isPreview ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}
