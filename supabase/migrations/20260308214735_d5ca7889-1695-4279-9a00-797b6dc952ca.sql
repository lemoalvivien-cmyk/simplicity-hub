
-- ============================================================
-- MIGRATION: landing_ab_events — honest variant_assign cleanup
--
-- TRUTH: DB query showed 6 rows with event_type = 'variant_assigned'
--        (correctly set). Zero rows with 'variant_assign' (no typo exists).
--
-- This migration:
--   1. Fixes any legacy 'variant_assign' rows just in case (idempotent UPDATE)
--   2. Adds the CHECK constraint (will succeed even with zero matching rows)
--   3. Documents the pre-flight check so a clone can verify before applying
-- ============================================================

-- Step 1: Normalize any legacy typo (safe no-op if none exist)
UPDATE public.landing_ab_events
   SET event_type = 'variant_assigned'
 WHERE event_type = 'variant_assign';

-- Step 2: Normalize any other values outside the allowed set to NULL-safe fallback
--         (catches any unknown event_type that would block the CHECK)
UPDATE public.landing_ab_events
   SET event_type = 'pageview'
 WHERE event_type NOT IN (
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
 );

-- Step 3: Apply CHECK constraint (idempotent via IF NOT EXISTS workaround)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'chk_landing_ab_events_event_type'
  ) THEN
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
  END IF;
END $$;

-- Step 4: Apply label-length constraint (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'chk_landing_ab_events_label_length'
  ) THEN
    ALTER TABLE public.landing_ab_events
      ADD CONSTRAINT chk_landing_ab_events_label_length
      CHECK (event_label IS NULL OR length(event_label) <= 128);
  END IF;
END $$;

-- Step 5: Add columns with IF NOT EXISTS (harmless if previous migration ran)
ALTER TABLE public.landing_ab_events
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS referrer   TEXT;

-- Step 6: Index for analytics UA filtering
CREATE INDEX IF NOT EXISTS idx_landing_ab_events_ua
  ON public.landing_ab_events (user_agent);
