
-- ══════════════════════════════════════════════════════════════════════
-- OPENCLAW INTEGRATION TABLES
-- ══════════════════════════════════════════════════════════════════════

-- 1. Configuration OpenClaw par utilisateur (gateway URL, niveau d'autonomie, kill switch)
CREATE TABLE public.openclaw_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  gateway_url TEXT DEFAULT NULL,              -- URL du gateway OpenClaw (ex: https://abc.ngrok.io)
  gateway_secret TEXT DEFAULT NULL,          -- Secret partagé pour authentifier les webhooks
  autonomie_level TEXT NOT NULL DEFAULT 'preparation'
    CHECK (autonomie_level IN ('lecture', 'preparation', 'assiste', 'semi-auto', 'etendu')),
  kill_switch_global BOOLEAN NOT NULL DEFAULT false,  -- true = tout stoppé
  is_connected BOOLEAN NOT NULL DEFAULT false,        -- true = gateway répond au healthcheck
  last_healthcheck_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  healthcheck_status TEXT DEFAULT 'unknown' CHECK (healthcheck_status IN ('ok', 'error', 'unknown')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.openclaw_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their openclaw config"
  ON public.openclaw_config FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_openclaw_config_updated_at
  BEFORE UPDATE ON public.openclaw_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Agents OpenClaw par utilisateur
CREATE TABLE public.openclaw_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id TEXT NOT NULL,                    -- ex: 'stratege', 'sourcing', 'message', etc.
  nom TEXT NOT NULL,
  role TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'pause'
    CHECK (statut IN ('actif', 'pause', 'attente', 'bloque')),
  kill_switch BOOLEAN NOT NULL DEFAULT false, -- kill switch individuel
  action_en_cours TEXT DEFAULT NULL,
  actions_aujourd_hui INTEGER NOT NULL DEFAULT 0,
  outils_autorises JSONB DEFAULT '[]'::jsonb, -- liste des outils + niveaux d'accès
  derniere_activite_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, agent_id)
);

ALTER TABLE public.openclaw_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their agents"
  ON public.openclaw_agents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_openclaw_agents_updated_at
  BEFORE UPDATE ON public.openclaw_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Journal d'audit OpenClaw (toutes les actions, décisions, blocages)
CREATE TABLE public.openclaw_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id TEXT DEFAULT NULL,               -- agent concerné ('stratege', 'sourcing', etc.)
  event_type TEXT NOT NULL
    CHECK (event_type IN (
      'agent_action',    -- action lancée par un agent
      'validation_requested', -- demande de validation humaine
      'validation_approved',  -- validation approuvée par l'humain
      'validation_rejected',  -- validation refusée par l'humain
      'kill_switch_activated', -- kill switch déclenché
      'kill_switch_deactivated',
      'rule_blocked',    -- action bloquée par une règle de sécurité
      'gateway_call',    -- appel vers le gateway OpenClaw
      'gateway_response',-- réponse du gateway
      'healthcheck',     -- résultat du healthcheck
      'dossier_sent',    -- dossier entreprise envoyé à OpenClaw
      'plan_started',    -- plan d'action démarré
      'plan_completed',  -- plan terminé
      'error'            -- erreur technique
    )),
  summary TEXT NOT NULL,                    -- résumé lisible (ex: "Agent Message a préparé 12 messages")
  details JSONB DEFAULT '{}'::jsonb,        -- payload complet
  risque TEXT DEFAULT 'faible' CHECK (risque IN ('faible', 'moyen', 'eleve')),
  gateway_request_id TEXT DEFAULT NULL,     -- ID de la requête vers OpenClaw si applicable
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.openclaw_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their openclaw logs"
  ON public.openclaw_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert logs"
  ON public.openclaw_logs FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_openclaw_logs_user_created ON public.openclaw_logs (user_id, created_at DESC);
CREATE INDEX idx_openclaw_logs_event_type ON public.openclaw_logs (user_id, event_type);

-- 4. Validations en attente (actions agents qui nécessitent approbation humaine)
CREATE TABLE public.openclaw_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id TEXT NOT NULL,
  type_validation TEXT NOT NULL
    CHECK (type_validation IN ('message', 'campagne', 'action', 'introduction', 'gain', 'blocage')),
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  consequence_valide TEXT NOT NULL,
  consequence_refuse TEXT NOT NULL,
  risque TEXT NOT NULL DEFAULT 'faible' CHECK (risque IN ('faible', 'moyen', 'eleve')),
  statut TEXT NOT NULL DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente', 'validee', 'refusee', 'expiree')),
  payload JSONB DEFAULT '{}'::jsonb,        -- données complètes de l'action à valider
  details TEXT[] DEFAULT '{}'::text[],
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  validated_by UUID DEFAULT NULL,
  gateway_callback_url TEXT DEFAULT NULL,   -- URL à appeler après validation/refus
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.openclaw_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their validations"
  ON public.openclaw_validations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_openclaw_validations_updated_at
  BEFORE UPDATE ON public.openclaw_validations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_openclaw_validations_user_statut
  ON public.openclaw_validations (user_id, statut, created_at DESC);

-- 5. Dossier entreprise OpenClaw (source de vérité envoyée au cerveau)
CREATE TABLE public.openclaw_dossier (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  -- Section 1 : Ce que fait l'entreprise
  activite TEXT DEFAULT NULL,
  offre TEXT DEFAULT NULL,
  valeur_proposee TEXT DEFAULT NULL,
  cas_usage TEXT DEFAULT NULL,
  -- Section 2 : Qui elle cherche
  cible_ideale TEXT DEFAULT NULL,
  type_entreprise TEXT DEFAULT NULL,
  taille_cible TEXT DEFAULT NULL,
  type_decideur TEXT DEFAULT NULL,
  -- Section 3 : Où elle cherche
  zone_geo TEXT DEFAULT NULL,
  villes TEXT DEFAULT NULL,
  secteurs_prioritaires TEXT DEFAULT NULL,
  exclusions_geo TEXT DEFAULT NULL,
  -- Section 4 : Comment prospecter
  mode_prospection TEXT DEFAULT 'assiste' CHECK (mode_prospection IN ('manuel', 'assiste', 'semi-auto', 'agent')),
  canaux_autorises TEXT[] DEFAULT '{}'::text[],
  canaux_interdits TEXT[] DEFAULT '{}'::text[],
  -- Section 5 : Objectifs business
  objectif_opportunites INTEGER DEFAULT NULL,
  objectif_introductions INTEGER DEFAULT NULL,
  objectif_rdv INTEGER DEFAULT NULL,
  priorite_secteur TEXT DEFAULT NULL,
  -- Section 6 : Ton / positionnement
  ton_messages TEXT DEFAULT 'professionnel',
  niveau_formalite TEXT DEFAULT 'formel',
  style_commercial TEXT DEFAULT NULL,
  angle_principal TEXT DEFAULT NULL,
  -- Section 7 : Contraintes
  clients_interdits TEXT DEFAULT NULL,
  actions_sensibles TEXT DEFAULT NULL,
  validation_humaine_requise BOOLEAN NOT NULL DEFAULT true,
  -- Métadonnées OpenClaw
  derniere_sync_openclaw_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  openclaw_session_id TEXT DEFAULT NULL,    -- ID de session OpenClaw si connecté
  completion_score INTEGER DEFAULT 0,       -- score de complétion 0-100
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.openclaw_dossier ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their dossier"
  ON public.openclaw_dossier FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_openclaw_dossier_updated_at
  BEFORE UPDATE ON public.openclaw_dossier
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
