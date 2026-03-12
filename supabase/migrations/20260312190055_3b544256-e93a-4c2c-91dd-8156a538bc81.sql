
-- 1. Add stripe_connect_account_id to facilitateur_profiles
ALTER TABLE public.facilitateur_profiles
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;

-- 2. Add stripe_transfer_id and related columns to payouts
ALTER TABLE public.payouts
  ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
  ADD COLUMN IF NOT EXISTS withdrawal_requested_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;

-- 3. RLS: facilitateurs can read their own payouts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payouts' AND policyname='Facilitators can view own payouts'
  ) THEN
    CREATE POLICY "Facilitators can view own payouts"
      ON public.payouts FOR SELECT
      USING (auth.uid() = facilitator_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payouts' AND policyname='Facilitators can insert withdrawal request'
  ) THEN
    CREATE POLICY "Facilitators can insert withdrawal request"
      ON public.payouts FOR INSERT
      WITH CHECK (auth.uid() = facilitator_id AND status = 'pending');
  END IF;
END $$;
