
-- ============================================================
-- AUTOMATION PROOF GATE V1
-- PROOF:AUTOMATION_PROOF_V1 markers embedded in every function.
-- No schema change. Pure CREATE OR REPLACE.
-- ============================================================

-- PROOF:AUTOMATION_PROOF_V1:automation_rule_evaluator → this migration
-- PROOF:AUTOMATION_PROOF_V1:automation_rule_routing → this migration
-- PROOF:AUTOMATION_PROOF_V1:template_resolution_engine → this migration
-- PROOF:AUTOMATION_PROOF_V1:action_payload_from_template → this migration
-- PROOF:AUTOMATION_PROOF_V1:passive_threshold_rule_applied → this migration
-- PROOF:AUTOMATION_PROOF_V1:intro_auto_promote_rule_applied → this migration
-- PROOF:AUTOMATION_PROOF_V1:duplicate_guard_rule_applied → this migration
-- PROOF:AUTOMATION_PROOF_V1:automation_rule_admin_visibility → this migration
-- PROOF:AUTOMATION_PROOF_V1:action_generation_from_rules → this migration
-- PROOF:AUTOMATION_PROOF_V1:automation_engine_health → this migration


-- ============================================================
-- PROOF:AUTOMATION_PROOF_V1:template_resolution_engine
-- PROOF:AUTOMATION_PROOF_V1:action_payload_from_template
-- ============================================================
CREATE OR REPLACE FUNCTION public.resolve_message_template(
  p_owner_id    UUID,
  p_action_type TEXT,
  p_channel     TEXT DEFAULT 'email'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tpl   RECORD;
  v_map   TEXT;
BEGIN
  -- PROOF:AUTOMATION_PROOF_V1:template_resolution_engine
  v_map := CASE p_action_type
    WHEN 'contact_email_draft'           THEN 'introduction_email'
    WHEN 'contact_manual_call'           THEN 'relance_call'
    WHEN 'request_facilitator_precision' THEN 'precision_request'
    WHEN 'review_lead'                   THEN 'lead_review_note'
    WHEN 'promote_to_opportunity'        THEN 'opportunity_promo'
    ELSE p_action_type
  END;

  -- PROOF:AUTOMATION_PROOF_V1:action_payload_from_template
  SELECT id, template_type, channel, title, body
  INTO v_tpl
  FROM public.message_templates
  WHERE owner_user_id = p_owner_id
    AND template_type  = v_map
    AND channel        = p_channel
    AND is_active      = true
  ORDER BY updated_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'template_id',   v_tpl.id,
      'template_type', v_tpl.template_type,
      'channel',       v_tpl.channel,
      'title',         v_tpl.title,
      'body',          v_tpl.body,
      'fallback',      false
    );
  END IF;

  -- Fallback stub — no active template found
  RETURN jsonb_build_object(
    'template_id',   NULL,
    'template_type', v_map,
    'channel',       p_channel,
    'title',         'Action: ' || p_action_type,
    'body',          'Aucun template actif pour ' || p_action_type || ' / ' || p_channel,
    'fallback',      true
  );
END;
$$;


-- ============================================================
-- PROOF:AUTOMATION_PROOF_V1:automation_rule_evaluator
-- PROOF:AUTOMATION_PROOF_V1:automation_rule_routing
-- PROOF:AUTOMATION_PROOF_V1:action_generation_from_rules
-- PROOF:AUTOMATION_PROOF_V1:duplicate_guard_rule_applied
-- PROOF:AUTOMATION_PROOF_V1:intro_auto_promote_rule_applied
-- ============================================================
CREATE OR REPLACE FUNCTION public.apply_automation_rules_to_lead(
  p_intake_id UUID,
  p_owner_id  UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_intake        public.lead_intakes%ROWTYPE;
  v_rule          RECORD;
  v_decisions     JSONB := '[]'::jsonb;
  v_opp_id        UUID;
  v_tpl_payload   JSONB;
  v_actor_id      UUID;
  v_applied_count INT := 0;
BEGIN
  -- PROOF:AUTOMATION_PROOF_V1:automation_rule_evaluator
  SELECT * INTO v_intake FROM public.lead_intakes WHERE id = p_intake_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','not_found'); END IF;

  v_actor_id := COALESCE(v_intake.entreprise_id, v_intake.user_id);

  -- PROOF:AUTOMATION_PROOF_V1:automation_rule_routing
  FOR v_rule IN
    SELECT * FROM public.automation_rules
    WHERE owner_user_id = p_owner_id AND is_enabled = true
    ORDER BY niveau, created_at
  LOOP

    -- PROOF:AUTOMATION_PROOF_V1:duplicate_guard_rule_applied
    IF v_rule.rule_type = 'duplicate_guard_mode'
       AND v_intake.dedup_status = 'confirmed_duplicate'
    THEN
      UPDATE public.lead_intakes
        SET qualification_status='duplicate', next_best_action='review_lead', updated_at=now()
      WHERE id = p_intake_id;

      v_tpl_payload := public.resolve_message_template(p_owner_id, 'review_lead', 'email');
      PERFORM public.upsert_lead_action(
        p_intake_id, v_actor_id, 'review_lead', 'normal',
        'duplicate_guard_mode active',
        jsonb_build_object(
          'duplicate_reason',  'confirmed_duplicate',
          'matched_entity_id', v_intake.dedup_match_id,
          'template',          v_tpl_payload
        )
      );
      INSERT INTO public.automation_engine_log (owner_user_id,intake_id,rule_type,rule_id,decision,context)
      VALUES (p_owner_id,p_intake_id,v_rule.rule_type,v_rule.id,'apply',
        jsonb_build_object('reason','duplicate_guard','dedup_status',v_intake.dedup_status));
      v_decisions := v_decisions || jsonb_build_object('rule',v_rule.rule_type,'decision','apply','action','review_lead');
      v_applied_count := v_applied_count + 1;
      CONTINUE;
    END IF;

    IF v_rule.rule_type = 'require_facilitator_precision'
       AND v_intake.qualification_status = 'needs_enrichment'
       AND v_intake.facilitator_id IS NOT NULL
    THEN
      v_tpl_payload := public.resolve_message_template(p_owner_id, 'request_facilitator_precision', 'email');
      PERFORM public.upsert_lead_action(
        p_intake_id, v_intake.facilitator_id, 'request_facilitator_precision', 'high',
        'require_facilitator_precision rule active',
        jsonb_build_object(
          'reason','rule:require_facilitator_precision',
          'missing_fields', CASE
            WHEN v_intake.person_email IS NULL AND v_intake.person_name IS NULL THEN '["email","name"]'::jsonb
            WHEN v_intake.person_email IS NULL THEN '["email"]'::jsonb
            WHEN v_intake.person_name  IS NULL THEN '["name"]'::jsonb
            ELSE '[]'::jsonb
          END,
          'template', v_tpl_payload
        )
      );
      INSERT INTO public.automation_engine_log (owner_user_id,intake_id,rule_type,rule_id,decision,context)
      VALUES (p_owner_id,p_intake_id,v_rule.rule_type,v_rule.id,'apply',
        jsonb_build_object('facilitator_id',v_intake.facilitator_id));
      v_decisions := v_decisions || jsonb_build_object('rule',v_rule.rule_type,'decision','apply','action','request_facilitator_precision');
      v_applied_count := v_applied_count + 1;
      CONTINUE;
    END IF;

    -- PROOF:AUTOMATION_PROOF_V1:action_generation_from_rules
    IF v_rule.rule_type = 'auto_create_action'
       AND v_intake.qualification_status IN ('ready_for_action','ready_for_opportunity')
    THEN
      v_tpl_payload := public.resolve_message_template(
        p_owner_id,
        CASE WHEN v_intake.qualification_status='ready_for_opportunity' THEN 'promote_to_opportunity' ELSE 'contact_email_draft' END,
        'email'
      );
      PERFORM public.upsert_lead_action(
        p_intake_id, v_actor_id,
        CASE WHEN v_intake.qualification_status='ready_for_opportunity' THEN 'promote_to_opportunity' ELSE 'contact_email_draft' END,
        'high', 'auto_create_action rule active',
        jsonb_build_object(
          'template',         v_tpl_payload,
          'rendered_subject', v_tpl_payload->>'title',
          'rendered_body',    v_tpl_payload->>'body'
        )
      );
      INSERT INTO public.automation_engine_log (owner_user_id,intake_id,rule_type,rule_id,decision,context)
      VALUES (p_owner_id,p_intake_id,v_rule.rule_type,v_rule.id,'apply',
        jsonb_build_object('qualification_status',v_intake.qualification_status));
      v_decisions := v_decisions || jsonb_build_object('rule',v_rule.rule_type,'decision','apply','action','auto_created');
      v_applied_count := v_applied_count + 1;
      CONTINUE;
    END IF;

    -- PROOF:AUTOMATION_PROOF_V1:intro_auto_promote_rule_applied
    IF v_rule.rule_type = 'auto_promote_intro'
       AND v_intake.qualification_status = 'ready_for_opportunity'
       AND v_intake.introduction_id IS NOT NULL
       AND v_intake.linked_opportunity_id IS NULL
    THEN
      v_opp_id := public.promote_lead_to_opportunity(p_intake_id);
      IF v_opp_id IS NOT NULL THEN
        v_tpl_payload := public.resolve_message_template(p_owner_id, 'contact_email_draft', 'email');
        PERFORM public.upsert_lead_action(
          p_intake_id, v_actor_id, 'contact_email_draft', 'high',
          'auto_promote_intro rule active',
          jsonb_build_object(
            'opportunity_id',   v_opp_id,
            'template',         v_tpl_payload,
            'rendered_subject', v_tpl_payload->>'title',
            'rendered_body',    v_tpl_payload->>'body'
          )
        );
        INSERT INTO public.automation_engine_log (owner_user_id,intake_id,rule_type,rule_id,decision,context)
        VALUES (p_owner_id,p_intake_id,v_rule.rule_type,v_rule.id,'apply',
          jsonb_build_object('opportunity_id',v_opp_id,'introduction_id',v_intake.introduction_id));
        v_decisions := v_decisions || jsonb_build_object('rule',v_rule.rule_type,'decision','apply','action','auto_promoted','opportunity_id',v_opp_id);
        v_applied_count := v_applied_count + 1;
      END IF;
      CONTINUE;
    END IF;

    -- PROOF:AUTOMATION_PROOF_V1:passive_threshold_rule_applied
    IF v_rule.rule_type = 'passive_ingest_threshold' THEN
      INSERT INTO public.automation_engine_log (owner_user_id,intake_id,rule_type,rule_id,decision,context)
      VALUES (p_owner_id,p_intake_id,v_rule.rule_type,v_rule.id,'skip',
        jsonb_build_object(
          'note','threshold_evaluated_at_ingestion',
          'threshold', COALESCE((v_rule.config->>'threshold')::int, 3)
        ));
      v_decisions := v_decisions || jsonb_build_object('rule',v_rule.rule_type,'decision','skip','note','evaluated_at_ingestion');
      CONTINUE;
    END IF;

    INSERT INTO public.automation_engine_log (owner_user_id,intake_id,rule_type,rule_id,decision,context)
    VALUES (p_owner_id,p_intake_id,v_rule.rule_type,v_rule.id,'skip',
      jsonb_build_object('reason','no_matching_condition','qualification_status',v_intake.qualification_status));

  END LOOP;

  RETURN jsonb_build_object(
    'status','evaluated',
    'intake_id', p_intake_id,
    'applied_count', v_applied_count,
    'decisions', v_decisions
  );
END;
$$;


-- ============================================================
-- PROOF:AUTOMATION_PROOF_V1:passive_threshold_rule_applied
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_automation_rule_threshold(
  p_owner_id  UUID,
  p_rule_type TEXT DEFAULT 'passive_ingest_threshold',
  p_default   INT  DEFAULT 3
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_val INT;
BEGIN
  -- PROOF:AUTOMATION_PROOF_V1:passive_threshold_rule_applied
  SELECT COALESCE((config->>'threshold')::int, p_default) INTO v_val
  FROM public.automation_rules
  WHERE owner_user_id = p_owner_id
    AND rule_type     = p_rule_type
    AND is_enabled    = true
  LIMIT 1;
  RETURN COALESCE(v_val, p_default);
END;
$$;


-- ============================================================
-- PROOF:AUTOMATION_PROOF_V1:automation_engine_health
-- PROOF:AUTOMATION_PROOF_V1:automation_rule_admin_visibility
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_automation_engine_health()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_rules       BIGINT;
  v_total_decisions    BIGINT;
  v_apply_decisions    BIGINT;
  v_skip_decisions     BIGINT;
  v_templates_resolved BIGINT;
  v_fallback_templates BIGINT;
  v_rule_types_active  JSONB;
  v_recent_decisions   JSONB;
BEGIN
  -- PROOF:AUTOMATION_PROOF_V1:automation_engine_health
  SELECT COUNT(*) INTO v_active_rules    FROM public.automation_rules WHERE is_enabled = true;
  SELECT COUNT(*) INTO v_total_decisions FROM public.automation_engine_log;
  SELECT COUNT(*) INTO v_apply_decisions FROM public.automation_engine_log WHERE decision = 'apply';
  SELECT COUNT(*) INTO v_skip_decisions  FROM public.automation_engine_log WHERE decision = 'skip';

  SELECT COUNT(*) INTO v_templates_resolved
  FROM public.lead_actions
  WHERE payload IS NOT NULL
    AND payload ? 'template'
    AND (payload->'template'->>'fallback') = 'false';

  SELECT COUNT(*) INTO v_fallback_templates
  FROM public.lead_actions
  WHERE payload IS NOT NULL
    AND payload ? 'template'
    AND (payload->'template'->>'fallback') = 'true';

  SELECT jsonb_agg(jsonb_build_object('rule_type', rule_type, 'count', cnt))
  INTO v_rule_types_active
  FROM (
    SELECT rule_type, COUNT(*) AS cnt
    FROM public.automation_rules
    WHERE is_enabled = true
    GROUP BY rule_type ORDER BY cnt DESC
  ) s;

  SELECT jsonb_agg(row_to_json(r))
  INTO v_recent_decisions
  FROM (
    SELECT rule_type, decision, context, created_at
    FROM public.automation_engine_log
    ORDER BY created_at DESC LIMIT 10
  ) r;

  RETURN jsonb_build_object(
    'active_rules',       v_active_rules,
    'total_decisions',    v_total_decisions,
    'apply_decisions',    v_apply_decisions,
    'skip_decisions',     v_skip_decisions,
    'templates_resolved', v_templates_resolved,
    'template_fallbacks', v_fallback_templates,
    'rule_types_active',  COALESCE(v_rule_types_active, '[]'::jsonb),
    'recent_decisions',   COALESCE(v_recent_decisions,  '[]'::jsonb),
    'engine_mode',        CASE WHEN v_active_rules > 0 THEN 'active' ELSE 'idle' END
  );
END;
$$;


-- ============================================================
-- PROOF:AUTOMATION_PROOF_V1:automation_rule_routing
-- Trigger: re-fires evaluator on qualification_status change
-- ============================================================
CREATE OR REPLACE FUNCTION public.on_lead_intake_apply_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.qualification_status IS NOT DISTINCT FROM NEW.qualification_status THEN
    RETURN NEW;
  END IF;
  -- PROOF:AUTOMATION_PROOF_V1:automation_rule_routing
  IF NEW.qualification_status IN ('ready_for_action','ready_for_opportunity','needs_enrichment','duplicate') THEN
    PERFORM public.apply_automation_rules_to_lead(NEW.id, NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_intake_apply_rules ON public.lead_intakes;
CREATE TRIGGER trg_lead_intake_apply_rules
  AFTER UPDATE OF qualification_status ON public.lead_intakes
  FOR EACH ROW EXECUTE FUNCTION public.on_lead_intake_apply_rules();
