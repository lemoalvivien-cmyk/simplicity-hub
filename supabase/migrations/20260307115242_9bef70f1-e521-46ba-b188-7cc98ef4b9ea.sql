
-- ══════════════════════════════════════════════════════════════
--  DEAL RADAR — Companies, Signals, Opportunities
-- ══════════════════════════════════════════════════════════════

-- ── 1. COMPANIES ─────────────────────────────────────────────
CREATE TABLE public.companies (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  domain      TEXT,
  industry    TEXT,
  location    TEXT,
  description TEXT,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view companies"
  ON public.companies FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage companies"
  ON public.companies FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 2. SIGNALS ───────────────────────────────────────────────
CREATE TABLE public.signals (
  id                 UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            UUID NOT NULL,
  company_name       TEXT NOT NULL,
  company_id         UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  signal_type        TEXT NOT NULL DEFAULT 'autre',
  source             TEXT NOT NULL DEFAULT 'manuel',
  signal_strength    INTEGER NOT NULL DEFAULT 50,
  detected_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  raw_summary        TEXT,
  normalized_summary TEXT,
  status             TEXT NOT NULL DEFAULT 'nouveau',
  created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their signals"
  ON public.signals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_signals_updated_at
  BEFORE UPDATE ON public.signals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 3. OPPORTUNITIES ─────────────────────────────────────────
CREATE TABLE public.opportunities (
  id                        UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                   UUID NOT NULL,
  company_name              TEXT NOT NULL,
  company_id                UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  signal_id                 UUID REFERENCES public.signals(id) ON DELETE SET NULL,
  origin                    TEXT NOT NULL DEFAULT 'radar',
  summary                   TEXT NOT NULL,
  intent_score              INTEGER NOT NULL DEFAULT 50,
  intent_label              TEXT NOT NULL DEFAULT 'moyen',
  status                    TEXT NOT NULL DEFAULT 'nouvelle',
  recommended_sector        TEXT,
  recommended_next_action   TEXT,
  dossier_match_label       TEXT,
  dossier_match_reason      TEXT,
  suggested_facilitators    JSONB DEFAULT '[]'::jsonb,
  openclaw_recommendation_id UUID,
  created_at                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their opportunities"
  ON public.opportunities FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX idx_signals_user_id      ON public.signals(user_id);
CREATE INDEX idx_signals_status       ON public.signals(status);
CREATE INDEX idx_signals_detected_at  ON public.signals(detected_at DESC);
CREATE INDEX idx_opportunities_user_id      ON public.opportunities(user_id);
CREATE INDEX idx_opportunities_status       ON public.opportunities(status);
CREATE INDEX idx_opportunities_intent_score ON public.opportunities(intent_score DESC);
CREATE INDEX idx_opportunities_created_at   ON public.opportunities(created_at DESC);
