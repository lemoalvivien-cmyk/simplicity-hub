-- Function to call ai-lead-scoring edge function after a lead_intake is inserted
CREATE OR REPLACE FUNCTION public.trigger_ai_lead_scoring()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url     text;
  v_key     text;
  v_payload jsonb;
BEGIN
  -- Only score non-duplicate leads
  IF NEW.dedup_status = 'confirmed_duplicate' THEN
    RETURN NEW;
  END IF;

  v_url := current_setting('app.supabase_url', true);
  v_key := current_setting('app.service_role_key', true);

  -- Build payload for the edge function
  v_payload := jsonb_build_object(
    'intake_id', NEW.id,
    'lead_data', jsonb_build_object(
      'name',    COALESCE(NEW.person_name, ''),
      'company', COALESCE(NEW.company_name, ''),
      'message', COALESCE(NEW.free_text_context, ''),
      'source',  COALESCE(NEW.source_type, '')
    )
  );

  -- Fire-and-forget via pg_net (non-blocking HTTP call)
  -- pg_net is available on all Supabase projects
  PERFORM net.http_post(
    url     := format('%s/functions/v1/ai-lead-scoring', v_url),
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', format('Bearer %s', v_key)
    ),
    body    := v_payload
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block the insert if scoring fails
  RETURN NEW;
END;
$$;

-- Trigger fires AFTER INSERT so the row already exists (needed for the UPDATE inside the function)
DROP TRIGGER IF EXISTS auto_ai_score_on_lead_intake ON public.lead_intakes;
CREATE TRIGGER auto_ai_score_on_lead_intake
  AFTER INSERT ON public.lead_intakes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_ai_lead_scoring();
