
-- launch_quota_consumed + increment RPC already ran in previous migration
-- This migration adds only the landing_ab_events hardening

ALTER TABLE public.landing_ab_events
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS referrer   TEXT;

-- All existing rows now have event_type = 'variant_assigned'
ALTER TABLE public.landing_ab_events
  ADD CONSTRAINT chk_landing_ab_events_event_type
  CHECK (event_type IN (
    'pageview',
    'scroll_50',
    'scroll_80',
    'cta_hero_enterprise',
    'cta_hero_facilitator',
    'cta_pricing_enterprise',
    'cta_pricing_facilitator',
    'cta_final_enterprise',
    'cta_final_facilitator',
    'cta_sticky_mobile',
    'variant_assigned'
  ));

ALTER TABLE public.landing_ab_events
  ADD CONSTRAINT chk_landing_ab_events_label_length
  CHECK (event_label IS NULL OR length(event_label) <= 128);

CREATE INDEX IF NOT EXISTS idx_landing_ab_events_ua ON public.landing_ab_events (user_agent);
