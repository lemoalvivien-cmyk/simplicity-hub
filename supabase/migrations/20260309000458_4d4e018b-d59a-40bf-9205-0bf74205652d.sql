-- ──────────────────────────────────────────────────────────────────────────────
-- PAYOUT PIPELINE: generate_payouts_from_validated_gains
-- Idempotent RPC. Creates one payout row per validated gain that has no payout yet.
-- ──────────────────────────────────────────────────────────────────────────────

-- Add gain_id to payouts for idempotency (safe if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payouts' AND column_name = 'gain_id'
  ) THEN
    ALTER TABLE public.payouts ADD COLUMN gain_id UUID REFERENCES public.gains(id);
    CREATE UNIQUE INDEX IF NOT EXISTS payouts_gain_id_unique ON public.payouts(gain_id) WHERE gain_id IS NOT NULL;
  END IF;
END $$;

-- RPC generate_payouts_from_validated_gains
CREATE OR REPLACE FUNCTION public.generate_payouts_from_validated_gains()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count  integer := 0;
  v_gain   RECORD;
BEGIN
  FOR v_gain IN
    SELECT g.id AS gain_id, g.facilitateur_id, g.montant, g.introduction_id
      FROM public.gains g
     WHERE g.statut IN ('valide', 'recu')
       AND g.montant IS NOT NULL
       AND g.montant > 0
       AND NOT EXISTS (SELECT 1 FROM public.payouts p WHERE p.gain_id = g.id)
  LOOP
    INSERT INTO public.payouts (facilitator_id, amount, currency, status, gain_id, notes)
    VALUES (
      v_gain.facilitateur_id,
      v_gain.montant,
      'EUR',
      'pending',
      v_gain.gain_id,
      'Auto from validated gain ' || v_gain.gain_id::text
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_payouts_from_validated_gains() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_payouts_from_validated_gains() TO service_role;