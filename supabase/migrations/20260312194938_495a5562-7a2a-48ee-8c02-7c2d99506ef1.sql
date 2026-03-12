
-- ============================================================
-- ANALYTICS EVENTS — DB TRIGGERS + BACKFILL + FUNCTIONS
-- ============================================================

-- ── Helper: track_business_event ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.track_business_event(
  p_event_type   text,
  p_user_id      uuid,
  p_entity_id    uuid,
  p_properties   jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.analytics_events (event_type, session_id, user_id, page, properties)
  VALUES (
    p_event_type,
    'db:' || COALESCE(p_entity_id::text, gen_random_uuid()::text),
    p_user_id,
    '/admin/revenue',
    p_properties
  );
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

-- ── TRIGGER: subscriptions ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trigger_analytics_on_subscription()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.track_business_event(
      'subscription_created', NEW.user_id, NEW.id,
      jsonb_build_object('offer_type', COALESCE(NEW.offer_type,'unknown'), 'status', NEW.status, 'stripe_subscription_id', NEW.stripe_subscription_id)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'canceled' AND OLD.status != 'canceled' THEN
      PERFORM public.track_business_event(
        'subscription_churned', NEW.user_id, NEW.id,
        jsonb_build_object('offer_type', COALESCE(NEW.offer_type,'unknown'))
      );
    ELSIF NEW.status = 'active' AND OLD.status NOT IN ('active', 'trialing') THEN
      PERFORM public.track_business_event(
        'subscription_reactivated', NEW.user_id, NEW.id,
        jsonb_build_object('offer_type', COALESCE(NEW.offer_type,'unknown'))
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_analytics_subscription ON public.subscriptions;
CREATE TRIGGER trg_analytics_subscription
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.trigger_analytics_on_subscription();

-- ── TRIGGER: billing_events → checkout_success ───────────────────────────────
CREATE OR REPLACE FUNCTION public.trigger_analytics_on_billing_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_amount_eur numeric;
BEGIN
  IF NEW.event_type = 'checkout.session.completed' THEN
    v_amount_eur := ROUND(COALESCE((NEW.payload->>'amount_total')::numeric, 0) / 100.0, 2);
    PERFORM public.track_business_event(
      'checkout_success', NEW.user_id, NEW.id,
      jsonb_build_object('amount_eur', v_amount_eur, 'stripe_event_id', NEW.stripe_event_id, 'currency', COALESCE(NEW.payload->>'currency', 'eur'))
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_analytics_billing_event ON public.billing_events;
CREATE TRIGGER trg_analytics_billing_event
AFTER INSERT ON public.billing_events
FOR EACH ROW EXECUTE FUNCTION public.trigger_analytics_on_billing_event();

-- ── TRIGGER: introductions → intro_validated / intro_submitted ───────────────
CREATE OR REPLACE FUNCTION public.trigger_analytics_on_intro_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.statut IS DISTINCT FROM OLD.statut THEN
    IF NEW.statut = 'validee' THEN
      PERFORM public.track_business_event(
        'intro_validated', NEW.facilitateur_id, NEW.id,
        jsonb_build_object('contact_nom', NEW.contact_nom, 'mission_id', NEW.mission_id, 'entreprise_id', NEW.entreprise_id)
      );
    ELSIF NEW.statut = 'refusee' THEN
      PERFORM public.track_business_event(
        'intro_refused', NEW.facilitateur_id, NEW.id,
        jsonb_build_object('contact_nom', NEW.contact_nom)
      );
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.track_business_event(
      'intro_submitted', NEW.facilitateur_id, NEW.id,
      jsonb_build_object('contact_nom', NEW.contact_nom, 'mission_id', NEW.mission_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_analytics_intro ON public.introductions;
CREATE TRIGGER trg_analytics_intro
AFTER INSERT OR UPDATE ON public.introductions
FOR EACH ROW EXECUTE FUNCTION public.trigger_analytics_on_intro_status();

-- ── TRIGGER: gains ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trigger_analytics_on_gain()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.statut IS DISTINCT FROM OLD.statut THEN
    IF NEW.statut IN ('valide','recu') AND OLD.statut NOT IN ('valide','recu') THEN
      PERFORM public.track_business_event(
        'gain_confirmed', NEW.facilitateur_id, NEW.id,
        jsonb_build_object('montant', NEW.montant, 'introduction_id', NEW.introduction_id, 'mission_id', NEW.mission_id)
      );
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.track_business_event(
      'gain_created', NEW.facilitateur_id, NEW.id,
      jsonb_build_object('montant', NEW.montant, 'statut', NEW.statut)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_analytics_gain ON public.gains;
CREATE TRIGGER trg_analytics_gain
AFTER INSERT OR UPDATE ON public.gains
FOR EACH ROW EXECUTE FUNCTION public.trigger_analytics_on_gain();

-- ── TRIGGER: payouts ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trigger_analytics_on_payout()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'paid' THEN
      PERFORM public.track_business_event(
        'payout_paid', NEW.facilitator_id, NEW.id,
        jsonb_build_object('amount_eur', NEW.amount, 'currency', COALESCE(NEW.currency,'EUR'), 'stripe_transfer_id', NEW.stripe_transfer_id, 'gain_id', NEW.gain_id)
      );
    ELSIF NEW.status = 'failed' THEN
      PERFORM public.track_business_event(
        'payout_failed', NEW.facilitator_id, NEW.id,
        jsonb_build_object('amount_eur', NEW.amount, 'failure_reason', NEW.failure_reason)
      );
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.track_business_event(
      'payout_created', NEW.facilitator_id, NEW.id,
      jsonb_build_object('amount_eur', NEW.amount, 'status', NEW.status, 'gain_id', NEW.gain_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_analytics_payout ON public.payouts;
CREATE TRIGGER trg_analytics_payout
AFTER INSERT OR UPDATE ON public.payouts
FOR EACH ROW EXECUTE FUNCTION public.trigger_analytics_on_payout();

-- ── TRIGGER: lead_intakes ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trigger_analytics_on_lead_intake()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.track_business_event(
      'lead_generated', NEW.user_id, NEW.id,
      jsonb_build_object('source_type', NEW.source_type, 'qualification_status', NEW.qualification_status, 'ai_score', NEW.ai_score, 'ai_label', NEW.ai_label, 'company_name', NEW.company_name)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.qualification_status IS DISTINCT FROM OLD.qualification_status
       AND NEW.qualification_status IN ('ready_for_action','ready_for_opportunity') THEN
      PERFORM public.track_business_event(
        'lead_qualified', NEW.user_id, NEW.id,
        jsonb_build_object('qualification_status', NEW.qualification_status, 'ai_score', NEW.ai_score)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_analytics_lead_intake ON public.lead_intakes;
CREATE TRIGGER trg_analytics_lead_intake
AFTER INSERT OR UPDATE ON public.lead_intakes
FOR EACH ROW EXECUTE FUNCTION public.trigger_analytics_on_lead_intake();

-- ── BACKFILL existing data ────────────────────────────────────────────────────
INSERT INTO public.analytics_events (event_type, session_id, user_id, page, properties, created_at)
SELECT 'subscription_created','backfill:sub:'||id::text, user_id,'/admin/revenue',
  jsonb_build_object('offer_type',COALESCE(offer_type,'unknown'),'status',status,'backfill',true), created_at
FROM public.subscriptions ON CONFLICT DO NOTHING;

INSERT INTO public.analytics_events (event_type, session_id, user_id, page, properties, created_at)
SELECT 'subscription_churned','backfill:churn:'||id::text, user_id,'/admin/revenue',
  jsonb_build_object('offer_type',COALESCE(offer_type,'unknown'),'backfill',true), updated_at
FROM public.subscriptions WHERE status='canceled' ON CONFLICT DO NOTHING;

INSERT INTO public.analytics_events (event_type, session_id, user_id, page, properties, created_at)
SELECT 'checkout_success','backfill:billing:'||id::text, user_id,'/admin/revenue',
  jsonb_build_object('amount_eur',ROUND(COALESCE((payload->>'amount_total')::numeric,0)/100.0,2),'stripe_event_id',stripe_event_id,'backfill',true), created_at
FROM public.billing_events WHERE event_type='checkout.session.completed' ON CONFLICT DO NOTHING;

INSERT INTO public.analytics_events (event_type, session_id, user_id, page, properties, created_at)
SELECT 'intro_validated','backfill:intro:'||id::text, facilitateur_id,'/admin/revenue',
  jsonb_build_object('contact_nom',contact_nom,'mission_id',mission_id,'backfill',true), updated_at
FROM public.introductions WHERE statut='validee' ON CONFLICT DO NOTHING;

INSERT INTO public.analytics_events (event_type, session_id, user_id, page, properties, created_at)
SELECT 'intro_submitted','backfill:intro_sub:'||id::text, facilitateur_id,'/admin/revenue',
  jsonb_build_object('contact_nom',contact_nom,'backfill',true), created_at
FROM public.introductions ON CONFLICT DO NOTHING;

INSERT INTO public.analytics_events (event_type, session_id, user_id, page, properties, created_at)
SELECT 'gain_confirmed','backfill:gain:'||id::text, facilitateur_id,'/admin/revenue',
  jsonb_build_object('montant',montant,'backfill',true), updated_at
FROM public.gains WHERE statut IN ('valide','recu') ON CONFLICT DO NOTHING;

INSERT INTO public.analytics_events (event_type, session_id, user_id, page, properties, created_at)
SELECT 'payout_paid','backfill:payout:'||id::text, facilitator_id,'/admin/revenue',
  jsonb_build_object('amount_eur',amount,'backfill',true), COALESCE(paid_at,created_at)
FROM public.payouts WHERE status='paid' ON CONFLICT DO NOTHING;

INSERT INTO public.analytics_events (event_type, session_id, user_id, page, properties, created_at)
SELECT 'lead_generated','backfill:lead:'||id::text, user_id,'/admin/revenue',
  jsonb_build_object('source_type',source_type,'ai_score',ai_score,'ai_label',ai_label,'backfill',true), created_at
FROM public.lead_intakes ON CONFLICT DO NOTHING;

-- ── INDEX ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created
  ON public.analytics_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_type
  ON public.analytics_events (user_id, event_type, created_at DESC);

-- ── FUNCTION: get_analytics_timeseries ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_analytics_timeseries(p_days integer DEFAULT 30)
RETURNS TABLE(
  day              text,
  checkouts        bigint,
  revenue_eur      numeric,
  leads_generated  bigint,
  intros_validated bigint,
  payouts_paid_cnt bigint,
  payouts_paid_eur numeric,
  subs_created     bigint
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  WITH date_series AS (
    SELECT generate_series(
      date_trunc('day', now() - (p_days||' days')::interval),
      date_trunc('day', now()),
      '1 day'::interval
    ) AS day_start
  ),
  events AS (
    SELECT date_trunc('day', created_at) AS day_start, event_type,
      COALESCE((properties->>'amount_eur')::numeric, 0) AS amount_eur
    FROM public.analytics_events
    WHERE created_at >= now() - (p_days||' days')::interval
  )
  SELECT
    to_char(d.day_start,'DD/MM') AS day,
    COUNT(*) FILTER (WHERE e.event_type='checkout_success')     AS checkouts,
    COALESCE(SUM(CASE WHEN e.event_type='checkout_success'  THEN e.amount_eur ELSE 0 END),0) AS revenue_eur,
    COUNT(*) FILTER (WHERE e.event_type='lead_generated')       AS leads_generated,
    COUNT(*) FILTER (WHERE e.event_type='intro_validated')      AS intros_validated,
    COUNT(*) FILTER (WHERE e.event_type='payout_paid')          AS payouts_paid_cnt,
    COALESCE(SUM(CASE WHEN e.event_type='payout_paid' THEN e.amount_eur ELSE 0 END),0) AS payouts_paid_eur,
    COUNT(*) FILTER (WHERE e.event_type='subscription_created') AS subs_created
  FROM date_series d
  LEFT JOIN events e ON e.day_start = d.day_start
  GROUP BY d.day_start
  ORDER BY d.day_start;
$$;

-- ── FUNCTION: get_analytics_event_summary ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_analytics_event_summary()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_checkouts',        (SELECT COUNT(*) FROM public.analytics_events WHERE event_type='checkout_success'),
    'total_leads',            (SELECT COUNT(*) FROM public.analytics_events WHERE event_type='lead_generated'),
    'total_intros_validated', (SELECT COUNT(*) FROM public.analytics_events WHERE event_type='intro_validated'),
    'total_payouts_paid',     (SELECT COUNT(*) FROM public.analytics_events WHERE event_type='payout_paid'),
    'total_subs_created',     (SELECT COUNT(*) FROM public.analytics_events WHERE event_type='subscription_created'),
    'total_churned',          (SELECT COUNT(*) FROM public.analytics_events WHERE event_type='subscription_churned'),
    'events_last_24h',        (SELECT COUNT(*) FROM public.analytics_events
                               WHERE created_at > now()-interval'24 hours'
                                 AND event_type NOT IN ('page_view','landing_view','pricing_view')),
    'computed_at', now()
  ) INTO v_result;
  RETURN v_result;
END;
$$;

-- ── FUNCTION: run_alert_cycle ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.run_alert_cycle()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_new_alerts int; v_critical jsonb;
BEGIN
  v_new_alerts := public.generate_business_alerts();
  SELECT jsonb_agg(jsonb_build_object(
    'id',id,'type',alert_type,'severity',severity,
    'title',title,'message',message,'value',value,'threshold',threshold
  )) INTO v_critical
  FROM public.business_alerts
  WHERE resolved=false AND severity='critical' AND created_at > now()-interval'1 hour';
  RETURN jsonb_build_object(
    'new_alerts',       v_new_alerts,
    'critical_alerts',  COALESCE(v_critical,'[]'::jsonb),
    'total_unresolved', (SELECT COUNT(*) FROM public.business_alerts WHERE resolved=false),
    'computed_at',      now()
  );
END;
$$;
