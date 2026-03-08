/**
 * WIINUP MAX — Landing Page Tracking & A/B Infrastructure
 * Events are persisted to `landing_ab_events` (Supabase) for real conversion analysis.
 * Also pushes to dataLayer for GTM integration.
 */

import { supabase } from "@/integrations/supabase/client";

// ─── Session ID (anonymous, persistent per browser tab) ──────────────────────

function getSessionId(): string {
  let sid = sessionStorage.getItem("landing_sid");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("landing_sid", sid);
  }
  return sid;
}

// ─── A/B Variant System ─────────────────────────────────────────────────────

const AB_VARIANTS = {
  heroHeadline: ["v1_clients", "v2_cockpit"] as const,
  heroCTA: ["v1_demarrer", "v2_activer"] as const,
  pricingFrame: ["v1_offre", "v2_investissement"] as const,
};

type VariantKey = keyof typeof AB_VARIANTS;
type VariantValue<K extends VariantKey> = typeof AB_VARIANTS[K][number];

function getVariant<K extends VariantKey>(key: K): VariantValue<K> {
  const stored = sessionStorage.getItem(`ab_${key}`);
  if (stored) return stored as VariantValue<K>;
  const options = AB_VARIANTS[key];
  const picked = options[Math.floor(Math.random() * options.length)];
  sessionStorage.setItem(`ab_${key}`, picked);
  // Persist variant assignment to DB (fire and forget)
  persistEvent("variant_assign", { label: key, variant: picked });
  return picked;
}

export const AB = {
  heroHeadline: () => getVariant("heroHeadline"),
  heroCTA: () => getVariant("heroCTA"),
  pricingFrame: () => getVariant("pricingFrame"),
};

// ─── Current Variants Snapshot ───────────────────────────────────────────────

function getCurrentVariants() {
  return {
    heroHeadline: sessionStorage.getItem("ab_heroHeadline") ?? "v1_clients",
    heroCTA: sessionStorage.getItem("ab_heroCTA") ?? "v1_demarrer",
    pricingFrame: sessionStorage.getItem("ab_pricingFrame") ?? "v1_offre",
  };
}

// ─── Event Tracking ──────────────────────────────────────────────────────────

export type TrackEvent =
  | "cta_hero_enterprise"
  | "cta_hero_facilitator"
  | "cta_sticky_mobile"
  | "cta_pricing_enterprise"
  | "cta_pricing_facilitator"
  | "cta_final_enterprise"
  | "cta_final_facilitator"
  | "cta_howitworks"
  | "cta_facilitateur_section"
  | "faq_open"
  | "objection_open"
  | "scroll_25"
  | "scroll_50"
  | "scroll_75"
  | "scroll_100"
  | "variant_assign";

export interface TrackPayload {
  label?: string;
  variant?: string;
  position?: string;
}

// ─── Supabase Persistence (fire & forget, never blocks UI) ───────────────────

function persistEvent(event: string, payload?: TrackPayload) {
  const variants = getCurrentVariants();
  const sid = getSessionId();

  supabase
    .from("landing_ab_events")
    .insert([{
      session_id: sid,
      event_type: event,
      hero_headline_variant: variants.heroHeadline,
      hero_cta_variant: variants.heroCTA,
      pricing_frame_variant: variants.pricingFrame,
      event_label: payload?.label ?? null,
      event_payload: (payload as Record<string, unknown>) ?? {},
      path: typeof window !== "undefined" ? window.location.pathname : "/",
    }])
    .then(() => {
      // silent — never throw
    });
}

// ─── Public Track Function ───────────────────────────────────────────────────

let _scrollMilestones = new Set<number>();

export function track(event: TrackEvent, payload?: TrackPayload) {
  const variants = getCurrentVariants();

  const data = {
    event,
    ...payload,
    variants,
    ts: Date.now(),
    path: typeof window !== "undefined" ? window.location.pathname : "/",
  };

  // Push to dataLayer (GTM-ready)
  if (typeof window !== "undefined") {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ event: `wiinup_${event}`, ...data });
  }

  // Persist to DB
  persistEvent(event, payload);

  // Console in dev
  if (import.meta.env.DEV) {
    console.info(`[track] ${event}`, data);
  }
}

// ─── Scroll Depth Tracker ────────────────────────────────────────────────────

export function initScrollTracking() {
  if (typeof window === "undefined") return;

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
