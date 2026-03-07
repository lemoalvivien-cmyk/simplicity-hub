
-- ═══════════════════════════════════════════════════════════════
-- OPENCLAW GOD MODE — Runs, Sessions, Memory
-- ═══════════════════════════════════════════════════════════════

-- ── openclaw_runs : cycles de travail du cerveau ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.openclaw_runs (
  id              uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL,
  run_type        text NOT NULL DEFAULT 'scan',       -- scan | brief | passive | radar | matching | relance | validation_check
  status          text NOT NULL DEFAULT 'planifie',   -- planifie | en_cours | termine | bloque | erreur | expire
  trigger_source  text NOT NULL DEFAULT 'cron',       -- cron | manual | webhook | agent | mission_created | intro_received
  agent_names     text[] DEFAULT '{}',                -- agents ayant participé
  requires_validation boolean NOT NULL DEFAULT false,
  validation_id   uuid,                               -- lié à openclaw_validations si besoin
  summary         text,
  outcome         jsonb DEFAULT '{}',
  error_detail    text,
  started_at      timestamp with time zone,
  ended_at        timestamp with time zone,
  next_run_at     timestamp with time zone,
  duration_ms     integer,
  created_at      timestamp with time zone NOT NULL DEFAULT now(),
  updated_at      timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.openclaw_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their runs"
  ON public.openclaw_runs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_openclaw_runs_updated_at
  BEFORE UPDATE ON public.openclaw_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── openclaw_sessions : sessions de travail longues ──────────────────────────
CREATE TABLE IF NOT EXISTS public.openclaw_sessions (
  id              uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL,
  session_type    text NOT NULL DEFAULT 'prospection', -- prospection | passive | matching | trust | brief
  status          text NOT NULL DEFAULT 'active',      -- active | paused | completed | expired
  autonomie_level text NOT NULL DEFAULT 'preparation',
  context         jsonb DEFAULT '{}',                  -- dossier snapshot, objectifs, mémoire
  runs_count      integer NOT NULL DEFAULT 0,
  last_run_id     uuid,
  last_run_at     timestamp with time zone,
  next_scheduled_at timestamp with time zone,
  memory_snapshot jsonb DEFAULT '{}',                  -- apprentissages de la session
  session_score   integer DEFAULT 50,                  -- score de qualité 0-100
  started_at      timestamp with time zone NOT NULL DEFAULT now(),
  ended_at        timestamp with time zone,
  created_at      timestamp with time zone NOT NULL DEFAULT now(),
  updated_at      timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.openclaw_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their sessions"
  ON public.openclaw_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_openclaw_sessions_updated_at
  BEFORE UPDATE ON public.openclaw_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── openclaw_memory : mémoire utile du cerveau ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.openclaw_memory (
  id              uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL,
  memory_type     text NOT NULL,  -- offer_performance | facilitator_response | message_conversion | language_success | validation_pattern | risk_pattern
  key             text NOT NULL,
  value           jsonb NOT NULL DEFAULT '{}',
  confidence      integer NOT NULL DEFAULT 50,   -- 0-100
  source          text DEFAULT 'system',
  times_used      integer NOT NULL DEFAULT 0,
  last_used_at    timestamp with time zone,
  expires_at      timestamp with time zone,
  created_at      timestamp with time zone NOT NULL DEFAULT now(),
  updated_at      timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, memory_type, key)
);

ALTER TABLE public.openclaw_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their memory"
  ON public.openclaw_memory FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_openclaw_memory_updated_at
  BEFORE UPDATE ON public.openclaw_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Index pour performance ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_openclaw_runs_user_status ON public.openclaw_runs (user_id, status);
CREATE INDEX IF NOT EXISTS idx_openclaw_runs_user_created ON public.openclaw_runs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_openclaw_sessions_user ON public.openclaw_sessions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_openclaw_memory_user_type ON public.openclaw_memory (user_id, memory_type);
