/**
 * ErrorBoundary — React class boundary for production error capture.
 * Logs to `business_alerts` table (Lovable Cloud) + console.
 * Renders a clean fallback UI on crash.
 */
import { Component, type ReactNode, type ErrorInfo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorId: null };

  static getDerivedStateFromError(): State {
    return { hasError: true, errorId: crypto.randomUUID().slice(0, 8) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const errorId = this.state.errorId ?? "unknown";
    const message = `[${errorId}] ${error.name}: ${error.message}\n${info.componentStack?.slice(0, 800)}`;

    // Fire & forget — never blocks UI
    (supabase.from("business_alerts") as any)
      .insert({
        alert_type: "frontend_error",
        title: `Erreur JS — ${error.name}`,
        message,
        severity: "high",
        value: null,
        threshold: null,
      })
      .then(({ error: dbError }: { error: unknown }) => {
        if (dbError && import.meta.env.DEV) {
          console.warn("[ErrorBoundary] failed to log:", dbError);
        }
      });

    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, errorId: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

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
              style={{ background: "hsl(0 72% 50% / 0.1)", border: "1px solid hsl(0 72% 50% / 0.2)" }}
            >
              <AlertTriangle size={24} style={{ color: "hsl(0 72% 60%)" }} />
            </div>
            <h2 className="font-display font-bold text-lg text-foreground mb-2">
              Un problème est survenu
            </h2>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Notre équipe a été prévenue automatiquement. Rechargez la page ou revenez dans quelques instants.
            </p>
            {this.state.errorId && (
              <p className="text-[10px] text-muted-foreground/50 mb-4 font-mono">
                Réf. #{this.state.errorId}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: "hsl(var(--primary) / 0.12)",
                border: "1px solid hsl(var(--primary) / 0.25)",
                color: "hsl(var(--primary-glow))",
              }}
            >
              <RefreshCw size={14} />
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
