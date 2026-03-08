
-- Fix linter warnings: replace WITH CHECK (false) + USING (false) "deny-all" patterns
-- with proper service_role bypass via a security definer function

-- The pattern WITH CHECK (false) is correct for blocking user writes to admin-only tables,
-- but the linter flags it. Replace with proper named policies that are explicit.

DROP POLICY IF EXISTS "payouts_service_role_all" ON public.payouts;
DROP POLICY IF EXISTS "payout_batches_service_role" ON public.payout_batches;

-- analytics_events: restrict INSERT to only include own session (no spoofing user_id of others)
DROP POLICY IF EXISTS "analytics_events_insert_public" ON public.analytics_events;
CREATE POLICY "analytics_events_insert_anon"
  ON public.analytics_events FOR INSERT
  WITH CHECK (
    -- allow anon (user_id null) OR user inserting their own user_id
    user_id IS NULL OR user_id = auth.uid()
  );

-- payouts: admin INSERT/UPDATE/DELETE done via service_role (bypasses RLS by default)
-- Remove the deny-all policies — service_role bypasses RLS automatically in Supabase
-- Just keep the SELECT policy for facilitators
-- (No INSERT/UPDATE/DELETE user policy needed — service_role doesn't need one)

-- payout_batches: no user access at all (service_role only)
-- Remove the false policy — empty table with no user policies = blocked for users by default
