console.log("%c[WIINUP DEBUG] main.tsx démarré", "color:orange;font-size:16px");

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initErrorMonitoring } from "./lib/errorMonitoring";
import { initSentry } from "./lib/sentryConfig";

// Ultra-visible error boundary for debug
import { Component, type ReactNode } from "react";

class DebugErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("[WIINUP DEBUG] ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      const err = (this.state.error ?? new Error("Erreur inconnue")) as Error;
      return (
        <div style={{
          background: "red",
          color: "white",
          padding: "40px",
          fontSize: "24px",
          textAlign: "center",
          minHeight: "100vh",
          fontFamily: "monospace",
        }}>
          <strong>Erreur WiinupMax</strong>
          <br />
          {err?.message ?? "Erreur inconnue"}
          <br />
          <small style={{ fontSize: "14px", display: "block", marginTop: "16px" }}>
            Ouvre la console F12 pour le détail complet
          </small>
        </div>
      );
    }
    return this.props.children;
  }
}

// Init error monitoring (local — no external deps, never blocks render)
initErrorMonitoring();
initSentry();

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

createRoot(root).render(
  <DebugErrorBoundary>
    <App />
  </DebugErrorBoundary>
);
