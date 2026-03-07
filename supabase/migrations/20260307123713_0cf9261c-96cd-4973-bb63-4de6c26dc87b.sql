
-- ============================================================
-- MARKETPLACE FACILITATEURS : tables requests & reviews
-- ============================================================

-- 1. Enrichir facilitateur_profiles avec stats de réputation
ALTER TABLE public.facilitateur_profiles
  ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_rate INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Table des demandes d'introduction (entreprise → facilitateur)
CREATE TABLE IF NOT EXISTS public.facilitator_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_user_id UUID NOT NULL,
  facilitator_user_id UUID NOT NULL,
  mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  request_context TEXT,
  openclaw_note TEXT,
  status TEXT NOT NULL DEFAULT 'envoyee',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.facilitator_requests ENABLE ROW LEVEL SECURITY;

-- Entreprise peut créer et voir ses demandes
CREATE POLICY "Companies can manage their requests"
  ON public.facilitator_requests FOR ALL
  USING (auth.uid() = company_user_id)
  WITH CHECK (auth.uid() = company_user_id);

-- Facilitateur peut voir et mettre à jour les demandes qui lui sont destinées
CREATE POLICY "Facilitators can view their requests"
  ON public.facilitator_requests FOR SELECT
  USING (auth.uid() = facilitator_user_id);

CREATE POLICY "Facilitators can update their requests"
  ON public.facilitator_requests FOR UPDATE
  USING (auth.uid() = facilitator_user_id);

CREATE TRIGGER update_facilitator_requests_updated_at
  BEFORE UPDATE ON public.facilitator_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Table des avis facilitateurs
CREATE TABLE IF NOT EXISTS public.facilitator_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_user_id UUID NOT NULL,
  facilitator_user_id UUID NOT NULL,
  introduction_id UUID REFERENCES public.introductions(id) ON DELETE SET NULL,
  request_id UUID REFERENCES public.facilitator_requests(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  tags JSONB DEFAULT '[]',
  recommended BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.facilitator_reviews ENABLE ROW LEVEL SECURITY;

-- Reviewer peut créer un avis
CREATE POLICY "Reviewers can insert reviews"
  ON public.facilitator_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_user_id);

-- Reviewer peut voir ses propres avis
CREATE POLICY "Reviewers can view their reviews"
  ON public.facilitator_reviews FOR SELECT
  USING (auth.uid() = reviewer_user_id);

-- Facilitateur peut voir ses avis
CREATE POLICY "Facilitators can view reviews about them"
  ON public.facilitator_reviews FOR SELECT
  USING (auth.uid() = facilitator_user_id);

-- Tout utilisateur authentifié peut lire les avis (pour la marketplace)
CREATE POLICY "Authenticated users can view reviews for marketplace"
  ON public.facilitator_reviews FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 4. Table des favoris facilitateurs (shortlist entreprise)
CREATE TABLE IF NOT EXISTS public.facilitator_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_user_id UUID NOT NULL,
  facilitator_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_user_id, facilitator_user_id)
);

ALTER TABLE public.facilitator_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can manage their favorites"
  ON public.facilitator_favorites FOR ALL
  USING (auth.uid() = company_user_id)
  WITH CHECK (auth.uid() = company_user_id);

-- 5. Rendre facilitateur_profiles lisibles par tous les utilisateurs authentifiés (pour la marketplace)
CREATE POLICY "Authenticated users can view all facilitateur profiles"
  ON public.facilitateur_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);
