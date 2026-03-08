
-- ============================================================
-- MIGRATION: launch_quota singleton enforcement
--
-- PURPOSE:
--   Guarantee exactly one row in launch_quota at all times.
--   Prior squash migration guaranteed AT LEAST one row via INSERT WHERE NOT EXISTS.
--   This migration adds AT MOST one row via a partial unique index.
--
-- STRATEGY:
--   A unique index on a constant expression prevents a second INSERT.
--
-- IDEMPOTENCY: guarded by IF NOT EXISTS.
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_launch_quota_singleton
  ON public.launch_quota ((TRUE));
