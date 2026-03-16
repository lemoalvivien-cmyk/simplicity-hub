/**
 * Sentry — Error tracking stub.
 * @sentry/react removed to avoid bundle conflicts.
 * Local error monitoring (errorMonitoring.ts) handles all error capture.
 * To add Sentry: install @sentry/react and update this file.
 */
export function initSentry(): void {
  // No-op: Sentry not configured. Errors captured by errorMonitoring.ts
  if (import.meta.env.DEV) {
    console.info("[Sentry] Stub — using local error monitoring instead.");
  }
}
