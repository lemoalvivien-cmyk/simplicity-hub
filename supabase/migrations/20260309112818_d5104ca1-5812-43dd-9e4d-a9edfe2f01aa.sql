
-- ═══════════════════════════════════════════════════════════════════
-- BILLING PROOF VIEW — Corrélation transactionnelle checkout→webhook→quota
-- PROOF:BILLING_PROOF_CHAIN_V1
-- ═══════════════════════════════════════════════════════════════════

-- 1. Vue billing_proof_chain (corrélation par event Stripe)
CREATE OR REPLACE VIEW public.billing_proof_chain AS
SELECT
  be.id                                                            AS event_id,
  be.stripe_event_id,
  be.event_type,
  be.created_at                                                    AS occurred_at,
  be.processed_at,
  be.user_id,
  (be.payload->'data'->'object'->>'id')                           AS stripe_object_id,
  (be.payload->'data'->'object'->>'customer')                     AS stripe_customer_id,
  (be.payload->'data'->'object'->>'subscription')                 AS stripe_subscription_id_from_event,
  CASE WHEN (be.payload->'data'->'object'->>'amount_total') IS NOT NULL
       THEN (be.payload->'data'->'object'->>'amount_total')::numeric / 100
       ELSE NULL END                                               AS amount_eur,
  (be.payload->'data'->'object'->>'currency')                     AS currency,
  (be.payload->'data'->'object'->'metadata'->>'offer_type')       AS offer_type,
  (be.payload->'data'->'object'->'metadata'->>'user_id')          AS metadata_user_id,
  (be.payload->'data'->'object'->>'status')                       AS object_status,
  CASE
    WHEN (be.payload->'data'->'object'->>'subscription') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.launch_quota_consumed lqc
       WHERE lqc.stripe_subscription_id = (be.payload->'data'->'object'->>'subscription')
     )
    THEN 'consumed'
    WHEN (be.payload->'data'->'object'->'metadata'->>'offer_type') = 'standard'
    THEN 'not_applicable'
    WHEN (be.payload->'data'->'object'->>'subscription') IS NULL
    THEN 'no_subscription_id'
    ELSE 'not_consumed'
  END                                                              AS quota_status,
  CASE
    WHEN (be.payload->'data'->'object'->>'subscription') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.subscriptions s
       WHERE s.stripe_subscription_id = (be.payload->'data'->'object'->>'subscription')
     )
    THEN 'synced'
    WHEN (be.payload->'data'->'object'->>'subscription') IS NULL
    THEN 'no_subscription'
    ELSE 'missing'
  END                                                              AS subscription_sync_status,
  CASE
    WHEN be.stripe_event_id IS NULL THEN 'no_event_id'
    WHEN be.event_type = 'checkout.session.completed'
      AND (be.payload->'data'->'object'->>'subscription') IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.subscriptions s
        WHERE s.stripe_subscription_id = (be.payload->'data'->'object'->>'subscription')
      )
      AND (
        (be.payload->'data'->'object'->'metadata'->>'offer_type') != 'launch'
        OR EXISTS (
          SELECT 1 FROM public.launch_quota_consumed lqc
          WHERE lqc.stripe_subscription_id = (be.payload->'data'->'object'->>'subscription')
        )
      )
    THEN 'full'
    WHEN be.event_type = 'checkout.session.completed'
      AND (be.payload->'data'->'object'->>'subscription') IS NOT NULL
    THEN 'partial'
    WHEN be.event_type IN ('customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted')
    THEN 'subscription_event'
    ELSE 'webhook_only'
  END                                                              AS proof_level
FROM public.billing_events be
ORDER BY be.created_at DESC;

-- 2. RPC admin: lire la chaîne de preuve billing
CREATE OR REPLACE FUNCTION public.get_billing_proof_chain(p_limit integer DEFAULT 50)
RETURNS TABLE (
  event_id                   uuid,
  stripe_event_id            text,
  event_type                 text,
  occurred_at                timestamptz,
  processed_at               timestamptz,
  user_id                    uuid,
  stripe_object_id           text,
  stripe_customer_id         text,
  stripe_subscription_id_from_event text,
  amount_eur                 numeric,
  currency                   text,
  offer_type                 text,
  metadata_user_id           text,
  object_status              text,
  quota_status               text,
  subscription_sync_status   text,
  proof_level                text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY
  SELECT
    bpc.event_id, bpc.stripe_event_id, bpc.event_type,
    bpc.occurred_at, bpc.processed_at, bpc.user_id,
    bpc.stripe_object_id, bpc.stripe_customer_id,
    bpc.stripe_subscription_id_from_event,
    bpc.amount_eur, bpc.currency, bpc.offer_type,
    bpc.metadata_user_id, bpc.object_status,
    bpc.quota_status, bpc.subscription_sync_status, bpc.proof_level
  FROM public.billing_proof_chain bpc
  LIMIT p_limit;
END;
$$;

-- 3. RPC admin: résumé billing proof
CREATE OR REPLACE FUNCTION public.get_billing_proof_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  SELECT jsonb_build_object(
    'total_billing_events',       (SELECT COUNT(*) FROM public.billing_events),
    'checkout_completed_events',  (SELECT COUNT(*) FROM public.billing_events WHERE event_type = 'checkout.session.completed'),
    'subscription_events',        (SELECT COUNT(*) FROM public.billing_events WHERE event_type LIKE 'customer.subscription.%'),
    'full_proof_events',          (SELECT COUNT(*) FROM public.billing_proof_chain WHERE proof_level = 'full'),
    'partial_proof_events',       (SELECT COUNT(*) FROM public.billing_proof_chain WHERE proof_level = 'partial'),
    'broken_events',              (SELECT COUNT(*) FROM public.billing_proof_chain WHERE proof_level IN ('no_event_id','webhook_only')),
    'quota_consumed_count',       (SELECT COUNT(*) FROM public.launch_quota_consumed),
    'quota_used_slots',           (SELECT used_slots FROM public.launch_quota LIMIT 1),
    'quota_total_slots',          (SELECT total_slots FROM public.launch_quota LIMIT 1),
    'active_subscriptions',       (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'active'),
    'computed_at',                now()
  ) INTO v_result;
  RETURN v_result;
END;
$$;

-- 4. RLS billing_events
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read billing_events" ON public.billing_events;
CREATE POLICY "Admin can read billing_events"
  ON public.billing_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Service role can insert billing_events" ON public.billing_events;
CREATE POLICY "Service role can insert billing_events"
  ON public.billing_events FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update billing_events" ON public.billing_events;
CREATE POLICY "Service role can update billing_events"
  ON public.billing_events FOR UPDATE
  USING (true);
