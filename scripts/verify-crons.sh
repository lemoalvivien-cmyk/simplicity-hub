#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# verify-crons.sh — Verify pg_cron jobs state in Supabase DB
# PROOF:CRON_VERIFY_V1
#
# Requires: psql + SUPABASE_DB_URL (postgres connection string)
# OR run the SQL directly in Lovable Cloud > Database > SQL Editor
#
# Usage:
#   SUPABASE_DB_URL="postgres://postgres:password@db.xyz.supabase.co:5432/postgres" \
#     bash scripts/verify-crons.sh
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "══════════════════════════════════════════════════════"
echo "  WIINUP MAX — pg_cron Jobs Verification"
echo "══════════════════════════════════════════════════════"
echo ""

SQL_VERIFY="
SELECT
  jobid,
  jobname,
  schedule,
  active,
  CASE
    WHEN jobname = 'openclaw-scheduler-tick' THEN '✅ PROUVÉ PAR EXÉCUTION'
    WHEN jobname IN ('openclaw-daily-sweep','openclaw-weekly-sweep') THEN '⚠️  BRANCHÉ MAIS NON PROUVÉ'
    WHEN jobname IN ('reactivation-daily-scan','payout-generation-daily') THEN '❌ CRÉÉ MAIS NON BRANCHÉ'
    ELSE '❓ INCONNU'
  END AS truth_status
FROM cron.job
WHERE jobname IN (
  'openclaw-scheduler-tick',
  'openclaw-daily-sweep',
  'openclaw-weekly-sweep',
  'reactivation-daily-scan',
  'payout-generation-daily'
)
ORDER BY jobid;
"

SQL_CREATE_REACTIVATION="
-- Create reactivation-daily-scan (idempotent)
-- IMPORTANT: Replace YOUR_PROJECT_REF and YOUR_ANON_KEY before running.
-- These values must NOT be committed to the repo.
--
-- SELECT cron.unschedule('reactivation-daily-scan') FROM cron.job WHERE jobname = 'reactivation-daily-scan';
-- SELECT cron.schedule(
--   'reactivation-daily-scan',
--   '0 3 * * *',
--   \$\$ SELECT public.scan_reactivation_candidates(); \$\$
-- );
"

SQL_CREATE_PAYOUT="
-- Create payout-generation-daily (idempotent)
-- SELECT cron.unschedule('payout-generation-daily') FROM cron.job WHERE jobname = 'payout-generation-daily';
-- SELECT cron.schedule(
--   'payout-generation-daily',
--   '0 4 * * *',
--   \$\$ SELECT public.generate_payouts_from_validated_gains(); \$\$
-- );
"

if [[ -n "${SUPABASE_DB_URL:-}" ]]; then
  echo "Running verification query against DB..."
  psql "$SUPABASE_DB_URL" -c "$SQL_VERIFY"
else
  echo "⚠️  SUPABASE_DB_URL not set. Run the following SQL manually in Lovable Cloud > Database > SQL Editor:"
  echo ""
  echo "────────────────────────────────────"
  echo "$SQL_VERIFY"
  echo "────────────────────────────────────"
  echo ""
  echo "To CREATE reactivation-daily-scan and payout-generation-daily:"
  echo "See: supabase/infra/scheduled-jobs.md"
  echo ""
  echo "NOTE: pg_cron jobs for reactivation + payout are CRÉÉ MAIS NON BRANCHÉ."
  echo "      Manual trigger via UI admin is fully operational in the meantime."
fi

echo ""
echo "Documentation: supabase/infra/scheduled-jobs.md"
echo "Status: see docs/PRODUCTION_READYNESS.md §1.4"
echo ""
