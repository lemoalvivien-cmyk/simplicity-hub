
-- PROOF:INTEGRITY_V1:action_audit_log
-- Audit trail table for all lead action mutations
CREATE TABLE IF NOT EXISTS public.lead_action_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id       UUID NOT NULL REFERENCES public.lead_actions(id) ON DELETE CASCADE,
  actor_user_id   UUID NOT NULL,
  previous_status TEXT,
  new_status      TEXT NOT NULL,
  event_type      TEXT NOT NULL DEFAULT 'status_change',
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_action_events_action_id ON public.lead_action_events(action_id);
CREATE INDEX IF NOT EXISTS idx_lead_action_events_actor    ON public.lead_action_events(actor_user_id);

ALTER TABLE public.lead_action_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_action_events_select" ON public.lead_action_events
  FOR SELECT USING (auth.uid() = actor_user_id);

CREATE POLICY "lead_action_events_insert" ON public.lead_action_events
  FOR INSERT WITH CHECK (auth.uid() = actor_user_id);

-- PROOF:INTEGRITY_V1:canonical_action_mutation
-- Canonical action mutation function with audit trail
CREATE OR REPLACE FUNCTION public.update_lead_action_status(
  p_action_id  UUID,
  p_new_status TEXT,
  p_actor_id   UUID,
  p_note       TEXT DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completed_at TIMESTAMPTZ;
  v_old_status   TEXT;
  v_affected     INT;
BEGIN
  SELECT status INTO v_old_status
  FROM lead_actions
  WHERE id = p_action_id AND actor_user_id = p_actor_id;

  IF NOT FOUND THEN RETURN false; END IF;

  IF v_old_status IN ('done', 'cancelled', 'superseded') THEN
    RETURN false;
  END IF;

  IF p_new_status = 'done' THEN v_completed_at := now(); END IF;

  UPDATE lead_actions
  SET
    status       = p_new_status,
    completed_at = v_completed_at,
    updated_at   = now()
  WHERE id = p_action_id
    AND actor_user_id = p_actor_id;

  GET DIAGNOSTICS v_affected = ROW_COUNT;

  IF v_affected = 0 THEN RETURN false; END IF;

  -- PROOF:INTEGRITY_V1:action_audit_log — audit event written after every mutation
  INSERT INTO lead_action_events (action_id, actor_user_id, previous_status, new_status, event_type, note)
  VALUES (p_action_id, p_actor_id, v_old_status, p_new_status, 'status_change', p_note);

  IF p_new_status = 'done' THEN
    UPDATE lead_intakes li
    SET action_status = 'done', updated_at = now()
    FROM lead_actions la
    WHERE la.id = p_action_id AND li.id = la.lead_intake_id;
  END IF;

  RETURN true;
END;
$$;

-- PROOF:INTEGRITY_V1:opportunities_pipeline_linkage
-- Ensure opportunities table has pipeline V2 columns (safe idempotent adds)
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS source_type_v2    TEXT,
  ADD COLUMN IF NOT EXISTS facilitator_ref_id UUID,
  ADD COLUMN IF NOT EXISTS lead_intake_id    UUID REFERENCES public.lead_intakes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_intro_id   UUID REFERENCES public.introductions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_opp_lead_intake ON public.opportunities(lead_intake_id) WHERE lead_intake_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opp_source_intro ON public.opportunities(source_intro_id) WHERE source_intro_id IS NOT NULL;
