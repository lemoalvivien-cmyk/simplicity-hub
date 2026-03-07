
-- ═══════════════════════════════════════════════════════════════
-- TRUST ENGINE — Trust scores, events, anti-circumvention, disputes, escrow
-- ═══════════════════════════════════════════════════════════════

-- 1. trust_scores
CREATE TABLE IF NOT EXISTS public.trust_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'facilitateur',
  global_score integer NOT NULL DEFAULT 50,
  quality_score integer NOT NULL DEFAULT 50,
  reliability_score integer NOT NULL DEFAULT 50,
  responsiveness_score integer NOT NULL DEFAULT 50,
  compliance_score integer NOT NULL DEFAULT 50,
  total_intros integer NOT NULL DEFAULT 0,
  intros_validees integer NOT NULL DEFAULT 0,
  total_gains integer NOT NULL DEFAULT 0,
  gains_confirmes integer NOT NULL DEFAULT 0,
  signalements_recus integer NOT NULL DEFAULT 0,
  badges text[] DEFAULT '{}',
  last_updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trust score"
  ON public.trust_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view trust scores"
  ON public.trust_scores FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their trust score"
  ON public.trust_scores FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. trust_events
CREATE TABLE IF NOT EXISTS public.trust_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  impact_score integer NOT NULL DEFAULT 0,
  source_entity_type text,
  source_entity_id uuid,
  summary text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trust_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trust events"
  ON public.trust_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert trust events"
  ON public.trust_events FOR INSERT
  WITH CHECK (true);

-- 3. anti_circumvention_flags
CREATE TABLE IF NOT EXISTS public.anti_circumvention_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  flag_type text NOT NULL,
  severity text NOT NULL DEFAULT 'faible',
  description text NOT NULL,
  related_entity_type text,
  related_entity_id uuid,
  status text NOT NULL DEFAULT 'ouvert',
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  resolution_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.anti_circumvention_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view flags about themselves"
  ON public.anti_circumvention_flags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage flags"
  ON public.anti_circumvention_flags FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p2
    WHERE p2.id = auth.uid() AND p2.role = 'admin'
  ));

CREATE POLICY "Service can insert flags"
  ON public.anti_circumvention_flags FOR INSERT
  WITH CHECK (true);

-- 4. disputes
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_user_id uuid NOT NULL,
  reported_user_id uuid,
  dispute_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  related_entity_type text,
  related_entity_id uuid,
  status text NOT NULL DEFAULT 'ouvert',
  priority text NOT NULL DEFAULT 'normale',
  admin_note text,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  impact_applied boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reporters can view their disputes"
  ON public.disputes FOR SELECT
  USING (auth.uid() = reporter_user_id);

CREATE POLICY "Reporters can create disputes"
  ON public.disputes FOR INSERT
  WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Admins can manage all disputes"
  ON public.disputes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p3
    WHERE p3.id = auth.uid() AND p3.role = 'admin'
  ));

-- 5. intro_escrow
CREATE TABLE IF NOT EXISTS public.intro_escrow (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  introduction_id uuid NOT NULL UNIQUE,
  facilitator_id uuid NOT NULL,
  company_id uuid,
  status text NOT NULL DEFAULT 'demandee',
  protected boolean NOT NULL DEFAULT false,
  proof_accumulated boolean NOT NULL DEFAULT false,
  converted boolean NOT NULL DEFAULT false,
  gain_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.intro_escrow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facilitators can view their escrow entries"
  ON public.intro_escrow FOR SELECT
  USING (auth.uid() = facilitator_id);

CREATE POLICY "Companies can view escrow for their intros"
  ON public.intro_escrow FOR SELECT
  USING (auth.uid() = company_id);

CREATE POLICY "Facilitators can insert escrow entries"
  ON public.intro_escrow FOR INSERT
  WITH CHECK (auth.uid() = facilitator_id);

CREATE POLICY "Facilitators and companies can update escrow"
  ON public.intro_escrow FOR UPDATE
  USING (auth.uid() = facilitator_id OR auth.uid() = company_id);

-- 6. Triggers
CREATE TRIGGER update_anti_circumvention_flags_updated_at
  BEFORE UPDATE ON public.anti_circumvention_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_intro_escrow_updated_at
  BEFORE UPDATE ON public.intro_escrow
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_trust_scores_user_id ON public.trust_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_events_user_id ON public.trust_events(user_id);
CREATE INDEX IF NOT EXISTS idx_anti_circumvention_user_id ON public.anti_circumvention_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_reporter ON public.disputes(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_intro_escrow_intro_id ON public.intro_escrow(introduction_id);
CREATE INDEX IF NOT EXISTS idx_intro_escrow_facilitator ON public.intro_escrow(facilitator_id);
