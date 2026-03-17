-- PALANTIR CERT — Critical: Block admin self-assignment on profiles INSERT
-- The INSERT policy allows any user to set their own role including 'admin'.
-- Fix: enforce role = 'facilitateur' as the only allowed default on self-insert.
-- Also: restrict facilitateur_profiles SELECT to authenticated users only (hide stripe_connect_account_id from anon).

-- 1. Drop existing INSERT policies on profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

-- 2. Re-create with explicit role restriction (only 'facilitateur' or 'entreprise' allowed on self-insert)
-- Admins are created via service_role (Edge Functions/triggers), never by client INSERT
CREATE POLICY "profiles_insert_own_safe"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND role IN ('facilitateur', 'entreprise')
  );

-- 3. Fix facilitateur_profiles: restrict to authenticated users only (not public/anon)
DROP POLICY IF EXISTS "Public view active facilitateur profiles" ON public.facilitateur_profiles;

-- Re-create for authenticated users only (hides stripe_connect_account_id from crawlers/anon)
CREATE POLICY "Authenticated view active facilitateur profiles"
  ON public.facilitateur_profiles
  FOR SELECT
  TO authenticated
  USING ( statut = 'actif' );