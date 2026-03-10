
-- ============================================================
-- Migration: seed_openclaw_jobs_on_onboarding
-- Seeds OpenClaw job queue when a user completes onboarding.
-- ============================================================

-- ── 1. Seed function ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.seed_openclaw_jobs_for_user(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tomorrow_07 TIMESTAMPTZ := date_trunc('day', now() AT TIME ZONE 'UTC')
                                + interval '1 day' + interval '7 hours';
  v_tomorrow_08 TIMESTAMPTZ := v_tomorrow_07 + interval '1 hour';
  v_tomorrow_09 TIMESTAMPTZ := v_tomorrow_07 + interval '2 hours';
  v_tomorrow_0930 TIMESTAMPTZ := v_tomorrow_07 + interval '2 hours 30 minutes';
  v_tomorrow_10 TIMESTAMPTZ := v_tomorrow_07 + interval '3 hours';
  v_tomorrow_11 TIMESTAMPTZ := v_tomorrow_07 + interval '4 hours';
  v_tomorrow_12 TIMESTAMPTZ := v_tomorrow_07 + interval '5 hours';
  v_in_7_days   TIMESTAMPTZ := now() + interval '7 days';

  -- Resolve user role
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;

  -- ── Shared jobs (all roles) ──────────────────────────────
  INSERT INTO public.openclaw_job_queue (
    user_id, job_type, priority, trigger_source, scheduled_at, max_retries
  ) VALUES
    (p_user_id, 'trust_recompute',      'normale', 'onboarding', v_in_7_days,   3),
    (p_user_id, 'passive_alert_digest', 'normale', 'onboarding', v_tomorrow_12, 3)
  ON CONFLICT DO NOTHING;

  -- ── Entreprise-only jobs ─────────────────────────────────
  IF v_role = 'entreprise' THEN
    INSERT INTO public.openclaw_job_queue (
      user_id, job_type, priority, trigger_source, scheduled_at, max_retries
    ) VALUES
      (p_user_id, 'daily_brief_generate',     'haute',   'onboarding', v_tomorrow_07,   3),
      (p_user_id, 'radar_scan',               'haute',   'onboarding', v_tomorrow_08,   3),
      (p_user_id, 'next_best_action_generate','normale', 'onboarding', v_tomorrow_09,   3),
      (p_user_id, 'hot_opportunity_rescore',  'normale', 'onboarding', v_tomorrow_0930, 3),
      (p_user_id, 'facilitator_match_refresh','normale', 'onboarding', v_tomorrow_10,   3),
      (p_user_id, 'approval_reminder',        'normale', 'onboarding', v_tomorrow_10,   3),
      (p_user_id, 'stuck_pipeline_recheck',   'normale', 'onboarding', v_tomorrow_11,   3)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- ── 2. Trigger function (wrapper calling seed) ───────────────
CREATE OR REPLACE FUNCTION public.trigger_seed_openclaw_jobs_on_onboarding()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when onboarding_done flips from false → true
  IF (OLD.onboarding_done IS DISTINCT FROM NEW.onboarding_done)
     AND NEW.onboarding_done = true
     AND NEW.role IN ('entreprise', 'facilitateur')
  THEN
    PERFORM public.seed_openclaw_jobs_for_user(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- ── 3. Drop + recreate trigger (idempotent) ──────────────────
DROP TRIGGER IF EXISTS seed_openclaw_jobs_after_onboarding ON public.profiles;

CREATE TRIGGER seed_openclaw_jobs_after_onboarding
  AFTER UPDATE OF onboarding_done
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_seed_openclaw_jobs_on_onboarding();

-- ── 4. Unique constraint to make ON CONFLICT work ────────────
-- Only add if it doesn't already exist (safe check via pg_constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'openclaw_job_queue_user_job_pending_uniq'
      AND conrelid = 'public.openclaw_job_queue'::regclass
  ) THEN
    -- Partial unique index: dedup pending jobs per user per job_type
    -- (allows re-queuing after completion)
    CREATE UNIQUE INDEX openclaw_job_queue_user_job_pending_uniq
      ON public.openclaw_job_queue (user_id, job_type)
      WHERE status IN ('pending', 'locked', 'running');
  END IF;
END;
$$;
