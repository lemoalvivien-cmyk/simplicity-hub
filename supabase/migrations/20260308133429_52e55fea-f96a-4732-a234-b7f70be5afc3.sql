
-- PROOF:AUTOMATION_CLEANUP_V1:rule_owner_resolution
-- Owner Resolution Strategy:
-- For a given lead_intake:
--   1. If entreprise_id is set → rules owner = entreprise_id (company owns the execution)
--   2. Else → rules owner = user_id (facilitator-originated lead, facilitator owns rules)
-- This aligns with the business model: companies own conversion actions,
-- facilitators own enrichment/precision actions.

-- PROOF:AUTOMATION_CLEANUP_V1:enterprise_rules_apply_to_enterprise_leads
-- PROOF:AUTOMATION_CLEANUP_V1:facilitator_rules_apply_to_facilitator_leads
-- PROOF:AUTOMATION_CLEANUP_V1:action_routing_coherence
CREATE OR REPLACE FUNCTION public.resolve_rule_owner(p_intake_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(entreprise_id, user_id)
  FROM public.lead_intakes
  WHERE id = p_intake_id;
$$;

-- Drop and recreate apply_automation_rules_to_lead with correct owner resolution
-- PROOF:AUTOMATION_CLEANUP_V1:rule_owner_resolution
CREATE OR REPLACE FUNCTION public.apply_automation_rules_to_lead(
  p_intake_id UUID,
  p_owner_id  UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_intake          RECORD;
  v_rule            RECORD;
  v_resolved_owner  UUID;
  v_decisions       JSONB := '[]'::JSONB;
  v_applied         INT   := 0;
  v_decision        TEXT;
  v_action_type     TEXT;
  v_action_payload  JSONB;
  v_template        JSONB;
BEGIN
  SELECT * INTO v_intake FROM public.lead_intakes WHERE id = p_intake_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'not_found', 'intake_id', p_intake_id);
  END IF;

  -- PROOF:AUTOMATION_CLEANUP_V1:enterprise_rules_apply_to_enterprise_leads
  -- PROOF:AUTOMATION_CLEANUP_V1:facilitator_rules_apply_to_facilitator_leads
  v_resolved_owner := COALESCE(p_owner_id, v_intake.entreprise_id, v_intake.user_id);

  FOR v_rule IN
    SELECT * FROM public.automation_rules
    WHERE owner_user_id = v_resolved_owner
      AND is_enabled = TRUE
    ORDER BY niveau DESC, created_at ASC
  LOOP
    v_decision := 'skip';
    v_action_type := NULL;
    v_action_payload := '{}'::JSONB;

    -- PROOF:AUTOMATION_CLEANUP_V1:action_routing_coherence
    IF v_rule.rule_type = 'duplicate_guard_mode' THEN
      IF v_intake.dedup_status = 'duplicate' THEN
        v_decision := 'apply';
        v_action_type := 'review_lead';
        v_action_payload := jsonb_build_object(
          'reason', 'duplicate_guard_mode active',
          'duplicate_reason', 'dedup_status=duplicate',
          'matched_entity_id', v_intake.dedup_match_id,
          'rule_type', v_rule.rule_type
        );
      END IF;

    ELSIF v_rule.rule_type = 'require_facilitator_precision' THEN
      IF v_intake.enrichment_status IN ('raw', 'pending') AND v_intake.facilitator_id IS NOT NULL THEN
        v_decision := 'apply';
        v_action_type := 'request_facilitator_precision';
        v_action_payload := jsonb_build_object(
          'reason', 'require_facilitator_precision active',
          'missing_fields', jsonb_build_array(
            CASE WHEN v_intake.person_email IS NULL THEN 'person_email' ELSE NULL END,
            CASE WHEN v_intake.phone IS NULL THEN 'phone' ELSE NULL END,
            CASE WHEN v_intake.linkedin_url IS NULL THEN 'linkedin_url' ELSE NULL END
          ),
          'rule_type', v_rule.rule_type,
          'routed_to', 'facilitator',
          'facilitator_id', v_intake.facilitator_id
        );
      END IF;

    ELSIF v_rule.rule_type = 'auto_create_action' THEN
      IF v_intake.qualification_status IN ('qualified', 'ready_for_opportunity') THEN
        v_decision := 'apply';
        SELECT resolve_message_template(v_resolved_owner, 'contact_email_draft', 'email')
          INTO v_template;
        v_action_type := 'contact_email_draft';
        v_action_payload := jsonb_build_object(
          'rule_type', v_rule.rule_type,
          'routed_to', 'enterprise',
          'template_id',   v_template->>'template_id',
          'template_type', v_template->>'template_type',
          'channel',       v_template->>'channel',
          'title',         v_template->>'title',
          'body',          v_template->>'body',
          'fallback',      v_template->>'fallback'
        );
      END IF;

    ELSIF v_rule.rule_type = 'auto_promote_intro' THEN
      IF v_intake.qualification_status = 'ready_for_opportunity'
         AND v_intake.linked_opportunity_id IS NULL THEN
        v_decision := 'apply';
        v_action_type := 'promote_to_opportunity';
        BEGIN
          PERFORM public.promote_lead_to_opportunity(p_intake_id, v_resolved_owner);
        EXCEPTION WHEN OTHERS THEN
          v_decision := 'error';
          v_action_payload := jsonb_build_object('error', SQLERRM, 'rule_type', v_rule.rule_type);
        END;
        IF v_decision <> 'error' THEN
          v_action_payload := jsonb_build_object(
            'rule_type', v_rule.rule_type,
            'routed_to', 'enterprise',
            'auto_promoted', TRUE
          );
        END IF;
      END IF;
    END IF;

    INSERT INTO public.automation_engine_log(
      owner_user_id, intake_id, rule_id, rule_type, decision, context
    ) VALUES (
      v_resolved_owner, p_intake_id, v_rule.id, v_rule.rule_type, v_decision,
      jsonb_build_object(
        'action_type',    v_action_type,
        'resolved_owner', v_resolved_owner,
        'owner_source',   CASE WHEN v_intake.entreprise_id IS NOT NULL THEN 'entreprise_id' ELSE 'user_id' END,
        'payload',        v_action_payload
      )
    );

    IF v_decision = 'apply' AND v_action_type IS NOT NULL THEN
      INSERT INTO public.lead_actions(
        lead_intake_id, actor_user_id, action_type, status, priority, reason, payload
      ) VALUES (
        p_intake_id,
        CASE WHEN v_action_type = 'request_facilitator_precision' THEN v_intake.facilitator_id
             ELSE v_resolved_owner END,
        v_action_type,
        'open',
        'normal',
        v_rule.label,
        v_action_payload
      )
      ON CONFLICT DO NOTHING;
      v_applied := v_applied + 1;
    END IF;

    v_decisions := v_decisions || jsonb_build_object(
      'rule', v_rule.rule_type,
      'decision', v_decision,
      'action', v_action_type
    );
  END LOOP;

  RETURN jsonb_build_object(
    'status',        'ok',
    'intake_id',     p_intake_id,
    'resolved_owner', v_resolved_owner,
    'owner_source',  CASE WHEN v_intake.entreprise_id IS NOT NULL THEN 'entreprise_id' ELSE 'user_id' END,
    'applied_count', v_applied,
    'decisions',     v_decisions
  );
END;
$$;

-- PROOF:AUTOMATION_CLEANUP_V1:rule_owner_resolution
DROP TRIGGER IF EXISTS trg_lead_intake_apply_rules ON public.lead_intakes;

CREATE OR REPLACE FUNCTION public.trg_fn_lead_intake_apply_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
BEGIN
  -- PROOF:AUTOMATION_CLEANUP_V1:enterprise_rules_apply_to_enterprise_leads
  -- PROOF:AUTOMATION_CLEANUP_V1:facilitator_rules_apply_to_facilitator_leads
  v_owner := COALESCE(NEW.entreprise_id, NEW.user_id);
  PERFORM public.apply_automation_rules_to_lead(NEW.id, v_owner);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lead_intake_apply_rules
AFTER INSERT OR UPDATE OF qualification_status ON public.lead_intakes
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_lead_intake_apply_rules();

-- PROOF:AUTOMATION_CLEANUP_V1:admin_health_consistency
CREATE OR REPLACE FUNCTION public.get_automation_engine_health()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_rules       INT;
  v_total_decisions    INT;
  v_apply_decisions    INT;
  v_skip_decisions     INT;
  v_templates_resolved INT;
  v_template_fallbacks INT;
  v_rule_types         JSONB;
  v_recent             JSONB;
BEGIN
  SELECT COUNT(*) INTO v_active_rules FROM public.automation_rules WHERE is_enabled = TRUE;
  SELECT COUNT(*) INTO v_total_decisions FROM public.automation_engine_log;
  SELECT COUNT(*) INTO v_apply_decisions FROM public.automation_engine_log WHERE decision = 'apply';
  SELECT COUNT(*) INTO v_skip_decisions  FROM public.automation_engine_log WHERE decision = 'skip';
  SELECT COUNT(*) INTO v_templates_resolved FROM public.automation_engine_log WHERE (context->>'template_id') IS NOT NULL;
  SELECT COUNT(*) INTO v_template_fallbacks FROM public.automation_engine_log WHERE (context->'payload'->>'fallback')::boolean = TRUE;

  SELECT COALESCE(jsonb_agg(r), '[]')
  INTO v_rule_types
  FROM (
    SELECT rule_type, COUNT(*) as count
    FROM public.automation_rules
    WHERE is_enabled = TRUE
    GROUP BY rule_type
    ORDER BY count DESC
  ) r;

  SELECT COALESCE(jsonb_agg(e), '[]')
  INTO v_recent
  FROM (
    SELECT rule_type, decision, context, created_at
    FROM public.automation_engine_log
    ORDER BY created_at DESC
    LIMIT 10
  ) e;

  RETURN jsonb_build_object(
    'active_rules',       v_active_rules,
    'total_decisions',    v_total_decisions,
    'apply_decisions',    v_apply_decisions,
    'skip_decisions',     v_skip_decisions,
    'templates_resolved', v_templates_resolved,
    'template_fallbacks', v_template_fallbacks,
    'engine_mode',        CASE WHEN v_active_rules > 0 THEN 'active' ELSE 'idle' END,
    'owner_resolution_strategy', 'entreprise_id → user_id (enterprise wins)',
    'action_routing', 'request_facilitator_precision → facilitator_id; all other actions → resolved_owner',
    'rule_types_active',  v_rule_types,
    'recent_decisions',   v_recent
  );
END;
$$;
