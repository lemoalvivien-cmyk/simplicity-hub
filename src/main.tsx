import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initErrorMonitoring } from "./lib/errorMonitoring";
import { initSentry } from "./lib/sentryConfig";
import ErrorBoundary from "./components/error/ErrorBoundary";

// Init error monitoring (local — no external deps, never blocks render)
initErrorMonitoring();
initSentry();

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

createRoot(root).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
