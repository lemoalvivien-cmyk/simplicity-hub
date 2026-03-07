
-- ══════════════════════════════════════════════════════════════════
-- OPENCLAW MAX RUNTIME — Schema extensions (fixed)
-- ══════════════════════════════════════════════════════════════════

-- ── 1. openclaw_sessions: add context_type & linked_entity ────────────────────
ALTER TABLE public.openclaw_sessions
  ADD COLUMN IF NOT EXISTS context_type text DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS linked_entity_id uuid,
  ADD COLUMN IF NOT EXISTS linked_entity_type text,
  ADD COLUMN IF NOT EXISTS node_host text DEFAULT 'cloud',
  ADD COLUMN IF NOT EXISTS channel_ids text[] DEFAULT '{}';

-- ── 2. openclaw_runs: link to session, channel, tool_policy ──────────────────
ALTER TABLE public.openclaw_runs
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.openclaw_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS channel_id text,
  ADD COLUMN IF NOT EXISTS node_host text DEFAULT 'cloud',
  ADD COLUMN IF NOT EXISTS tool_policy jsonb DEFAULT '{}';

-- ── 3. openclaw_validations: add missing columns (individually to avoid conflicts) ──
ALTER TABLE public.openclaw_validations
  ADD COLUMN IF NOT EXISTS run_id uuid,
  ADD COLUMN IF NOT EXISTS session_id uuid,
  ADD COLUMN IF NOT EXISTS channel_id text,
  ADD COLUMN IF NOT EXISTS node_host text DEFAULT 'cloud',
  ADD COLUMN IF NOT EXISTS relance_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_relance_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS outcome_injected boolean DEFAULT false;

-- ── 4. openclaw_channels: real channel status per user ───────────────────────
CREATE TABLE IF NOT EXISTS public.openclaw_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  channel_id text NOT NULL,
  channel_name text NOT NULL,
  status text NOT NULL DEFAULT 'non_configure',
  is_ready boolean NOT NULL DEFAULT false,
  is_openclaw_enabled boolean NOT NULL DEFAULT false,
  last_probe_at timestamp with time zone,
  probe_latency_ms integer,
  probe_detail text,
  config jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, channel_id)
);

ALTER TABLE public.openclaw_channels ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'openclaw_channels' AND policyname = 'Users can manage their channels') THEN
    CREATE POLICY "Users can manage their channels" ON public.openclaw_channels
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_openclaw_channels_updated_at') THEN
    CREATE TRIGGER update_openclaw_channels_updated_at
      BEFORE UPDATE ON public.openclaw_channels
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ── 5. openclaw_jobs: scheduled cron / wakeup jobs ───────────────────────────
CREATE TABLE IF NOT EXISTS public.openclaw_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_type text NOT NULL,
  job_name text NOT NULL,
  status text NOT NULL DEFAULT 'planifie',
  cron_expression text,
  next_run_at timestamp with time zone,
  last_run_at timestamp with time zone,
  last_run_id uuid REFERENCES public.openclaw_runs(id) ON DELETE SET NULL,
  enabled boolean NOT NULL DEFAULT true,
  run_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  last_error text,
  config jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.openclaw_jobs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'openclaw_jobs' AND policyname = 'Users can manage their jobs') THEN
    CREATE POLICY "Users can manage their jobs" ON public.openclaw_jobs
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_openclaw_jobs_updated_at') THEN
    CREATE TRIGGER update_openclaw_jobs_updated_at
      BEFORE UPDATE ON public.openclaw_jobs
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ── 6. openclaw_tool_policies: per-agent tool access matrix ──────────────────
CREATE TABLE IF NOT EXISTS public.openclaw_tool_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_id text NOT NULL,
  tool_name text NOT NULL,
  access_level text NOT NULL DEFAULT 'lecture',
  context_type text DEFAULT 'global',
  channel_id text,
  autonomie_level text DEFAULT 'preparation',
  override_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, agent_id, tool_name, context_type)
);

ALTER TABLE public.openclaw_tool_policies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'openclaw_tool_policies' AND policyname = 'Users can manage their tool policies') THEN
    CREATE POLICY "Users can manage their tool policies" ON public.openclaw_tool_policies
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_openclaw_tool_policies_updated_at') THEN
    CREATE TRIGGER update_openclaw_tool_policies_updated_at
      BEFORE UPDATE ON public.openclaw_tool_policies
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ── 7. indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_openclaw_channels_user ON public.openclaw_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_openclaw_jobs_user_next ON public.openclaw_jobs(user_id, next_run_at) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_openclaw_runs_session ON public.openclaw_runs(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_openclaw_sessions_context ON public.openclaw_sessions(user_id, context_type);

-- ── 8. seed_openclaw_jobs function ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.seed_openclaw_jobs(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.openclaw_jobs (user_id, job_type, job_name, cron_expression, next_run_at, config)
  VALUES
    (p_user_id, 'scan_radar', 'Scan radar opportunités', '0 8 * * *', now() + interval '1 day',
     '{"run_type": "scan", "agents": ["signal_hunter", "opportunity_builder"]}'::jsonb),
    (p_user_id, 'brief_daily', 'Brief quotidien', '0 7 * * *', now() + interval '1 day',
     '{"run_type": "brief", "agents": ["brief_writer"]}'::jsonb),
    (p_user_id, 'relance_validations', 'Relance validations en attente', '0 10 * * *', now() + interval '1 day',
     '{"run_type": "validation_check", "agents": ["validator"]}'::jsonb),
    (p_user_id, 'trust_recheck', 'Réévaluation confiance', '0 0 * * 0', now() + interval '7 days',
     '{"run_type": "matching", "agents": ["trust_sentinel"]}'::jsonb),
    (p_user_id, 'passive_recheck', 'Recheck offres passives', '0 12 * * *', now() + interval '1 day',
     '{"run_type": "passive", "agents": ["passive_distributor"]}'::jsonb)
  ON CONFLICT DO NOTHING;
END;
$$;

-- ── 9. seed_openclaw_channels function ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.seed_openclaw_channels(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.openclaw_channels (user_id, channel_id, channel_name, status, is_ready, is_openclaw_enabled)
  VALUES
    (p_user_id, 'email', 'Email', 'pret', true, true),
    (p_user_id, 'phone', 'Téléphone', 'assiste', false, false),
    (p_user_id, 'whatsapp', 'WhatsApp Business', 'non_configure', false, false),
    (p_user_id, 'introduction', 'Introductions', 'pret', true, true),
    (p_user_id, 'linkedin', 'LinkedIn', 'non_configure', false, false)
  ON CONFLICT DO NOTHING;
END;
$$;
