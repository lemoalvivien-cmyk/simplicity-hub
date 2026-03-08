
-- PROOF:GOLIVE_V1:automation_rules_table
-- automation_rules: persistent user-level automation rules (replaces useState mock in Regles.tsx)
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id   UUID        NOT NULL,
  rule_type       TEXT        NOT NULL,
  label           TEXT        NOT NULL,
  description     TEXT,
  is_enabled      BOOLEAN     NOT NULL DEFAULT true,
  niveau          TEXT        NOT NULL DEFAULT 'securite',
  config          JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_rules_owner_select"
  ON public.automation_rules FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "automation_rules_owner_insert"
  ON public.automation_rules FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "automation_rules_owner_update"
  ON public.automation_rules FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "automation_rules_owner_delete"
  ON public.automation_rules FOR DELETE
  USING (auth.uid() = owner_user_id);

CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PROOF:GOLIVE_V1:message_templates_table
-- message_templates: persistent per-user message templates (replaces hardcoded array in Messages.tsx)
CREATE TABLE IF NOT EXISTS public.message_templates (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id   UUID        NOT NULL,
  template_type   TEXT        NOT NULL,
  title           TEXT        NOT NULL,
  body            TEXT        NOT NULL DEFAULT '',
  channel         TEXT        NOT NULL DEFAULT 'email',
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  utilises        INT         NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_templates_owner_select"
  ON public.message_templates FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "message_templates_owner_insert"
  ON public.message_templates FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "message_templates_owner_update"
  ON public.message_templates FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "message_templates_owner_delete"
  ON public.message_templates FOR DELETE
  USING (auth.uid() = owner_user_id);

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PROOF:GOLIVE_V1:passive_edge_or_rpc_path
-- ingest_passive_signal: server-side RPC for passive ingestion with idempotency guard
CREATE OR REPLACE FUNCTION public.ingest_passive_signal(
  p_user_id        UUID,
  p_share_link_id  UUID,
  p_person_email   TEXT  DEFAULT NULL,
  p_company_name   TEXT  DEFAULT NULL,
  p_context        TEXT  DEFAULT 'passive_click'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id  UUID;
  v_intake_id UUID;
  v_dedup     TEXT := 'unique';
  v_match_id  UUID;
  v_exists    BOOLEAN := false;
BEGIN
  -- PROOF:GOLIVE_V1:passive_ingestion_trigger_real
  -- Idempotency guard: reject if this share_link was already ingested
  SELECT EXISTS(
    SELECT 1 FROM lead_source_events
    WHERE user_id = p_user_id
      AND source_type = 'passive_click'
      AND source_ref_id = p_share_link_id::text
  ) INTO v_exists;

  IF v_exists THEN
    RETURN jsonb_build_object('status', 'already_ingested', 'share_link_id', p_share_link_id);
  END IF;

  -- Email dedup check
  IF p_person_email IS NOT NULL THEN
    SELECT id INTO v_match_id FROM lead_intakes
    WHERE user_id = p_user_id
      AND lower(trim(person_email)) = lower(trim(p_person_email))
    LIMIT 1;
    IF v_match_id IS NOT NULL THEN v_dedup := 'confirmed_duplicate'; END IF;
  END IF;

  INSERT INTO lead_source_events (
    user_id, source_type, source_ref_id, source_ref_type, raw_payload, processed
  ) VALUES (
    p_user_id, 'passive_click', p_share_link_id::text, 'share_link',
    jsonb_build_object(
      'share_link_id', p_share_link_id,
      'context',       p_context,
      'email',         p_person_email,
      'company',       p_company_name
    ),
    false
  ) RETURNING id INTO v_event_id;

  INSERT INTO lead_intakes (
    user_id, source_event_id, source_type,
    person_email, company_name,
    dedup_status, dedup_match_id,
    qualification_status, next_best_action,
    action_status
  ) VALUES (
    p_user_id, v_event_id, 'passive_click',
    p_person_email, p_company_name,
    v_dedup, v_match_id,
    CASE WHEN v_dedup = 'confirmed_duplicate' THEN 'duplicate'
         WHEN p_person_email IS NOT NULL THEN 'ready_for_action'
         ELSE 'pending_review' END,
    CASE WHEN v_dedup = 'confirmed_duplicate' THEN NULL
         WHEN p_person_email IS NOT NULL THEN 'contact_email_draft'
         ELSE 'review_lead' END,
    'pending'
  ) RETURNING id INTO v_intake_id;

  UPDATE lead_source_events SET intake_id = v_intake_id, processed = true WHERE id = v_event_id;
  UPDATE offer_share_links SET converted = true WHERE id = p_share_link_id AND NOT converted;

  RETURN jsonb_build_object(
    'status',    'created',
    'intake_id', v_intake_id,
    'event_id',  v_event_id,
    'dedup',     v_dedup
  );
END;
$$;

-- Seed helper: default automation rules
CREATE OR REPLACE FUNCTION public.seed_default_automation_rules(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.automation_rules (owner_user_id, rule_type, label, description, is_enabled, niveau, config) VALUES
    (p_user_id, 'validation_avant_envoi',  'Toujours vérifier avant d''envoyer',             'Chaque message est soumis à votre validation avant d''être envoyé.', true,  'securite',       '{}'),
    (p_user_id, 'pause_si_anomalie',        'S''arrêter si quelque chose semble anormal',      'La campagne se met en pause automatiquement si on détecte un problème.', true,'securite',       '{}'),
    (p_user_id, 'limite_volume',            'Limiter le nombre d''envois par jour',            'Pour rester naturel et éviter d''être signalé comme spam.', true,         'securite',       '{}'),
    (p_user_id, 'pause_manuelle',           'Pouvoir tout arrêter en un clic',                 'Mettez en pause toutes vos campagnes en un seul clic.', true,             'securite',       '{}'),
    (p_user_id, 'actions_simples_auto',     'Lancer automatiquement les étapes simples',       'Certaines actions répétitives peuvent se faire automatiquement.', false,    'automatisation', '{}'),
    (p_user_id, 'validation_importantes',   'Demander une confirmation avant les actions importantes', 'Pour les actions à fort impact, vous confirmez avant.', true,   'validation',     '{}')
  ON CONFLICT DO NOTHING;
END;
$$;

-- Seed helper: default message templates
CREATE OR REPLACE FUNCTION public.seed_default_message_templates(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.message_templates (owner_user_id, template_type, title, body, channel, is_active) VALUES
    (p_user_id, 'prospect_first_touch', 'Premier contact — direct',
      E'Bonjour [Prénom],\n\nJe vous contacte car votre activité correspond exactement à ce que nous faisons chez [Votre entreprise].\n\nEn quelques mots : nous aidons les PME à [résoudre leur problème] sans [point de douleur].\n\nÇa vous intéresserait d''en savoir plus en 15 minutes cette semaine ?\n\nBonne journée,\n[Votre prénom]',
      'email', true),
    (p_user_id, 'relance', 'Relance douce après silence',
      E'Bonjour [Prénom],\n\nJe me permets de revenir vers vous — mon email précédent a peut-être été noyé dans vos messages.\n\nJuste pour vous demander : est-ce que le sujet [problème] est quelque chose d''actuel pour vous ?\n\n[Votre prénom]',
      'email', true),
    (p_user_id, 'intro_followup_email', 'Introduction — présentation chaleureuse',
      E'Bonjour [Prénom],\n\nJe me permets de vous contacter suite à la recommandation de [Prénom du contact commun].\n\nVoici en deux lignes : [description simple].\n\nSeriez-vous disponible pour un échange rapide ?\n\n[Votre prénom]',
      'email', true),
    (p_user_id, 'manual_call_prep_note', 'Script appel — premier contact',
      E'Bonjour, je suis [Prénom] de [Votre entreprise].\n\nJe vous appelle car nous travaillons avec des entreprises comme la vôtre sur [sujet].\n\nEst-ce que vous avez 2 minutes pour que je vous explique rapidement ?\n\n[Si oui → expliquer la valeur]\n[Si non → proposer un rappel]',
      'telephone', true),
    (p_user_id, 'reponse', 'Réponse à une demande entrante',
      E'Bonjour [Prénom],\n\nMerci de votre message.\n\nJe suis ravi de pouvoir vous aider. Voici ce que je vous propose : [solution simple].\n\nEst-ce que vous seriez disponible [créneau] pour en discuter ?\n\n[Votre prénom]',
      'email', true),
    (p_user_id, 'facilitator_precision_request', 'Demande de précision facilitateur',
      E'Bonjour,\n\nPour traiter correctement ce lead, j''aurais besoin de quelques informations supplémentaires :\n\n- Contexte de la relation ?\n- Email ou téléphone du contact ?\n- Secteur / zone géographique ?\n\nMerci d''avance.',
      'email', true)
  ON CONFLICT DO NOTHING;
END;
$$;
