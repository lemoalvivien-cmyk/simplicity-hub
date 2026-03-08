-- Landing A/B Events — anonymous analytics for conversion tracking
CREATE TABLE IF NOT EXISTS public.landing_ab_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  hero_headline_variant TEXT,
  hero_cta_variant TEXT,
  pricing_frame_variant TEXT,
  event_label TEXT,
  event_payload JSONB DEFAULT '{}',
  path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX idx_landing_ab_events_session ON public.landing_ab_events (session_id);
CREATE INDEX idx_landing_ab_events_created ON public.landing_ab_events (created_at DESC);
CREATE INDEX idx_landing_ab_events_type ON public.landing_ab_events (event_type);

-- Enable RLS
ALTER TABLE public.landing_ab_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous tracking)
CREATE POLICY "Public can insert landing events"
  ON public.landing_ab_events
  FOR INSERT
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read landing events"
  ON public.landing_ab_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );