/**
 * Sentry — Error tracking & performance monitoring
 * WiinupMax Production
 *
 * Usage: call initSentry() once in main.tsx before rendering.
 * Set VITE_SENTRY_DSN in your environment to activate.
 * Without DSN, Sentry is silently disabled (never blocks the app).
 */

let sentryInitialized = false;

export async function initSentry(): Promise<void> {
  if (sentryInitialized) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

  if (!dsn) {
    if (import.meta.env.DEV) {
      console.info(
        "[Sentry] DSN not configured — set VITE_SENTRY_DSN to activate. " +
        "Errors are still captured by the local error monitoring fallback."
      );
    }
    return;
  }

  try {
    const Sentry = await import("@sentry/react");
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE ?? "production",
      tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      ignoreErrors: [
        "ResizeObserver loop limit exceeded",
        "Non-Error promise rejection captured",
        "Network request failed",
      ],
      beforeSend(event) {
        if (event.request?.headers) {
          delete event.request.headers["Authorization"];
          delete event.request.headers["Cookie"];
        }
        return event;
      },
    });

    sentryInitialized = true;

    if (import.meta.env.DEV) {
      console.info("[Sentry] Initialized in", import.meta.env.MODE, "mode.");
    }
  } catch (e) {
    // Sentry must never crash the app
    if (import.meta.env.DEV) {
      console.warn("[Sentry] Failed to initialize:", e);
    }
  }
}
