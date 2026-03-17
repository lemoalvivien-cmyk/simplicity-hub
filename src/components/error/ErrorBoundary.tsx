/**
 * ErrorBoundary — Global React crash boundary.
 * • Détecte les erreurs réseau/Supabase et affiche un message adapté
 * • Logs to Sentry (if DSN configured)
 * • Logs to business_alerts table (Lovable Cloud)
 * • Renders a clean fallback UI — never breaks the app
 */
import { Component, type ReactNode, type ErrorInfo } from "react";
import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string | null;
  sentryEventId: string | null;
  isNetworkError: boolean;
}

function isNetworkOrSupabaseError(error: Error): boolean {
  const msg = error.message ?? "";
  return (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("supabase") ||
    msg.includes("timeout") ||
    msg.includes("net::ERR")
  );
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorId: null, sentryEventId: null, isNetworkError: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      errorId: crypto.randomUUID().slice(0, 8),
      isNetworkError: isNetworkOrSupabaseError(error),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const errorId = this.state.errorId ?? "unknown";

    // 1. Sentry (primary — full stack trace + replay)
    const sentryEventId = import.meta.env.VITE_SENTRY_DSN
      ? Sentry.captureException(error, {
          extra: {
            componentStack: info.componentStack?.slice(0, 1200),
            errorId,
          },
        })
      : null;

    if (sentryEventId) {
      this.setState({ sentryEventId });
    }

    // 2. Lovable Cloud business_alerts (fallback + ops visibility)
    const message = `[${errorId}] ${error.name}: ${error.message}\n${info.componentStack?.slice(0, 800)}`;
    (supabase.from("business_alerts") as any)
      .insert({
        alert_type: "frontend_error",
        title: `Erreur React — ${error.name}`,
        message,
        severity: "high",
        value: null,
        threshold: null,
      })
      .then(({ error: dbError }: { error: unknown }) => {
        if (dbError && import.meta.env.DEV) {
          console.warn("[ErrorBoundary] DB log failed:", dbError);
        }
      });

    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, errorId: null, sentryEventId: null, isNetworkError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { isNetworkError, errorId, sentryEventId } = this.state;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div
            className="rounded-2xl border p-8 max-w-sm w-full text-center"
            style={{
              background: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{
                background: isNetworkError
                  ? "hsl(38 92% 50% / 0.1)"
                  : "hsl(0 72% 50% / 0.1)",
                border: isNetworkError
                  ? "1px solid hsl(38 92% 50% / 0.2)"
                  : "1px solid hsl(0 72% 50% / 0.2)",
              }}
            >
              {isNetworkError
                ? <WifiOff size={24} style={{ color: "hsl(38 92% 60%)" }} />
                : <AlertTriangle size={24} style={{ color: "hsl(0 72% 60%)" }} />
              }
            </div>
            <h2 className="font-display font-bold text-lg text-foreground mb-2">
              {isNetworkError ? "Service temporairement indisponible" : "Un problème est survenu"}
            </h2>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              {isNetworkError
                ? "Vérifiez votre connexion internet et rechargez la page."
                : "Notre équipe a été prévenue automatiquement. Rechargez la page ou revenez dans quelques instants."
              }
            </p>
            {errorId && (
              <p className="text-[10px] text-muted-foreground/50 mb-1 font-mono">
                Réf. #{errorId}
              </p>
            )}
            {sentryEventId && (
              <p className="text-[9px] text-muted-foreground/30 mb-4 font-mono">
                Sentry: {sentryEventId.slice(0, 16)}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  background: "hsl(var(--primary) / 0.12)",
                  border: "1px solid hsl(var(--primary) / 0.25)",
                  color: "hsl(var(--primary-glow))",
                }}
              >
                <RefreshCw size={14} />
                Recharger la page
              </button>
              {!isNetworkError && (
                <button
                  onClick={this.handleReset}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                >
                  Réessayer sans recharger
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
