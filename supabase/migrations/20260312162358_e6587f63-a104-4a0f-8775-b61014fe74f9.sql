
-- ============================================================
-- RLS HARDENING — Business Tables (corrected)
-- ============================================================

-- ── 1. PROFILES ──────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_no_role_escalation" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- ANTI-ESCALATION: users cannot change their own role field
CREATE POLICY "profiles_update_own_no_role_escalation" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- ── 2. BILLING_EVENTS ────────────────────────────────────────
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "billing_events_select_own" ON public.billing_events;
CREATE POLICY "billing_events_select_own" ON public.billing_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ── 3. LAUNCH_QUOTA_CONSUMED ─────────────────────────────────
ALTER TABLE public.launch_quota_consumed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quota_consumed_admin_select" ON public.launch_quota_consumed;
CREATE POLICY "quota_consumed_admin_select" ON public.launch_quota_consumed
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── 4. LEAD_ACTIONS ──────────────────────────────────────────
ALTER TABLE public.lead_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lead_actions_select_own" ON public.lead_actions;
DROP POLICY IF EXISTS "lead_actions_insert_own" ON public.lead_actions;
DROP POLICY IF EXISTS "lead_actions_update_own" ON public.lead_actions;
CREATE POLICY "lead_actions_select_own" ON public.lead_actions
  FOR SELECT TO authenticated
  USING (actor_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "lead_actions_insert_own" ON public.lead_actions
  FOR INSERT TO authenticated
  WITH CHECK (actor_user_id = auth.uid());
CREATE POLICY "lead_actions_update_own" ON public.lead_actions
  FOR UPDATE TO authenticated
  USING (actor_user_id = auth.uid())
  WITH CHECK (actor_user_id = auth.uid());

-- ── 5. PROMO_CODES — use status column (not is_active) ───────
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promo_codes_select_active" ON public.promo_codes;
DROP POLICY IF EXISTS "promo_codes_admin_insert" ON public.promo_codes;
DROP POLICY IF EXISTS "promo_codes_admin_update" ON public.promo_codes;
CREATE POLICY "promo_codes_select_active" ON public.promo_codes
  FOR SELECT TO authenticated
  USING (
    (status = 'active' AND (disabled_at IS NULL OR disabled_at > now()))
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "promo_codes_admin_insert" ON public.promo_codes
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "promo_codes_admin_update" ON public.promo_codes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── 6. NOTIFICATIONS ─────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── 7. OPENCLAW_CONFIG ───────────────────────────────────────
ALTER TABLE public.openclaw_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "openclaw_config_select_own" ON public.openclaw_config;
DROP POLICY IF EXISTS "openclaw_config_insert_own" ON public.openclaw_config;
DROP POLICY IF EXISTS "openclaw_config_update_own" ON public.openclaw_config;
CREATE POLICY "openclaw_config_select_own" ON public.openclaw_config
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "openclaw_config_insert_own" ON public.openclaw_config
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "openclaw_config_update_own" ON public.openclaw_config
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 8. OPENCLAW_LOGS ─────────────────────────────────────────
ALTER TABLE public.openclaw_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "openclaw_logs_select_own" ON public.openclaw_logs;
CREATE POLICY "openclaw_logs_select_own" ON public.openclaw_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ── 9. OPENCLAW_AGENTS ───────────────────────────────────────
ALTER TABLE public.openclaw_agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "openclaw_agents_select_own" ON public.openclaw_agents;
DROP POLICY IF EXISTS "openclaw_agents_update_own" ON public.openclaw_agents;
CREATE POLICY "openclaw_agents_select_own" ON public.openclaw_agents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "openclaw_agents_update_own" ON public.openclaw_agents
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 10. OPENCLAW_VALIDATIONS ─────────────────────────────────
ALTER TABLE public.openclaw_validations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "openclaw_validations_select_own" ON public.openclaw_validations;
DROP POLICY IF EXISTS "openclaw_validations_update_own" ON public.openclaw_validations;
CREATE POLICY "openclaw_validations_select_own" ON public.openclaw_validations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "openclaw_validations_update_own" ON public.openclaw_validations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 11. OPENCLAW_RECOMMENDATIONS ─────────────────────────────
ALTER TABLE public.openclaw_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "openclaw_recommendations_select_own" ON public.openclaw_recommendations;
DROP POLICY IF EXISTS "openclaw_recommendations_update_own" ON public.openclaw_recommendations;
CREATE POLICY "openclaw_recommendations_select_own" ON public.openclaw_recommendations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "openclaw_recommendations_update_own" ON public.openclaw_recommendations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 12. OPENCLAW_JOB_QUEUE ───────────────────────────────────
ALTER TABLE public.openclaw_job_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "openclaw_job_queue_select_own" ON public.openclaw_job_queue;
CREATE POLICY "openclaw_job_queue_select_own" ON public.openclaw_job_queue
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ── 13. OPENCLAW_DOSSIER ─────────────────────────────────────
ALTER TABLE public.openclaw_dossier ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "openclaw_dossier_select_own" ON public.openclaw_dossier;
DROP POLICY IF EXISTS "openclaw_dossier_insert_own" ON public.openclaw_dossier;
DROP POLICY IF EXISTS "openclaw_dossier_update_own" ON public.openclaw_dossier;
CREATE POLICY "openclaw_dossier_select_own" ON public.openclaw_dossier
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "openclaw_dossier_insert_own" ON public.openclaw_dossier
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "openclaw_dossier_update_own" ON public.openclaw_dossier
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 14. OPENCLAW_CHANNELS ────────────────────────────────────
ALTER TABLE public.openclaw_channels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "openclaw_channels_select_own" ON public.openclaw_channels;
DROP POLICY IF EXISTS "openclaw_channels_update_own" ON public.openclaw_channels;
CREATE POLICY "openclaw_channels_select_own" ON public.openclaw_channels
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "openclaw_channels_update_own" ON public.openclaw_channels
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 15. OPENCLAW_BRIEFS ──────────────────────────────────────
ALTER TABLE public.openclaw_briefs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "openclaw_briefs_select_own" ON public.openclaw_briefs;
CREATE POLICY "openclaw_briefs_select_own" ON public.openclaw_briefs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ── 16. SUBSCRIPTIONS ────────────────────────────────────────
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
