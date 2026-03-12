
-- Wire notify-intro-validated edge function into the introduction validated pipeline
-- Uses pg_net to fire-and-forget the HTTP call to the edge function

CREATE OR REPLACE FUNCTION public.on_introduction_validated_pipeline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url  text;
  v_key  text;
BEGIN
  -- Only fire when statut transitions to 'validee'
  IF (OLD.statut IS DISTINCT FROM NEW.statut) AND NEW.statut = 'validee' THEN

    v_url := current_setting('app.supabase_url', true);
    v_key := current_setting('app.service_role_key', true);

    -- Fire-and-forget: notify-intro-validated edge function (real Resend email)
    PERFORM net.http_post(
      url     := format('%s/functions/v1/notify-intro-validated', v_url),
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', format('Bearer %s', v_key)
      ),
      body    := jsonb_build_object('introduction_id', NEW.id)
    );

  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block the update
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists on introductions table
DROP TRIGGER IF EXISTS trg_on_introduction_validated_pipeline ON public.introductions;
CREATE TRIGGER trg_on_introduction_validated_pipeline
  AFTER UPDATE ON public.introductions
  FOR EACH ROW
  EXECUTE FUNCTION public.on_introduction_validated_pipeline();
