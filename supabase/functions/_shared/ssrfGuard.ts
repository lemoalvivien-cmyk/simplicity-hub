/**
 * SSRF guard for OpenClaw gateway URL validation.
 *
 * SECURITY: Before making any fetch() to a user-configured gateway URL,
 * call isValidGatewayUrl(url). This prevents:
 *  - HTTP requests (force HTTPS)
 *  - SSRF to internal services (metadata endpoints, Supabase itself, localhost)
 *  - Requests to private RFC-1918 / link-local / loopback IP ranges
 *
 * Usage:
 *   if (!isValidGatewayUrl(gatewayUrl)) {
 *     return new Response(JSON.stringify({ error: "Invalid gateway URL" }), { status: 400 });
 *   }
 */

// SECURITY: List of hostname patterns that must never be reached.
// Covers cloud metadata endpoints, localhost variants, and Supabase internals.
const BLOCKED_HOSTNAME_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /^127\./,                         // loopback IPv4
  /^::1$/,                          // loopback IPv6
  /^0\.0\.0\.0$/,                   // unspecified
  /^10\.\d+\.\d+\.\d+$/,            // RFC-1918 Class A
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/, // RFC-1918 Class B (172.16–172.31)
  /^192\.168\.\d+\.\d+$/,           // RFC-1918 Class C
  /^169\.254\.\d+\.\d+$/,           // link-local (APIPA + AWS metadata 169.254.169.254)
  /^fd[0-9a-f]{2}:/i,               // ULA IPv6 (fc00::/7)
  /^fe80:/i,                        // link-local IPv6
  /metadata\.google\.internal$/i,   // GCP metadata
  /169\.254\.169\.254/,             // AWS/GCP/Azure metadata IP
  /supabase\.co$/i,                 // SECURITY: Supabase own infra must not be called by gateway
  /supabase\.in$/i,
];

/**
 * Returns true only if the URL is safe to fetch.
 * Rejects: non-HTTPS, missing hostname, blocked private/internal ranges.
 */
export function isValidGatewayUrl(rawUrl: string): boolean {
  // SECURITY: Must not be empty or excessively long (URL bombing).
  if (!rawUrl || rawUrl.length > 2048) return false;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    // SECURITY: Unparseable URL — reject.
    return false;
  }

  // SECURITY: HTTPS only — plain HTTP exposes secrets in transit.
  if (parsed.protocol !== "https:") return false;

  const hostname = parsed.hostname.toLowerCase();

  // SECURITY: Empty hostname (e.g., file:// tricks) — reject.
  if (!hostname) return false;

  // SECURITY: Check against every blocked pattern.
  for (const pattern of BLOCKED_HOSTNAME_PATTERNS) {
    if (pattern.test(hostname)) return false;
  }

  return true;
}
