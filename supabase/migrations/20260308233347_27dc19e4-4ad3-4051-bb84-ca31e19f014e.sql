
-- ════════════════════════════════════════════════════════════════
-- PHASE A — SÉCURITÉ CRITIQUE
-- ════════════════════════════════════════════════════════════════

-- A3: Restreindre trust_scores — lecture limitée au propriétaire uniquement
-- Supprimer toute policy SELECT trop permissive
DROP POLICY IF EXISTS "Authenticated users can view trust scores" ON public.trust_scores;
DROP POLICY IF EXISTS "Users can view all trust scores" ON public.trust_scores;
DROP POLICY IF EXISTS "trust_scores_select_public" ON public.trust_scores;

-- Lecture uniquement sur son propre score
CREATE POLICY "trust_scores_select_own"
  ON public.trust_scores FOR SELECT
  USING (auth.uid() = user_id);

-- A4: Restreindre admin_forensics_summary — contrôle admin réel
-- Créer la fonction avec vérification admin via user_roles
CREATE OR REPLACE FUNCTION public.admin_forensics_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_is_admin boolean := false;
  v_result jsonb;
BEGIN
  -- Vérifier que l'appelant est admin via user_roles (jamais via profiles pour éviter privilege escalation)
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_caller AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT jsonb_build_object(
    'total_lead_action_events', (SELECT COUNT(*) FROM public.lead_action_events),
    'active_automation_rules',  (SELECT COUNT(*) FROM public.automation_rules WHERE is_enabled = true),
    'lead_intakes_last_24h',    (SELECT COUNT(*) FROM public.lead_intakes WHERE created_at > now() - interval '24 hours'),
    'passive_signals_last_24h', (SELECT COUNT(*) FROM public.lead_source_events WHERE source_type = 'passive_click' AND created_at > now() - interval '24 hours'),
    'jobs_completed_last_24h',  (SELECT COUNT(*) FROM public.openclaw_job_queue WHERE status = 'done' AND ended_at > now() - interval '24 hours'),
    'jobs_failed_last_24h',     (SELECT COUNT(*) FROM public.openclaw_job_queue WHERE status = 'failed' AND ended_at > now() - interval '24 hours'),
    'channel_actions_last_24h', (SELECT COUNT(*) FROM public.openclaw_channel_actions WHERE created_at > now() - interval '24 hours'),
    'generated_at',             now()
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Révoquer EXECUTE de tous les authenticated (ancienne config trop permissive)
REVOKE EXECUTE ON FUNCTION public.admin_forensics_summary() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_forensics_summary() FROM authenticated;
-- Accorder uniquement au service_role (appels depuis edge functions avec service_role key)
GRANT EXECUTE ON FUNCTION public.admin_forensics_summary() TO service_role;

-- ════════════════════════════════════════════════════════════════
-- PHASE B7 — PAYOUT OPS BACKBONE
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.payouts (
  id              UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facilitator_id  UUID NOT NULL,
  amount          NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'EUR',
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  method          TEXT NOT NULL DEFAULT 'manual'
    CHECK (method IN ('manual', 'stripe_transfer', 'bank_wire')),
  reference       TEXT,
  notes           TEXT,
  batch_id        UUID,
  gain_ids        UUID[],
  requested_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at    TIMESTAMP WITH TIME ZONE,
  paid_at         TIMESTAMP WITH TIME ZONE,
  failure_reason  TEXT,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payout_batches (
  id              UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  total_amount    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payout_count    INTEGER NOT NULL DEFAULT 0,
  processed_by    UUID,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payout_failures (
  id              UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payout_id       UUID NOT NULL REFERENCES public.payouts(id) ON DELETE CASCADE,
  error_code      TEXT,
  error_message   TEXT,
  occurred_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  retry_count     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.payout_audit_log (
  id              UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payout_id       UUID NOT NULL REFERENCES public.payouts(id) ON DELETE CASCADE,
  actor_id        UUID NOT NULL,
  action          TEXT NOT NULL,
  previous_status TEXT,
  new_status      TEXT,
  note            TEXT,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payouts_facilitator    ON public.payouts(facilitator_id, status);
CREATE INDEX IF NOT EXISTS idx_payouts_batch          ON public.payouts(batch_id);
CREATE INDEX IF NOT EXISTS idx_payout_audit_payout    ON public.payout_audit_log(payout_id, created_at DESC);

-- RLS
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_audit_log ENABLE ROW LEVEL SECURITY;

-- Facilitateur : voir uniquement ses propres payouts
CREATE POLICY "payouts_select_own"
  ON public.payouts FOR SELECT
  USING (auth.uid() = facilitator_id);

-- Seul le service_role peut INSERT/UPDATE/DELETE payouts (admin via edge function)
CREATE POLICY "payouts_service_role_all"
  ON public.payouts FOR ALL
  USING (false) WITH CHECK (false);

-- payout_batches, failures, audit_log : admin via service_role uniquement
CREATE POLICY "payout_batches_service_role"
  ON public.payout_batches FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "payout_failures_select_own"
  ON public.payout_failures FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.payouts p WHERE p.id = payout_id AND p.facilitator_id = auth.uid()));
CREATE POLICY "payout_audit_select_own"
  ON public.payout_audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.payouts p WHERE p.id = payout_id AND p.facilitator_id = auth.uid()));

-- Trigger updated_at
CREATE TRIGGER update_payouts_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payout_batches_updated_at
  BEFORE UPDATE ON public.payout_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ════════════════════════════════════════════════════════════════
-- PHASE B5 — ANALYTICS RUNTIME EVENTS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    TEXT NOT NULL,
  user_id       UUID,
  event_type    TEXT NOT NULL,
  page          TEXT,
  properties    JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type    ON public.analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user    ON public.analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Public INSERT (anonymous events + logged-in) — pas de SELECT pour les users normaux
CREATE POLICY "analytics_events_insert_public"
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);

-- Aucun SELECT pour les users normaux (admin via service_role)
-- Service_role peut tout lire
