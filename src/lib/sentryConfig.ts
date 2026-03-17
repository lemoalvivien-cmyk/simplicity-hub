/**
 * Sentry — Production error tracking for WiinupMax.
 * DSN is read from VITE_SENTRY_DSN (Lovable Cloud Vault).
 * Gracefully no-ops if DSN is absent (dev / staging without Sentry).
 */
import * as Sentry from "@sentry/react";

let _initialized = false;

export function initSentry(): void {
  if (_initialized) return;
  _initialized = true;

  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

  if (!dsn) {
    if (import.meta.env.DEV) {
      console.info("[Sentry] No DSN — using local error monitoring only.");
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE, // "production" | "development"
    release: import.meta.env.VITE_BUILD_SHA ?? "unknown",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance — 10% in prod, 100% in dev
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Session Replay — 1% of all sessions, 100% on errors
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,
    // Don't send errors from localhost
    beforeSend(event) {
      if (
        typeof window !== "undefined" &&
        window.location.hostname === "localhost"
      ) {
        return null;
      }
      return event;
    },
  });

  if (import.meta.env.DEV) {
    console.info("[Sentry] Initialized with DSN.");
  }
}

/**
 * Attach authenticated user to all future Sentry events.
 * Call after supabase.auth.getUser() resolves.
 */
export function setSentryUser(user: { id: string; email?: string } | null): void {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Manually capture an exception (use in catch blocks).
 * Falls back silently if Sentry is not initialized.
 */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>
): void {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context) scope.setExtras(context);
      Sentry.captureException(error);
    });
  } else {
    console.error("[captureException]", error, context);
  }
}
