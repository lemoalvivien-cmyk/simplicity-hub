
-- PASSE H: Composite indexes for high-traffic queries
CREATE INDEX IF NOT EXISTS idx_link_events_fac_date ON public.link_events(facilitator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_actions_intake_status ON public.lead_actions(lead_intake_id, status);
CREATE INDEX IF NOT EXISTS idx_gains_fac_statut ON public.gains(facilitateur_id, statut);
CREATE INDEX IF NOT EXISTS idx_lead_intakes_user_qual ON public.lead_intakes(user_id, qualification_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_introductions_fac_statut ON public.introductions(facilitateur_id, statut);

-- PASSE A: Tighten profiles SELECT — prevent cross-user count leak
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
