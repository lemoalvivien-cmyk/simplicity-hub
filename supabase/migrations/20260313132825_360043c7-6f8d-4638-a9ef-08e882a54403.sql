
-- ══════════════════════════════════════════════════════════════════
-- ETERNAL TRUST GRAPH (ETG) v1 — Palantir Gotham Architecture 2026
-- ══════════════════════════════════════════════════════════════════

-- ── 1. ETG PERSONS (anonymisés par hash) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.etg_persons (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_hash           TEXT        NOT NULL UNIQUE,
  trust_index         NUMERIC     NOT NULL DEFAULT 50 CHECK (trust_index >= 0 AND trust_index <= 100),
  reliability_score   NUMERIC     NOT NULL DEFAULT 50 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  intro_count         INT         NOT NULL DEFAULT 0,
  validated_count     INT         NOT NULL DEFAULT 0,
  deal_count          INT         NOT NULL DEFAULT 0,
  total_commission    NUMERIC     NOT NULL DEFAULT 0,
  sector              TEXT,
  zone                TEXT,
  language            TEXT,
  last_activity_at    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. ETG COMPANIES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.etg_companies (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id        TEXT        NOT NULL UNIQUE,
  sector              TEXT,
  zone                TEXT,
  deal_count          INT         NOT NULL DEFAULT 0,
  deal_velocity_days  NUMERIC     DEFAULT NULL,
  trust_index         NUMERIC     NOT NULL DEFAULT 50 CHECK (trust_index >= 0 AND trust_index <= 100),
  revenue_signal      NUMERIC     DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. ETG LINKS (INTRODUCED_BY / TRUSTS / DEAL_CLOSED) ──────────
CREATE TABLE IF NOT EXISTS public.etg_links (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL,
  from_id               UUID        NOT NULL,
  from_type             TEXT        NOT NULL CHECK (from_type IN ('person','company')),
  to_id                 UUID        NOT NULL,
  to_type               TEXT        NOT NULL CHECK (to_type IN ('person','company')),
  link_type             TEXT        NOT NULL CHECK (link_type IN ('INTRODUCED_BY','TRUSTS','DEAL_CLOSED')),
  trust_score           NUMERIC     NOT NULL DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  hidden_link_strength  NUMERIC     NOT NULL DEFAULT 0  CHECK (hidden_link_strength >= 0 AND hidden_link_strength <= 100),
  commission_rate       NUMERIC     NOT NULL DEFAULT 0.07,
  commission_amount     NUMERIC     NOT NULL DEFAULT 0,
  weight                NUMERIC     NOT NULL DEFAULT 1,
  source                TEXT,
  metadata              JSONB       NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. ETG HIDDEN LINKS (liens inférés) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.etg_hidden_links (
  id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID        NOT NULL,
  person_a_id                UUID        REFERENCES public.etg_persons(id) ON DELETE CASCADE,
  person_b_id                UUID        REFERENCES public.etg_persons(id) ON DELETE CASCADE,
  strength                   NUMERIC     NOT NULL DEFAULT 0 CHECK (strength >= 0 AND strength <= 100),
  confidence                 NUMERIC     NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  inference_path             JSONB       NOT NULL DEFAULT '[]',
  predicted_deal_probability NUMERIC     NOT NULL DEFAULT 0 CHECK (predicted_deal_probability >= 0 AND predicted_deal_probability <= 1),
  inferred_by                TEXT        DEFAULT 'etg-aggregate',
  expires_at                 TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, person_a_id, person_b_id)
);

-- ── 5. ETG OPPORTUNITIES (prédictions 6-12 semaines) ─────────────
CREATE TABLE IF NOT EXISTS public.etg_opportunities (
  id                           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                      UUID        NOT NULL,
  target_person_id             UUID        REFERENCES public.etg_persons(id) ON DELETE SET NULL,
  target_company_id            UUID        REFERENCES public.etg_companies(id) ON DELETE SET NULL,
  predicted_close_weeks_min    INT         NOT NULL DEFAULT 6,
  predicted_close_weeks_max    INT         NOT NULL DEFAULT 12,
  confidence_score             NUMERIC     NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  precision_delta              NUMERIC     NOT NULL DEFAULT 0,
  trust_path                   JSONB       NOT NULL DEFAULT '[]',
  recommended_intro_person_id  UUID        REFERENCES public.etg_persons(id) ON DELETE SET NULL,
  deal_value_estimate          NUMERIC,
  commission_estimate          NUMERIC,
  sector                       TEXT,
  zone                         TEXT,
  status                       TEXT        NOT NULL DEFAULT 'predicted' CHECK (status IN ('predicted','active','won','lost','stale')),
  reasoning                    TEXT,
  scoring_version              TEXT        NOT NULL DEFAULT 'v1',
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 6. ETG AUDIT LOG ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.etg_audit_log (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID,
  action        TEXT        NOT NULL,
  entity_type   TEXT,
  entity_id     UUID,
  before_state  JSONB,
  after_state   JSONB,
  ip_hash       TEXT,
  function_name TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ══ INDEXES ══════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_etg_persons_user_id      ON public.etg_persons(user_id);
CREATE INDEX IF NOT EXISTS idx_etg_persons_trust_index  ON public.etg_persons(trust_index DESC);
CREATE INDEX IF NOT EXISTS idx_etg_persons_sector_zone  ON public.etg_persons(sector, zone);
CREATE INDEX IF NOT EXISTS idx_etg_links_user_id        ON public.etg_links(user_id);
CREATE INDEX IF NOT EXISTS idx_etg_links_from           ON public.etg_links(from_id, from_type);
CREATE INDEX IF NOT EXISTS idx_etg_links_to             ON public.etg_links(to_id, to_type);
CREATE INDEX IF NOT EXISTS idx_etg_links_type           ON public.etg_links(link_type);
CREATE INDEX IF NOT EXISTS idx_etg_links_trust          ON public.etg_links(trust_score DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_etg_links_unique  ON public.etg_links(user_id, from_id, to_id, link_type);
CREATE INDEX IF NOT EXISTS idx_etg_hl_user_id           ON public.etg_hidden_links(user_id);
CREATE INDEX IF NOT EXISTS idx_etg_hl_strength          ON public.etg_hidden_links(strength DESC);
CREATE INDEX IF NOT EXISTS idx_etg_hl_prob              ON public.etg_hidden_links(predicted_deal_probability DESC);
CREATE INDEX IF NOT EXISTS idx_etg_opp_user_id          ON public.etg_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_etg_opp_confidence       ON public.etg_opportunities(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_etg_opp_status           ON public.etg_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_etg_opp_sector_zone      ON public.etg_opportunities(sector, zone);
CREATE INDEX IF NOT EXISTS idx_etg_audit_user           ON public.etg_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_etg_audit_action         ON public.etg_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_etg_audit_created        ON public.etg_audit_log(created_at DESC);

-- ══ RLS ══════════════════════════════════════════════════════════
ALTER TABLE public.etg_persons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etg_companies      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etg_links          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etg_hidden_links   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etg_opportunities  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etg_audit_log      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "etg_persons_select_auth"   ON public.etg_persons FOR SELECT TO authenticated USING (true);
CREATE POLICY "etg_persons_insert_own"    ON public.etg_persons FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "etg_persons_update_own"    ON public.etg_persons FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "etg_companies_select_auth" ON public.etg_companies FOR SELECT TO authenticated USING (true);

CREATE POLICY "etg_links_select_own"      ON public.etg_links FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "etg_links_insert_own"      ON public.etg_links FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "etg_links_update_own"      ON public.etg_links FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "etg_links_delete_own"      ON public.etg_links FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "etg_hl_select_own"         ON public.etg_hidden_links FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "etg_hl_insert_own"         ON public.etg_hidden_links FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "etg_hl_update_own"         ON public.etg_hidden_links FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "etg_hl_delete_own"         ON public.etg_hidden_links FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "etg_opp_select_own"        ON public.etg_opportunities FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "etg_opp_insert_own"        ON public.etg_opportunities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "etg_opp_update_own"        ON public.etg_opportunities FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "etg_opp_delete_own"        ON public.etg_opportunities FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "etg_audit_select_admin"    ON public.etg_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "etg_audit_insert_own"      ON public.etg_audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ══ TRIGGERS updated_at ═══════════════════════════════════════════
CREATE OR REPLACE TRIGGER etg_persons_updated_at
  BEFORE UPDATE ON public.etg_persons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER etg_companies_updated_at
  BEFORE UPDATE ON public.etg_companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER etg_links_updated_at
  BEFORE UPDATE ON public.etg_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER etg_hidden_links_updated_at
  BEFORE UPDATE ON public.etg_hidden_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER etg_opportunities_updated_at
  BEFORE UPDATE ON public.etg_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ══ HELPER: AUDIT ════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.etg_write_audit(
  p_user_id     UUID,
  p_action      TEXT,
  p_entity_type TEXT,
  p_entity_id   UUID,
  p_before      JSONB DEFAULT NULL,
  p_after       JSONB DEFAULT NULL,
  p_fn          TEXT  DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.etg_audit_log
    (user_id, action, entity_type, entity_id, before_state, after_state, function_name)
  VALUES
    (p_user_id, p_action, p_entity_type, p_entity_id, p_before, p_after, p_fn);
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

-- ══ ETG PREDICTIVE QUERY ════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.etg_predict_opportunities(
  p_user_id        UUID,
  p_weeks_min      INT     DEFAULT 6,
  p_weeks_max      INT     DEFAULT 12,
  p_min_confidence NUMERIC DEFAULT 20,
  p_limit          INT     DEFAULT 20
)
RETURNS TABLE (
  opportunity_id       UUID,
  confidence_score     NUMERIC,
  precision_delta      NUMERIC,
  target_sector        TEXT,
  target_zone          TEXT,
  close_weeks_min      INT,
  close_weeks_max      INT,
  deal_value_estimate  NUMERIC,
  commission_estimate  NUMERIC,
  reasoning            TEXT,
  recommended_intro_id UUID,
  trust_path           JSONB,
  status               TEXT,
  created_at           TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_user_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'ETG: Access denied';
  END IF;
  RETURN QUERY
  SELECT
    o.id,
    o.confidence_score,
    o.precision_delta,
    COALESCE(c.sector, o.sector),
    COALESCE(c.zone,   o.zone),
    o.predicted_close_weeks_min,
    o.predicted_close_weeks_max,
    o.deal_value_estimate,
    o.commission_estimate,
    o.reasoning,
    o.recommended_intro_person_id,
    o.trust_path,
    o.status,
    o.created_at
  FROM public.etg_opportunities o
  LEFT JOIN public.etg_companies c ON c.id = o.target_company_id
  WHERE o.user_id = p_user_id
    AND o.status IN ('predicted','active')
    AND o.confidence_score >= p_min_confidence
    AND o.predicted_close_weeks_min >= p_weeks_min
    AND o.predicted_close_weeks_max <= p_weeks_max
  ORDER BY o.confidence_score DESC, o.precision_delta DESC
  LIMIT p_limit;
END;
$$;

-- ══ ETG GRAPH STATS ══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.etg_graph_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result JSONB;
BEGIN
  IF p_user_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'ETG: Access denied';
  END IF;
  SELECT jsonb_build_object(
    'total_persons',      (SELECT COUNT(*) FROM public.etg_persons),
    'total_companies',    (SELECT COUNT(*) FROM public.etg_companies),
    'total_links',        (SELECT COUNT(*) FROM public.etg_links        WHERE user_id = p_user_id),
    'deals_closed',       (SELECT COUNT(*) FROM public.etg_links        WHERE user_id = p_user_id AND link_type = 'DEAL_CLOSED'),
    'total_commission',   (SELECT COALESCE(SUM(commission_amount),0) FROM public.etg_links WHERE user_id = p_user_id AND link_type = 'DEAL_CLOSED'),
    'avg_trust_score',    (SELECT COALESCE(ROUND(AVG(trust_score),1),0) FROM public.etg_links WHERE user_id = p_user_id),
    'hidden_links',       (SELECT COUNT(*) FROM public.etg_hidden_links  WHERE user_id = p_user_id),
    'open_opportunities', (SELECT COUNT(*) FROM public.etg_opportunities WHERE user_id = p_user_id AND status IN ('predicted','active')),
    'top_confidence',     (SELECT MAX(confidence_score) FROM public.etg_opportunities WHERE user_id = p_user_id),
    'computed_at',        now()
  ) INTO v_result;
  RETURN v_result;
END;
$$;
