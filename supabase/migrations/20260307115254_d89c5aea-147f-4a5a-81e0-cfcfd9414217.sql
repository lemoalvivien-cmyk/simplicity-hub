
-- Fix: Replace overly permissive "Service role can manage companies" policy
-- The companies table is managed by edge functions (via service role key),
-- so regular authenticated users should only INSERT/UPDATE their own records.
-- We drop the ALL policy and replace with scoped ones.

DROP POLICY IF EXISTS "Service role can manage companies" ON public.companies;

-- Allow any authenticated user to insert a new company (deduplicated by name in app logic)
CREATE POLICY "Authenticated users can insert companies"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow any authenticated user to update companies (shared reference table)
CREATE POLICY "Authenticated users can update companies"
  ON public.companies FOR UPDATE
  USING (auth.uid() IS NOT NULL);
