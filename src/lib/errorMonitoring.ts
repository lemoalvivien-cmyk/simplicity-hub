/**
 * Production error monitoring — WiinupMax
 * Captures unhandled JS errors + unhandled promise rejections.
 * Logs to `business_alerts` table. Never blocks the app.
 */
import { supabase } from "@/integrations/supabase/client";

let initialized = false;

async function logError(title: string, message: string): Promise<void> {
  try {
    await (supabase.from("business_alerts") as any).insert({
      alert_type: "frontend_error",
      title,
      message: message.slice(0, 2000),
      severity: "high",
      value: null,
      threshold: null,
    });
  } catch {
    // Silently fail — monitoring must never break the app
  }
}

export function initErrorMonitoring(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  // Global JS errors
  window.addEventListener("error", (event) => {
    const { message, filename, lineno, colno, error } = event;
    const stack = error?.stack?.slice(0, 800) ?? "";
    logError(
      `Erreur JS — ${message.slice(0, 120)}`,
      `${message}\nFichier : ${filename}:${lineno}:${colno}\n${stack}`
    );
  });

  // Unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const msg =
      reason instanceof Error
        ? `${reason.name}: ${reason.message}\n${reason.stack?.slice(0, 600) ?? ""}`
        : String(reason).slice(0, 600);
    logError(`Promesse rejetée — ${msg.slice(0, 120)}`, msg);
  });

  if (import.meta.env.DEV) {
    console.info("[monitoring] Error monitoring initialized.");
  }
}
