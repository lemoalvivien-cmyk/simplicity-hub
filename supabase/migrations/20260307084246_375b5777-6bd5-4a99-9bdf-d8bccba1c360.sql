
-- Fix: restrict the "all" policy to service role only by dropping it (service role bypasses RLS by default)
DROP POLICY IF EXISTS "Service role can manage launch quota" ON public.launch_quota;
