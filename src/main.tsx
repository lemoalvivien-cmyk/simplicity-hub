import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initErrorMonitoring } from "./lib/errorMonitoring";
import { initSentry } from "./lib/sentryConfig";
import ErrorBoundary from "./components/error/ErrorBoundary";

// 1. Init Sentry first (captures errors from init itself if any)
initSentry();

// 2. Init local error monitoring fallback (logs to business_alerts)
// Works even without Sentry DSN — belt-and-suspenders approach
initErrorMonitoring();

// 3. Single root render — wrapped in ErrorBoundary for UI-level catch
const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

createRoot(root).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
