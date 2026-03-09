
-- ══════════════════════════════════════════════════════════════════════════════
-- billing_proof_chain VIEW
-- PROOF:BILLING_PROOF_CHAIN_V1:view_created
--
-- Corrélation transactionnelle checkout → webhook → quota.
-- Répond à : "Ce paiement a-t-il activé l'entitlement attendu ?"
--
-- Source tables :
--   billing_events        → événements Stripe webhooks normalisés
--   subscriptions         → abonnements Stripe synchronisés
--   launch_quota_consumed → slots launch consommés (idempotent)
--
-- HONEST LIMITS: This view proves the webhook was received, persisted, and
-- that downstream mutations (subscription sync, quota) occurred.
-- It does NOT prove payment was captured by Stripe — that requires Stripe Dashboard.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.billing_proof_chain AS
SELECT
  -- ── Identifiants de corrélation ──────────────────────────────────────────
  be.id                                                             AS event_id,
  be.stripe_event_id,
  be.event_type,

  -- ── Timestamps ────────────────────────────────────────────────────────────
  -- billing_events has no occurred_at column; use processed_at as proxy
  be.processed_at                                                   AS occurred_at,
  be.processed_at,

  -- ── User / tenant ──────────────────────────────────────────────────────────
  be.user_id,

  -- ── Stripe object IDs extracted from the payload blob ─────────────────────
  -- checkout.session.completed → data.object.id = cs_xxx
  -- customer.subscription.*   → data.object.id = sub_xxx
  (be.payload -> 'data' -> 'object' ->> 'id')                      AS stripe_object_id,
  (be.payload -> 'data' -> 'object' ->> 'customer')                AS stripe_customer_id,

  -- Subscription ID: present on checkout under 'subscription' key,
  -- or the object itself for subscription events
  COALESCE(
    (be.payload -> 'data' -> 'object' ->> 'subscription'),
    CASE WHEN be.event_type LIKE 'customer.subscription.%'
         THEN (be.payload -> 'data' -> 'object' ->> 'id')
         ELSE NULL END
  )                                                                 AS stripe_subscription_id_from_event,

  -- ── Amount (EUR) ───────────────────────────────────────────────────────────
  CASE
    WHEN (be.payload -> 'data' -> 'object' ->> 'amount_paid') IS NOT NULL
    THEN ((be.payload -> 'data' -> 'object' ->> 'amount_paid')::numeric / 100)
    WHEN (be.payload -> 'data' -> 'object' ->> 'amount_total') IS NOT NULL
    THEN ((be.payload -> 'data' -> 'object' ->> 'amount_total')::numeric / 100)
    ELSE NULL
  END                                                               AS amount_eur,

  COALESCE(
    (be.payload -> 'data' -> 'object' ->> 'currency'),
    'eur'
  )                                                                 AS currency,

  -- ── Offer type from metadata ────────────────────────────────────────────────
  (be.payload -> 'data' -> 'object' -> 'metadata' ->> 'offer_type') AS offer_type,

  -- ── metadata.user_id (fallback correlation when be.user_id is NULL) ────────
  (be.payload -> 'data' -> 'object' -> 'metadata' ->> 'user_id')   AS metadata_user_id,

  -- ── Object status (e.g. 'complete', 'active', 'canceled') ─────────────────
  (be.payload -> 'data' -> 'object' ->> 'status')                  AS object_status,

  -- ── Quota mutation status ───────────────────────────────────────────────────
  CASE
    WHEN be.event_type != 'checkout.session.completed'
      THEN 'not_applicable'
    WHEN COALESCE((be.payload -> 'data' -> 'object' -> 'metadata' ->> 'offer_type'), '') != 'launch'
      THEN 'not_applicable'
    WHEN COALESCE((be.payload -> 'data' -> 'object' ->> 'subscription'), '') = ''
      THEN 'no_subscription_id'
    WHEN EXISTS (
      SELECT 1 FROM public.launch_quota_consumed lqc
      WHERE lqc.stripe_subscription_id = (be.payload -> 'data' -> 'object' ->> 'subscription')
    )
      THEN 'consumed'
    ELSE 'not_consumed'
  END                                                               AS quota_status,

  -- ── Subscription sync status ────────────────────────────────────────────────
  CASE
    WHEN be.event_type NOT IN (
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated'
    )
      THEN 'not_applicable'
    WHEN be.user_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = be.user_id)
      THEN 'synced'
    WHEN COALESCE((be.payload -> 'data' -> 'object' -> 'metadata' ->> 'user_id'), '') != ''
      AND EXISTS (
        SELECT 1 FROM public.subscriptions s
        WHERE s.user_id::text = (be.payload -> 'data' -> 'object' -> 'metadata' ->> 'user_id')
      )
      THEN 'synced'
    ELSE 'missing'
  END                                                               AS subscription_sync_status,

  -- ── proof_level ──────────────────────────────────────────────────────────────
  CASE
    WHEN be.stripe_event_id IS NULL
      THEN 'no_event_id'
    WHEN be.event_type LIKE 'customer.subscription.%'
      THEN CASE
        WHEN (be.user_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.subscriptions s WHERE s.user_id = be.user_id
        )) THEN 'subscription_event'
        ELSE 'webhook_only'
      END
    WHEN be.event_type LIKE 'invoice.%'
      THEN 'subscription_event'
    WHEN be.event_type = 'checkout.session.completed'
      THEN CASE
        WHEN (
          (be.user_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.subscriptions s WHERE s.user_id = be.user_id
          )) OR (
            COALESCE((be.payload -> 'data' -> 'object' -> 'metadata' ->> 'user_id'), '') != ''
            AND EXISTS (
              SELECT 1 FROM public.subscriptions s
              WHERE s.user_id::text = (be.payload -> 'data' -> 'object' -> 'metadata' ->> 'user_id')
            )
          )
        )
        AND (
          COALESCE((be.payload -> 'data' -> 'object' -> 'metadata' ->> 'offer_type'), '') != 'launch'
          OR EXISTS (
            SELECT 1 FROM public.launch_quota_consumed lqc
            WHERE lqc.stripe_subscription_id = (be.payload -> 'data' -> 'object' ->> 'subscription')
          )
        )
        THEN 'full'
        ELSE 'partial'
      END
    ELSE 'webhook_only'
  END                                                               AS proof_level

FROM public.billing_events be
ORDER BY be.processed_at DESC;

-- ── Access control ────────────────────────────────────────────────────────────
-- Direct SELECT blocked; access only via SECURITY DEFINER RPCs
-- (get_billing_proof_chain, get_billing_proof_summary) which check admin role.
REVOKE ALL ON public.billing_proof_chain FROM PUBLIC;
REVOKE ALL ON public.billing_proof_chain FROM anon;
REVOKE ALL ON public.billing_proof_chain FROM authenticated;
GRANT SELECT ON public.billing_proof_chain TO service_role;
