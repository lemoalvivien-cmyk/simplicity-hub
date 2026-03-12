
-- ═══════════════════════════════════════════════════════════════════════════════
-- WELCOME EMAIL TRIGGER
-- Fires after a user confirms their email (email_confirmed_at IS NOT NULL)
-- and calls the send-welcome-email Edge Function via pg_net.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Enable pg_net if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Function: called when profiles row is inserted (new signup confirmed)
--    We use profiles table because it is populated by the existing trigger
--    on auth.users and contains prenom + email in one place.
CREATE OR REPLACE FUNCTION public.on_profile_created_send_welcome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_function_url text;
BEGIN
  -- Only fire once per profile
  v_function_url := 'https://usnriklfiagazpffsqew.supabase.co/functions/v1/send-welcome-email';

  PERFORM net.http_post(
    url     := v_function_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body    := jsonb_build_object(
      'user_id', NEW.id::text,
      'email',   NEW.email,
      'prenom',  COALESCE(NEW.prenom, 'là')
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block profile creation
  RAISE WARNING '[welcome] pg_net error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 3. Attach trigger to profiles (fires once on INSERT)
DROP TRIGGER IF EXISTS trg_send_welcome_email ON public.profiles;
CREATE TRIGGER trg_send_welcome_email
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.on_profile_created_send_welcome();

-- ─────────────────────────────────────────────────────────────────────────────
-- INTRO VALIDATED TRIGGER (ensure it exists and fires on status → 'validee')
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.on_introduction_validated_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_function_url text;
BEGIN
  -- Only act on transition TO 'validee'
  IF (NEW.statut = 'validee' AND (OLD.statut IS DISTINCT FROM 'validee')) THEN
    v_function_url := 'https://usnriklfiagazpffsqew.supabase.co/functions/v1/notify-intro-validated';

    PERFORM net.http_post(
      url     := v_function_url,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body    := jsonb_build_object('introduction_id', NEW.id::text)
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[notify-intro] pg_net error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Attach / replace trigger on introductions
DROP TRIGGER IF EXISTS trg_notify_intro_validated ON public.introductions;
CREATE TRIGGER trg_notify_intro_validated
  AFTER UPDATE OF statut ON public.introductions
  FOR EACH ROW
  EXECUTE FUNCTION public.on_introduction_validated_notify();

-- ─────────────────────────────────────────────────────────────────────────────
-- GAIN PAYE TRIGGER — fires when gains.statut → 'paye'
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.on_gain_paye_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_function_url text;
BEGIN
  IF (NEW.statut = 'paye' AND (OLD.statut IS DISTINCT FROM 'paye')) THEN
    v_function_url := 'https://usnriklfiagazpffsqew.supabase.co/functions/v1/notify-gain-paye';

    PERFORM net.http_post(
      url     := v_function_url,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body    := jsonb_build_object(
        'gain_id',         NEW.id::text,
        'facilitateur_id', NEW.facilitateur_id::text,
        'montant',         COALESCE(NEW.montant, 0)
      )
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[notify-gain] pg_net error: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_gain_paye ON public.gains;
CREATE TRIGGER trg_notify_gain_paye
  AFTER UPDATE OF statut ON public.gains
  FOR EACH ROW
  EXECUTE FUNCTION public.on_gain_paye_notify();
