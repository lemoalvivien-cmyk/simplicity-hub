
-- ============================================================
-- SECURITY HARDENING MIGRATION — ROUND 2b
-- (billing_proof_chain is a VIEW — RLS not applicable, 
--  security is inherited from billing_events table policies)
-- ============================================================

-- ── 1. Profiles — prevent self-role-escalation ───────────────────────────────
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- ── 2. trust_scores — read-only for users, full access for service_role ───────
DROP POLICY IF EXISTS "Users can manage their trust score" ON public.trust_scores;

CREATE POLICY "Users can read own trust score"
  ON public.trust_scores
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages trust scores" ON public.trust_scores;
CREATE POLICY "Service role manages trust scores"
  ON public.trust_scores
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read all trust scores" ON public.trust_scores;
CREATE POLICY "Admins can read all trust scores"
  ON public.trust_scores
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── 3. trust_events — remove user INSERT, service_role only ──────────────────
DROP POLICY IF EXISTS "Users can insert own trust events" ON public.trust_events;
-- Service role full access already exists from migration 1

-- ── 4. openclaw_scheduled_runs — remove NULL user_id leakage ─────────────────
DROP POLICY IF EXISTS "Authenticated can view scheduled runs" ON public.openclaw_scheduled_runs;
DROP POLICY IF EXISTS "Users can view their scheduled runs" ON public.openclaw_scheduled_runs;

CREATE POLICY "Users can view own scheduled runs"
  ON public.openclaw_scheduled_runs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages scheduled runs" ON public.openclaw_scheduled_runs;
CREATE POLICY "Service role manages scheduled runs"
  ON public.openclaw_scheduled_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
