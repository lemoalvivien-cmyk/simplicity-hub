
-- ================================================================
-- OPENCLAW CRON DIAGNOSTIC VIEW
-- Vue de diagnostic reproductible pour les cron jobs OpenClaw.
-- Statuts: recently_active / active / seen_today /
--          configured_not_seen_recently / configured_never_run
-- ================================================================

CREATE OR REPLACE VIEW public.openclaw_cron_status AS
WITH cron_runs AS (
  SELECT
    run_key,
    COUNT(*) FILTER (WHERE trigger_source = 'cron' AND status = 'done')    AS real_cron_runs,
    COUNT(*) FILTER (WHERE status = 'done')                                AS total_successful,
    COUNT(*) FILTER (WHERE status = 'failed')                              AS total_failed,
    COUNT(*)                                                               AS total_runs,
    MAX(started_at) FILTER (WHERE trigger_source = 'cron' AND status = 'done') AS last_cron_run_at,
    MAX(started_at) FILTER (WHERE trigger_source = 'cron')                 AS last_cron_attempt_at,
    MAX(next_run_at) FILTER (WHERE trigger_source = 'cron')                AS next_run_at,
    AVG(duration_ms) FILTER (WHERE status = 'done')                        AS avg_duration_ms,
    SUM(jobs_completed)                                                    AS total_jobs_completed
  FROM public.openclaw_scheduled_runs
  GROUP BY run_key
)
SELECT
  run_key,
  real_cron_runs,
  total_successful,
  total_failed,
  total_runs,
  last_cron_run_at,
  last_cron_attempt_at,
  next_run_at,
  avg_duration_ms,
  total_jobs_completed,
  CASE
    WHEN real_cron_runs = 0                                           THEN 'configured_never_run'
    WHEN last_cron_run_at > NOW() - INTERVAL '10 minutes'             THEN 'recently_active'
    WHEN last_cron_run_at > NOW() - INTERVAL '1 hour'                 THEN 'active'
    WHEN last_cron_run_at > NOW() - INTERVAL '24 hours'               THEN 'seen_today'
    ELSE                                                                   'configured_not_seen_recently'
  END AS observed_status
FROM cron_runs

UNION ALL

SELECT
  known.run_key,
  0, 0, 0, 0,
  NULL::timestamptz,
  NULL::timestamptz,
  NULL::timestamptz,
  NULL::numeric,
  0,
  'configured_never_run'
FROM (VALUES ('scheduler_tick'), ('daily_sweep'), ('weekly_sweep')) AS known(run_key)
WHERE known.run_key NOT IN (SELECT run_key FROM public.openclaw_scheduled_runs WHERE trigger_source = 'cron');

COMMENT ON VIEW public.openclaw_cron_status IS
'Vue diagnostique des cron jobs OpenClaw. Statuts: recently_active (< 10min) | active (< 1h) | seen_today (< 24h) | configured_not_seen_recently | configured_never_run. Ne lit que openclaw_scheduled_runs. Définition des jobs pg_cron: supabase/infra/cron-jobs.md';
