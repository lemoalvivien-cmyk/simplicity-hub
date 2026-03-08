-- Add ai_generated flag to openclaw_recommendations
ALTER TABLE public.openclaw_recommendations
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT false;

-- Add ai_generated flag to openclaw_briefs (for AI-enhanced daily briefs)
ALTER TABLE public.openclaw_briefs
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT false;

-- Index for fast dashboard badge query
CREATE INDEX IF NOT EXISTS idx_openclaw_rec_user_ai_status
  ON public.openclaw_recommendations (user_id, ai_generated, status)
  WHERE ai_generated = true;