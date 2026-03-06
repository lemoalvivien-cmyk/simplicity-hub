
-- ============================
-- SCHÉMA COMPLET WIINUP MAX
-- ============================

-- Profiles (utilisateurs)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  email TEXT,
  prenom TEXT,
  role TEXT DEFAULT 'facilitateur',
  onboarding_done BOOLEAN NOT NULL DEFAULT false,
  statut TEXT DEFAULT 'actif',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Profils entreprise
CREATE TABLE IF NOT EXISTS public.entreprise_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  nom_entreprise TEXT,
  description TEXT,
  offre TEXT,
  cible_client TEXT,
  secteur TEXT,
  zone TEXT,
  abonnement_statut TEXT DEFAULT 'none',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.entreprise_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their entreprise profile"
  ON public.entreprise_profiles FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Profils facilitateur
CREATE TABLE IF NOT EXISTS public.facilitateur_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  description_reseau TEXT,
  types_contacts TEXT,
  secteur TEXT,
  zone TEXT,
  statut TEXT DEFAULT 'actif',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.facilitateur_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their facilitateur profile"
  ON public.facilitateur_profiles FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Missions
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entreprise_id UUID NOT NULL,
  titre TEXT NOT NULL,
  description TEXT,
  type_client_recherche TEXT,
  secteur TEXT,
  zone TEXT,
  recompense TEXT,
  statut TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entreprises can manage their missions"
  ON public.missions FOR ALL USING (auth.uid() = entreprise_id)
  WITH CHECK (auth.uid() = entreprise_id);

CREATE POLICY "Facilitateurs can view active missions"
  ON public.missions FOR SELECT USING (statut = 'active');

-- Introductions
CREATE TABLE IF NOT EXISTS public.introductions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID REFERENCES public.missions(id),
  facilitateur_id UUID NOT NULL,
  entreprise_id UUID,
  contact_nom TEXT NOT NULL,
  contact_email TEXT,
  contact_telephone TEXT,
  contexte TEXT,
  pertinence TEXT,
  statut TEXT DEFAULT 'en_attente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.introductions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facilitateurs can manage their introductions"
  ON public.introductions FOR ALL USING (auth.uid() = facilitateur_id)
  WITH CHECK (auth.uid() = facilitateur_id);

CREATE POLICY "Entreprises can view introductions for their missions"
  ON public.introductions FOR SELECT
  USING (auth.uid() = entreprise_id);

CREATE POLICY "Entreprises can update introductions for their missions"
  ON public.introductions FOR UPDATE
  USING (auth.uid() = entreprise_id);

-- Gains
CREATE TABLE IF NOT EXISTS public.gains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  introduction_id UUID REFERENCES public.introductions(id),
  facilitateur_id UUID NOT NULL,
  mission_id UUID REFERENCES public.missions(id),
  montant NUMERIC(10,2),
  statut TEXT DEFAULT 'en_attente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facilitateurs can view their gains"
  ON public.gains FOR ALL USING (auth.uid() = facilitateur_id)
  WITH CHECK (auth.uid() = facilitateur_id);

-- Contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  prenom_nom TEXT NOT NULL,
  entreprise TEXT,
  email TEXT,
  telephone TEXT,
  origine TEXT DEFAULT 'manuel',
  statut TEXT DEFAULT 'actif',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their contacts"
  ON public.contacts FOR ALL USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Listes
CREATE TABLE IF NOT EXISTS public.listes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  nom TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.listes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their listes"
  ON public.listes FOR ALL USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Liste_contacts (pivot)
CREATE TABLE IF NOT EXISTS public.liste_contacts (
  liste_id UUID NOT NULL REFERENCES public.listes(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  PRIMARY KEY (liste_id, contact_id)
);

ALTER TABLE public.liste_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their liste_contacts"
  ON public.liste_contacts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.listes WHERE listes.id = liste_id AND listes.owner_user_id = auth.uid())
  );

-- Campagnes
CREATE TABLE IF NOT EXISTS public.campagnes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  nom TEXT NOT NULL,
  objectif TEXT,
  mode_action TEXT DEFAULT 'manuel',
  canal_principal TEXT DEFAULT 'email',
  statut TEXT DEFAULT 'brouillon',
  liste_id UUID REFERENCES public.listes(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campagnes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their campagnes"
  ON public.campagnes FOR ALL USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Actions
CREATE TABLE IF NOT EXISTS public.actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  type_action TEXT NOT NULL,
  titre TEXT NOT NULL,
  description TEXT,
  statut TEXT DEFAULT 'a_faire',
  priorite TEXT DEFAULT 'normale',
  canal TEXT,
  contact_id UUID REFERENCES public.contacts(id),
  campagne_id UUID REFERENCES public.campagnes(id),
  mission_id UUID REFERENCES public.missions(id),
  introduction_id UUID REFERENCES public.introductions(id),
  due_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their actions"
  ON public.actions FOR ALL USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- ============================
-- BILLING TABLES
-- ============================

CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'none',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TABLE public.billing_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  stripe_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view billing events"
  ON public.billing_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Service role can manage billing events"
  ON public.billing_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'actif',
  duration_months INTEGER NOT NULL DEFAULT 12,
  usage_unique BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  used_by UUID,
  used_at TIMESTAMP WITH TIME ZONE,
  disabled_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read promo codes for validation"
  ON public.promo_codes FOR SELECT USING (true);

CREATE POLICY "Admins can manage promo codes"
  ON public.promo_codes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE TABLE public.promo_code_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id),
  user_id UUID NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  start_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own redemptions"
  ON public.promo_code_redemptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage redemptions"
  ON public.promo_code_redemptions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================
-- TRIGGERS
-- ============================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, prenom, role, onboarding_done)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    'facilitateur',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================
-- SEED promo codes
-- ============================

INSERT INTO public.promo_codes (code, status, duration_months, usage_unique, expires_at)
VALUES
  ('BIENVENUE12', 'actif', 12, true, now() + interval '2 years'),
  ('INVITE2025A', 'actif', 12, true, now() + interval '1 year'),
  ('INVITE2025B', 'actif', 12, true, now() + interval '1 year'),
  ('WIINUP2025', 'actif', 12, true, now() + interval '1 year');
