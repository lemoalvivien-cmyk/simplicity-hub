
-- Fix overly-permissive RLS on openclaw_scheduled_runs
-- Service-role bypasses RLS entirely; authenticated users only need SELECT.
DROP POLICY IF EXISTS "Service can insert scheduled runs" ON public.openclaw_scheduled_runs;

-- Users see their own runs + system-wide runs (user_id IS NULL)
-- Inserts are done server-side (service_role bypasses RLS), no explicit INSERT policy needed for users.
CREATE POLICY "Authenticated can view scheduled runs"
  ON public.openclaw_scheduled_runs
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);
