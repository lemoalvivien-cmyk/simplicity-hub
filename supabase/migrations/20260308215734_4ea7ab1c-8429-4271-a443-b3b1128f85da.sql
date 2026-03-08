
-- ============================================================
-- SQUASH CORRECTIF — landing_ab_events + quota replay-safe baseline
--
-- PURPOSE: Guarantee that any clone reaches consistent state regardless
--          of whether prior migrations applied partially.
--
-- WHAT THIS FIXES:
--   1. 20260308213829_d8c2baed posed a CHECK on landing_ab_events WITHOUT
--      first cleaning legacy data. On a dirty DB this would fail.
--   2. That same migration had a false comment about launch_quota_consumed.
--      This squash does NOT recreate that table (ff43d5d4 owns it).
--   3. Guarantees launch_quota has a singleton row so the RPC never returns
--      'no_quota_row' on a fresh deploy.
--
-- IDEMPOTENCY: all statements use IF NOT EXISTS / DO-block guards.
-- ============================================================

-- Step 1: Columns (idempotent — may exist from prior migration)
ALTER TABLE public.landing_ab_events
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS referrer   TEXT;

-- Step 2: Normalize legacy 'variant_assign' typo
UPDATE public.landing_ab_events
   SET event_type = 'variant_assigned'
 WHERE event_type = 'variant_assign';

-- Step 3: Normalize any out-of-enum values to 'pageview' (prevents CHECK failure on dirty base)
UPDATE public.landing_ab_events
   SET event_type = 'pageview'
 WHERE event_type NOT IN (
   'pageview','scroll_50','scroll_80',
   'cta_hero_enterprise','cta_hero_facilitator',
   'cta_pricing_enterprise','cta_pricing_facilitator',
   'cta_final_enterprise','cta_final_facilitator',
   'cta_sticky_mobile','variant_assigned'
 );

-- Step 4: CHECK constraint (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_landing_ab_events_event_type') THEN
    ALTER TABLE public.landing_ab_events
      ADD CONSTRAINT chk_landing_ab_events_event_type
      CHECK (event_type IN (
        'pageview','scroll_50','scroll_80',
        'cta_hero_enterprise','cta_hero_facilitator',
        'cta_pricing_enterprise','cta_pricing_facilitator',
        'cta_final_enterprise','cta_final_facilitator',
        'cta_sticky_mobile','variant_assigned'
      ));
  END IF;
END $$;

-- Step 5: label-length constraint (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_landing_ab_events_label_length') THEN
    ALTER TABLE public.landing_ab_events
      ADD CONSTRAINT chk_landing_ab_events_label_length
      CHECK (event_label IS NULL OR length(event_label) <= 128);
  END IF;
END $$;

-- Step 6: Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_landing_ab_events_ua      ON public.landing_ab_events (user_agent);
CREATE INDEX IF NOT EXISTS idx_landing_ab_events_session ON public.landing_ab_events (session_id);
CREATE INDEX IF NOT EXISTS idx_landing_ab_events_created ON public.landing_ab_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_landing_ab_events_type    ON public.landing_ab_events (event_type);

-- Step 7: Ensure launch_quota singleton row exists (RPC returns 'no_quota_row' otherwise)
INSERT INTO public.launch_quota (total_slots, used_slots)
SELECT 100, 0
WHERE NOT EXISTS (SELECT 1 FROM public.launch_quota);
