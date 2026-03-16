
-- SECURITY FINAL v3 - RLS hardening + search_path fix

-- Fix 1: Immutable search_path on trigger functions
CREATE OR REPLACE FUNCTION public.set_insights_key_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix 2: Remove recursive profile lookups on anti_circumvention_flags
DROP POLICY IF EXISTS "Admins can insert flags" ON public.anti_circumvention_flags;
DROP POLICY IF EXISTS "Admins can manage flags" ON public.anti_circumvention_flags;

CREATE POLICY "admins_insert_flags_v3"
  ON public.anti_circumvention_flags
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_manage_flags_v3"
  ON public.anti_circumvention_flags
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix 3: Remove duplicate billing_events admin policies
DROP POLICY IF EXISTS "Admins can view billing events" ON public.billing_events;
DROP POLICY IF EXISTS "billing_events_admin_select" ON public.billing_events;

-- Fix 4: Remove recursive disputes policy
DROP POLICY IF EXISTS "Admins can manage all disputes" ON public.disputes;

CREATE POLICY "admins_manage_disputes_v3"
  ON public.disputes
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
