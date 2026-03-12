
-- ═══════════════════════════════════════════════════════════════════
-- RLS HARDENING — payouts, gains, lead_intakes, facilitateur_profiles
-- IDOR proof: each user sees/touches only their own rows
-- Admin override via has_role('admin')
-- ═══════════════════════════════════════════════════════════════════

-- ── Rate-limit tracking table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL,
  function_name text       NOT NULL,
  window_start  timestamptz NOT NULL DEFAULT date_trunc('minute', now()),
  request_count int        NOT NULL DEFAULT 1,
  UNIQUE (user_id, function_name, window_start)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own rate limit rows"
  ON public.api_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages rate limits"
  ON public.api_rate_limits FOR ALL
  USING (true) WITH CHECK (true);

-- ── Function: check + increment rate limit ───────────────────────────
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id      uuid,
  p_function_name text,
  p_max_per_min  int DEFAULT 100
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window timestamptz := date_trunc('minute', now());
  v_count  int;
BEGIN
  INSERT INTO public.api_rate_limits (user_id, function_name, window_start, request_count)
  VALUES (p_user_id, p_function_name, v_window, 1)
  ON CONFLICT (user_id, function_name, window_start)
  DO UPDATE SET request_count = api_rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  RETURN v_count <= p_max_per_min;
END;
$$;

-- ── Clean old rate limit windows ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits() RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.api_rate_limits
  WHERE window_start < now() - interval '10 minutes';
$$;

-- ════════════════════════════════════════════════════════════════════
-- 1. TABLE: payouts
-- ════════════════════════════════════════════════════════════════════
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Facilitators see own payouts"    ON public.payouts;
DROP POLICY IF EXISTS "Facilitators insert own payouts" ON public.payouts;
DROP POLICY IF EXISTS "Facilitators update own payouts" ON public.payouts;
DROP POLICY IF EXISTS "Admin full access payouts"       ON public.payouts;
DROP POLICY IF EXISTS "Service role inserts payouts"    ON public.payouts;
DROP POLICY IF EXISTS "Facilitators update own withdrawal request" ON public.payouts;
DROP POLICY IF EXISTS "Admin delete payouts"            ON public.payouts;

CREATE POLICY "Facilitators see own payouts"
  ON public.payouts FOR SELECT
  USING (
    auth.uid() = facilitator_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Service role inserts payouts"
  ON public.payouts FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Facilitators update own withdrawal request"
  ON public.payouts FOR UPDATE
  USING (
    auth.uid() = facilitator_id
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    auth.uid() = facilitator_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admin delete payouts"
  ON public.payouts FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ════════════════════════════════════════════════════════════════════
-- 2. TABLE: gains
-- ════════════════════════════════════════════════════════════════════
ALTER TABLE public.gains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Facilitators see own gains"    ON public.gains;
DROP POLICY IF EXISTS "Facilitators insert own gains" ON public.gains;
DROP POLICY IF EXISTS "Facilitators update own gains" ON public.gains;
DROP POLICY IF EXISTS "Admin full access gains"       ON public.gains;
DROP POLICY IF EXISTS "Entreprise sees linked gains"  ON public.gains;
DROP POLICY IF EXISTS "Admin insert gains"            ON public.gains;
DROP POLICY IF EXISTS "Admin update gains"            ON public.gains;
DROP POLICY IF EXISTS "Admin delete gains"            ON public.gains;

CREATE POLICY "Facilitators see own gains"
  ON public.gains FOR SELECT
  USING (
    auth.uid() = facilitateur_id
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = gains.mission_id
        AND m.entreprise_id = auth.uid()
    )
  );

CREATE POLICY "Admin insert gains"
  ON public.gains FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin update gains"
  ON public.gains FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete gains"
  ON public.gains FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ════════════════════════════════════════════════════════════════════
-- 3. TABLE: lead_intakes
-- ════════════════════════════════════════════════════════════════════
ALTER TABLE public.lead_intakes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own lead intakes"    ON public.lead_intakes;
DROP POLICY IF EXISTS "Users insert own lead intakes" ON public.lead_intakes;
DROP POLICY IF EXISTS "Users update own lead intakes" ON public.lead_intakes;
DROP POLICY IF EXISTS "Admin full access lead_intakes" ON public.lead_intakes;
DROP POLICY IF EXISTS "Admin delete lead intakes"     ON public.lead_intakes;

CREATE POLICY "Users see own lead intakes"
  ON public.lead_intakes FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users insert own lead intakes"
  ON public.lead_intakes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users update own lead intakes"
  ON public.lead_intakes FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admin delete lead intakes"
  ON public.lead_intakes FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ════════════════════════════════════════════════════════════════════
-- 4. TABLE: facilitateur_profiles
-- ════════════════════════════════════════════════════════════════════
ALTER TABLE public.facilitateur_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active facilitator profiles" ON public.facilitateur_profiles;
DROP POLICY IF EXISTS "Facilitators manage own profile"             ON public.facilitateur_profiles;
DROP POLICY IF EXISTS "Admin full access facilitateur_profiles"     ON public.facilitateur_profiles;
DROP POLICY IF EXISTS "Public view active facilitateur profiles"    ON public.facilitateur_profiles;
DROP POLICY IF EXISTS "Facilitator insert own profile"              ON public.facilitateur_profiles;
DROP POLICY IF EXISTS "Facilitator update own profile"              ON public.facilitateur_profiles;
DROP POLICY IF EXISTS "Admin delete facilitateur profiles"          ON public.facilitateur_profiles;

CREATE POLICY "Public view active facilitateur profiles"
  ON public.facilitateur_profiles FOR SELECT
  USING (
    statut = 'actif'
    OR auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Facilitator insert own profile"
  ON public.facilitateur_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Facilitator update own profile"
  ON public.facilitateur_profiles FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admin delete facilitateur profiles"
  ON public.facilitateur_profiles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ════════════════════════════════════════════════════════════════════
-- 5. payout_audit_log — read-only for owner + admin
-- ════════════════════════════════════════════════════════════════════
ALTER TABLE public.payout_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Facilitators see own audit log" ON public.payout_audit_log;
DROP POLICY IF EXISTS "Service inserts audit log"      ON public.payout_audit_log;

CREATE POLICY "Facilitators see own audit log"
  ON public.payout_audit_log FOR SELECT
  USING (
    auth.uid() = actor_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Service inserts audit log"
  ON public.payout_audit_log FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ════════════════════════════════════════════════════════════════════
-- Indexes for fast user-scoped lookups
-- ════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_payouts_facilitator_id    ON public.payouts (facilitator_id);
CREATE INDEX IF NOT EXISTS idx_gains_facilitateur_id     ON public.gains (facilitateur_id);
CREATE INDEX IF NOT EXISTS idx_lead_intakes_user_id      ON public.lead_intakes (user_id);
CREATE INDEX IF NOT EXISTS idx_facilitateur_profiles_uid ON public.facilitateur_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_fn_win   ON public.api_rate_limits (user_id, function_name, window_start);
