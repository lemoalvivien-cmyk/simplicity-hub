
-- CREATE TYPE doesn't support IF NOT EXISTS in older Postgres — use DO block instead
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role    public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select_own"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE POLICY "payout_batches_admin_select"
  ON public.payout_batches FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "payout_failures_admin_select"
  ON public.payout_failures FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "payout_audit_admin_select"
  ON public.payout_audit_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.admin_forensics_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_result jsonb;
BEGIN
  IF NOT public.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT jsonb_build_object(
    'total_lead_action_events', (SELECT COUNT(*) FROM public.lead_action_events),
    'active_automation_rules',  (SELECT COUNT(*) FROM public.automation_rules WHERE is_enabled = true),
    'lead_intakes_last_24h',    (SELECT COUNT(*) FROM public.lead_intakes WHERE created_at > now() - interval '24 hours'),
    'passive_signals_last_24h', (SELECT COUNT(*) FROM public.lead_source_events WHERE source_type = 'passive_click' AND created_at > now() - interval '24 hours'),
    'jobs_completed_last_24h',  (SELECT COUNT(*) FROM public.openclaw_job_queue WHERE status = 'done' AND ended_at > now() - interval '24 hours'),
    'jobs_failed_last_24h',     (SELECT COUNT(*) FROM public.openclaw_job_queue WHERE status = 'failed' AND ended_at > now() - interval '24 hours'),
    'channel_actions_last_24h', (SELECT COUNT(*) FROM public.openclaw_channel_actions WHERE created_at > now() - interval '24 hours'),
    'generated_at',             now()
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_forensics_summary() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_forensics_summary() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_forensics_summary() TO service_role;
