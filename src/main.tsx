// CRITICAL: Unregister any stale Service Worker before app boots
// Prevents cached old JS chunks from crashing the app after a rebuild
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
      console.log('[WIINUP] Stale SW unregistered:', registration.scope);
    }
  });
}

// ── GUARD: Supabase env vars must be present before any module loads ──────
// If VITE_SUPABASE_URL is missing, createClient() throws synchronously and
// crashes the entire module graph before any ErrorBoundary can catch it.
// This guard renders a visible error page instead of a white screen.
const _supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const _supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!_supabaseUrl || !_supabaseKey) {
  document.getElementById('root')!.innerHTML = `
    <div style="font-family:monospace;background:#1a1a2e;color:#e94560;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;text-align:center">
      <h1 style="font-size:2rem;margin-bottom:1rem">⚠️ Configuration manquante</h1>
      <p style="color:#a8b2d8;max-width:500px;line-height:1.6">
        Les variables <code style="color:#64ffda">VITE_SUPABASE_URL</code> et <code style="color:#64ffda">VITE_SUPABASE_PUBLISHABLE_KEY</code>
        sont absentes du build.<br/><br/>
        Reconnectez Lovable Cloud dans <strong>Settings → Supabase</strong> puis publiez à nouveau.
      </p>
      <p style="color:#555;margin-top:2rem;font-size:0.8rem">WiinupMax v1.5.0 — PHOENIX-FINAL</p>
    </div>
  `;
  throw new Error('[WIINUP FATAL] VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is missing. Reconnect Lovable Cloud.');
}

console.log("%c[WIINUP DEBUG] main.tsx démarré — Supabase OK", "color:orange;font-size:16px");

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
