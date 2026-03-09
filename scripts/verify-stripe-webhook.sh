#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# verify-stripe-webhook.sh — Gap 3 Manual Test Procedure
# PROOF:STRIPE_GAP3_MANUAL
#
# Requires: stripe CLI, STRIPE_WEBHOOK_SECRET configured in Lovable Cloud Secrets
# This script CANNOT be automated from within Lovable — run it externally.
#
# Usage:
#   bash scripts/verify-stripe-webhook.sh
# ─────────────────────────────────────────────────────────────────────────────

WEBHOOK_URL="https://usnriklfiagazpffsqew.supabase.co/functions/v1/stripe-webhook"

echo ""
echo "══════════════════════════════════════════════════════"
echo "  WIINUP MAX — Stripe Webhook Verification (Gap 3)"
echo "══════════════════════════════════════════════════════"
echo ""
echo "PREREQUISITES:"
echo "  1. stripe CLI installed: brew install stripe/stripe-cli/stripe"
echo "  2. stripe CLI logged in: stripe login"
echo "  3. STRIPE_WEBHOOK_SECRET configured in Lovable Cloud > Secrets"
echo ""
echo "STEP 1 — Start webhook relay (run in Terminal A):"
echo "  stripe listen --forward-to $WEBHOOK_URL"
echo ""
echo "STEP 2 — Trigger test event (run in Terminal B):"
echo "  stripe trigger checkout.session.completed"
echo ""
echo "EXPECTED LOGS (in Supabase Edge Function logs):"
echo "  [STRIPE-WEBHOOK] Webhook received"
echo "  [STRIPE-WEBHOOK] Event verified — { type: 'checkout.session.completed', id: 'evt_...' }"
echo "  [STRIPE-WEBHOOK] Quota consume result — { consumeResult: 'incremented' | 'skipped_not_launch' }"
echo ""
echo "FAILURE INDICATORS:"
echo "  'Webhook secret not configured' → STRIPE_WEBHOOK_SECRET not set"
echo "  'No signatures found' → signature header missing"
echo "  HTTP 400 → signature verification failed (wrong secret)"
echo ""
echo "AFTER VERIFICATION:"
echo "  Update docs/PRODUCTION_READYNESS.md Gap 3 status from BRANCHÉ MAIS NON PROUVÉ to PROUVÉ PAR EXÉCUTION"
echo ""
echo "STATUS: GAP 3 — BRANCHÉ MAIS NON PROUVÉ (STRIPE_WEBHOOK_SECRET absent from secrets)"
echo ""
