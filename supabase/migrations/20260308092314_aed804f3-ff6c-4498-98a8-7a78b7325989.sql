
-- ============================================================
-- CORE DOMAIN UNIFICATION — Lead Pipeline
-- Tables: lead_source_events, lead_intakes, lead_entity_links
-- ============================================================

-- ── 1. lead_source_events ────────────────────────────────────
CREATE TABLE public.lead_source_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  source_type     TEXT NOT NULL,
  source_ref_id   UUID,
  source_ref_type TEXT,
  raw_payload     JSONB,
  processed       BOOLEAN NOT NULL DEFAULT false,
  intake_id       UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_source_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_source_events_owner" ON public.lead_source_events
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_lse_user_id ON public.lead_source_events(user_id);
CREATE INDEX idx_lse_source_type ON public.lead_source_events(source_type);
CREATE INDEX idx_lse_source_ref ON public.lead_source_events(source_ref_id);
CREATE INDEX idx_lse_processed ON public.lead_source_events(processed) WHERE processed = false;

-- ── 2. lead_intakes ──────────────────────────────────────────
CREATE TABLE public.lead_intakes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL,
  source_event_id       UUID REFERENCES public.lead_source_events(id) ON DELETE SET NULL,
  source_type           TEXT NOT NULL,

  person_name           TEXT,
  person_email          TEXT,
  company_name          TEXT,
  linkedin_url          TEXT,
  phone                 TEXT,
  free_text_context     TEXT,

  entreprise_id         UUID,
  facilitator_id        UUID,
  mission_id            UUID,
  introduction_id       UUID REFERENCES public.introductions(id) ON DELETE SET NULL,
  linked_contact_id     UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  linked_opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,

  qualification_status  TEXT NOT NULL DEFAULT 'pending_review',
  dedup_status          TEXT NOT NULL DEFAULT 'unique',
  dedup_match_id        UUID,
  enrichment_status     TEXT NOT NULL DEFAULT 'raw',
  policy_status         TEXT NOT NULL DEFAULT 'pending',
  action_status         TEXT NOT NULL DEFAULT 'none',
  next_best_action      TEXT,
  nba_context           JSONB,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_intakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_intakes_owner" ON public.lead_intakes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_li_user_id ON public.lead_intakes(user_id);
CREATE INDEX idx_li_qualification ON public.lead_intakes(qualification_status);
CREATE INDEX idx_li_policy ON public.lead_intakes(policy_status);
CREATE INDEX idx_li_intro ON public.lead_intakes(introduction_id);
CREATE INDEX idx_li_contact ON public.lead_intakes(linked_contact_id);
CREATE INDEX idx_li_email ON public.lead_intakes(person_email) WHERE person_email IS NOT NULL;

CREATE TRIGGER lead_intakes_updated_at
  BEFORE UPDATE ON public.lead_intakes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 3. lead_entity_links ─────────────────────────────────────
CREATE TABLE public.lead_entity_links (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_intake_id UUID NOT NULL REFERENCES public.lead_intakes(id) ON DELETE CASCADE,
  entity_type    TEXT NOT NULL,
  entity_id      UUID NOT NULL,
  link_reason    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_entity_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_entity_links_via_intake" ON public.lead_entity_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.lead_intakes li
      WHERE li.id = lead_intake_id AND li.user_id = auth.uid()
    )
  );

CREATE INDEX idx_lel_intake ON public.lead_entity_links(lead_intake_id);
CREATE INDEX idx_lel_entity ON public.lead_entity_links(entity_type, entity_id);

-- ── 4. FK: lead_source_events → lead_intakes ─────────────────
ALTER TABLE public.lead_source_events
  ADD CONSTRAINT fk_lse_intake
  FOREIGN KEY (intake_id) REFERENCES public.lead_intakes(id) ON DELETE SET NULL;

-- ── 5. Policy engine function ─────────────────────────────────
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
BEGIN
  SELECT * INTO v_intake FROM public.lead_intakes WHERE id = p_intake_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF v_intake.dedup_status = 'confirmed_duplicate' THEN
    v_qual := 'duplicate';
    v_nba  := NULL;
  ELSIF v_intake.source_type = 'introduction'
    AND v_intake.introduction_id IS NOT NULL
    AND v_intake.linked_contact_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.introductions i
      WHERE i.id = v_intake.introduction_id AND i.statut = 'validee'
    )
  THEN
    v_qual := 'ready_for_opportunity';
    v_nba  := 'promote_to_opportunity';
  ELSIF v_intake.person_email IS NOT NULL AND v_intake.company_name IS NOT NULL THEN
    v_qual := 'ready_for_action';
    v_nba  := 'contact_email_draft';
  ELSIF v_intake.person_name IS NULL OR (v_intake.person_email IS NULL AND v_intake.phone IS NULL) THEN
    v_qual := 'needs_enrichment';
    v_nba  := 'enrich_lead';
  ELSE
    v_qual := 'pending_review';
    v_nba  := 'review_lead';
  END IF;

  UPDATE public.lead_intakes
  SET qualification_status = v_qual,
      next_best_action     = v_nba,
      updated_at           = now()
  WHERE id = p_intake_id;
END;
$$;

-- ── 6. Trigger: on introduction INSERT → create pipeline objects ──
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
      'contact_nom', NEW.contact_nom,
      'contact_email', NEW.contact_email,
      'mission_id', NEW.mission_id,
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
    entreprise_id, facilitator_id, mission_id, introduction_id,
    linked_contact_id, dedup_status, dedup_match_id,
    qualification_status, next_best_action
  ) VALUES (
    NEW.facilitateur_id, v_event_id, 'introduction',
    NEW.contact_nom, NEW.contact_email, NEW.contact_telephone,
    NEW.entreprise_id, NEW.facilitateur_id, NEW.mission_id, NEW.id,
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

CREATE TRIGGER trg_introduction_pipeline
  AFTER INSERT ON public.introductions
  FOR EACH ROW EXECUTE FUNCTION public.on_introduction_created_pipeline();

-- ── 7. Trigger: on introduction UPDATE (validated) → promote ─
CREATE OR REPLACE FUNCTION public.on_introduction_validated_pipeline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_intake_id UUID;
BEGIN
  IF NOT (OLD.statut IS DISTINCT FROM NEW.statut AND NEW.statut = 'validee') THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_intake_id FROM public.lead_intakes
  WHERE introduction_id = NEW.id LIMIT 1;

  IF v_intake_id IS NULL THEN RETURN NEW; END IF;

  PERFORM public.apply_lead_policy(v_intake_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_intro_validated_pipeline
  AFTER UPDATE ON public.introductions
  FOR EACH ROW EXECUTE FUNCTION public.on_introduction_validated_pipeline();

-- ── 8. Helper: create lead from contact import ───────────────
CREATE OR REPLACE FUNCTION public.create_lead_from_import(
  p_user_id      UUID,
  p_person_name  TEXT,
  p_person_email TEXT,
  p_company_name TEXT,
  p_phone        TEXT DEFAULT NULL,
  p_contact_id   UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id  UUID;
  v_intake_id UUID;
  v_dedup     TEXT := 'unique';
  v_match_id  UUID;
BEGIN
  IF p_person_email IS NOT NULL THEN
    SELECT id INTO v_match_id FROM public.lead_intakes
    WHERE user_id = p_user_id
      AND lower(trim(person_email)) = lower(trim(p_person_email))
    LIMIT 1;
    IF v_match_id IS NOT NULL THEN v_dedup := 'confirmed_duplicate'; END IF;
  END IF;

  INSERT INTO public.lead_source_events (
    user_id, source_type, source_ref_id, source_ref_type, raw_payload
  ) VALUES (
    p_user_id, 'import', p_contact_id, 'contact',
    jsonb_build_object('name', p_person_name, 'email', p_person_email, 'company', p_company_name)
  ) RETURNING id INTO v_event_id;

  INSERT INTO public.lead_intakes (
    user_id, source_event_id, source_type,
    person_name, person_email, company_name, phone,
    linked_contact_id, dedup_status, dedup_match_id,
    qualification_status, next_best_action
  ) VALUES (
    p_user_id, v_event_id, 'import',
    p_person_name, p_person_email, p_company_name, p_phone,
    p_contact_id, v_dedup, v_match_id,
    CASE WHEN v_dedup = 'confirmed_duplicate' THEN 'duplicate'
         WHEN p_person_email IS NOT NULL AND p_company_name IS NOT NULL THEN 'ready_for_action'
         ELSE 'pending_review' END,
    CASE WHEN v_dedup = 'confirmed_duplicate' THEN NULL
         WHEN p_person_email IS NOT NULL AND p_company_name IS NOT NULL THEN 'contact_email_draft'
         ELSE 'review_lead' END
  ) RETURNING id INTO v_intake_id;

  UPDATE public.lead_source_events SET intake_id = v_intake_id, processed = true WHERE id = v_event_id;

  IF p_contact_id IS NOT NULL THEN
    INSERT INTO public.lead_entity_links (lead_intake_id, entity_type, entity_id, link_reason)
    VALUES (v_intake_id, 'contact', p_contact_id, 'import_contact');
  END IF;

  RETURN v_intake_id;
END;
$$;
