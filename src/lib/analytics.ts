/**
 * WIINUP MAX — App Analytics Runtime
 * Writes real events to `analytics_events` table.
 * Validates event_type at compile-time. Never blocks UI (fire & forget).
 * Correlates session_id / user_id / page / created_at.
 *
 * FUNNEL EVENTS (full coverage):
 *   landing_view → pricing_view → checkout_start → checkout_success →
 *   success_view → onboarding_done → mission_created → intro_submitted →
 *   intro_validated → gain_created → gain_paid
 */

import { supabase } from "@/integrations/supabase/client";

// ── Validated event types ────────────────────────────────────────────────────
export const ANALYTICS_EVENTS = [
  // Acquisition funnel
  "page_view",
  "landing_view",
  "waitlist_signup",
  "cta_click",
  "pricing_view",
  "checkout_start",
  "checkout_success",
  "success_view",
  // Activation funnel
  "signup_started",
  "login_success",
  "onboarding_done",
  "promo_redeemed",
  // Core value funnel
  "mission_created",
  "intro_submitted",
  "intro_validated",
  // Revenue funnel
  "gain_created",
  "gain_paid",
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

// ── Consent gate ─────────────────────────────────────────────────────────────
// trackEvent() is blocked until the user accepts cookies (RGPD art. 6.1.a)
function isAnalyticsConsented(): boolean {
  try {
    const raw = localStorage.getItem("wiinupmax_cookie_consent");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed.state === "accepted" && parsed.version === "v1";
  } catch {
    return false;
  }
}

// ── Core write function ──────────────────────────────────────────────────────
// Fire & forget — never throws, never blocks
export function trackEvent(
  eventType: AnalyticsEventType,
  userId: string | null | undefined,
  properties: AnalyticsPayload = {}
): void {
  // RGPD: don't track until consent
  if (!isAnalyticsConsented()) {
    if (import.meta.env.DEV) {
      console.info(`[analytics] BLOCKED (no consent): ${eventType}`);
    }
    return;
  }

  const sessionId = getSessionId();
  const page = typeof window !== "undefined" ? window.location.pathname : "/";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supabase.from("analytics_events") as any)
    .insert({
      event_type: eventType,
      session_id: sessionId,
      user_id: userId ?? null,
      page,
      properties: properties as Record<string, unknown>,
    })
    .then(({ error }: { error: { message: string } | null }) => {
      if (error && import.meta.env.DEV) {
        console.warn("[analytics] insert failed:", error.message);
      }
    });

  if (import.meta.env.DEV) {
    console.info(`[analytics] ${eventType}`, { userId, page, ...properties });
  }
}

// ── React hook ───────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
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

// ── Auto page-view tracker ────────────────────────────────────────────────────
export function usePageTracking() {
  const { user } = useAuth();
  const location = useLocation();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;
    if (path === prevPath.current) return;
    prevPath.current = path;

    // Named funnel events for key pages
    const funnelMap: Partial<Record<string, AnalyticsEventType>> = {
      "/pricing": "pricing_view",
      "/checkout": "checkout_start",
      "/success": "success_view",
    };
    const funnelEvent = funnelMap[path];
    if (funnelEvent) {
      trackEvent(funnelEvent, user?.id ?? null, { path });
    } else {
      trackEvent("page_view", user?.id ?? null, { path });
    }
  }, [location.pathname, user?.id]);
}
