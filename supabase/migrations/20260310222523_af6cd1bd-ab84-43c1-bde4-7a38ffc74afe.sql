
-- ══════════════════════════════════════════════════════════════
-- Migration: auto_enqueue_nba_on_lead_intake
-- After each new lead_intake, enqueue a next_best_action_generate
-- job into openclaw_job_queue so the job executor picks it up.
-- Uses ON CONFLICT / dedup logic from the queue's partial index.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.trigger_enqueue_nba_on_lead_intake()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip confirmed duplicates — no point running NBA on them
  IF NEW.dedup_status = 'confirmed_duplicate' THEN
    RETURN NEW;
  END IF;

  -- Enqueue a next_best_action_generate job, fire immediately
  PERFORM public.enqueue_job(
    NEW.user_id,                         -- p_user_id
    'next_best_action_generate',         -- p_job_type
    'haute',                             -- p_priority
    'lead_intake',                       -- p_trigger_source
    'lead_intake_created',               -- p_source_event
    NEW.id,                              -- p_source_entity_id
    'lead_intake',                       -- p_source_entity_type
    now(),                               -- p_scheduled_at  (immediate)
    3,                                   -- p_max_retries
    false,                               -- p_requires_approval
    5                                    -- p_dedup_minutes (short window, not 30)
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block the insert if job enqueue fails
  RETURN NEW;
END;
$$;

-- Drop & recreate idempotently
DROP TRIGGER IF EXISTS auto_enqueue_nba_on_lead_intake ON public.lead_intakes;

CREATE TRIGGER auto_enqueue_nba_on_lead_intake
  AFTER INSERT ON public.lead_intakes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_enqueue_nba_on_lead_intake();
