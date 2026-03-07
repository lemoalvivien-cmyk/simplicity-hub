
-- Add passive source tracking to gains table
ALTER TABLE public.gains 
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'mission_directe',
  ADD COLUMN IF NOT EXISTS share_link_id uuid REFERENCES public.offer_share_links(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS shared_offer_id uuid REFERENCES public.shared_offers(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_gains_source ON public.gains(source);
CREATE INDEX IF NOT EXISTS idx_gains_share_link_id ON public.gains(share_link_id);

-- Add qualified_interest table to track the signal pipeline
CREATE TABLE IF NOT EXISTS public.qualified_interests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_link_id uuid REFERENCES public.offer_share_links(id) ON DELETE CASCADE,
  facilitator_id uuid NOT NULL,
  offer_id uuid REFERENCES public.shared_offers(id) ON DELETE SET NULL,
  visitor_fingerprint text,
  click_count integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'detected',
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.qualified_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facilitators can view their qualified interests"
  ON public.qualified_interests FOR SELECT
  USING (auth.uid() = facilitator_id);

CREATE POLICY "Service role can manage qualified interests"
  ON public.qualified_interests FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_qualified_interests_updated_at
  BEFORE UPDATE ON public.qualified_interests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add passive_alerts table for smart alerts
CREATE TABLE IF NOT EXISTS public.passive_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  entity_type text,
  entity_id uuid,
  read boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'normale',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.passive_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their alerts"
  ON public.passive_alerts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_passive_alerts_user_id ON public.passive_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_passive_alerts_read ON public.passive_alerts(read);
