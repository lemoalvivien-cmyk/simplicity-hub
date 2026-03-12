
-- Fix overly permissive api_rate_limits policy
-- Service role bypasses RLS by default, so we remove the ALL policy
-- and replace with targeted INSERT + UPDATE for service_role usage via SECURITY DEFINER functions only
DROP POLICY IF EXISTS "Service role manages rate limits" ON public.api_rate_limits;

-- Only the DB function check_rate_limit (SECURITY DEFINER) will write; 
-- no client-side INSERT/UPDATE needed
-- We add a cleanup policy scoped to admin only
CREATE POLICY "Admin manages rate limits"
  ON public.api_rate_limits FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
