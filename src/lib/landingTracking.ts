/**
 * WIINUP MAX — Landing Page Tracking
 * Events are persisted to `landing_ab_events` (Supabase) for conversion analysis.
 * Also pushes to dataLayer for GTM integration.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

// ─── Session ID (anonymous, persistent per browser tab) ──────────────────────

function getSessionId(): string {
  let sid = sessionStorage.getItem("landing_sid");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("landing_sid", sid);
  }
  return sid;
}

// ─── DB-accepted event types (must match CHECK constraint) ───────────────────

type DbEvent =
  | "pageview"
  | "scroll_50"
  | "scroll_80"
  | "cta_hero_enterprise"
  | "cta_hero_facilitator"
  | "cta_pricing_enterprise"
  | "cta_pricing_facilitator"
  | "cta_final_enterprise"
  | "cta_final_facilitator"
  | "cta_sticky_mobile";

// All trackable events (superset — some are local-only, not persisted to DB)
export type TrackEvent =
  | DbEvent
  | "cta_howitworks"
  | "cta_hero_facilitateur"
  | "cta_facilitateur_section"
  | "qa_open"
  | "scroll_25"
  | "scroll_75"
  | "scroll_100";

export interface TrackPayload {
  label?: string;
  variant?: string;
  position?: string;
}

const DB_EVENTS = new Set<string>([
  "pageview",
  "scroll_50",
  "scroll_80",
  "cta_hero_enterprise",
  "cta_hero_facilitator",
  "cta_pricing_enterprise",
  "cta_pricing_facilitator",
  "cta_final_enterprise",
  "cta_final_facilitator",
  "cta_sticky_mobile",
]);

// ─── Supabase Persistence (fire & forget, never blocks UI) ───────────────────

function persistToDb(event: string, payload?: TrackPayload) {
  const sid = getSessionId();
  const ua = typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 256) : null;
  const ref = typeof document !== "undefined" ? (document.referrer.slice(0, 512) || null) : null;

  supabase
    .from("landing_ab_events")
    .insert([{
      session_id: sid,
      event_type: event,
      hero_headline_variant: null,
      hero_cta_variant: null,
      pricing_frame_variant: null,
      event_label: payload?.label ? payload.label.slice(0, 128) : null,
      event_payload: (payload ?? {}) as Json,
      path: typeof window !== "undefined" ? window.location.pathname : "/",
      user_agent: ua,
      referrer: ref,
    }])
    .then(() => {
      // silent — never throw
    });
}

// ─── Public Track Function ───────────────────────────────────────────────────

let _scrollMilestones = new Set<number>();

export function track(event: TrackEvent, payload?: TrackPayload) {
  const data = {
    event,
    ...payload,
    ts: Date.now(),
    path: typeof window !== "undefined" ? window.location.pathname : "/",
  };

  // Push to dataLayer (GTM-ready)
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    const { event: _trackEvent, ...rest } = data;
    w.dataLayer.push({ event: `wiinup_${_trackEvent}`, ...rest });
  }

  // Persist to DB only if event is in the accepted set
  if (DB_EVENTS.has(event)) {
    persistToDb(event, payload);
  }

  // Console in dev
  if (import.meta.env.DEV) {
    console.info(`[track] ${event}`, data);
  }
}

// ─── Scroll Depth Tracker ────────────────────────────────────────────────────

export function initScrollTracking() {
  if (typeof window === "undefined") return;

  // 50 → DB-persisted (in constraint). 25/75/100 → local only.
  const milestones = [25, 50, 75, 100];

  const handler = () => {
    const el = document.documentElement;
    const pct = el.scrollHeight - el.clientHeight;
    if (pct <= 0) return;
    const scrolled = (el.scrollTop / pct) * 100;

    milestones.forEach((m) => {
      if (scrolled >= m && !_scrollMilestones.has(m)) {
        _scrollMilestones.add(m);
        track(`scroll_${m}` as TrackEvent);
      }
    });
  };

  window.addEventListener("scroll", handler, { passive: true });
  return () => {
    window.removeEventListener("scroll", handler);
    _scrollMilestones = new Set<number>();
  };
}
