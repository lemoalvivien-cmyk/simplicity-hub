
-- ═══════════════════════════════════════════════════════════════
-- PHASE B: ANALYTICS RUNTIME + REACTIVATION JOBS + PAYOUT OPS
-- ═══════════════════════════════════════════════════════════════

-- ── 1. analytics_events: ensure RLS open for auth INSERT (app tracking) ─────
ALTER TABLE IF EXISTS public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own events
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_events' AND policyname = 'analytics_events_insert_own'
  ) THEN
    CREATE POLICY "analytics_events_insert_own"
      ON public.analytics_events FOR INSERT
      WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

-- Allow anon/anon to insert (landing page events have no user yet)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_events' AND policyname = 'analytics_events_insert_anon'
  ) THEN
    CREATE POLICY "analytics_events_insert_anon"
      ON public.analytics_events FOR INSERT
      WITH CHECK (user_id IS NULL);
  END IF;
END $$;

-- Admin can read all
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_events' AND policyname = 'analytics_events_admin_select'
  ) THEN
    CREATE POLICY "analytics_events_admin_select"
      ON public.analytics_events FOR SELECT
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- ── 2. reactivation_jobs table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reactivation_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  trigger_type    TEXT NOT NULL,          -- 'checkout_abandoned' | 'onboarding_incomplete' | 'mission_no_intro' | 'intro_not_validated'
  trigger_entity  TEXT,                   -- entity type context
  entity_id       UUID,                   -- related entity (mission, intro, etc.)
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | sent | dismissed | converted
  scheduled_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at         TIMESTAMPTZ,
  dismissed_at    TIMESTAMPTZ,
  converted_at    TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reactivation_jobs_trigger_type_check CHECK (
    trigger_type IN ('checkout_abandoned', 'onboarding_incomplete', 'mission_no_intro', 'intro_not_validated')
  ),
  CONSTRAINT reactivation_jobs_status_check CHECK (
    status IN ('pending', 'sent', 'dismissed', 'converted')
  )
);

ALTER TABLE public.reactivation_jobs ENABLE ROW LEVEL SECURITY;

-- Dedup: one pending job per user+trigger_type
CREATE UNIQUE INDEX IF NOT EXISTS reactivation_jobs_dedup_idx
  ON public.reactivation_jobs (user_id, trigger_type)
  WHERE status = 'pending';

CREATE POLICY "reactivation_jobs_admin_all"
  ON public.reactivation_jobs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "reactivation_jobs_user_view"
  ON public.reactivation_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE TRIGGER reactivation_jobs_updated_at
  BEFORE UPDATE ON public.reactivation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 3. Ensure payouts tables exist (from Phase A migration) with clean schema ─
CREATE TABLE IF NOT EXISTS public.payouts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facilitator_id    UUID NOT NULL,
  introduction_id   UUID,
  gain_id           UUID,
  amount            NUMERIC(12,2) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'EUR',
  status            TEXT NOT NULL DEFAULT 'pending',
  method            TEXT,                            -- 'bank_transfer' | 'paypal' | 'stripe_connect'
  reference         TEXT,
  batch_id          UUID,
  processed_at      TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payouts_status_check CHECK (
    status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')
  )
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.payout_batches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label         TEXT,
  status        TEXT NOT NULL DEFAULT 'draft',
  total_amount  NUMERIC(12,2) DEFAULT 0,
  payout_count  INTEGER DEFAULT 0,
  created_by    UUID NOT NULL,
  processed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payout_batches_status_check CHECK (
    status IN ('draft', 'processing', 'paid', 'failed')
  )
);

ALTER TABLE public.payout_batches ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.payout_failures (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id   UUID NOT NULL REFERENCES public.payouts(id),
  reason      TEXT NOT NULL,
  raw_error   JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payout_failures ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.payout_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id   UUID,
  batch_id    UUID,
  actor_id    UUID NOT NULL,
  action      TEXT NOT NULL,
  old_status  TEXT,
  new_status  TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payout_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS: admin only for payout ops
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payouts' AND policyname = 'payouts_admin_all') THEN
    CREATE POLICY "payouts_admin_all" ON public.payouts FOR ALL USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payout_batches' AND policyname = 'payout_batches_admin_all') THEN
    CREATE POLICY "payout_batches_admin_all" ON public.payout_batches FOR ALL USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payout_failures' AND policyname = 'payout_failures_admin_all') THEN
    CREATE POLICY "payout_failures_admin_all" ON public.payout_failures FOR ALL USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payout_audit_log' AND policyname = 'payout_audit_log_admin_all') THEN
    CREATE POLICY "payout_audit_log_admin_all" ON public.payout_audit_log FOR ALL USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Add facilitator self-view for own payouts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payouts' AND policyname = 'payouts_facilitator_view') THEN
    CREATE POLICY "payouts_facilitator_view" ON public.payouts FOR SELECT USING (auth.uid() = facilitator_id);
  END IF;
END $$;

-- Triggers for updated_at
CREATE TRIGGER payouts_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER payout_batches_updated_at
  BEFORE UPDATE ON public.payout_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 4. Function: record payout audit ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.record_payout_audit(
  p_payout_id   UUID,
  p_batch_id    UUID,
  p_actor_id    UUID,
  p_action      TEXT,
  p_old_status  TEXT,
  p_new_status  TEXT,
  p_note        TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.payout_audit_log (payout_id, batch_id, actor_id, action, old_status, new_status, note)
  VALUES (p_payout_id, p_batch_id, p_actor_id, p_action, p_old_status, p_new_status, p_note);
END;
$$;

-- ── 5. Function: update payout status with audit ────────────────────────────
CREATE OR REPLACE FUNCTION public.update_payout_status(
  p_payout_id   UUID,
  p_new_status  TEXT,
  p_actor_id    UUID,
  p_note        TEXT DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status TEXT;
  v_batch_id   UUID;
BEGIN
  IF NOT public.has_role(p_actor_id, 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT status, batch_id INTO v_old_status, v_batch_id
  FROM public.payouts WHERE id = p_payout_id;

  IF NOT FOUND THEN RETURN false; END IF;

  UPDATE public.payouts
  SET status = p_new_status,
      processed_at = CASE WHEN p_new_status = 'paid' THEN now() ELSE processed_at END,
      updated_at = now()
  WHERE id = p_payout_id;

  PERFORM public.record_payout_audit(p_payout_id, v_batch_id, p_actor_id, 'status_change', v_old_status, p_new_status, p_note);
  RETURN true;
END;
$$;

-- ── 6. Function: create_payout_batch ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_payout_batch(
  p_actor_id    UUID,
  p_label       TEXT,
  p_payout_ids  UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_id    UUID;
  v_total       NUMERIC := 0;
  v_count       INTEGER := 0;
BEGIN
  IF NOT public.has_role(p_actor_id, 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT SUM(amount), COUNT(*) INTO v_total, v_count
  FROM public.payouts
  WHERE id = ANY(p_payout_ids) AND status = 'pending';

  INSERT INTO public.payout_batches (label, total_amount, payout_count, created_by)
  VALUES (p_label, v_total, v_count, p_actor_id)
  RETURNING id INTO v_batch_id;

  UPDATE public.payouts
  SET batch_id = v_batch_id, status = 'processing', updated_at = now()
  WHERE id = ANY(p_payout_ids) AND status = 'pending';

  PERFORM public.record_payout_audit(NULL, v_batch_id, p_actor_id, 'batch_created', NULL, 'processing', p_label);

  RETURN v_batch_id;
END;
$$;

-- ── 7. Function: scan_reactivation_candidates ───────────────────────────────
CREATE OR REPLACE FUNCTION public.scan_reactivation_candidates()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  r RECORD;
BEGIN
  -- Case 1: onboarding_incomplete (signup > 24h, onboarding_done = false)
  FOR r IN
    SELECT id FROM public.profiles
    WHERE onboarding_done = false
      AND created_at < now() - interval '24 hours'
  LOOP
    INSERT INTO public.reactivation_jobs (user_id, trigger_type, trigger_entity, metadata)
    VALUES (r.id, 'onboarding_incomplete', 'profile', jsonb_build_object('profile_id', r.id))
    ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
  END LOOP;

  -- Case 2: mission_no_intro (mission > 3 days, no intro yet for that mission)
  FOR r IN
    SELECT DISTINCT m.entreprise_id, m.id as mission_id
    FROM public.missions m
    WHERE m.created_at < now() - interval '3 days'
      AND NOT EXISTS (
        SELECT 1 FROM public.introductions i WHERE i.mission_id = m.id
      )
      AND m.statut = 'active'
  LOOP
    INSERT INTO public.reactivation_jobs (user_id, trigger_type, trigger_entity, entity_id, metadata)
    VALUES (r.entreprise_id, 'mission_no_intro', 'mission', r.mission_id, jsonb_build_object('mission_id', r.mission_id))
    ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
  END LOOP;

  -- Case 3: intro_not_validated (intro > 7 days, still en_attente)
  FOR r IN
    SELECT DISTINCT i.facilitateur_id, i.id as intro_id
    FROM public.introductions i
    WHERE i.statut = 'en_attente'
      AND i.created_at < now() - interval '7 days'
  LOOP
    INSERT INTO public.reactivation_jobs (user_id, trigger_type, trigger_entity, entity_id, metadata)
    VALUES (r.facilitateur_id, 'intro_not_validated', 'introduction', r.intro_id, jsonb_build_object('intro_id', r.intro_id))
    ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ── 8. Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS analytics_events_event_type_idx ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS analytics_events_user_created_idx ON public.analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reactivation_jobs_status_idx ON public.reactivation_jobs(status, scheduled_at);
CREATE INDEX IF NOT EXISTS payouts_facilitator_status_idx ON public.payouts(facilitator_id, status);
CREATE INDEX IF NOT EXISTS payouts_batch_idx ON public.payouts(batch_id) WHERE batch_id IS NOT NULL;
