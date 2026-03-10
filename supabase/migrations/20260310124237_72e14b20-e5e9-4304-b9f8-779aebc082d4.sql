
-- Create user_actions table
CREATE TABLE public.user_actions (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            TEXT        NOT NULL CHECK (type IN ('appeler','envoyer','relancer','valider','verifier','analyser')),
  title           TEXT        NOT NULL,
  description     TEXT,
  priority        TEXT        NOT NULL DEFAULT 'normale' CHECK (priority IN ('urgente','haute','normale','basse')),
  status          TEXT        NOT NULL DEFAULT 'a_faire' CHECK (status IN ('a_faire','en_cours','terminee','annulee')),
  due_date        TIMESTAMPTZ,
  source          TEXT        NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','openclaw','ai_recommendation')),
  source_ref_id   UUID,
  contact_id      UUID        REFERENCES public.contacts(id) ON DELETE SET NULL,
  mission_id      UUID        REFERENCES public.missions(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_user_actions_user_status   ON public.user_actions(user_id, status);
CREATE INDEX idx_user_actions_user_priority ON public.user_actions(user_id, priority);
CREATE INDEX idx_user_actions_contact       ON public.user_actions(contact_id) WHERE contact_id IS NOT NULL;

-- RLS
ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_actions"
  ON public.user_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_actions"
  ON public.user_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_actions"
  ON public.user_actions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_actions"
  ON public.user_actions FOR DELETE
  USING (auth.uid() = user_id);
