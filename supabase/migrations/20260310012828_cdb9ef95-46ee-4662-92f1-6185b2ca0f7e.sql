-- Add AI scoring columns to lead_intakes table
ALTER TABLE public.lead_intakes
  ADD COLUMN IF NOT EXISTS ai_score      smallint        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_label      text            DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_reasoning  text            DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_scored_at  timestamptz     DEFAULT NULL;

-- Index for fast filtering / ordering by AI score
CREATE INDEX IF NOT EXISTS idx_lead_intakes_ai_score
  ON public.lead_intakes (ai_score DESC NULLS LAST);
