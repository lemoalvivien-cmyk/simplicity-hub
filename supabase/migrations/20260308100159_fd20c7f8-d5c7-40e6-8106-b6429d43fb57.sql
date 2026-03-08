
-- ══════════════════════════════════════════════════════════════
-- SHARED PIPELINE FIX v5
-- 1. lead_actions table (persistent action queue)
-- 2. RLS fix for lead_intakes (shared visibility)
-- 3. promote_lead_to_opportunity() function
-- 4. upsert_lead_action() function
-- 5. trigger: auto-spawn action on intake upsert
-- 6. apply_lead_policy: propagate entreprise_id
-- 7. on_introduction_created_pipeline: set entreprise_id
-- ══════════════════════════════════════════════════════════════

-- ─── 1. LEAD_ACTIONS TABLE ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_actions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_intake_id      UUID NOT NULL REFERENCES public.lead_intakes(id) ON DELETE CASCADE,
  opportunity_id      UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  actor_user_id       UUID NOT NULL,
  action_type         TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'open',
  priority            TEXT NOT NULL DEFAULT 'normal',
  reason              TEXT,
  payload             JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at        TIMESTAMPTZ,
  CONSTRAINT lead_actions_action_type_check CHECK (action_type IN (
    'review_lead', 'enrich_lead', 'contact_email_draft',
    'contact_manual_call', 'request_facilitator_precision',
    'promote_to_opportunity'
  )),
  CONSTRAINT lead_actions_status_check CHECK (status IN (
    'open', 'in_progress', 'done', 'superseded', 'cancelled'
  )),
  CONSTRAINT lead_actions_priority_check CHECK (priority IN (
    'low', 'normal', 'high', 'urgent'
  ))
);

CREATE INDEX IF NOT EXISTS idx_lead_actions_intake ON public.lead_actions(lead_intake_id);
CREATE INDEX IF NOT EXISTS idx_lead_actions_actor  ON public.lead_actions(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_lead_actions_open   ON public.lead_actions(status) WHERE status = 'open';

ALTER TABLE public.lead_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_actions_select_own"
  ON public.lead_actions FOR SELECT
  USING (auth.uid() = actor_user_id);

CREATE POLICY "lead_actions_insert_own"
  ON public.lead_actions FOR INSERT
  WITH CHECK (auth.uid() = actor_user_id);

CREATE POLICY "lead_actions_update_own"
  ON public.lead_actions FOR UPDATE
  USING (auth.uid() = actor_user_id);

CREATE TRIGGER update_lead_actions_updated_at
  BEFORE UPDATE ON public.lead_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ─── 2. RLS FOR lead_intakes (SHARED VISIBILITY) ─────────────
-- Drop any existing policies to replace cleanly
DROP POLICY IF EXISTS "lead_intakes_select_own" ON public.lead_intakes;
DROP POLICY IF EXISTS "lead_intakes_insert_own" ON public.lead_intakes;
DROP POLICY IF EXISTS "lead_intakes_update_own" ON public.lead_intakes;
DROP POLICY IF EXISTS "lead_intakes_select" ON public.lead_intakes;
DROP POLICY IF EXISTS "lead_intakes_insert" ON public.lead_intakes;
DROP POLICY IF EXISTS "lead_intakes_update" ON public.lead_intakes;

-- SELECT: owner (facilitateur) OR entreprise via direct field OR via linked intro/mission
CREATE POLICY "lead_intakes_select"
  ON public.lead_intakes FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() = entreprise_id
    OR (
      introduction_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.introductions i
        WHERE i.id = introduction_id
          AND i.entreprise_id = auth.uid()
      )
    )
    OR (
      mission_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.missions m
        WHERE m.id = mission_id
          AND m.entreprise_id = auth.uid()
      )
    )
  );

-- INSERT: only the owning user
CREATE POLICY "lead_intakes_insert"
  ON public.lead_intakes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: only the owning user
CREATE POLICY "lead_intakes_update"
  ON public.lead_intakes FOR UPDATE
  USING (auth.uid() = user_id);


-- ─── 3. RLS FOR lead_source_events ───────────────────────────
DROP POLICY IF EXISTS "lead_source_events_select_own" ON public.lead_source_events;
DROP POLICY IF EXISTS "lead_source_events_insert_own" ON public.lead_source_events;
DROP POLICY IF EXISTS "lead_source_events_select" ON public.lead_source_events;
DROP POLICY IF EXISTS "lead_source_events_insert" ON public.lead_source_events;

CREATE POLICY "lead_source_events_select"
  ON public.lead_source_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "lead_source_events_insert"
  ON public.lead_source_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ─── 4. RLS FOR lead_entity_links ────────────────────────────
DROP POLICY IF EXISTS "lead_entity_links_select_own" ON public.lead_entity_links;
DROP POLICY IF EXISTS "lead_entity_links_insert_own" ON public.lead_entity_links;
DROP POLICY IF EXISTS "lead_entity_links_select" ON public.lead_entity_links;
DROP POLICY IF EXISTS "lead_entity_links_insert" ON public.lead_entity_links;

CREATE POLICY "lead_entity_links_select"
  ON public.lead_entity_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lead_intakes li
      WHERE li.id = lead_intake_id
        AND (
          li.user_id = auth.uid()
          OR li.entreprise_id = auth.uid()
          OR (li.introduction_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.introductions i
            WHERE i.id = li.introduction_id AND i.entreprise_id = auth.uid()
          ))
        )
    )
  );

CREATE POLICY "lead_entity_links_insert"
  ON public.lead_entity_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lead_intakes li
      WHERE li.id = lead_intake_id AND li.user_id = auth.uid()
    )
  );


-- ─── 5. OPPORTUNITY FACTORY FUNCTION ─────────────────────────
CREATE OR REPLACE FUNCTION public.promote_lead_to_opportunity(p_intake_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_intake     public.lead_intakes%ROWTYPE;
  v_opp_id     UUID;
  v_company    TEXT;
  v_summary    TEXT;
BEGIN
  SELECT * INTO v_intake FROM public.lead_intakes WHERE id = p_intake_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- Already linked
  IF v_intake.linked_opportunity_id IS NOT NULL THEN
    RETURN v_intake.linked_opportunity_id;
  END IF;

  v_company := COALESCE(v_intake.company_name, v_intake.person_name);

  -- Anti-duplication: existing active opportunity for same user + company
  IF v_company IS NOT NULL THEN
    SELECT id INTO v_opp_id
    FROM public.opportunities
    WHERE user_id = v_intake.user_id
      AND lower(trim(company_name)) = lower(trim(v_company))
      AND status NOT IN ('archivee', 'perdue')
    LIMIT 1;
  END IF;

  v_summary := CASE v_intake.source_type
    WHEN 'introduction'  THEN 'Opportunité issue d''une introduction : ' || COALESCE(v_intake.person_name, 'contact')
    WHEN 'import'        THEN 'Opportunité issue d''un import : ' || COALESCE(v_intake.person_name, v_company)
    WHEN 'passive_click' THEN 'Opportunité issue d''un intérêt passif tracké'
    WHEN 'radar_signal'  THEN 'Opportunité issue d''un signal radar : ' || COALESCE(v_company, 'cible')
    WHEN 'manual'        THEN 'Opportunité créée manuellement : ' || COALESCE(v_intake.person_name, v_company)
    ELSE 'Opportunité : ' || COALESCE(v_intake.person_name, v_company, 'sans nom')
  END;

  IF v_opp_id IS NULL THEN
    INSERT INTO public.opportunities (
      user_id, company_name, summary,
      intent_label, intent_score, status, origin,
      recommended_next_action, dossier_match_label, dossier_match_reason
    ) VALUES (
      v_intake.user_id, v_company, v_summary,
      'moyen', 60, 'nouvelle', v_intake.source_type,
      'Contacter ce prospect',
      'Pertinence moyenne',
      'Lead unifié depuis ' || v_intake.source_type
    )
    RETURNING id INTO v_opp_id;
  END IF;

  UPDATE public.lead_intakes
  SET linked_opportunity_id = v_opp_id,
      qualification_status  = 'ready_for_opportunity',
      updated_at            = now()
  WHERE id = p_intake_id;

  INSERT INTO public.lead_entity_links (lead_intake_id, entity_type, entity_id, link_reason)
  VALUES (p_intake_id, 'opportunity', v_opp_id, 'promoted_from_lead')
  ON CONFLICT DO NOTHING;

  RETURN v_opp_id;
END;
$$;


-- ─── 6. UPSERT LEAD ACTION (dedup-safe) ──────────────────────
CREATE OR REPLACE FUNCTION public.upsert_lead_action(
  p_intake_id   UUID,
  p_actor_id    UUID,
  p_action_type TEXT,
  p_priority    TEXT DEFAULT 'normal',
  p_reason      TEXT DEFAULT NULL,
  p_payload     JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id UUID;
  v_new_id      UUID;
BEGIN
  -- Supersede open actions of different type for same intake+actor
  UPDATE public.lead_actions
  SET status = 'superseded', updated_at = now()
  WHERE lead_intake_id = p_intake_id
    AND actor_user_id  = p_actor_id
    AND action_type   <> p_action_type
    AND status         = 'open';

  -- Check if same action already open
  SELECT id INTO v_existing_id
  FROM public.lead_actions
  WHERE lead_intake_id = p_intake_id
    AND actor_user_id  = p_actor_id
    AND action_type    = p_action_type
    AND status         = 'open'
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.lead_actions
    SET priority   = p_priority,
        reason     = COALESCE(p_reason, reason),
        updated_at = now()
    WHERE id = v_existing_id;
    RETURN v_existing_id;
  END IF;

  INSERT INTO public.lead_actions (
    lead_intake_id, actor_user_id, action_type, priority, reason, payload
  ) VALUES (
    p_intake_id, p_actor_id, p_action_type, p_priority, p_reason, p_payload
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;


-- ─── 7. TRIGGER: auto-spawn action on intake upsert ──────────
CREATE OR REPLACE FUNCTION public.on_lead_intake_action_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.next_best_action IS NULL THEN RETURN NEW; END IF;

  IF (OLD IS NOT NULL
      AND OLD.next_best_action IS NOT DISTINCT FROM NEW.next_best_action
      AND OLD.qualification_status IS NOT DISTINCT FROM NEW.qualification_status) THEN
    RETURN NEW;
  END IF;

  -- Supersede obsolete open actions
  UPDATE public.lead_actions
  SET status = 'superseded', updated_at = now()
  WHERE lead_intake_id = NEW.id
    AND status = 'open'
    AND action_type <> NEW.next_best_action;

  -- Upsert the current NBA as an action
  PERFORM public.upsert_lead_action(
    NEW.id,
    NEW.user_id,
    NEW.next_best_action,
    CASE NEW.next_best_action
      WHEN 'promote_to_opportunity' THEN 'high'
      WHEN 'contact_email_draft'    THEN 'high'
      WHEN 'contact_manual_call'    THEN 'high'
      ELSE 'normal'
    END,
    NEW.qualification_status,
    jsonb_build_object('source_type', NEW.source_type)
  );

  -- Auto-promote intros that are ready
  IF NEW.qualification_status = 'ready_for_opportunity'
    AND NEW.linked_opportunity_id IS NULL
    AND NEW.introduction_id IS NOT NULL
  THEN
    PERFORM public.promote_lead_to_opportunity(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_intake_action_sync ON public.lead_intakes;
CREATE TRIGGER trg_lead_intake_action_sync
  AFTER INSERT OR UPDATE OF next_best_action, qualification_status
  ON public.lead_intakes
  FOR EACH ROW EXECUTE FUNCTION public.on_lead_intake_action_sync();


-- ─── 8. UPDATED apply_lead_policy: propagate entreprise_id ───
CREATE OR REPLACE FUNCTION public.apply_lead_policy(p_intake_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_intake public.lead_intakes%ROWTYPE;
  v_qual   TEXT;
  v_nba    TEXT;
  v_eid    UUID;
BEGIN
  SELECT * INTO v_intake FROM public.lead_intakes WHERE id = p_intake_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF v_intake.entreprise_id IS NULL AND v_intake.introduction_id IS NOT NULL THEN
    SELECT entreprise_id INTO v_eid FROM public.introductions WHERE id = v_intake.introduction_id;
    IF v_eid IS NOT NULL THEN
      UPDATE public.lead_intakes SET entreprise_id = v_eid WHERE id = p_intake_id;
      v_intake.entreprise_id := v_eid;
    END IF;
  END IF;

  IF v_intake.dedup_status = 'confirmed_duplicate' THEN
    v_qual := 'duplicate'; v_nba := NULL;
  ELSIF v_intake.source_type = 'introduction'
    AND v_intake.introduction_id IS NOT NULL
    AND v_intake.linked_contact_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.introductions i
      WHERE i.id = v_intake.introduction_id AND i.statut = 'validee'
    )
  THEN
    v_qual := 'ready_for_opportunity'; v_nba := 'promote_to_opportunity';
  ELSIF v_intake.person_email IS NOT NULL AND v_intake.company_name IS NOT NULL THEN
    v_qual := 'ready_for_action'; v_nba := 'contact_email_draft';
  ELSIF v_intake.person_name IS NULL OR (v_intake.person_email IS NULL AND v_intake.phone IS NULL) THEN
    v_qual := 'needs_enrichment'; v_nba := 'enrich_lead';
  ELSE
    v_qual := 'pending_review'; v_nba := 'review_lead';
  END IF;

  UPDATE public.lead_intakes
  SET qualification_status = v_qual,
      next_best_action     = v_nba,
      updated_at           = now()
  WHERE id = p_intake_id;
END;
$$;


-- ─── 9. on_introduction_created_pipeline: set entreprise_id ──
CREATE OR REPLACE FUNCTION public.on_introduction_created_pipeline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id   UUID;
  v_intake_id  UUID;
  v_match_id   UUID;
  v_dedup      TEXT := 'unique';
  v_contact_id UUID;
BEGIN
  INSERT INTO public.lead_source_events (
    user_id, source_type, source_ref_id, source_ref_type, raw_payload
  ) VALUES (
    NEW.facilitateur_id, 'introduction', NEW.id, 'introduction',
    jsonb_build_object(
      'contact_nom',   NEW.contact_nom,
      'contact_email', NEW.contact_email,
      'mission_id',    NEW.mission_id,
      'entreprise_id', NEW.entreprise_id
    )
  ) RETURNING id INTO v_event_id;

  IF NEW.contact_email IS NOT NULL THEN
    SELECT id INTO v_contact_id
    FROM public.contacts
    WHERE owner_user_id = NEW.facilitateur_id
      AND lower(trim(email)) = lower(trim(NEW.contact_email))
    LIMIT 1;

    IF v_contact_id IS NOT NULL THEN
      SELECT id INTO v_match_id FROM public.lead_intakes
      WHERE user_id = NEW.facilitateur_id AND linked_contact_id = v_contact_id LIMIT 1;
      IF v_match_id IS NOT NULL THEN v_dedup := 'confirmed_duplicate'; END IF;
    ELSE
      SELECT id INTO v_match_id FROM public.lead_intakes
      WHERE user_id = NEW.facilitateur_id
        AND lower(trim(person_email)) = lower(trim(NEW.contact_email))
      LIMIT 1;
      IF v_match_id IS NOT NULL THEN v_dedup := 'confirmed_duplicate'; END IF;
    END IF;
  END IF;

  INSERT INTO public.lead_intakes (
    user_id, source_event_id, source_type,
    person_name, person_email, phone,
    entreprise_id,
    facilitator_id, mission_id, introduction_id,
    linked_contact_id, dedup_status, dedup_match_id,
    qualification_status, next_best_action
  ) VALUES (
    NEW.facilitateur_id, v_event_id, 'introduction',
    NEW.contact_nom, NEW.contact_email, NEW.contact_telephone,
    NEW.entreprise_id,
    NEW.facilitateur_id, NEW.mission_id, NEW.id,
    v_contact_id, v_dedup, v_match_id,
    CASE WHEN v_dedup = 'confirmed_duplicate' THEN 'duplicate' ELSE 'pending_review' END,
    CASE WHEN v_dedup = 'confirmed_duplicate' THEN NULL ELSE 'review_lead' END
  ) RETURNING id INTO v_intake_id;

  UPDATE public.lead_source_events SET intake_id = v_intake_id, processed = true WHERE id = v_event_id;

  INSERT INTO public.lead_entity_links (lead_intake_id, entity_type, entity_id, link_reason)
  VALUES (v_intake_id, 'introduction', NEW.id, 'source_introduction');

  IF v_contact_id IS NOT NULL THEN
    INSERT INTO public.lead_entity_links (lead_intake_id, entity_type, entity_id, link_reason)
    VALUES (v_intake_id, 'contact', v_contact_id, 'dedup_email_match');
  END IF;

  RETURN NEW;
END;
$$;

-- Re-attach triggers
DROP TRIGGER IF EXISTS trg_introduction_pipeline ON public.introductions;
CREATE TRIGGER trg_introduction_pipeline
  AFTER INSERT ON public.introductions
  FOR EACH ROW EXECUTE FUNCTION public.on_introduction_created_pipeline();

DROP TRIGGER IF EXISTS trg_intro_validated_pipeline ON public.introductions;
CREATE TRIGGER trg_intro_validated_pipeline
  AFTER UPDATE OF statut ON public.introductions
  FOR EACH ROW EXECUTE FUNCTION public.on_introduction_validated_pipeline();
