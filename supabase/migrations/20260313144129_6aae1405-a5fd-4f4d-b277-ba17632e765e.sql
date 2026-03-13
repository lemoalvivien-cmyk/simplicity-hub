
-- ═══════════════════════════════════════════════════════════
-- ADA (Autonomous Deal Agents) — Database Schema v1.0
-- ═══════════════════════════════════════════════════════════

-- ── ADA Sessions (State Machine) ───────────────────────────
CREATE TYPE public.ada_state AS ENUM (
  'idle',
  'scanning',
  'preparing_script',
  'awaiting_consent',
  'calling',
  'negotiating',
  'awaiting_human_validation',
  'generating_contract',
  'awaiting_final_closing',
  'closed',
  'abandoned',
  'error'
);

CREATE TABLE public.ada_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id         UUID NOT NULL,
  -- ETG target context
  target_person_id      UUID REFERENCES public.etg_persons(id) ON DELETE SET NULL,
  target_company_id     UUID REFERENCES public.etg_companies(id) ON DELETE SET NULL,
  target_name           TEXT NOT NULL,
  target_phone          TEXT,
  target_email          TEXT,
  target_context        JSONB DEFAULT '{}'::jsonb,
  -- State machine
  state                 public.ada_state NOT NULL DEFAULT 'idle',
  previous_state        public.ada_state,
  state_entered_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Script & reasoning
  adaptive_script       TEXT,
  reasoning_trace       JSONB DEFAULT '[]'::jsonb,
  negotiation_notes     TEXT,
  -- Voice call
  elevenlabs_call_id    TEXT,
  call_started_at       TIMESTAMPTZ,
  call_ended_at         TIMESTAMPTZ,
  call_duration_sec     INTEGER,
  -- Human oversight
  human_validated_at    TIMESTAMPTZ,
  human_validated_by    UUID,
  final_closed_at       TIMESTAMPTZ,
  final_closed_by       UUID,
  -- Contract
  stripe_payment_link   TEXT,
  contract_amount       NUMERIC(12,2),
  commission_7pct       NUMERIC(12,2) GENERATED ALWAYS AS (contract_amount * 0.07) STORED,
  -- Outcome
  outcome               TEXT,
  roi_score             NUMERIC(5,2),
  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── ADA Consent Logs (RGPD) ────────────────────────────────
CREATE TABLE public.ada_consent_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            UUID NOT NULL REFERENCES public.ada_sessions(id) ON DELETE CASCADE,
  owner_user_id         UUID NOT NULL,
  -- Consent type
  consent_type          TEXT NOT NULL CHECK (consent_type IN ('vocal_recorded', 'gdpr_explicit', 'bloctel_checked', 'rgpd_info_sent')),
  consented             BOOLEAN NOT NULL DEFAULT false,
  -- Evidence
  consent_text          TEXT,
  ip_hash               TEXT,
  user_agent_hash       TEXT,
  elevenlabs_audio_ref  TEXT,
  -- Legal timestamps
  consented_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at            TIMESTAMPTZ,
  revoked_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── ADA Transcriptions (Real-time) ────────────────────────
CREATE TABLE public.ada_transcriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            UUID NOT NULL REFERENCES public.ada_sessions(id) ON DELETE CASCADE,
  owner_user_id         UUID NOT NULL,
  -- Transcript segment
  speaker               TEXT NOT NULL CHECK (speaker IN ('agent', 'prospect', 'system')),
  text                  TEXT NOT NULL,
  confidence            NUMERIC(4,3),
  -- Timing
  segment_start_ms      INTEGER,
  segment_end_ms        INTEGER,
  -- Flags
  is_key_moment         BOOLEAN DEFAULT false,
  key_moment_type       TEXT,  -- 'objection', 'buying_signal', 'closing_attempt', 'consent'
  agent_reasoning       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── ADA Node Events (LangGraph-style audit trail) ──────────
CREATE TABLE public.ada_node_events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            UUID NOT NULL REFERENCES public.ada_sessions(id) ON DELETE CASCADE,
  owner_user_id         UUID NOT NULL,
  node_name             TEXT NOT NULL,  -- 'scan_etg', 'prepare_script', 'voice_call', 'negotiate', 'generate_contract', 'human_oversight'
  node_input            JSONB DEFAULT '{}'::jsonb,
  node_output           JSONB DEFAULT '{}'::jsonb,
  duration_ms           INTEGER,
  success               BOOLEAN DEFAULT true,
  error_message         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────
CREATE INDEX idx_ada_sessions_owner     ON public.ada_sessions(owner_user_id);
CREATE INDEX idx_ada_sessions_state     ON public.ada_sessions(state);
CREATE INDEX idx_ada_sessions_created   ON public.ada_sessions(created_at DESC);
CREATE INDEX idx_ada_consent_session    ON public.ada_consent_logs(session_id);
CREATE INDEX idx_ada_transcript_session ON public.ada_transcriptions(session_id, created_at);
CREATE INDEX idx_ada_node_session       ON public.ada_node_events(session_id, created_at);

-- ── Realtime ───────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.ada_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ada_transcriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ada_node_events;

-- ── Updated_at trigger ────────────────────────────────────
CREATE TRIGGER ada_sessions_updated_at
  BEFORE UPDATE ON public.ada_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ══════════════════════════════════════════════════════════
-- RLS Policies
-- ══════════════════════════════════════════════════════════

ALTER TABLE public.ada_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ada_consent_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ada_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ada_node_events    ENABLE ROW LEVEL SECURITY;

-- ada_sessions
CREATE POLICY "ada_sessions_owner_select"  ON public.ada_sessions FOR SELECT  USING (auth.uid() = owner_user_id);
CREATE POLICY "ada_sessions_owner_insert"  ON public.ada_sessions FOR INSERT  WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "ada_sessions_owner_update"  ON public.ada_sessions FOR UPDATE  USING (auth.uid() = owner_user_id);
CREATE POLICY "ada_sessions_owner_delete"  ON public.ada_sessions FOR DELETE  USING (auth.uid() = owner_user_id);

-- ada_consent_logs (immutable audit — no update/delete for owners)
CREATE POLICY "ada_consent_owner_select"   ON public.ada_consent_logs FOR SELECT  USING (auth.uid() = owner_user_id);
CREATE POLICY "ada_consent_owner_insert"   ON public.ada_consent_logs FOR INSERT  WITH CHECK (auth.uid() = owner_user_id);

-- ada_transcriptions
CREATE POLICY "ada_transcript_owner_select" ON public.ada_transcriptions FOR SELECT  USING (auth.uid() = owner_user_id);
CREATE POLICY "ada_transcript_owner_insert" ON public.ada_transcriptions FOR INSERT  WITH CHECK (auth.uid() = owner_user_id);

-- ada_node_events (immutable log)
CREATE POLICY "ada_node_owner_select"      ON public.ada_node_events FOR SELECT  USING (auth.uid() = owner_user_id);
CREATE POLICY "ada_node_owner_insert"      ON public.ada_node_events FOR INSERT  WITH CHECK (auth.uid() = owner_user_id);
