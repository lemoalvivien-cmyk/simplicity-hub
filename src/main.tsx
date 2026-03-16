import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initErrorMonitoring } from "./lib/errorMonitoring";
import { initSentry } from "./lib/sentryConfig";
import ErrorBoundary from "./components/error/ErrorBoundary";

// 1. Init local error monitoring (sync, always active — no external deps)
initErrorMonitoring();

// 2. Init Sentry async (only if VITE_SENTRY_DSN is set — never blocks render)
initSentry();

// 3. Single root render — wrapped in ErrorBoundary for UI-level catch
const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

createRoot(root).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
