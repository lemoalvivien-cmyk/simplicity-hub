
-- ─────────────────────────────────────────────────────────────────────
-- PASSIVE FACILITATOR OS — shared_offers + offer_share_links tables
-- ─────────────────────────────────────────────────────────────────────

-- 1. Shared offers (missions packaged for easy sharing by facilitators)
CREATE TABLE IF NOT EXISTS public.shared_offers (
  id                UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_user_id   UUID NOT NULL,
  mission_id        UUID REFERENCES public.missions(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  short_description TEXT,
  whatsapp_text     TEXT,
  email_text        TEXT,
  social_text       TEXT,
  pitch_vocal       TEXT,
  status            TEXT NOT NULL DEFAULT 'active',
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can manage their shared offers"
  ON public.shared_offers FOR ALL
  USING (auth.uid() = company_user_id)
  WITH CHECK (auth.uid() = company_user_id);

CREATE POLICY "Facilitators can view active shared offers"
  ON public.shared_offers FOR SELECT
  USING (status = 'active');

CREATE TRIGGER update_shared_offers_updated_at
  BEFORE UPDATE ON public.shared_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Tracked links per facilitator per offer
CREATE TABLE IF NOT EXISTS public.offer_share_links (
  id                    UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facilitator_id        UUID NOT NULL,
  company_id            UUID,
  offer_id              UUID REFERENCES public.shared_offers(id) ON DELETE CASCADE,
  mission_id            UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  tracking_code         TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  destination_url       TEXT,
  clicks_count          INTEGER NOT NULL DEFAULT 0,
  unique_clicks_count   INTEGER NOT NULL DEFAULT 0,
  last_click_at         TIMESTAMP WITH TIME ZONE,
  converted             BOOLEAN NOT NULL DEFAULT false,
  linked_opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  linked_gain_id        UUID REFERENCES public.gains(id) ON DELETE SET NULL,
  created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facilitators can manage their share links"
  ON public.offer_share_links FOR ALL
  USING (auth.uid() = facilitator_id)
  WITH CHECK (auth.uid() = facilitator_id);

CREATE POLICY "Companies can view share links for their offers"
  ON public.offer_share_links FOR SELECT
  USING (auth.uid() = company_id);

CREATE TRIGGER update_offer_share_links_updated_at
  BEFORE UPDATE ON public.offer_share_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_offer_share_links_tracking_code
  ON public.offer_share_links(tracking_code);

CREATE INDEX IF NOT EXISTS idx_offer_share_links_facilitator
  ON public.offer_share_links(facilitator_id);
