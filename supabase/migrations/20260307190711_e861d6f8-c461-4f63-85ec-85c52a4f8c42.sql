
-- ══════════════════════════════════════════════════════════════════════════
-- TRUE UNATTENDED MODE + CHANNEL ACTIONS
-- Creates:
--   1. openclaw_channel_actions — real prepared/executed channel actions
--   2. openclaw_scheduled_runs  — traces all recurring cycle executions
-- ══════════════════════════════════════════════════════════════════════════

-- 1. openclaw_channel_actions
CREATE TABLE IF NOT EXISTS public.openclaw_channel_actions (
  id                  UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID        NOT NULL,
  channel             TEXT        NOT NULL,           -- email | whatsapp | telegram | slack | introduction | phone
  action_type         TEXT        NOT NULL,           -- outreach | relance | diffusion | rappel | brief | digest
  job_type            TEXT        NOT NULL,           -- source job (e.g. next_best_action_generate)
  execution_id        UUID        NULL,
  source_run_id       UUID        NULL,
  source_entity_id    UUID        NULL,
  source_entity_type  TEXT        NULL,
  status              TEXT        NOT NULL DEFAULT 'prepared',  -- prepared | pending_approval | approved | sent | failed | cancelled
  trigger_mode        TEXT        NOT NULL DEFAULT 'auto',      -- auto | assisted | manual
  approval_required   BOOLEAN     NOT NULL DEFAULT false,
  approved_at         TIMESTAMPTZ NULL,
  executed_at         TIMESTAMPTZ NULL,
  payload_summary     TEXT        NULL,               -- human-readable content preview
  payload             JSONB       NULL DEFAULT '{}',  -- full structured content
  error_detail        TEXT        NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.openclaw_channel_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their channel actions"
  ON public.openclaw_channel_actions
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_channel_actions_user_status
  ON public.openclaw_channel_actions (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_channel_actions_execution
  ON public.openclaw_channel_actions (execution_id);

-- 2. openclaw_scheduled_runs — trace every cron / scheduled cycle
CREATE TABLE IF NOT EXISTS public.openclaw_scheduled_runs (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        NULL,                    -- null = system-wide sweep
  run_key         TEXT        NOT NULL,               -- scheduler_tick | daily_sweep | weekly_sweep
  trigger_source  TEXT        NOT NULL DEFAULT 'cron', -- cron | manual | event
  status          TEXT        NOT NULL DEFAULT 'running',  -- running | done | failed | skipped
  jobs_enqueued   INTEGER     NOT NULL DEFAULT 0,
  jobs_claimed    INTEGER     NOT NULL DEFAULT 0,
  jobs_completed  INTEGER     NOT NULL DEFAULT 0,
  jobs_failed     INTEGER     NOT NULL DEFAULT 0,
  error_detail    TEXT        NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at        TIMESTAMPTZ NULL,
  duration_ms     INTEGER     NULL,
  next_run_at     TIMESTAMPTZ NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.openclaw_scheduled_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their scheduled runs"
  ON public.openclaw_scheduled_runs
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Service role can insert (cron jobs are service-role invoked)
CREATE POLICY "Service can insert scheduled runs"
  ON public.openclaw_scheduled_runs
  FOR ALL
  USING  (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_scheduled_runs_key_started
  ON public.openclaw_scheduled_runs (run_key, started_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_channel_actions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_channel_actions_updated_at ON public.openclaw_channel_actions;
CREATE TRIGGER trg_channel_actions_updated_at
  BEFORE UPDATE ON public.openclaw_channel_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_channel_actions_updated_at();

-- Enable extensions needed for pg_cron (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
