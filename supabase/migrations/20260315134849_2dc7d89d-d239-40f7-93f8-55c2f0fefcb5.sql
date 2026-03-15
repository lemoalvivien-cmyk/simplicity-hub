
-- ─────────────────────────────────────────────────────────────────────────────
-- SECURITY HARDENING: Lock payout RPCs to service_role + admin only
-- REVOKE from authenticated, replace p_actor_id checks with auth.uid()
-- All functions: SECURITY DEFINER + SET search_path = 'public'
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. update_payout_status ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_payout_status(
  p_payout_id   UUID,
  p_new_status  TEXT,
  p_actor_id    UUID,   -- kept for audit trail; MUST equal auth.uid() or service_role call
  p_note        TEXT DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_caller     UUID;
  v_old_status TEXT;
  v_batch_id   UUID;
BEGIN
  -- SECURITY: no user_id override allowed — actor is always the authenticated caller
  v_caller := auth.uid();
  IF v_caller IS NOT NULL AND v_caller <> p_actor_id THEN
    RAISE EXCEPTION 'Access denied: actor_id mismatch';
  END IF;

  -- Allow service_role calls (v_caller is NULL in that context)
  IF v_caller IS NOT NULL AND NOT public.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT status, batch_id INTO v_old_status, v_batch_id
  FROM public.payouts WHERE id = p_payout_id;

  IF NOT FOUND THEN RETURN false; END IF;

  UPDATE public.payouts
  SET status      = p_new_status,
      processed_at = CASE WHEN p_new_status = 'paid' THEN now() ELSE processed_at END,
      updated_at  = now()
  WHERE id = p_payout_id;

  PERFORM public.record_payout_audit(
    p_payout_id, v_batch_id,
    COALESCE(v_caller, p_actor_id),
    'status_change', v_old_status, p_new_status, p_note
  );
  RETURN true;
END;
$$;

-- Revoke from authenticated; only service_role may call
REVOKE EXECUTE ON FUNCTION public.update_payout_status(UUID, TEXT, UUID, TEXT) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.update_payout_status(UUID, TEXT, UUID, TEXT) TO service_role;


-- ── 2. create_payout_batch ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_payout_batch(
  p_actor_id   UUID,
  p_label      TEXT,
  p_payout_ids UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_caller   UUID;
  v_batch_id UUID;
  v_total    NUMERIC := 0;
  v_count    INTEGER := 0;
BEGIN
  -- SECURITY: no user_id override allowed — actor is always the authenticated caller
  v_caller := auth.uid();
  IF v_caller IS NOT NULL AND v_caller <> p_actor_id THEN
    RAISE EXCEPTION 'Access denied: actor_id mismatch';
  END IF;

  IF v_caller IS NOT NULL AND NOT public.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT SUM(amount), COUNT(*) INTO v_total, v_count
  FROM public.payouts
  WHERE id = ANY(p_payout_ids) AND status = 'pending';

  INSERT INTO public.payout_batches (label, total_amount, payout_count, created_by)
  VALUES (p_label, v_total, v_count, COALESCE(v_caller, p_actor_id))
  RETURNING id INTO v_batch_id;

  UPDATE public.payouts
  SET batch_id = v_batch_id, status = 'processing', updated_at = now()
  WHERE id = ANY(p_payout_ids) AND status = 'pending';

  PERFORM public.record_payout_audit(
    NULL, v_batch_id,
    COALESCE(v_caller, p_actor_id),
    'batch_created', NULL, 'processing', p_label
  );

  RETURN v_batch_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_payout_batch(UUID, TEXT, UUID[]) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.create_payout_batch(UUID, TEXT, UUID[]) TO service_role;


-- ── 3. generate_payouts_from_validated_gains ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_payouts_from_validated_gains()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_caller UUID;
  v_count  integer := 0;
  v_gain   RECORD;
BEGIN
  -- SECURITY: no user_id override allowed — only service_role or admin may call
  v_caller := auth.uid();
  IF v_caller IS NOT NULL AND NOT public.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

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

-- Revoke from authenticated; only service_role may call (via CRON_SECRET Edge Function)
REVOKE EXECUTE ON FUNCTION public.generate_payouts_from_validated_gains() FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.generate_payouts_from_validated_gains() TO service_role;
