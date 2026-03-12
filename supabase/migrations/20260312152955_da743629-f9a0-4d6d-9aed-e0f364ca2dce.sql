
-- ══════════════════════════════════════════════════════════
-- Security hardening: RLS on billing_events,
-- launch_quota_consumed, and lead_actions
-- ══════════════════════════════════════════════════════════

-- ── 1. billing_events ──────────────────────────────────────
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_events_select" ON public.billing_events;
DROP POLICY IF EXISTS "billing_events_insert" ON public.billing_events;
DROP POLICY IF EXISTS "billing_events_all" ON public.billing_events;
DROP POLICY IF EXISTS "billing_events_admin_select" ON public.billing_events;

-- Admins SELECT only — stripe-webhook uses service_role (bypasses RLS)
CREATE POLICY "billing_events_admin_select"
  ON public.billing_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── 2. launch_quota_consumed ───────────────────────────────
ALTER TABLE public.launch_quota_consumed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "launch_quota_consumed_select" ON public.launch_quota_consumed;
DROP POLICY IF EXISTS "launch_quota_consumed_insert" ON public.launch_quota_consumed;
DROP POLICY IF EXISTS "launch_quota_consumed_all" ON public.launch_quota_consumed;
DROP POLICY IF EXISTS "launch_quota_consumed_admin_select" ON public.launch_quota_consumed;

CREATE POLICY "launch_quota_consumed_admin_select"
  ON public.launch_quota_consumed
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── 3. lead_actions ────────────────────────────────────────
ALTER TABLE public.lead_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lead_actions_select" ON public.lead_actions;
DROP POLICY IF EXISTS "lead_actions_insert" ON public.lead_actions;
DROP POLICY IF EXISTS "lead_actions_update" ON public.lead_actions;
DROP POLICY IF EXISTS "lead_actions_all" ON public.lead_actions;
DROP POLICY IF EXISTS "lead_actions_owner_select" ON public.lead_actions;
DROP POLICY IF EXISTS "lead_actions_owner_insert" ON public.lead_actions;
DROP POLICY IF EXISTS "lead_actions_owner_update" ON public.lead_actions;
DROP POLICY IF EXISTS "lead_actions_admin_select" ON public.lead_actions;

CREATE POLICY "lead_actions_owner_select"
  ON public.lead_actions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = actor_user_id);

CREATE POLICY "lead_actions_owner_insert"
  ON public.lead_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = actor_user_id);

CREATE POLICY "lead_actions_owner_update"
  ON public.lead_actions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = actor_user_id)
  WITH CHECK (auth.uid() = actor_user_id);

CREATE POLICY "lead_actions_admin_select"
  ON public.lead_actions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
