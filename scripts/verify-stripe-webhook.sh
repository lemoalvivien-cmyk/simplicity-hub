#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# verify-stripe-webhook.sh — Runbook de preuve E2E Stripe Webhook
# PROOF:BILLING_PROOF_CHAIN_V1:webhook_verification_runbook
#
# CE SCRIPT PROUVE / NE PROUVE PAS:
#   CODE_READY     : edge fn stripe-webhook déployée, signature verification présente dans le code
#   EXTERNAL_CONFIG: STRIPE_WEBHOOK_SECRET doit être configuré dans Cloud Secrets (non vérifiable ici)
#   E2E_NOT_PROVEN : aucun checkout réel exercé depuis un navigateur ou Stripe CLI
#   E2E_PROVEN     : uniquement après exécution de ce runbook avec succès ET vérification DB
#
# PRÉREQUIS:
#   1. stripe CLI installé : brew install stripe/stripe-cli/stripe (ou https://stripe.com/docs/stripe-cli)
#   2. stripe CLI authentifié : stripe login
#   3. STRIPE_WEBHOOK_SECRET configuré dans Cloud Secrets (Lovable Cloud → Secrets)
#      → Valeur à copier depuis : stripe listen --print-secret
#   4. curl + jq installés
#   5. SUPABASE_URL et SUPABASE_SERVICE_KEY disponibles (optionnel pour vérification DB)
#
# VARIABLES REQUISES:
#   - STRIPE_WEBHOOK_ENDPOINT : URL de votre webhook déployé (défaut ci-dessous)
#   - SUPABASE_URL            : (optionnel) pour vérifier la mutation DB
#   - SUPABASE_SERVICE_KEY    : (optionnel) service role key pour lire billing_events
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────────────
WEBHOOK_ENDPOINT="${STRIPE_WEBHOOK_ENDPOINT:-https://usnriklfiagazpffsqew.supabase.co/functions/v1/stripe-webhook}"
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-}"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  WIINUP MAX — Stripe Webhook E2E Verification Runbook"
echo "  PROOF:BILLING_PROOF_CHAIN_V1"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ── ÉTAPE 0 : Vérification des prérequis ──────────────────────────────────────
echo "ÉTAPE 0 — Vérification des prérequis"
echo ""

if ! command -v stripe &>/dev/null; then
  echo "  ✗ stripe CLI non installé"
  echo "    → brew install stripe/stripe-cli/stripe"
  echo "    → ou https://stripe.com/docs/stripe-cli"
  echo ""
  echo "CLASSIFICATION: E2E_NOT_PROVEN (prérequis manquant)"
  exit 1
fi
echo "  ✓ stripe CLI disponible : $(stripe version)"

if ! command -v curl &>/dev/null; then
  echo "  ✗ curl non disponible"
  exit 1
fi
echo "  ✓ curl disponible"

echo ""
echo "  Endpoint webhook cible : $WEBHOOK_ENDPOINT"
echo ""

# ── ÉTAPE 1 : Test de rejet — signature absente → 400 ─────────────────────────
# CE QUE ÇA PROUVE : l'edge fn est déployée et rejette les webhooks non signés
# CE QUE ÇA NE PROUVE PAS : que STRIPE_WEBHOOK_SECRET est correctement configuré
echo "ÉTAPE 1 — Test rejet signature absente"
echo ""
echo "  Envoi d'un POST sans stripe-signature..."
REJECT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$WEBHOOK_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"type":"test","data":{"object":{}}}')

if [[ "$REJECT_STATUS" == "400" ]]; then
  echo "  ✓ HTTP $REJECT_STATUS — Edge fn déployée, rejette bien les payloads non signés"
  echo "  PROOF: CODE_READY"
elif [[ "$REJECT_STATUS" == "500" ]]; then
  echo "  ⚠ HTTP $REJECT_STATUS — Edge fn déployée MAIS STRIPE_WEBHOOK_SECRET manquant dans Cloud Secrets"
  echo "  ACTION REQUISE: Configurer STRIPE_WEBHOOK_SECRET dans Cloud Secrets"
  echo "    1. Exécuter localement: stripe listen --print-secret"
  echo "    2. Copier le secret whsec_..."
  echo "    3. Lovable Cloud → Secrets → Ajouter STRIPE_WEBHOOK_SECRET"
  echo ""
  echo "CLASSIFICATION: EXTERNAL_CONFIG_REQUIRED"
  exit 1
elif [[ "$REJECT_STATUS" == "000" ]]; then
  echo "  ✗ Connexion impossible ($REJECT_STATUS) — endpoint inaccessible"
  echo "  Vérifier que l'edge fn est déployée et que l'URL est correcte"
  echo ""
  echo "CLASSIFICATION: E2E_NOT_PROVEN (endpoint inaccessible)"
  exit 1
else
  echo "  ⚠ HTTP $REJECT_STATUS — résultat inattendu, vérifier les logs edge fn"
fi

echo ""

# ── ÉTAPE 2 : Relay Stripe CLI — vrai webhook signé ───────────────────────────
# CE QUE ÇA PROUVE : que le webhook est reçu, vérifié et traité avec un vrai secret
# CE QUE ÇA NE PROUVE PAS : que la mutation DB (subscription sync, quota) fonctionne
echo "ÉTAPE 2 — Test relay webhook Stripe CLI (signé)"
echo ""
echo "  ┌─ TERMINAL A : Démarrer le relay (laisser ouvert) ─────────────┐"
echo "  │  stripe listen --forward-to $WEBHOOK_ENDPOINT                 │"
echo "  └───────────────────────────────────────────────────────────────┘"
echo ""
echo "  ┌─ TERMINAL B : Déclencher un événement test ────────────────────┐"
echo "  │  stripe trigger checkout.session.completed                     │"
echo "  └───────────────────────────────────────────────────────────────┘"
echo ""
echo "  LOGS ATTENDUS dans les Edge Function logs (Lovable Cloud → Logs) :"
echo "  [STRIPE-WEBHOOK] Webhook received"
echo "  [STRIPE-WEBHOOK] Event verified — { type: 'checkout.session.completed', id: 'evt_test_...' }"
echo "  [STRIPE-WEBHOOK] Quota consume result — { consumeResult: 'skipped_not_launch' }"
echo "  (Note: l'événement test Stripe n'a pas offer_type=launch dans metadata, donc skip normal)"
echo ""

# ── ÉTAPE 3 : Vérification mutation DB (optionnel si SUPABASE_URL fourni) ─────
if [[ -n "$SUPABASE_URL" && -n "$SUPABASE_SERVICE_KEY" ]]; then
  echo "ÉTAPE 3 — Vérification mutation DB (billing_events)"
  echo ""

  BILLING_COUNT=$(curl -s \
    "$SUPABASE_URL/rest/v1/billing_events?select=id,stripe_event_id,event_type&order=created_at.desc&limit=5" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    | jq 'length' 2>/dev/null || echo "0")

  echo "  Événements billing_events en base: $BILLING_COUNT"

  if [[ "$BILLING_COUNT" -gt "0" ]]; then
    echo "  ✓ billing_events contient des données — webhook reçu et persisté"
    echo "  PROOF: E2E_PROVEN (partiel — quota mutation à vérifier séparément)"

    QUOTA_DATA=$(curl -s \
      "$SUPABASE_URL/rest/v1/launch_quota?select=used_slots,total_slots" \
      -H "apikey: $SUPABASE_SERVICE_KEY" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
      | jq '.[0]' 2>/dev/null || echo "null")

    echo ""
    echo "  Quota actuel : $QUOTA_DATA"
    echo ""
    echo "  Pour une preuve complète checkout→webhook→quota, effectuer un VRAI checkout"
    echo "  avec une carte Stripe test (4242 4242 4242 4242) sur https://wiinupmax.com/pricing"
    echo "  puis vérifier que used_slots a augmenté."
  else
    echo "  ⚠ billing_events vide — webhook non reçu ou non persisté"
    echo "  Vérifier: logs Edge Function → [STRIPE-WEBHOOK] dans Lovable Cloud"
  fi

  echo ""
else
  echo "ÉTAPE 3 — Vérification DB (optionnelle)"
  echo "  Fournir SUPABASE_URL + SUPABASE_SERVICE_KEY pour vérifier la mutation DB."
  echo "  Sinon, vérifier manuellement dans Lovable Cloud → Backend → billing_events"
  echo ""
fi

# ── ÉTAPE 4 : Comment vérifier la corrélation complète ────────────────────────
echo "ÉTAPE 4 — Vérifier la corrélation complète checkout → webhook → quota"
echo ""
echo "  1. Ouvrir /admin/payments dans l'interface admin"
echo "  2. Onglet 'Billing Proof Chain' — chercher un événement avec proof_level = 'full'"
echo "  3. Un 'full' signifie :"
echo "     a. Checkout session complétée (stripe_event_id présent)"
echo "     b. Abonnement synced dans la table subscriptions"
echo "     c. Si offre launch: entrée dans launch_quota_consumed"
echo ""
echo "  Logs à vérifier (Lovable Cloud → Edge Function Logs → stripe-webhook) :"
echo "  [STRIPE-WEBHOOK] Webhook received"
echo "  [STRIPE-WEBHOOK] Event verified — { type, id }"
echo "  [STRIPE-WEBHOOK] Checkout completed — { sessionId }"
echo "  [STRIPE-WEBHOOK] Quota consume result — { consumeResult: 'incremented' }"
echo "  [STRIPE-WEBHOOK] Subscription synced after checkout — { userId }"
echo ""

# ── Résumé classification finale ──────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════════"
echo "  CLASSIFICATION FINALE"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  CODE_READY          [✓] Edge fn stripe-webhook déployée"
echo "                         Vérification signature: code présent"
echo "                         RPC increment_launch_quota_used_slots: code présent"
echo ""
echo "  EXTERNAL_CONFIG     [?] STRIPE_WEBHOOK_SECRET doit être dans Cloud Secrets"
echo "                         Non vérifiable depuis ce script."
echo "                         Signe: HTTP 500 à l'ÉTAPE 1 = secret manquant"
echo "                         Signe: HTTP 400 à l'ÉTAPE 1 = edge fn déployée (mais secret inconnu)"
echo ""
echo "  E2E_NOT_PROVEN      [x] Aucun checkout → webhook → mutation quota exercé en conditions réelles"
echo "                         Ce statut reste jusqu'à exécution complète de ce runbook"
echo "                         ET observation d'un proof_level='full' dans /admin/payments"
echo ""
echo "  E2E_PROVEN          [ ] Statut atteignable après:"
echo "                         1. Exécution ÉTAPE 2 avec succès (logs verts)"
echo "                         2. billing_events contient l'événement"
echo "                         3. /admin/payments → Billing Proof Chain → proof_level = 'full'"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
