-- ── openclaw_recommendations ─────────────────────────────────────────────────
CREATE TABLE public.openclaw_recommendations (
  id               uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid        NOT NULL,
  agent_name       text        NOT NULL DEFAULT 'stratege',
  type             text        NOT NULL,
  title            text        NOT NULL,
  summary          text        NOT NULL,
  linked_entity_type text,
  linked_entity_id   uuid,
  priority         text        NOT NULL DEFAULT 'normale',
  status           text        NOT NULL DEFAULT 'nouvelle',
  recommended_action text,
  payload          jsonb                DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.openclaw_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their recommendations"
  ON public.openclaw_recommendations FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_openclaw_recommendations_updated_at
  BEFORE UPDATE ON public.openclaw_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── openclaw_briefs ───────────────────────────────────────────────────────────
CREATE TABLE public.openclaw_briefs (
  id               uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid        NOT NULL,
  title            text        NOT NULL,
  summary          text        NOT NULL,
  priority_items   jsonb               DEFAULT '[]'::jsonb,
  suggested_actions jsonb              DEFAULT '[]'::jsonb,
  stats            jsonb               DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.openclaw_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their briefs"
  ON public.openclaw_briefs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_openclaw_briefs_user_date ON public.openclaw_briefs (user_id, created_at DESC);