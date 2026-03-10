
-- 1. Add ai_generated column to mission_matches
ALTER TABLE public.mission_matches
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT false;

-- 2. Trigger function: enqueue facilitator_match_refresh after mission insert
CREATE OR REPLACE FUNCTION public.trigger_enqueue_match_on_mission_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.enqueue_job(
    NEW.entreprise_id,
    'facilitator_match_refresh',
    'haute',
    'event',
    'mission_created',
    NEW.id,
    'mission',
    now(),
    3,
    false,
    10
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

-- 3. Drop & recreate trigger idempotently
DROP TRIGGER IF EXISTS auto_enqueue_match_on_mission_insert ON public.missions;

CREATE TRIGGER auto_enqueue_match_on_mission_insert
  AFTER INSERT ON public.missions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_enqueue_match_on_mission_insert();
