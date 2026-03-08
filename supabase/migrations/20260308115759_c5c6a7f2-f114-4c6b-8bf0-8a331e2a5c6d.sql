
-- PROOF:RELEASE_V1:seed_uniqueness_rules
-- Enforce unique constraint on automation_rules to prevent silent duplicates on replay
ALTER TABLE public.automation_rules
  DROP CONSTRAINT IF EXISTS automation_rules_owner_rule_type_unique;

ALTER TABLE public.automation_rules
  ADD CONSTRAINT automation_rules_owner_rule_type_unique
    UNIQUE (owner_user_id, rule_type);

-- PROOF:RELEASE_V1:seed_uniqueness_templates
-- Enforce unique constraint on message_templates to prevent silent duplicates on replay
ALTER TABLE public.message_templates
  DROP CONSTRAINT IF EXISTS message_templates_owner_type_channel_unique;

ALTER TABLE public.message_templates
  ADD CONSTRAINT message_templates_owner_type_channel_unique
    UNIQUE (owner_user_id, template_type, channel);

-- PROOF:RELEASE_V1:admin_forensics_global_visibility
-- Admin read RPC — SECURITY DEFINER so it bypasses RLS safely.
-- Returns global aggregate counts for the forensics panel.
-- Never returns user PII, only counts + audit events (no user_id exposed).
CREATE OR REPLACE FUNCTION public.admin_forensics_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action_events_count    bigint;
  v_automation_rules_count bigint;
  v_msg_templates_count    bigint;
  v_passive_events_count   bigint;
  v_recent_events          jsonb;
BEGIN
  SELECT COUNT(*) INTO v_action_events_count    FROM public.lead_action_events;
  SELECT COUNT(*) INTO v_automation_rules_count FROM public.automation_rules;
  SELECT COUNT(*) INTO v_msg_templates_count    FROM public.message_templates;
  SELECT COUNT(*) INTO v_passive_events_count
    FROM public.lead_source_events
    WHERE source_type = 'passive_click';

  SELECT jsonb_agg(row_to_json(r))
  INTO v_recent_events
  FROM (
    SELECT id, new_status, event_type, created_at
    FROM public.lead_action_events
    ORDER BY created_at DESC
    LIMIT 10
  ) r;

  RETURN jsonb_build_object(
    'action_events_count',     v_action_events_count,
    'automation_rules_count',  v_automation_rules_count,
    'message_templates_count', v_msg_templates_count,
    'passive_events_count',    v_passive_events_count,
    'recent_events',           COALESCE(v_recent_events, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_forensics_summary() TO authenticated;

COMMENT ON FUNCTION public.admin_forensics_summary() IS
  'PROOF:RELEASE_V1:admin_forensics_global_visibility — global aggregate admin view, SECURITY DEFINER, bypasses RLS safely.';
