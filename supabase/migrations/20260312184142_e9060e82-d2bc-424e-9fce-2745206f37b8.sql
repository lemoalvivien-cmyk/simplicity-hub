
-- ══════════════════════════════════════════════════════════════════
-- Seed trigger: when a user's subscription becomes active
-- for the first time, insert 1 sample mission + 3 sample contacts
-- + 1 lead_intake (OpenClaw cible suggérée) IF they have none yet.
-- ══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.seed_onboarding_data_on_activation(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mission_id UUID;
  v_contact1   UUID;
  v_contact2   UUID;
  v_contact3   UUID;
  v_event_id   UUID;
  v_role       TEXT;
  v_mission_count INT;
  v_contact_count INT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
  IF v_role IS DISTINCT FROM 'entreprise' THEN RETURN; END IF;

  SELECT COUNT(*) INTO v_mission_count FROM public.missions WHERE entreprise_id = p_user_id;
  IF v_mission_count > 0 THEN RETURN; END IF;

  SELECT COUNT(*) INTO v_contact_count FROM public.contacts WHERE owner_user_id = p_user_id;
  IF v_contact_count > 0 THEN RETURN; END IF;

  INSERT INTO public.missions (
    entreprise_id, titre, description, secteur, zone, recompense, statut
  ) VALUES (
    p_user_id,
    'Ma première mission — à personnaliser',
    'Cette mission a été créée automatiquement pour vous aider à démarrer. Modifiez-la ou créez-en une nouvelle adaptée à votre activité.',
    'SaaS / Tech', 'France', '500 €', 'active'
  ) RETURNING id INTO v_mission_id;

  INSERT INTO public.contacts (owner_user_id, prenom_nom, entreprise, email, origine, statut)
  VALUES (p_user_id, 'Sophie Martin', 'Innova SAS', 'sophie.martin@exemple.fr', 'import', 'a_contacter')
  RETURNING id INTO v_contact1;

  INSERT INTO public.contacts (owner_user_id, prenom_nom, entreprise, email, origine, statut)
  VALUES (p_user_id, 'Thomas Dupont', 'Tech Ventures', 'thomas.dupont@exemple.fr', 'import', 'a_contacter')
  RETURNING id INTO v_contact2;

  INSERT INTO public.contacts (owner_user_id, prenom_nom, entreprise, email, origine, statut)
  VALUES (p_user_id, 'Amina Benali', 'Growth Corp', 'amina.benali@exemple.fr', 'import', 'a_contacter')
  RETURNING id INTO v_contact3;

  INSERT INTO public.lead_source_events (user_id, source_type, source_ref_id, source_ref_type, raw_payload)
  VALUES (
    p_user_id, 'import', v_contact1, 'contact',
    '{"name":"Sophie Martin","company":"Innova SAS","email":"sophie.martin@exemple.fr","seeded":true}'::jsonb
  ) RETURNING id INTO v_event_id;

  INSERT INTO public.lead_intakes (
    user_id, source_event_id, source_type,
    person_name, person_email, company_name,
    linked_contact_id, dedup_status, qualification_status,
    next_best_action, free_text_context, ai_label, ai_score
  ) VALUES (
    p_user_id, v_event_id, 'import',
    'Sophie Martin', 'sophie.martin@exemple.fr', 'Innova SAS',
    v_contact1, 'unique', 'ready_for_action',
    'contact_email_draft',
    'Contact suggéré par OpenClaw — cible identifiée au profil décideur SaaS B2B.',
    'Chaud', 72
  );

  UPDATE public.lead_source_events SET processed = true WHERE id = v_event_id;

EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_seed_on_subscription_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('active', 'trialing') AND
     (OLD IS NULL OR OLD.status NOT IN ('active', 'trialing'))
  THEN
    PERFORM public.seed_onboarding_data_on_activation(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seed_on_subscription_active ON public.subscriptions;
CREATE TRIGGER seed_on_subscription_active
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_seed_on_subscription_active();
