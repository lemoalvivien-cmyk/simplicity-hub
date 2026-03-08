/**
 * WIINUP MAX — Landing Page Tracking & A/B Infrastructure
 * Clean, lightweight, no external deps required.
 * Integrates with any future analytics provider via the `track()` function.
 */

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
  return picked;
}

export const AB = {
  heroHeadline: () => getVariant("heroHeadline"),
  heroCTA: () => getVariant("heroCTA"),
  pricingFrame: () => getVariant("pricingFrame"),
};

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
  | "scroll_100";

interface TrackPayload {
  label?: string;
  variant?: string;
  position?: string;
}

let _scrollMilestones = new Set<number>();

export function track(event: TrackEvent, payload?: TrackPayload) {
  const variants = {
    heroHeadline: sessionStorage.getItem("ab_heroHeadline") ?? "v1_clients",
    heroCTA: sessionStorage.getItem("ab_heroCTA") ?? "v1_demarrer",
    pricingFrame: sessionStorage.getItem("ab_pricingFrame") ?? "v1_offre",
  };

  const data = {
    event,
    ...payload,
    variants,
    ts: Date.now(),
    path: window.location.pathname,
  };

  // Push to dataLayer (GTM-ready)
  if (typeof window !== "undefined") {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ event: `wiinup_${event}`, ...data });
  }

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
    const scrolled = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;

    milestones.forEach((m) => {
      if (scrolled >= m && !_scrollMilestones.has(m)) {
        _scrollMilestones.add(m);
        track(`scroll_${m}` as TrackEvent);
      }
    });
  };

  window.addEventListener("scroll", handler, { passive: true });
  return () => window.removeEventListener("scroll", handler);
}
