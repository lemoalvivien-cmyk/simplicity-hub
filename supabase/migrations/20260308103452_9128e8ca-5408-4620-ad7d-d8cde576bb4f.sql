
-- ══════════════════════════════════════════════════════════════════
-- EXECUTION V1 — Ownership Fix adapted to real schema
-- PROOF:EXECUTION_V1:enterprise_opportunity_ownership
-- PROOF:EXECUTION_V1:opportunity_visibility_rls
-- PROOF:EXECUTION_V1:enterprise_action_queue
-- PROOF:EXECUTION_V1:facilitateur_action_queue
-- PROOF:EXECUTION_V1:action_status_mutations
-- PROOF:EXECUTION_V1:intro_to_enterprise_opportunity
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Add traceability columns to opportunities (real schema)
-- PROOF:EXECUTION_V1:enterprise_opportunity_ownership
-- opportunities.user_id = owner. We add facilitator_ref for traceability.
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS facilitator_ref_id uuid,
  ADD COLUMN IF NOT EXISTS lead_intake_id uuid,
  ADD COLUMN IF NOT EXISTS source_intro_id uuid,
  ADD COLUMN IF NOT EXISTS source_type_v2 text DEFAULT 'manual';

-- ── 2. promote_lead_to_opportunity using real opportunities schema
-- PROOF:EXECUTION_V1:intro_to_enterprise_opportunity
CREATE OR REPLACE FUNCTION public.promote_lead_to_opportunity(p_intake_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_intake        lead_intakes%ROWTYPE;
  v_opp_id        uuid;
  v_owner_id      uuid;
  v_existing_opp  uuid;
BEGIN
  SELECT * INTO v_intake FROM lead_intakes WHERE id = p_intake_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF v_intake.linked_opportunity_id IS NOT NULL THEN
    RETURN v_intake.linked_opportunity_id;
  END IF;

  -- PROOF:EXECUTION_V1:enterprise_opportunity_ownership
  -- Enterprise owns: if intro targets an enterprise, that enterprise is the owner.
  -- Facilitator traceability preserved via facilitator_ref_id.
  v_owner_id := COALESCE(v_intake.entreprise_id, v_intake.user_id);

  -- Anti-dup 1: lead_intake_id already linked
  SELECT id INTO v_existing_opp
  FROM opportunities
  WHERE lead_intake_id = p_intake_id
  LIMIT 1;
  IF v_existing_opp IS NOT NULL THEN
    UPDATE lead_intakes SET linked_opportunity_id = v_existing_opp, updated_at = now() WHERE id = p_intake_id;
    RETURN v_existing_opp;
  END IF;

  -- Anti-dup 2: same intro
  IF v_intake.introduction_id IS NOT NULL THEN
    SELECT id INTO v_existing_opp
    FROM opportunities
    WHERE source_intro_id = v_intake.introduction_id
      AND user_id = v_owner_id
    LIMIT 1;
    IF v_existing_opp IS NOT NULL THEN
      UPDATE lead_intakes SET linked_opportunity_id = v_existing_opp, updated_at = now() WHERE id = p_intake_id;
      RETURN v_existing_opp;
    END IF;
  END IF;

  -- Anti-dup 3: company_name + email within same owner
  IF v_intake.company_name IS NOT NULL AND v_intake.person_email IS NOT NULL THEN
    SELECT id INTO v_existing_opp
    FROM opportunities
    WHERE user_id = v_owner_id
      AND lower(trim(company_name)) = lower(trim(v_intake.company_name))
      AND status != 'archivee'
    LIMIT 1;
    IF v_existing_opp IS NOT NULL THEN
      UPDATE lead_intakes SET linked_opportunity_id = v_existing_opp, updated_at = now() WHERE id = p_intake_id;
      RETURN v_existing_opp;
    END IF;
  END IF;

  -- Create opportunity owned by enterprise (or user fallback)
  INSERT INTO opportunities (
    user_id,
    company_name,
    summary,
    origin,
    status,
    facilitator_ref_id,
    lead_intake_id,
    source_intro_id,
    source_type_v2
  ) VALUES (
    v_owner_id,
    COALESCE(v_intake.company_name, v_intake.person_name, 'Lead #' || substring(p_intake_id::text, 1, 8)),
    COALESCE(v_intake.free_text_context, 'Lead issu du pipeline V2'),
    COALESCE(v_intake.source_type, 'pipeline'),
    'nouveau',
    v_intake.facilitator_id,
    p_intake_id,
    v_intake.introduction_id,
    v_intake.source_type
  )
  RETURNING id INTO v_opp_id;

  UPDATE lead_intakes
  SET linked_opportunity_id = v_opp_id,
      qualification_status = 'ready_for_action',
      updated_at = now()
  WHERE id = p_intake_id;

  INSERT INTO lead_entity_links (lead_intake_id, entity_id, entity_type, link_reason)
  VALUES (p_intake_id, v_opp_id, 'opportunity', 'promoted_from_lead');

  RETURN v_opp_id;
END;
$$;

-- ── 3. upsert_lead_action with proper actor routing
-- PROOF:EXECUTION_V1:enterprise_action_queue
-- PROOF:EXECUTION_V1:facilitateur_action_queue
CREATE OR REPLACE FUNCTION public.upsert_lead_action(
  p_intake_id    uuid,
  p_actor_id     uuid,
  p_action_type  text,
  p_priority     text DEFAULT 'normal',
  p_reason       text DEFAULT NULL,
  p_payload      jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action_id uuid;
BEGIN
  -- Supersede stale open actions for this intake+actor
  UPDATE lead_actions
  SET status = 'superseded', updated_at = now()
  WHERE lead_intake_id = p_intake_id
    AND actor_user_id = p_actor_id
    AND status IN ('open', 'in_progress');

  INSERT INTO lead_actions (
    lead_intake_id, actor_user_id, action_type,
    status, priority, reason, payload
  ) VALUES (
    p_intake_id, p_actor_id, p_action_type,
    'open', p_priority, p_reason, p_payload
  )
  RETURNING id INTO v_action_id;

  UPDATE lead_intakes
  SET action_status = 'has_action', next_best_action = p_action_type, updated_at = now()
  WHERE id = p_intake_id;

  RETURN v_action_id;
END;
$$;

-- ── 4. Action routing trigger with correct actor selection
-- PROOF:EXECUTION_V1:enterprise_action_queue
-- PROOF:EXECUTION_V1:facilitateur_action_queue
DROP TRIGGER IF EXISTS trg_lead_intake_action_routing ON public.lead_intakes;

CREATE OR REPLACE FUNCTION public.route_lead_action_on_intake()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id    uuid;
  v_action_type text;
  v_priority    text := 'normal';
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.qualification_status = NEW.qualification_status THEN
    RETURN NEW;
  END IF;

  CASE NEW.qualification_status
    WHEN 'pending_review'        THEN v_action_type := 'review_lead';
    WHEN 'needs_enrichment'      THEN v_action_type := 'enrich_lead';
    WHEN 'ready_for_opportunity' THEN v_action_type := 'promote_to_opportunity';
    WHEN 'ready_for_action'      THEN v_action_type := 'contact_email_draft';
    WHEN 'duplicate'             THEN RETURN NEW;
    WHEN 'blocked'               THEN RETURN NEW;
    ELSE RETURN NEW;
  END CASE;

  -- PROOF:EXECUTION_V1:enterprise_action_queue
  IF NEW.qualification_status IN ('ready_for_opportunity', 'ready_for_action')
     AND NEW.entreprise_id IS NOT NULL THEN
    v_actor_id := NEW.entreprise_id;
    v_priority := 'high';
  -- PROOF:EXECUTION_V1:facilitateur_action_queue
  ELSIF NEW.qualification_status = 'needs_enrichment'
     AND NEW.facilitator_id IS NOT NULL THEN
    v_actor_id := NEW.facilitator_id;
    v_action_type := 'request_facilitator_precision';
  ELSE
    v_actor_id := NEW.user_id;
  END IF;

  IF v_actor_id IS NULL THEN RETURN NEW; END IF;

  PERFORM public.upsert_lead_action(NEW.id, v_actor_id, v_action_type, v_priority);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lead_intake_action_routing
  AFTER INSERT OR UPDATE OF qualification_status ON public.lead_intakes
  FOR EACH ROW
  EXECUTE FUNCTION public.route_lead_action_on_intake();

-- ── 5. Opportunity RLS
-- PROOF:EXECUTION_V1:opportunity_visibility_rls
DO $$
BEGIN
  DROP POLICY IF EXISTS "opportunities_owner_all" ON public.opportunities;
  DROP POLICY IF EXISTS "opportunities_facilitator_view" ON public.opportunities;
  DROP POLICY IF EXISTS "Users can manage their opportunities" ON public.opportunities;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "opportunities_owner_all"
  ON public.opportunities
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Facilitator sees opportunities where they are the referring facilitator
CREATE POLICY "opportunities_facilitator_view"
  ON public.opportunities
  FOR SELECT
  USING (
    facilitator_ref_id = auth.uid()
    OR (
      source_intro_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM introductions i
        WHERE i.id = opportunities.source_intro_id
          AND i.facilitateur_id = auth.uid()
      )
    )
  );

-- ── 6. Action status mutation function
-- PROOF:EXECUTION_V1:action_status_mutations
CREATE OR REPLACE FUNCTION public.update_lead_action_status(
  p_action_id uuid,
  p_new_status text,
  p_actor_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_completed_at timestamptz;
BEGIN
  IF p_new_status = 'done' THEN v_completed_at := now(); END IF;

  UPDATE lead_actions
  SET status = p_new_status,
      completed_at = v_completed_at,
      updated_at = now()
  WHERE id = p_action_id
    AND actor_user_id = p_actor_id
    AND status NOT IN ('done', 'cancelled', 'superseded');

  IF p_new_status = 'done' THEN
    UPDATE lead_intakes li
    SET action_status = 'done', updated_at = now()
    FROM lead_actions la
    WHERE la.id = p_action_id AND li.id = la.lead_intake_id;
  END IF;

  RETURN FOUND;
END;
$$;
