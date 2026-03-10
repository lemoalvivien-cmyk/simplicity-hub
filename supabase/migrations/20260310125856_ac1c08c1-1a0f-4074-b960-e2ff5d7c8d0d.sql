-- ── Add missing columns to message_templates for prospection sequences ───────
ALTER TABLE public.message_templates
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'email';

-- backfill user_id from owner_user_id where needed
UPDATE public.message_templates SET user_id = owner_user_id WHERE user_id IS NULL;

-- ── prospection_sequences ────────────────────────────────────────────────────
CREATE TABLE public.prospection_sequences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  campaign_id UUID REFERENCES public.campagnes(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'brouillon'
              CHECK (status IN ('brouillon', 'active', 'en_pause', 'terminee')),
  steps       JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prospection_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sequences" ON public.prospection_sequences
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER set_prospection_sequences_updated_at
  BEFORE UPDATE ON public.prospection_sequences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_prospection_sequences_campaign ON public.prospection_sequences(campaign_id);

-- ── prospection_executions ───────────────────────────────────────────────────
CREATE TABLE public.prospection_executions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id     UUID NOT NULL REFERENCES public.prospection_sequences(id) ON DELETE CASCADE,
  contact_id      UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  current_step    INT NOT NULL DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'en_cours'
                  CHECK (status IN ('en_cours', 'termine', 'annule', 'repondu')),
  last_action_at  TIMESTAMPTZ,
  next_action_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prospection_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access executions via sequence" ON public.prospection_executions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.prospection_sequences ps
      WHERE ps.id = sequence_id AND ps.user_id = auth.uid()
    )
  );
CREATE TRIGGER set_prospection_executions_updated_at
  BEFORE UPDATE ON public.prospection_executions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_prospection_executions_sequence ON public.prospection_executions(sequence_id);
CREATE INDEX idx_prospection_executions_contact ON public.prospection_executions(contact_id);