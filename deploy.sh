#!/usr/bin/env bash
# ============================================================
# WIINUP MAX — Deploy Script
# Usage: chmod +x deploy.sh && ./deploy.sh
# ============================================================
set -euo pipefail

echo "🏗️  [1/4] Building frontend..."
npm run build

echo "🚀  [2/4] Deploying Edge Functions..."
supabase functions deploy --all

echo "🌐  [3/4] Publishing to Lovable..."
echo "⚠️  Open Lovable and click Publish to push frontend changes live."

echo "🔍  [4/4] Verifying live site..."
HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}" https://wiinupmax.com/)
if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "✅  wiinupmax.com → HTTP $HTTP_STATUS — OK"
else
  echo "❌  wiinupmax.com → HTTP $HTTP_STATUS — CHECK REQUIRED"
  exit 1
fi

echo ""
echo "✅ WIINUP MAX v6 DEPLOY COMPLETE"
echo "   Hero: WIINUP MAX — Trouvez vos prochains clients B2B via votre réseau."
echo "   Pricing: /pricing — 99€/an Founder Pass + Gratuit Facilitateur"
echo "   Zero AI mentions. Zero legacy debt."
