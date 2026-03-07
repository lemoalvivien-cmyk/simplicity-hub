
-- ══════════════════════════════════════════════════════════
-- 1. BUSINESS GRAPH — graph_edges
-- ══════════════════════════════════════════════════════════
CREATE TABLE public.graph_edges (
  id                UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_entity_type  TEXT NOT NULL,
  from_entity_id    UUID NOT NULL,
  to_entity_type    TEXT NOT NULL,
  to_entity_id      UUID NOT NULL,
  relationship_type TEXT NOT NULL,
  strength_score    INTEGER NOT NULL DEFAULT 50,
  source            TEXT NOT NULL DEFAULT 'platform',
  user_id           UUID NOT NULL,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.graph_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their graph edges"
  ON public.graph_edges FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_graph_edges_from ON public.graph_edges (from_entity_type, from_entity_id);
CREATE INDEX idx_graph_edges_to   ON public.graph_edges (to_entity_type, to_entity_id);

CREATE TRIGGER update_graph_edges_updated_at
  BEFORE UPDATE ON public.graph_edges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ══════════════════════════════════════════════════════════
-- 2. ENTITY RESOLUTION — company_aliases
-- ══════════════════════════════════════════════════════════
CREATE TABLE public.company_aliases (
  id                   UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  canonical_company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  alias_name           TEXT NOT NULL,
  alias_domain         TEXT,
  confidence           INTEGER NOT NULL DEFAULT 80,
  source               TEXT NOT NULL DEFAULT 'manual',
  created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.company_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view company aliases"
  ON public.company_aliases FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert company aliases"
  ON public.company_aliases FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_company_aliases_canonical ON public.company_aliases (canonical_company_id);

-- ══════════════════════════════════════════════════════════
-- 3. PROOF OF INTRODUCTION LEDGER — introduction_proofs
-- ══════════════════════════════════════════════════════════
CREATE TABLE public.introduction_proofs (
  id                UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  introduction_id   UUID NOT NULL REFERENCES public.introductions(id) ON DELETE CASCADE,
  company_id        UUID,
  facilitator_id    UUID NOT NULL,
  requested_by      UUID,
  validation_status TEXT NOT NULL DEFAULT 'en_attente',
  proof_status      TEXT NOT NULL DEFAULT 'brouillon',
  proof_context     TEXT,
  linked_gain_id    UUID,
  linked_review_id  UUID,
  last_event_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finalized_at      TIMESTAMP WITH TIME ZONE,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.introduction_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facilitators can manage their introduction proofs"
  ON public.introduction_proofs FOR ALL
  USING (auth.uid() = facilitator_id)
  WITH CHECK (auth.uid() = facilitator_id);

CREATE POLICY "Companies can view introduction proofs"
  ON public.introduction_proofs FOR SELECT
  USING (auth.uid() = company_id OR auth.uid() = requested_by);

CREATE INDEX idx_intro_proofs_intro   ON public.introduction_proofs (introduction_id);
CREATE INDEX idx_intro_proofs_fac     ON public.introduction_proofs (facilitator_id);

CREATE TRIGGER update_introduction_proofs_updated_at
  BEFORE UPDATE ON public.introduction_proofs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ══════════════════════════════════════════════════════════
-- 4. MATCHING ENGINE — opportunity_matches
-- ══════════════════════════════════════════════════════════
CREATE TABLE public.opportunity_matches (
  id                   UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id       UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  facilitator_id       UUID NOT NULL,
  user_id              UUID NOT NULL,
  match_score          INTEGER NOT NULL DEFAULT 50,
  match_reason_summary TEXT,
  sector_fit_score     INTEGER NOT NULL DEFAULT 50,
  geo_fit_score        INTEGER NOT NULL DEFAULT 50,
  language_fit_score   INTEGER NOT NULL DEFAULT 50,
  trust_fit_score      INTEGER NOT NULL DEFAULT 50,
  status               TEXT NOT NULL DEFAULT 'suggested',
  created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.opportunity_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their opportunity matches"
  ON public.opportunity_matches FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Facilitators can view matches they appear in"
  ON public.opportunity_matches FOR SELECT
  USING (auth.uid() = facilitator_id);

CREATE INDEX idx_opp_matches_score ON public.opportunity_matches (match_score DESC);

CREATE TRIGGER update_opportunity_matches_updated_at
  BEFORE UPDATE ON public.opportunity_matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ══════════════════════════════════════════════════════════
-- 5. LANGUAGE + CORRIDOR FIELDS
-- ══════════════════════════════════════════════════════════
ALTER TABLE public.facilitateur_profiles
  ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS business_corridors TEXT[] DEFAULT '{}';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS ui_language TEXT DEFAULT 'fr';

ALTER TABLE public.entreprise_profiles
  ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS business_corridors TEXT[] DEFAULT '{}';
