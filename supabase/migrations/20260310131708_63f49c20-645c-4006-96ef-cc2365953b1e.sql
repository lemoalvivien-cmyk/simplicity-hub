
-- ══════════════════════════════════════════════════════
-- 1. mission_matches table
-- ══════════════════════════════════════════════════════
CREATE TABLE public.mission_matches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id          UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  facilitateur_id     UUID NOT NULL,
  compatibility_score INTEGER NOT NULL DEFAULT 0,
  reasoning           TEXT,
  status              TEXT NOT NULL DEFAULT 'suggeree',
  created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_mission_matches_mission_id   ON public.mission_matches(mission_id);
CREATE INDEX idx_mission_matches_facilitateur ON public.mission_matches(facilitateur_id);

ALTER TABLE public.mission_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entreprise owner can see mission matches" ON public.mission_matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = mission_id AND m.entreprise_id = auth.uid()
    )
  );

CREATE POLICY "Facilitateur can see own match" ON public.mission_matches
  FOR SELECT USING (facilitateur_id = auth.uid());

CREATE POLICY "Service role can insert mission matches" ON public.mission_matches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Entreprise owner can update match status" ON public.mission_matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = mission_id AND m.entreprise_id = auth.uid()
    )
  );

CREATE TRIGGER update_mission_matches_updated_at
  BEFORE UPDATE ON public.mission_matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ══════════════════════════════════════════════════════
-- 2. notifications table
-- ══════════════════════════════════════════════════════
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  href       TEXT,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- ══════════════════════════════════════════════════════
-- 3. Trigger: notify enterprise on new introduction
-- ══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.notify_entreprise_on_intro()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.entreprise_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, href)
    VALUES (
      NEW.entreprise_id,
      'intro_recue',
      'Nouvelle introduction reçue',
      'Un apporteur vous a envoyé une introduction : ' || NEW.contact_nom,
      '/entreprise/introductions'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_intro_received
  AFTER INSERT ON public.introductions
  FOR EACH ROW EXECUTE FUNCTION public.notify_entreprise_on_intro();
