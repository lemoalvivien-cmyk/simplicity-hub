
-- ═══════════════════════════════════════════════════════════════
-- GRAPH + MATCHING ENGINE MAX
-- ═══════════════════════════════════════════════════════════════

-- 1. Enrich graph_edges with scoring columns
ALTER TABLE public.graph_edges
  ADD COLUMN IF NOT EXISTS confidence_score   integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS trust_score        integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS recency_score      integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS activity_score     integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS conversion_score   integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corridor_score     integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS language_fit_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_score     integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS revenue_score      integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dispute_penalty    integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_weight       integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS last_interaction_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS metadata           jsonb DEFAULT '{}'::jsonb;

-- 2. Facilitator match scores table
CREATE TABLE IF NOT EXISTS public.facilitator_match_scores (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facilitator_user_id   uuid NOT NULL,
  user_id               uuid NOT NULL,
  sector_score          integer DEFAULT 0,
  zone_score            integer DEFAULT 0,
  corridor_score        integer DEFAULT 0,
  language_score        integer DEFAULT 0,
  trust_score           integer DEFAULT 50,
  conversion_score      integer DEFAULT 0,
  response_score        integer DEFAULT 50,
  revenue_score         integer DEFAULT 0,
  recency_score         integer DEFAULT 50,
  global_score          integer DEFAULT 0,
  best_sector           text,
  best_zone             text,
  best_corridor         text,
  best_language         text,
  explanation           text[],
  mission_types         text[],
  total_intros          integer DEFAULT 0,
  intros_validees       integer DEFAULT 0,
  total_gains           integer DEFAULT 0,
  revenue_generated     numeric DEFAULT 0,
  avg_response_days     numeric,
  computed_at           timestamp with time zone DEFAULT now(),
  created_at            timestamp with time zone DEFAULT now(),
  updated_at            timestamp with time zone DEFAULT now()
);

ALTER TABLE public.facilitator_match_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read match scores" ON public.facilitator_match_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their match scores" ON public.facilitator_match_scores
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Best path cache table
CREATE TABLE IF NOT EXISTS public.graph_best_paths (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL,
  target_type           text NOT NULL,
  target_id             text NOT NULL,
  target_label          text,
  best_facilitator_id   uuid,
  best_facilitator_name text,
  path_confidence       integer DEFAULT 0,
  path_explanation      text[],
  corridor              text,
  language              text,
  alternative_paths     jsonb DEFAULT '[]'::jsonb,
  next_action           text,
  risk_note             text,
  computed_at           timestamp with time zone DEFAULT now(),
  expires_at            timestamp with time zone DEFAULT now() + interval '24 hours',
  created_at            timestamp with time zone DEFAULT now(),
  updated_at            timestamp with time zone DEFAULT now()
);

ALTER TABLE public.graph_best_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their best paths" ON public.graph_best_paths
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Graph events feed
CREATE TABLE IF NOT EXISTS public.graph_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  event_type      text NOT NULL,
  entity_type     text,
  entity_id       uuid,
  edge_id         uuid,
  delta_weight    integer DEFAULT 0,
  summary         text,
  created_at      timestamp with time zone DEFAULT now()
);

ALTER TABLE public.graph_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their graph events" ON public.graph_events
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Function: recompute total_weight on a graph edge
CREATE OR REPLACE FUNCTION public.recompute_edge_weight(p_edge_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_edge public.graph_edges%ROWTYPE;
  v_weight integer;
BEGIN
  SELECT * INTO v_edge FROM public.graph_edges WHERE id = p_edge_id;
  IF NOT FOUND THEN RETURN; END IF;
  v_weight := ROUND(
    v_edge.confidence_score   * 0.20 +
    v_edge.trust_score        * 0.20 +
    v_edge.recency_score      * 0.15 +
    v_edge.activity_score     * 0.10 +
    v_edge.conversion_score   * 0.15 +
    v_edge.corridor_score     * 0.08 +
    v_edge.language_fit_score * 0.05 +
    v_edge.response_score     * 0.07 +
    GREATEST(0, 100 - v_edge.dispute_penalty) * 0.10 -
    COALESCE(v_edge.dispute_penalty, 0) * 0.10
  );
  UPDATE public.graph_edges
  SET total_weight = GREATEST(0, LEAST(100, v_weight)), updated_at = now()
  WHERE id = p_edge_id;
END;
$$;

-- 6. Function: upsert graph edge
CREATE OR REPLACE FUNCTION public.upsert_graph_edge(
  p_user_id       uuid,
  p_from_id       uuid,
  p_from_type     text,
  p_to_id         uuid,
  p_to_type       text,
  p_relationship  text,
  p_source        text DEFAULT 'platform',
  p_confidence    integer DEFAULT 60,
  p_trust         integer DEFAULT 50,
  p_conversion    integer DEFAULT 0,
  p_revenue       integer DEFAULT 0,
  p_metadata      jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_edge_id uuid;
BEGIN
  SELECT id INTO v_edge_id
  FROM public.graph_edges
  WHERE user_id = p_user_id
    AND from_entity_id = p_from_id
    AND to_entity_id = p_to_id
    AND relationship_type = p_relationship
  LIMIT 1;

  IF v_edge_id IS NULL THEN
    INSERT INTO public.graph_edges (
      user_id, from_entity_id, from_entity_type, to_entity_id, to_entity_type,
      relationship_type, source, strength_score,
      confidence_score, trust_score, recency_score, activity_score,
      conversion_score, revenue_score, response_score,
      last_interaction_at, metadata
    ) VALUES (
      p_user_id, p_from_id, p_from_type, p_to_id, p_to_type,
      p_relationship, p_source, p_confidence,
      p_confidence, p_trust, 80, 50,
      p_conversion, p_revenue, 50,
      now(), p_metadata
    )
    RETURNING id INTO v_edge_id;
  ELSE
    UPDATE public.graph_edges SET
      strength_score      = LEAST(100, strength_score + 5),
      confidence_score    = LEAST(100, GREATEST(confidence_score, p_confidence)),
      trust_score         = LEAST(100, GREATEST(trust_score, p_trust)),
      recency_score       = 80,
      activity_score      = LEAST(100, activity_score + 10),
      conversion_score    = LEAST(100, GREATEST(conversion_score, p_conversion)),
      revenue_score       = LEAST(100, GREATEST(revenue_score, p_revenue)),
      last_interaction_at = now(),
      updated_at          = now()
    WHERE id = v_edge_id;
  END IF;

  PERFORM public.recompute_edge_weight(v_edge_id);
  RETURN v_edge_id;
END;
$$;

-- 7. Function: compute facilitator match score
CREATE OR REPLACE FUNCTION public.compute_facilitator_match(
  p_user_id         uuid,
  p_facilitator_id  uuid,
  p_target_sector   text DEFAULT NULL,
  p_target_zone     text DEFAULT NULL,
  p_target_corridor text DEFAULT NULL,
  p_target_language text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fac             public.facilitateur_profiles%ROWTYPE;
  v_ts              public.trust_scores%ROWTYPE;
  v_total_intros    integer := 0;
  v_validees        integer := 0;
  v_total_gains     integer := 0;
  v_revenue         numeric := 0;
  v_sector_score    integer := 0;
  v_zone_score      integer := 0;
  v_corridor_score  integer := 0;
  v_lang_score      integer := 0;
  v_trust_score     integer := 50;
  v_conversion_score integer := 0;
  v_response_score  integer := 50;
  v_global          integer := 0;
  v_explanations    text[] := '{}';
BEGIN
  SELECT * INTO v_fac FROM public.facilitateur_profiles WHERE user_id = p_facilitator_id;
  SELECT * INTO v_ts  FROM public.trust_scores WHERE user_id = p_facilitator_id;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE statut = 'validee')
  INTO v_total_intros, v_validees
  FROM public.introductions WHERE facilitateur_id = p_facilitator_id;

  SELECT COUNT(*), COALESCE(SUM(montant), 0)
  INTO v_total_gains, v_revenue
  FROM public.gains WHERE facilitateur_id = p_facilitator_id AND statut IN ('valide','recu');

  IF p_target_sector IS NOT NULL AND v_fac.secteur IS NOT NULL THEN
    IF lower(v_fac.secteur) = lower(p_target_sector) THEN
      v_sector_score := 90;
      v_explanations := v_explanations || ('Spécialiste ' || p_target_sector);
    ELSIF v_fac.secteur ILIKE '%' || p_target_sector || '%' THEN
      v_sector_score := 60;
    END IF;
  ELSE
    v_sector_score := 40;
  END IF;

  IF p_target_zone IS NOT NULL AND v_fac.zone IS NOT NULL THEN
    IF lower(v_fac.zone) = lower(p_target_zone) THEN
      v_zone_score := 90;
      v_explanations := v_explanations || ('Présent en ' || p_target_zone);
    ELSIF v_fac.zone ILIKE '%' || p_target_zone || '%' THEN
      v_zone_score := 65;
    ELSE
      v_zone_score := 30;
    END IF;
  ELSE
    v_zone_score := 40;
  END IF;

  IF p_target_corridor IS NOT NULL AND v_fac.business_corridors IS NOT NULL THEN
    IF p_target_corridor = ANY(v_fac.business_corridors) THEN
      v_corridor_score := 100;
      v_explanations := v_explanations || ('Actif sur le corridor ' || p_target_corridor);
    ELSE
      v_corridor_score := 20;
    END IF;
  END IF;

  IF p_target_language IS NOT NULL AND v_fac.languages IS NOT NULL THEN
    IF p_target_language = ANY(v_fac.languages) THEN
      v_lang_score := 100;
      v_explanations := v_explanations || ('Parle ' || p_target_language);
    END IF;
  END IF;

  v_trust_score := COALESCE(v_ts.global_score, 50);
  IF v_trust_score >= 80 THEN
    v_explanations := v_explanations || ('Score de confiance ' || v_trust_score || '/100');
  END IF;

  IF v_total_intros > 0 THEN
    v_conversion_score := LEAST(100, ROUND((v_validees::numeric / v_total_intros) * 100));
    IF v_conversion_score >= 60 THEN
      v_explanations := v_explanations || (v_validees || ' intros validées sur ' || v_total_intros);
    END IF;
  END IF;

  IF v_revenue > 0 THEN
    v_explanations := v_explanations || ('Gains confirmés générés');
  END IF;

  v_response_score := COALESCE(v_fac.response_rate, 50);

  v_global := GREATEST(0, LEAST(100, ROUND(
    v_sector_score     * 0.22 +
    v_zone_score       * 0.15 +
    v_corridor_score   * 0.15 +
    v_lang_score       * 0.10 +
    v_trust_score      * 0.18 +
    v_conversion_score * 0.12 +
    v_response_score   * 0.08
  )));

  RETURN jsonb_build_object(
    'facilitator_id',   p_facilitator_id,
    'global_score',     v_global,
    'sector_score',     v_sector_score,
    'zone_score',       v_zone_score,
    'corridor_score',   v_corridor_score,
    'language_score',   v_lang_score,
    'trust_score',      v_trust_score,
    'conversion_score', v_conversion_score,
    'response_score',   v_response_score,
    'total_intros',     v_total_intros,
    'intros_validees',  v_validees,
    'total_gains',      v_total_gains,
    'revenue',          v_revenue,
    'explanation',      v_explanations
  );
END;
$$;

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_graph_edges_user_type ON public.graph_edges(user_id, relationship_type);
CREATE INDEX IF NOT EXISTS idx_graph_edges_weight ON public.graph_edges(total_weight DESC);
CREATE INDEX IF NOT EXISTS idx_graph_edges_entities ON public.graph_edges(from_entity_id, to_entity_id);
CREATE INDEX IF NOT EXISTS idx_fac_match_user ON public.facilitator_match_scores(user_id, global_score DESC);
CREATE INDEX IF NOT EXISTS idx_best_paths_user ON public.graph_best_paths(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_graph_events_user ON public.graph_events(user_id, created_at DESC);

-- 9. Triggers
CREATE OR REPLACE TRIGGER update_fac_match_scores_updated_at
  BEFORE UPDATE ON public.facilitator_match_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_best_paths_updated_at
  BEFORE UPDATE ON public.graph_best_paths
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
