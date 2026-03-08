
-- ============================================================
-- MIGRATION: launch_quota_consumed + increment_launch_quota_used_slots
-- Purpose: idempotent Stripe launch-slot accounting
-- Proof: this is the SOLE source-of-truth — no prior migration existed
-- ============================================================

-- 1. Table: records every subscription that has consumed a launch slot.
--    The UNIQUE constraint on stripe_subscription_id IS the idempotency key.
CREATE TABLE IF NOT EXISTS public.launch_quota_consumed (
  id                     UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_subscription_id TEXT        NOT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_lqc_sub UNIQUE (stripe_subscription_id)
);

-- Fast idempotency look-up in the webhook
CREATE INDEX IF NOT EXISTS idx_lqc_sub
  ON public.launch_quota_consumed (stripe_subscription_id);

-- RLS: only the service-role key (used by the webhook) may touch this table.
ALTER TABLE public.launch_quota_consumed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only — deny all anon/auth"
  ON public.launch_quota_consumed
  FOR ALL
  USING     (false)
  WITH CHECK(false);

-- 2. Atomic RPC: increments used_slots only when capacity remains.
--    Returns TEXT:
--      'incremented'  — slot consumed, counter updated
--      'at_capacity'  — used_slots >= total_slots, no change
--      'no_quota_row' — launch_quota table is empty (misconfiguration)
--
--    Idempotency is enforced by the caller inserting into launch_quota_consumed
--    BEFORE calling this RPC; a unique-violation on that insert acts as the
--    dedup guard, so this function never needs to worry about double-calls.
CREATE OR REPLACE FUNCTION public.increment_launch_quota_used_slots()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id    UUID;
  v_used  INT;
  v_total INT;
BEGIN
  -- Serialise concurrent webhook deliveries by locking the quota row
  SELECT id, used_slots, total_slots
    INTO v_id, v_used, v_total
    FROM public.launch_quota
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'no_quota_row';
  END IF;

  IF v_used >= v_total THEN
    RETURN 'at_capacity';
  END IF;

  UPDATE public.launch_quota
     SET used_slots = v_used + 1,
         updated_at = now()
   WHERE id = v_id;

  RETURN 'incremented';
END;
$$;

-- Strip execute from public roles — service-role key bypasses this automatically
REVOKE EXECUTE ON FUNCTION public.increment_launch_quota_used_slots() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_launch_quota_used_slots() FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_launch_quota_used_slots() FROM authenticated;
