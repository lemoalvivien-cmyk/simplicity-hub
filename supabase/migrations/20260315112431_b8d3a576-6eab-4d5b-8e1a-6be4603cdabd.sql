
-- ══════════════════════════════════════════════════════════════════════════════
-- FIX 1 — Race condition promo: UNIQUE constraint on (promo_code_id, user_id)
-- SECURITY: Last-mile guard against concurrent double-redemption.
-- Even if two requests pass the application-level checks simultaneously,
-- the DB will reject the second INSERT with error 23505.
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.promo_code_redemptions
  ADD CONSTRAINT promo_code_redemptions_promo_code_id_user_id_key
  UNIQUE (promo_code_id, user_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- FIX 4 — Rename commission_7pct → royalty_12pct in ada_sessions
-- The column was incorrectly named commission_7pct but stores 12% royalty.
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.ada_sessions
  RENAME COLUMN commission_7pct TO royalty_12pct;

-- Same rename in ada_training_samples (mirrors the session structure)
ALTER TABLE public.ada_training_samples
  RENAME COLUMN commission_7pct TO royalty_12pct;
