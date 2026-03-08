/**
 * WIINUP MAX — App Analytics Runtime
 * Writes real events to `analytics_events` table (Supabase).
 *
 * PROOF:ANALYTICS_RUNTIME_V1:writer_exists — this file is the single writer to analytics_events
 * Validates event_type at compile-time. Never blocks UI (fire & forget).
 * Correlates session_id / user_id / page / created_at.
 */

import { supabase } from "@/integrations/supabase/client";

// ── Validated event types ────────────────────────────────────────────────────
// These are the ONLY accepted values — no freeform strings.
export const ANALYTICS_EVENTS = [
  "landing_view",
  "cta_click",
  "pricing_view",
  "checkout_start",
  "checkout_success",
  "onboarding_done",
  "mission_created",
  "intro_submitted",
  "intro_validated",
  "signup_started",
  "login_success",
  "promo_redeemed",
] as const;

export type AnalyticsEventType = typeof ANALYTICS_EVENTS[number];

export interface AnalyticsPayload {
  label?: string;
  source?: string;
  value?: number | string;
  [key: string]: unknown;
}

// ── Session ID (anonymous, persists in sessionStorage) ──────────────────────
function getSessionId(): string {
  let sid = sessionStorage.getItem("wiinup_sid");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("wiinup_sid", sid);
  }
  return sid;
}

// ── Core write function ──────────────────────────────────────────────────────
// Fire & forget — never throws, never blocks
export function trackEvent(
  eventType: AnalyticsEventType,
  userId: string | null | undefined,
  properties: AnalyticsPayload = {}
): void {
  const sessionId = getSessionId();
  const page = typeof window !== "undefined" ? window.location.pathname : "/";

  // PROOF:ANALYTICS_RUNTIME_V1:real_insert — writes to analytics_events
  supabase
    .from("analytics_events")
    .insert({
      event_type: eventType,
      session_id: sessionId,
      user_id: userId ?? null,
      page,
      properties: properties as Record<string, unknown>,
    })
    .then(({ error }) => {
      if (error && import.meta.env.DEV) {
        console.warn("[analytics] insert failed:", error.message);
      }
    });

  if (import.meta.env.DEV) {
    console.info(`[analytics] ${eventType}`, { userId, page, ...properties });
  }
}

// ── React hook ───────────────────────────────────────────────────────────────
import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useAnalytics() {
  const { user } = useAuth();

  const track = useCallback(
    (eventType: AnalyticsEventType, properties: AnalyticsPayload = {}) => {
      trackEvent(eventType, user?.id, properties);
    },
    [user?.id]
  );

  return { track };
}
