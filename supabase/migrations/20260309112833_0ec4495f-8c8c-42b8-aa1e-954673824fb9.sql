
-- Fix security_definer_view: drop view and recreate without SECURITY DEFINER
-- (views in PostgreSQL don't have SECURITY DEFINER by default, but Supabase
-- linter flags views that reference tables with RLS without invoker context)
-- Solution: drop view, use RPC functions only for admin access (already created)

DROP VIEW IF EXISTS public.billing_proof_chain;

-- Fix permissive INSERT/UPDATE policies on billing_events:
-- Only service_role (webhook) should write. We enforce this via service_role key
-- usage in the edge function (stripe-webhook uses service_role). 
-- Replace WITH CHECK (true) with a restrictive pattern that still allows service role.
-- Note: service_role bypasses RLS entirely, so these policies only apply to non-service-role callers.
-- Safe to keep as is for INSERT/UPDATE since only service_role edge fn writes to billing_events.
-- However, to satisfy linter, we scope to authenticated users with admin role only for all DML.

DROP POLICY IF EXISTS "Service role can insert billing_events" ON public.billing_events;
DROP POLICY IF EXISTS "Service role can update billing_events" ON public.billing_events;

-- No explicit INSERT/UPDATE policy needed: service_role bypasses RLS.
-- This means only service_role can insert/update — which is correct and secure.
-- Admin can read via RPC (SECURITY DEFINER) or directly via SELECT policy.
