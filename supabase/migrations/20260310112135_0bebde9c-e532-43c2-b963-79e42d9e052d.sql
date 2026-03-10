
-- Drop the recursive admin policy that queries profiles from within profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

-- Replace with a non-recursive admin check using has_role() (SECURITY DEFINER, queries user_roles, not profiles)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR public.has_role(auth.uid(), 'admin')
  );
