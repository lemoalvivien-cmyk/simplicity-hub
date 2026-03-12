
-- ═══════════════════════════════════════════════════════════════════════════
-- BUSINESS METRICS — Revenue time-series + churn + LTV + alerts tracking
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. business_alerts table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_alerts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type   text        NOT NULL,   -- 'churn_high','payout_failed','quota_high','pending_gain_48h'
  severity     text        NOT NULL DEFAULT 'warning',  -- 'info','warning','critical'
  title        text        NOT NULL,
  message      text        NOT NULL,
  value        numeric,                -- the metric value that triggered
  threshold    numeric,                -- the threshold
  resolved     boolean     NOT NULL DEFAULT false,
  resolved_at  timestamptz,
  email_sent   boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin reads business alerts"
  ON public.business_alerts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin manages business alerts"
  ON public.business_alerts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── 2. Revenu mensuel: billing_events bucketed by month ─────────────────────
CREATE OR REPLACE FUNCTION public.get_revenue_timeseries(p_days int DEFAULT 90)
RETURNS TABLE(
  period        text,
  revenue_eur   numeric,
  subs_active   bigint,
  payouts_paid  numeric,
  leads_openclaw bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH date_series AS (
    SELECT generate_series(
      date_trunc('month', now() - (p_days || ' days')::interval),
      date_trunc('month', now()),
      '1 month'::interval
    ) AS month_start
  ),
  billing AS (
    SELECT
      date_trunc('month', created_at) AS month_start,
      SUM(COALESCE((payload->>'amount_total')::numeric, 0) / 100) AS revenue_eur
    FROM public.billing_events
    WHERE event_type = 'checkout.session.completed'
      AND created_at >= now() - (p_days || ' days')::interval
    GROUP BY 1
  ),
  subs AS (
    SELECT
      date_trunc('month', created_at) AS month_start,
      COUNT(*) FILTER (WHERE status = 'active') AS subs_active
    FROM public.subscriptions
    WHERE created_at >= now() - (p_days || ' days')::interval
    GROUP BY 1
  ),
  payouts AS (
    SELECT
      date_trunc('month', paid_at) AS month_start,
      SUM(amount) AS payouts_paid
    FROM public.payouts
    WHERE status = 'paid'
      AND paid_at >= now() - (p_days || ' days')::interval
    GROUP BY 1
  ),
  leads AS (
    SELECT
      date_trunc('month', created_at) AS month_start,
      COUNT(*) AS leads_openclaw
    FROM public.lead_intakes
    WHERE source_type = 'openclaw_ai'
      AND created_at >= now() - (p_days || ' days')::interval
    GROUP BY 1
  )
  SELECT
    to_char(d.month_start, 'MM/YYYY') AS period,
    COALESCE(b.revenue_eur, 0)        AS revenue_eur,
    COALESCE(s.subs_active, 0)        AS subs_active,
    COALESCE(p.payouts_paid, 0)       AS payouts_paid,
    COALESCE(l.leads_openclaw, 0)     AS leads_openclaw
  FROM date_series d
  LEFT JOIN billing b ON b.month_start = d.month_start
  LEFT JOIN subs    s ON s.month_start = d.month_start
  LEFT JOIN payouts p ON p.month_start = d.month_start
  LEFT JOIN leads   l ON l.month_start = d.month_start
  ORDER BY d.month_start;
$$;

-- ── 3. Daily time-series for 7d/30d granularity ─────────────────────────────
CREATE OR REPLACE FUNCTION public.get_daily_timeseries(p_days int DEFAULT 30)
RETURNS TABLE(
  day           text,
  revenue_eur   numeric,
  payouts_paid  numeric,
  leads_openclaw bigint,
  intros_validees bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH date_series AS (
    SELECT generate_series(
      date_trunc('day', now() - (p_days || ' days')::interval),
      date_trunc('day', now()),
      '1 day'::interval
    ) AS day_start
  ),
  billing AS (
    SELECT
      date_trunc('day', created_at) AS day_start,
      SUM(COALESCE((payload->>'amount_total')::numeric, 0) / 100) AS revenue_eur
    FROM public.billing_events
    WHERE event_type = 'checkout.session.completed'
      AND created_at >= now() - (p_days || ' days')::interval
    GROUP BY 1
  ),
  payouts AS (
    SELECT
      date_trunc('day', paid_at) AS day_start,
      SUM(amount) AS payouts_paid
    FROM public.payouts
    WHERE status = 'paid'
      AND paid_at >= now() - (p_days || ' days')::interval
    GROUP BY 1
  ),
  leads AS (
    SELECT
      date_trunc('day', created_at) AS day_start,
      COUNT(*) AS leads_openclaw
    FROM public.lead_intakes
    WHERE source_type = 'openclaw_ai'
      AND created_at >= now() - (p_days || ' days')::interval
    GROUP BY 1
  ),
  intros AS (
    SELECT
      date_trunc('day', updated_at) AS day_start,
      COUNT(*) AS intros_validees
    FROM public.introductions
    WHERE statut = 'validee'
      AND updated_at >= now() - (p_days || ' days')::interval
    GROUP BY 1
  )
  SELECT
    to_char(d.day_start, 'DD/MM') AS day,
    COALESCE(b.revenue_eur, 0)     AS revenue_eur,
    COALESCE(p.payouts_paid, 0)    AS payouts_paid,
    COALESCE(l.leads_openclaw, 0)  AS leads_openclaw,
    COALESCE(i.intros_validees, 0) AS intros_validees
  FROM date_series d
  LEFT JOIN billing b ON b.day_start = d.day_start
  LEFT JOIN payouts p ON p.day_start = d.day_start
  LEFT JOIN leads   l ON l.day_start = d.day_start
  LEFT JOIN intros  i ON i.day_start = d.day_start
  ORDER BY d.day_start;
$$;

-- ── 4. Business health metrics (churn, LTV, quotas) ─────────────────────────
CREATE OR REPLACE FUNCTION public.get_business_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_subs      bigint;
  v_churned_30d      bigint;
  v_new_30d          bigint;
  v_churn_rate       numeric;
  v_total_revenue    numeric;
  v_ltv              numeric;
  v_pending_48h      bigint;
  v_failed_payouts   bigint;
  v_openclaw_today   bigint;
  v_openclaw_quota   numeric;
  v_pending_gains    bigint;
BEGIN
  -- Active subscriptions
  SELECT COUNT(*) INTO v_active_subs
  FROM public.subscriptions WHERE status = 'active';

  -- Churned last 30 days (canceled)
  SELECT COUNT(*) INTO v_churned_30d
  FROM public.subscriptions
  WHERE status = 'canceled'
    AND updated_at >= now() - interval '30 days';

  -- New last 30 days
  SELECT COUNT(*) INTO v_new_30d
  FROM public.subscriptions
  WHERE status = 'active'
    AND created_at >= now() - interval '30 days';

  -- Churn rate = churned / (active + churned) * 100
  v_churn_rate := CASE
    WHEN (v_active_subs + v_churned_30d) > 0
    THEN ROUND(v_churned_30d::numeric / (v_active_subs + v_churned_30d) * 100, 1)
    ELSE 0
  END;

  -- Total Stripe revenue
  SELECT COALESCE(SUM(COALESCE((payload->>'amount_total')::numeric, 0) / 100), 0)
  INTO v_total_revenue
  FROM public.billing_events
  WHERE event_type = 'checkout.session.completed';

  -- LTV = total revenue / active subs
  v_ltv := CASE WHEN v_active_subs > 0 THEN ROUND(v_total_revenue / v_active_subs, 0) ELSE 0 END;

  -- Gains pending > 48h
  SELECT COUNT(*) INTO v_pending_48h
  FROM public.payouts
  WHERE status = 'pending'
    AND created_at < now() - interval '48 hours';

  -- Failed payouts last 7 days
  SELECT COUNT(*) INTO v_failed_payouts
  FROM public.payouts
  WHERE status = 'failed'
    AND updated_at >= now() - interval '7 days';

  -- OpenClaw leads today
  SELECT COUNT(*) INTO v_openclaw_today
  FROM public.lead_intakes
  WHERE source_type = 'openclaw_ai'
    AND created_at >= date_trunc('day', now());

  -- OpenClaw quota usage (max 3/day per user * active users, simplified: total today)
  v_openclaw_quota := CASE
    WHEN v_active_subs > 0
    THEN ROUND(v_openclaw_today::numeric / GREATEST(v_active_subs * 3, 1) * 100, 1)
    ELSE 0
  END;

  -- Pending gains (not yet in payouts)
  SELECT COUNT(*) INTO v_pending_gains
  FROM public.gains
  WHERE statut IN ('valide')
    AND NOT EXISTS (SELECT 1 FROM public.payouts p WHERE p.gain_id = gains.id);

  RETURN jsonb_build_object(
    'active_subs',       v_active_subs,
    'churned_30d',       v_churned_30d,
    'new_subs_30d',      v_new_30d,
    'churn_rate',        v_churn_rate,
    'total_revenue',     v_total_revenue,
    'ltv',               v_ltv,
    'pending_48h',       v_pending_48h,
    'failed_payouts_7d', v_failed_payouts,
    'openclaw_today',    v_openclaw_today,
    'openclaw_quota_pct',v_openclaw_quota,
    'pending_gains_no_payout', v_pending_gains,
    'computed_at',       now()
  );
END;
$$;

-- ── 5. Auto-generate alerts function ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_business_alerts()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_health  jsonb;
  v_count   int := 0;
BEGIN
  v_health := public.get_business_health();

  -- ALERT: churn > 5%
  IF (v_health->>'churn_rate')::numeric > 5 THEN
    INSERT INTO public.business_alerts
      (alert_type, severity, title, message, value, threshold)
    VALUES (
      'churn_high', 'critical',
      'Churn élevé ⚠️',
      format('Le taux de churn est à %s%% sur les 30 derniers jours (seuil : 5%%)', v_health->>'churn_rate'),
      (v_health->>'churn_rate')::numeric, 5
    )
    ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
  END IF;

  -- ALERT: failed payouts > 0 in last 7 days
  IF (v_health->>'failed_payouts_7d')::int > 0 THEN
    INSERT INTO public.business_alerts
      (alert_type, severity, title, message, value, threshold)
    VALUES (
      'payout_failed', 'critical',
      'Payouts échoués 🚨',
      format('%s payout(s) ont échoué dans les 7 derniers jours. Vérifiez les comptes Stripe Connect.', v_health->>'failed_payouts_7d'),
      (v_health->>'failed_payouts_7d')::numeric, 0
    )
    ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
  END IF;

  -- ALERT: OpenClaw quota > 80%
  IF (v_health->>'openclaw_quota_pct')::numeric > 80 THEN
    INSERT INTO public.business_alerts
      (alert_type, severity, title, message, value, threshold)
    VALUES (
      'quota_high', 'warning',
      'Quota OpenClaw >80% 🤖',
      format('Le quota de génération OpenClaw est utilisé à %s%% aujourd''hui.', v_health->>'openclaw_quota_pct'),
      (v_health->>'openclaw_quota_pct')::numeric, 80
    )
    ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
  END IF;

  -- ALERT: pending payout > 48h
  IF (v_health->>'pending_48h')::int > 0 THEN
    INSERT INTO public.business_alerts
      (alert_type, severity, title, message, value, threshold)
    VALUES (
      'pending_gain_48h', 'warning',
      'Gains en attente >48h ⏳',
      format('%s payout(s) sont en attente depuis plus de 48h. Lancez le batch de paiement.', v_health->>'pending_48h'),
      (v_health->>'pending_48h')::numeric, 0
    )
    ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
  END IF;

  RETURN v_count;
END;
$$;

-- Index for fast time-series queries
CREATE INDEX IF NOT EXISTS idx_billing_events_type_date ON public.billing_events (event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_payouts_status_date       ON public.payouts (status, paid_at);
CREATE INDEX IF NOT EXISTS idx_lead_intakes_source_date  ON public.lead_intakes (source_type, created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_date ON public.subscriptions (status, updated_at);
CREATE INDEX IF NOT EXISTS idx_business_alerts_resolved  ON public.business_alerts (resolved, created_at DESC);
