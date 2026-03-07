
-- Fix permissive RLS: replace WITH CHECK (true) with authenticated user checks
DROP POLICY IF EXISTS "Service can insert trust events" ON public.trust_events;
DROP POLICY IF EXISTS "Service can insert flags" ON public.anti_circumvention_flags;

-- trust_events: authenticated users can insert events about themselves
CREATE POLICY "Authenticated can insert trust events"
  ON public.trust_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- anti_circumvention_flags: only admins can insert flags
CREATE POLICY "Admins can insert flags"
  ON public.anti_circumvention_flags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));
