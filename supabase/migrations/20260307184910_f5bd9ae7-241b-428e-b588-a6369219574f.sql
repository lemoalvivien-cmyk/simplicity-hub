
-- ══════════════════════════════════════════════════════════════════
-- 1. openclaw_job_queue — real priority queue with locking + retries
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.openclaw_job_queue (
  id                uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid        NOT NULL,
  job_type          text        NOT NULL,
  priority          text        NOT NULL DEFAULT 'normale',
  trigger_source    text        NOT NULL DEFAULT 'scheduled',
  source_event      text        NULL,
  source_entity_id  uuid        NULL,
  source_entity_type text       NULL,
  session_id        uuid        NULL,
  run_id            uuid        NULL,
  status            text        NOT NULL DEFAULT 'pending',
  scheduled_at      timestamptz NOT NULL DEFAULT now(),
  locked_at         timestamptz NULL,
  lock_owner        text        NULL,
  started_at        timestamptz NULL,
  ended_at          timestamptz NULL,
  retry_count       int         NOT NULL DEFAULT 0,
  max_retries       int         NOT NULL DEFAULT 3,
  next_retry_at     timestamptz NULL,
  requires_approval boolean     NOT NULL DEFAULT false,
  approved_at       timestamptz NULL,
  error_summary     text        NULL,
  output_summary    text        NULL,
  output_count      int         NOT NULL DEFAULT 0,
  execution_id      uuid        NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.openclaw_job_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their job queue"
  ON public.openclaw_job_queue FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_job_queue_pending
  ON public.openclaw_job_queue (user_id, status, scheduled_at, priority)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_job_queue_locked
  ON public.openclaw_job_queue (lock_owner, locked_at)
  WHERE status = 'locked';

CREATE INDEX IF NOT EXISTS idx_job_queue_retry
  ON public.openclaw_job_queue (next_retry_at)
  WHERE status = 'failed' AND retry_count < max_retries;

CREATE TRIGGER update_openclaw_job_queue_updated_at
  BEFORE UPDATE ON public.openclaw_job_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ══════════════════════════════════════════════════════════════════
-- 2. openclaw_scheduler_heartbeats
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.openclaw_scheduler_heartbeats (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL,
  beat_at         timestamptz NOT NULL DEFAULT now(),
  jobs_claimed    int         NOT NULL DEFAULT 0,
  jobs_completed  int         NOT NULL DEFAULT 0,
  jobs_failed     int         NOT NULL DEFAULT 0,
  jobs_due        int         NOT NULL DEFAULT 0,
  engine_status   text        NOT NULL DEFAULT 'ok',
  note            text        NULL
);

ALTER TABLE public.openclaw_scheduler_heartbeats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their heartbeats"
  ON public.openclaw_scheduler_heartbeats FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_heartbeats_user_beat
  ON public.openclaw_scheduler_heartbeats (user_id, beat_at DESC);

-- ══════════════════════════════════════════════════════════════════
-- 3. enqueue_job helper
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.enqueue_job(
  p_user_id          uuid,
  p_job_type         text,
  p_priority         text        DEFAULT 'normale',
  p_trigger_source   text        DEFAULT 'scheduled',
  p_source_event     text        DEFAULT NULL,
  p_source_entity_id  uuid       DEFAULT NULL,
  p_source_entity_type text      DEFAULT NULL,
  p_scheduled_at     timestamptz DEFAULT now(),
  p_max_retries      int         DEFAULT 3,
  p_requires_approval boolean    DEFAULT false,
  p_dedup_minutes    int         DEFAULT 30
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id uuid;
  v_new_id      uuid;
BEGIN
  IF p_dedup_minutes > 0 THEN
    SELECT id INTO v_existing_id
    FROM public.openclaw_job_queue
    WHERE user_id  = p_user_id
      AND job_type = p_job_type
      AND status   IN ('pending', 'locked', 'running')
      AND created_at >= now() - (p_dedup_minutes || ' minutes')::interval
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      RETURN v_existing_id;
    END IF;
  END IF;

  INSERT INTO public.openclaw_job_queue (
    user_id, job_type, priority, trigger_source,
    source_event, source_entity_id, source_entity_type,
    scheduled_at, max_retries, requires_approval
  ) VALUES (
    p_user_id, p_job_type, p_priority, p_trigger_source,
    p_source_event, p_source_entity_id, p_source_entity_type,
    p_scheduled_at, p_max_retries, p_requires_approval
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- ══════════════════════════════════════════════════════════════════
-- 4. Business event trigger function
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.openclaw_business_event_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    uuid;
  v_entity_id  uuid;
BEGIN
  v_entity_id := NEW.id;

  CASE TG_TABLE_NAME
    WHEN 'missions'      THEN v_user_id := NEW.entreprise_id;
    WHEN 'offers'        THEN v_user_id := NEW.company_id;
    WHEN 'introductions' THEN v_user_id := NEW.facilitateur_id;
    WHEN 'gains'         THEN v_user_id := NEW.facilitateur_id;
    WHEN 'disputes'      THEN v_user_id := NEW.reporter_user_id;
    ELSE v_user_id := NULL;
  END CASE;

  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    CASE TG_TABLE_NAME
      WHEN 'missions' THEN
        PERFORM public.enqueue_job(v_user_id,'radar_scan','haute','event','mission_created',v_entity_id,'mission',now()+interval'5 minutes',3,false,60);
        PERFORM public.enqueue_job(v_user_id,'facilitator_match_refresh','normale','event','mission_created',v_entity_id,'mission',now()+interval'10 minutes',3,false,60);
      WHEN 'offers' THEN
        PERFORM public.enqueue_job(v_user_id,'passive_offer_refresh','normale','event','offer_created',v_entity_id,'offer',now()+interval'5 minutes',3,false,60);
      ELSE NULL;
    END CASE;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    CASE TG_TABLE_NAME
      WHEN 'introductions' THEN
        IF NEW.statut = 'en_attente' AND OLD.statut = 'en_attente' THEN
          PERFORM public.enqueue_job(v_user_id,'stuck_pipeline_recheck','normale','event','introduction_stuck',v_entity_id,'introduction',now()+interval'1 hour',2,false,120);
        END IF;
        IF NEW.statut = 'validee' AND OLD.statut != 'validee' THEN
          PERFORM public.enqueue_job(v_user_id,'hot_opportunity_rescore','haute','event','introduction_validee',v_entity_id,'introduction',now()+interval'2 minutes',3,false,30);
        END IF;
      WHEN 'gains' THEN
        IF NEW.statut IN ('valide','recu') AND OLD.statut NOT IN ('valide','recu') THEN
          PERFORM public.enqueue_job(v_user_id,'trust_recompute','haute','event','gain_confirme',v_entity_id,'gain',now()+interval'1 minute',3,false,30);
        END IF;
      WHEN 'disputes' THEN
        IF NEW.status = 'ouvert' AND (OLD.status IS DISTINCT FROM 'ouvert') THEN
          PERFORM public.enqueue_job(v_user_id,'trust_recompute','critique','event','litige_ouvert',v_entity_id,'dispute',now(),5,false,15);
        END IF;
      ELSE NULL;
    END CASE;
  END IF;

  RETURN NEW;
END;
$$;

-- ══════════════════════════════════════════════════════════════════
-- 5. Attach triggers to business tables
-- ══════════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS trg_openclaw_missions ON public.missions;
CREATE TRIGGER trg_openclaw_missions
  AFTER INSERT OR UPDATE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.openclaw_business_event_trigger();

DROP TRIGGER IF EXISTS trg_openclaw_offers ON public.offers;
CREATE TRIGGER trg_openclaw_offers
  AFTER INSERT OR UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.openclaw_business_event_trigger();

DROP TRIGGER IF EXISTS trg_openclaw_introductions ON public.introductions;
CREATE TRIGGER trg_openclaw_introductions
  AFTER INSERT OR UPDATE ON public.introductions
  FOR EACH ROW EXECUTE FUNCTION public.openclaw_business_event_trigger();

DROP TRIGGER IF EXISTS trg_openclaw_gains ON public.gains;
CREATE TRIGGER trg_openclaw_gains
  AFTER INSERT OR UPDATE ON public.gains
  FOR EACH ROW EXECUTE FUNCTION public.openclaw_business_event_trigger();

DROP TRIGGER IF EXISTS trg_openclaw_disputes ON public.disputes;
CREATE TRIGGER trg_openclaw_disputes
  AFTER INSERT OR UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.openclaw_business_event_trigger();

-- ══════════════════════════════════════════════════════════════════
-- 6. claim_next_job — atomic lock
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.claim_next_job(
  p_user_id       uuid,
  p_lock_owner    text DEFAULT 'scheduler-v1',
  p_lock_timeout  int  DEFAULT 300
)
RETURNS TABLE (
  job_id         uuid,
  job_type       text,
  trigger_source text,
  source_event   text,
  priority       text,
  retry_count    int,
  queue_row      jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- expire stale locks
  UPDATE public.openclaw_job_queue
  SET status='pending', locked_at=NULL, lock_owner=NULL
  WHERE user_id=p_user_id AND status='locked'
    AND locked_at < now()-(p_lock_timeout||' seconds')::interval;

  -- re-queue retryable failures
  UPDATE public.openclaw_job_queue
  SET status='pending', locked_at=NULL, lock_owner=NULL, next_retry_at=NULL
  WHERE user_id=p_user_id AND status='failed'
    AND retry_count < max_retries AND next_retry_at <= now();

  RETURN QUERY
  WITH claimed AS (
    UPDATE public.openclaw_job_queue
    SET status='locked', locked_at=now(), lock_owner=p_lock_owner, started_at=now()
    WHERE id=(
      SELECT id FROM public.openclaw_job_queue
      WHERE user_id=p_user_id AND status='pending' AND scheduled_at<=now()
      ORDER BY
        CASE priority WHEN 'critique' THEN 1 WHEN 'haute' THEN 2 WHEN 'normale' THEN 3 ELSE 4 END,
        scheduled_at ASC
      LIMIT 1 FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  )
  SELECT c.id, c.job_type, c.trigger_source, c.source_event, c.priority, c.retry_count,
         row_to_json(c)::jsonb
  FROM claimed c;
END;
$$;

-- ══════════════════════════════════════════════════════════════════
-- 7. complete_queue_job — atomic finish with exponential backoff
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.complete_queue_job(
  p_job_id              uuid,
  p_status              text,
  p_output_summary      text DEFAULT NULL,
  p_output_count        int  DEFAULT 0,
  p_error_summary       text DEFAULT NULL,
  p_execution_id        uuid DEFAULT NULL,
  p_retry_backoff_mins  int  DEFAULT 15
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_retry int; v_max int;
BEGIN
  SELECT retry_count, max_retries INTO v_retry, v_max
  FROM public.openclaw_job_queue WHERE id=p_job_id;

  IF p_status='failed' AND v_retry < v_max THEN
    UPDATE public.openclaw_job_queue SET
      status='failed', ended_at=now(), error_summary=p_error_summary,
      retry_count=v_retry+1,
      next_retry_at=now()+(p_retry_backoff_mins*power(2,v_retry)||' minutes')::interval,
      lock_owner=NULL, locked_at=NULL, execution_id=p_execution_id, updated_at=now()
    WHERE id=p_job_id;
  ELSE
    UPDATE public.openclaw_job_queue SET
      status=p_status, ended_at=now(), output_summary=p_output_summary,
      output_count=p_output_count, error_summary=p_error_summary,
      lock_owner=NULL, locked_at=NULL, execution_id=p_execution_id, updated_at=now()
    WHERE id=p_job_id;
  END IF;
END;
$$;
