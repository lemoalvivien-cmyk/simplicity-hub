
-- SPRINT 2: Fix SECURITY DEFINER view — convert to SECURITY INVOKER
-- This ensures the view respects the RLS of the querying user, not the creator.
CREATE OR REPLACE VIEW public.openclaw_cron_status
WITH (security_invoker = true)
AS
WITH cron_runs AS (
  SELECT
    openclaw_scheduled_runs.run_key,
    count(*) FILTER (WHERE (openclaw_scheduled_runs.trigger_source = 'cron' AND openclaw_scheduled_runs.status = 'done')) AS real_cron_runs,
    count(*) FILTER (WHERE openclaw_scheduled_runs.status = 'done') AS total_successful,
    count(*) FILTER (WHERE openclaw_scheduled_runs.status = 'failed') AS total_failed,
    count(*) AS total_runs,
    max(openclaw_scheduled_runs.started_at) FILTER (WHERE openclaw_scheduled_runs.trigger_source = 'cron' AND openclaw_scheduled_runs.status = 'done') AS last_cron_run_at,
    max(openclaw_scheduled_runs.started_at) FILTER (WHERE openclaw_scheduled_runs.trigger_source = 'cron') AS last_cron_attempt_at,
    max(openclaw_scheduled_runs.next_run_at) FILTER (WHERE openclaw_scheduled_runs.trigger_source = 'cron') AS next_run_at,
    avg(openclaw_scheduled_runs.duration_ms) FILTER (WHERE openclaw_scheduled_runs.status = 'done') AS avg_duration_ms,
    sum(openclaw_scheduled_runs.jobs_completed) AS total_jobs_completed
  FROM public.openclaw_scheduled_runs
  GROUP BY openclaw_scheduled_runs.run_key
)
SELECT
  cron_runs.run_key,
  cron_runs.real_cron_runs,
  cron_runs.total_successful,
  cron_runs.total_failed,
  cron_runs.total_runs,
  cron_runs.last_cron_run_at,
  cron_runs.last_cron_attempt_at,
  cron_runs.next_run_at,
  cron_runs.avg_duration_ms,
  cron_runs.total_jobs_completed,
  CASE
    WHEN cron_runs.real_cron_runs = 0 THEN 'configured_never_run'
    WHEN cron_runs.last_cron_run_at > (now() - interval '10 minutes') THEN 'recently_active'
    WHEN cron_runs.last_cron_run_at > (now() - interval '1 hour') THEN 'active'
    WHEN cron_runs.last_cron_run_at > (now() - interval '24 hours') THEN 'seen_today'
    ELSE 'configured_not_seen_recently'
  END AS observed_status
FROM cron_runs
UNION ALL
SELECT
  known.run_key,
  0 AS real_cron_runs,
  0 AS total_successful,
  0 AS total_failed,
  0 AS total_runs,
  NULL::timestamptz AS last_cron_run_at,
  NULL::timestamptz AS last_cron_attempt_at,
  NULL::timestamptz AS next_run_at,
  NULL::numeric AS avg_duration_ms,
  0 AS total_jobs_completed,
  'configured_never_run' AS observed_status
FROM (VALUES ('scheduler_tick'::text), ('daily_sweep'::text), ('weekly_sweep'::text)) AS known(run_key)
WHERE NOT (known.run_key IN (
  SELECT openclaw_scheduled_runs.run_key
  FROM public.openclaw_scheduled_runs
  WHERE openclaw_scheduled_runs.trigger_source = 'cron'
));
