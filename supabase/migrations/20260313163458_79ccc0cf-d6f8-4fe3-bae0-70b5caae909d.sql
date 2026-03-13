
-- ══════════════════════════════════════════════════════════════════
-- ETG v2 — pgvector + GIN indexes + shortest_path_trust recursive CTE
-- ══════════════════════════════════════════════════════════════════

-- 1. Enable pgvector extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add vector(1536) embedding columns for semantic similarity search
ALTER TABLE public.etg_persons
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

ALTER TABLE public.etg_companies
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

ALTER TABLE public.etg_opportunities
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. GIN index on etg_links metadata for fast JSONB traversal
CREATE INDEX IF NOT EXISTS idx_etg_links_metadata_gin
  ON public.etg_links USING GIN (metadata);

-- 4. HNSW vector indexes for fast ANN search (cosine distance)
CREATE INDEX IF NOT EXISTS idx_etg_persons_embedding_hnsw
  ON public.etg_persons USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_etg_companies_embedding_hnsw
  ON public.etg_companies USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_etg_opportunities_embedding_hnsw
  ON public.etg_opportunities USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 5. B-tree indexes on hot query columns
CREATE INDEX IF NOT EXISTS idx_etg_links_user_trust
  ON public.etg_links (user_id, trust_score DESC);

CREATE INDEX IF NOT EXISTS idx_etg_links_from_to
  ON public.etg_links (from_id, to_id, link_type);

CREATE INDEX IF NOT EXISTS idx_etg_hidden_links_user_prob
  ON public.etg_hidden_links (user_id, predicted_deal_probability DESC);

CREATE INDEX IF NOT EXISTS idx_etg_opportunities_user_conf
  ON public.etg_opportunities (user_id, confidence_score DESC, status);

CREATE INDEX IF NOT EXISTS idx_etg_persons_user_id
  ON public.etg_persons (user_id);

CREATE INDEX IF NOT EXISTS idx_etg_persons_anon_hash
  ON public.etg_persons (anon_hash);

-- 6. shortest_path_trust: Recursive CTE BFS traversal (up to 5 hops, <50ms)
CREATE OR REPLACE FUNCTION public.shortest_path_trust(
  p_user_id     uuid,
  p_from_hash   text,
  p_to_hash     text,
  p_max_hops    int  DEFAULT 5,
  p_min_trust   int  DEFAULT 30
)
RETURNS TABLE (
  hop              int,
  node_id          uuid,
  node_hash        text,
  link_type        text,
  trust_score      int,
  cumulative_trust numeric,
  path_ids         uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_from_id uuid;
  v_to_id   uuid;
BEGIN
  IF p_user_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'ETG shortest_path: Access denied';
  END IF;

  SELECT id INTO v_from_id FROM public.etg_persons WHERE anon_hash = p_from_hash LIMIT 1;
  SELECT id INTO v_to_id   FROM public.etg_persons WHERE anon_hash = p_to_hash   LIMIT 1;

  IF v_from_id IS NULL OR v_to_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH RECURSIVE trust_path(
    hop, current_node, target_node, link_type, trust_score,
    cumulative_trust, path_ids, visited
  ) AS (
    SELECT
      0::int,
      v_from_id,
      v_to_id,
      NULL::text,
      100::int,
      100::numeric,
      ARRAY[v_from_id]::uuid[],
      ARRAY[v_from_id]::uuid[]
    UNION ALL
    SELECT
      tp.hop + 1,
      l.to_id,
      tp.target_node,
      l.link_type,
      l.trust_score::int,
      ROUND(tp.cumulative_trust * l.trust_score / 100.0, 2),
      tp.path_ids || l.to_id,
      tp.visited  || l.to_id
    FROM trust_path tp
    JOIN public.etg_links l
      ON  l.from_id    = tp.current_node
      AND l.user_id    = p_user_id
      AND l.trust_score >= p_min_trust
      AND NOT (l.to_id = ANY(tp.visited))
    WHERE tp.hop < p_max_hops
      AND tp.current_node != tp.target_node
  )
  SELECT
    tp.hop,
    tp.current_node,
    ep.anon_hash,
    tp.link_type,
    tp.trust_score,
    tp.cumulative_trust,
    tp.path_ids
  FROM trust_path tp
  LEFT JOIN public.etg_persons ep ON ep.id = tp.current_node
  WHERE tp.current_node = v_to_id OR tp.hop = 0
  ORDER BY tp.cumulative_trust DESC, tp.hop ASC
  LIMIT 10;
END;
$$;

-- 7. vector similarity search for hidden 6-12 week opportunities
CREATE OR REPLACE FUNCTION public.etg_vector_similar_opportunities(
  p_user_id       uuid,
  p_query_vector  vector(1536),
  p_limit         int     DEFAULT 10,
  p_min_confidence numeric DEFAULT 20
)
RETURNS TABLE (
  opportunity_id      uuid,
  confidence_score    numeric,
  similarity          numeric,
  sector              text,
  zone                text,
  close_weeks_min     int,
  close_weeks_max     int,
  commission_estimate numeric,
  reasoning           text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF p_user_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'ETG vector search: Access denied';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.confidence_score,
    ROUND((1 - (o.embedding <=> p_query_vector))::numeric, 4) AS similarity,
    o.sector,
    o.zone,
    o.predicted_close_weeks_min,
    o.predicted_close_weeks_max,
    o.commission_estimate,
    o.reasoning
  FROM public.etg_opportunities o
  WHERE o.user_id          = p_user_id
    AND o.status           IN ('predicted', 'active')
    AND o.confidence_score >= p_min_confidence
    AND o.embedding        IS NOT NULL
  ORDER BY o.embedding <=> p_query_vector ASC
  LIMIT p_limit;
END;
$$;

-- 8. Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.shortest_path_trust TO authenticated;
GRANT EXECUTE ON FUNCTION public.etg_vector_similar_opportunities TO authenticated;
