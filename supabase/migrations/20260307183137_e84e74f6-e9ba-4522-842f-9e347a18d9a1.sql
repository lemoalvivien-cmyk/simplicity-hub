
CREATE TABLE IF NOT EXISTS public.openclaw_job_executions (
  id              uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL,
  job_id          uuid REFERENCES public.openclaw_jobs(id) ON DELETE SET NULL,
  session_id      uuid REFERENCES public.openclaw_sessions(id) ON DELETE SET NULL,
  run_id          uuid REFERENCES public.openclaw_runs(id) ON DELETE SET NULL,
  job_type        text NOT NULL,
  trigger_source  text NOT NULL DEFAULT 'manual',
  status          text NOT NULL DEFAULT 'planifie',
  output_type     text,
  output_count    integer NOT NULL DEFAULT 0,
  output_summary  text,
  recommendations_created  integer NOT NULL DEFAULT 0,
  actions_created          integer NOT NULL DEFAULT 0,
  alerts_created           integer NOT NULL DEFAULT 0,
  trust_updates            integer NOT NULL DEFAULT 0,
  opportunities_rescored   integer NOT NULL DEFAULT 0,
  started_at      timestamp with time zone,
  ended_at        timestamp with time zone,
  duration_ms     integer,
  retry_count     integer NOT NULL DEFAULT 0,
  last_error      text,
  requires_approval boolean NOT NULL DEFAULT false,
  approved_at     timestamp with time zone,
  result_payload  jsonb,
  created_at      timestamp with time zone NOT NULL DEFAULT now(),
  updated_at      timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.openclaw_job_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their job executions"
  ON public.openclaw_job_executions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_job_exec_user_id ON public.openclaw_job_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_job_exec_status ON public.openclaw_job_executions(status);
CREATE INDEX IF NOT EXISTS idx_job_exec_job_type ON public.openclaw_job_executions(job_type);
CREATE INDEX IF NOT EXISTS idx_job_exec_created ON public.openclaw_job_executions(created_at DESC);

CREATE OR REPLACE TRIGGER update_job_executions_updated_at
  BEFORE UPDATE ON public.openclaw_job_executions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'openclaw_runs' AND column_name = 'execution_id'
  ) THEN
    ALTER TABLE public.openclaw_runs ADD COLUMN execution_id uuid REFERENCES public.openclaw_job_executions(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'openclaw_recommendations' AND column_name = 'execution_id'
  ) THEN
    ALTER TABLE public.openclaw_recommendations ADD COLUMN execution_id uuid REFERENCES public.openclaw_job_executions(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.complete_job_execution(
  p_execution_id uuid,
  p_status text,
  p_output_summary text,
  p_output_count integer,
  p_recommendations integer,
  p_actions integer,
  p_alerts integer,
  p_trust_updates integer,
  p_opportunities integer,
  p_error text,
  p_result_payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.openclaw_job_executions SET
    status                  = p_status,
    output_summary          = p_output_summary,
    output_count            = p_output_count,
    recommendations_created = p_recommendations,
    actions_created         = p_actions,
    alerts_created          = p_alerts,
    trust_updates           = p_trust_updates,
    opportunities_rescored  = p_opportunities,
    last_error              = p_error,
    result_payload          = p_result_payload,
    ended_at                = now(),
    duration_ms             = EXTRACT(EPOCH FROM (now() - started_at)) * 1000
  WHERE id = p_execution_id;
END;
$$;
