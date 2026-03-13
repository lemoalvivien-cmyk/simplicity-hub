-- Insights API Keys table
CREATE TABLE IF NOT EXISTS public.insights_api_keys (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   uuid NOT NULL,
  key_hash        text NOT NULL UNIQUE,
  key_prefix      text NOT NULL,
  tier            text NOT NULL DEFAULT 'starter' CHECK (tier IN ('starter', 'growth', 'enterprise')),
  label           text,
  stripe_subscription_id text,
  stripe_customer_id     text,
  is_active       boolean NOT NULL DEFAULT true,
  requests_this_month integer NOT NULL DEFAULT 0,
  monthly_limit   integer NOT NULL DEFAULT 10000,
  last_used_at    timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Insights API Usage log
CREATE TABLE IF NOT EXISTS public.insights_api_usage (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id      uuid NOT NULL REFERENCES public.insights_api_keys(id) ON DELETE CASCADE,
  endpoint        text NOT NULL,
  tier            text NOT NULL,
  response_time_ms integer,
  signals_returned integer,
  ip_hash         text,
  error_code      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_insights_api_keys_hash    ON public.insights_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_insights_api_keys_owner   ON public.insights_api_keys(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_insights_api_usage_key    ON public.insights_api_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_insights_api_usage_date   ON public.insights_api_usage(created_at DESC);

-- RLS
ALTER TABLE public.insights_api_keys  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights_api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select" ON public.insights_api_keys
  FOR SELECT USING (owner_user_id = auth.uid());
CREATE POLICY "owner_insert" ON public.insights_api_keys
  FOR INSERT WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "owner_update" ON public.insights_api_keys
  FOR UPDATE USING (owner_user_id = auth.uid());
CREATE POLICY "owner_delete" ON public.insights_api_keys
  FOR DELETE USING (owner_user_id = auth.uid());

CREATE POLICY "owner_usage_select" ON public.insights_api_usage
  FOR SELECT USING (
    api_key_id IN (
      SELECT id FROM public.insights_api_keys WHERE owner_user_id = auth.uid()
    )
  );

-- Monthly reset function
CREATE OR REPLACE FUNCTION public.reset_insights_monthly_quota()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.insights_api_keys
  SET requests_this_month = 0, updated_at = now();
END;
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_insights_key_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_insights_key_updated
  BEFORE UPDATE ON public.insights_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.set_insights_key_updated_at();