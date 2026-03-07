
-- Track which subscription type was used (launch vs standard)
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS offer_type text DEFAULT 'standard';

-- Table to track launch offer usage (100 first companies)
CREATE TABLE IF NOT EXISTS public.launch_quota (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_slots integer NOT NULL DEFAULT 100,
  used_slots integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default row
INSERT INTO public.launch_quota (total_slots, used_slots)
VALUES (100, 0)
ON CONFLICT DO NOTHING;

-- RLS for launch_quota: public read, service role write
ALTER TABLE public.launch_quota ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read launch quota"
  ON public.launch_quota FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage launch quota"
  ON public.launch_quota FOR ALL
  USING (true)
  WITH CHECK (true);
