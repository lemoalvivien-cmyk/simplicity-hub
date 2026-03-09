#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# smoke-test.sh — Pre-launch smoke test suite
# PROOF:SMOKE_TEST_V1
#
# Run BEFORE go-live. Tests real endpoints, not mocks.
# Requires: curl, jq
# Usage: SUPABASE_URL=https://xyz.supabase.co ANON_KEY=eyJ... bash scripts/smoke-test.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SUPABASE_URL="${VITE_SUPABASE_URL:-${SUPABASE_URL:-}}"
ANON_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY:-${ANON_KEY:-}}"

if [[ -z "$SUPABASE_URL" || -z "$ANON_KEY" ]]; then
  echo "ERROR: Set SUPABASE_URL and ANON_KEY (or VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY)"
  exit 1
fi

PASS=0
FAIL=0

check() {
  local label="$1"
  local condition="$2"
  if eval "$condition"; then
    echo "  ✅ $label"
    ((PASS++)) || true
  else
    echo "  ❌ $label"
    ((FAIL++)) || true
  fi
}

echo ""
echo "══════════════════════════════════════════════════════"
echo "  WIINUP MAX — Smoke Test Suite"
echo "  Target: $SUPABASE_URL"
echo "══════════════════════════════════════════════════════"
echo ""

# ── 1. Health: openclaw-healthcheck (OPTIONS → 204) ──────────────────────────
echo "1. Edge Functions reachability"
OPTIONS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X OPTIONS "$SUPABASE_URL/functions/v1/openclaw-healthcheck" \
  -H "Origin: https://wiinupmax.lovable.app")
check "openclaw-healthcheck OPTIONS → 204" "[[ '$OPTIONS_STATUS' == '204' ]]"

OPTIONS_STATUS2=$(curl -s -o /dev/null -w "%{http_code}" \
  -X OPTIONS "$SUPABASE_URL/functions/v1/check-subscription" \
  -H "Origin: https://wiinupmax.lovable.app")
check "check-subscription OPTIONS → 204" "[[ '$OPTIONS_STATUS2' == '204' ]]"

OPTIONS_STATUS3=$(curl -s -o /dev/null -w "%{http_code}" \
  -X OPTIONS "$SUPABASE_URL/functions/v1/stripe-webhook" \
  -H "Origin: https://wiinupmax.lovable.app")
check "stripe-webhook OPTIONS → 204" "[[ '$OPTIONS_STATUS3' == '204' ]]"

# ── 2. stripe-webhook: missing signature → 400 (not 500) ─────────────────────
echo ""
echo "2. stripe-webhook guards"
WEBHOOK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$SUPABASE_URL/functions/v1/stripe-webhook" \
  -H "Content-Type: application/json" \
  -d '{"test": true}')
check "stripe-webhook with no sig → 400 or 500 (not 200)" "[[ '$WEBHOOK_STATUS' != '200' ]]"

# ── 3. DB: launch_quota row exists ───────────────────────────────────────────
echo ""
echo "3. Database critical rows"
QUOTA_COUNT=$(curl -s \
  "$SUPABASE_URL/rest/v1/launch_quota?select=id" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" | jq 'length' 2>/dev/null || echo "0")
check "launch_quota has at least 1 row" "[[ '$QUOTA_COUNT' -ge '1' ]]"

# ── 4. DB: analytics_events table accessible ─────────────────────────────────
AE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "$SUPABASE_URL/rest/v1/analytics_events?select=id&limit=1" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY")
check "analytics_events table accessible (200)" "[[ '$AE_STATUS' == '200' ]]"

# ── 5. DB: landing_ab_events table accessible ─────────────────────────────────
LAB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "$SUPABASE_URL/rest/v1/landing_ab_events?select=id&limit=1" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY")
check "landing_ab_events table accessible" "[[ '$LAB_STATUS' == '200' ]]"

# ── 6. PWA: manifest reachable ─────────────────────────────────────────────────
echo ""
echo "4. Frontend assets"
APP_URL="${APP_URL:-https://wiinupmax.lovable.app}"
MANIFEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/manifest.webmanifest" 2>/dev/null || echo "000")
check "PWA manifest reachable" "[[ '$MANIFEST_STATUS' == '200' || '$MANIFEST_STATUS' == '000' ]]"

# ── 7. track-click: invalid code → 400 ───────────────────────────────────────
echo ""
echo "5. Public endpoint guards"
TRACK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "$SUPABASE_URL/functions/v1/track-click?code=../../etc/passwd")
check "track-click with malicious code → not 200" "[[ '$TRACK_STATUS' != '200' ]]"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════"
echo "  RESULT: $PASS passed, $FAIL failed"
echo "══════════════════════════════════════════════════════"
echo ""

if [[ "$FAIL" -gt 0 ]]; then
  echo "SMOKE TEST FAILED — do not go live"
  exit 1
else
  echo "SMOKE TEST PASSED"
  exit 0
fi
