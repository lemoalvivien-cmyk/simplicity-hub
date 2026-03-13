
-- ═══════════════════════════════════════════════════════════════════════════
-- ADA Closed-Loop Fine-Tuning Infrastructure
-- Tables: ada_training_samples, ada_training_runs, ada_model_versions, ada_precision_metrics
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Training Samples (anonymized deal dataset) ────────────────────────
CREATE TABLE IF NOT EXISTS public.ada_training_samples (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_hash              TEXT NOT NULL,
  source_session_id         UUID REFERENCES public.ada_sessions(id) ON DELETE SET NULL,
  sector                    TEXT,
  zone                      TEXT,
  etg_opportunities_count   INT DEFAULT 0,
  etg_persons_count         INT DEFAULT 0,
  trust_score_avg           NUMERIC(5,2),
  hidden_link_strength_avg  NUMERIC(5,2),
  script_phase_count        INT DEFAULT 5,
  key_triggers              JSONB DEFAULT '[]'::jsonb,
  objections_handled        INT DEFAULT 0,
  negotiation_turns         INT DEFAULT 0,
  key_moments               JSONB DEFAULT '[]'::jsonb,
  outcome                   TEXT NOT NULL,
  contract_amount           NUMERIC(12,2),
  commission_7pct           NUMERIC(10,2),
  roi_score                 INT,
  call_duration_sec         INT,
  label                     TEXT NOT NULL,
  quality_score             NUMERIC(5,2) DEFAULT 0,
  used_in_training          BOOLEAN DEFAULT FALSE,
  training_run_id           UUID,
  fine_tuned_model_id       UUID
);

ALTER TABLE public.ada_training_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view samples from their sessions"
  ON public.ada_training_samples FOR SELECT
  USING (
    source_session_id IN (
      SELECT id FROM public.ada_sessions WHERE owner_user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_training_samples_outcome ON public.ada_training_samples(outcome);
CREATE INDEX IF NOT EXISTS idx_training_samples_label ON public.ada_training_samples(label);
CREATE INDEX IF NOT EXISTS idx_training_samples_created_at ON public.ada_training_samples(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_samples_used ON public.ada_training_samples(used_in_training);

-- ── 2. Training Runs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ada_training_runs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  triggered_by          TEXT NOT NULL DEFAULT 'auto',
  trigger_closing_count INT NOT NULL DEFAULT 0,
  sample_count          INT NOT NULL DEFAULT 0,
  positive_count        INT NOT NULL DEFAULT 0,
  negative_count        INT NOT NULL DEFAULT 0,
  base_model            TEXT NOT NULL DEFAULT 'meta-llama/Llama-3-70b-chat-hf',
  together_job_id       TEXT,
  together_model_id     TEXT,
  lora_rank             INT DEFAULT 8,
  lora_alpha            INT DEFAULT 16,
  epochs                INT DEFAULT 3,
  status                TEXT NOT NULL DEFAULT 'pending',
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  error_message         TEXT,
  train_loss_final      NUMERIC(8,4),
  eval_loss_final       NUMERIC(8,4),
  training_time_sec     INT
);

ALTER TABLE public.ada_training_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view training runs"
  ON public.ada_training_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── 3. Model Versions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ada_model_versions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  training_run_id           UUID REFERENCES public.ada_training_runs(id) ON DELETE SET NULL,
  version_tag               TEXT NOT NULL,
  model_id                  TEXT NOT NULL,
  model_provider            TEXT NOT NULL DEFAULT 'together_ai',
  is_active                 BOOLEAN DEFAULT FALSE,
  is_base                   BOOLEAN DEFAULT FALSE,
  precision_score           NUMERIC(5,2),
  recall_score              NUMERIC(5,2),
  f1_score                  NUMERIC(5,2),
  deals_predicted_correctly INT DEFAULT 0,
  deals_predicted_total     INT DEFAULT 0,
  training_sample_count     INT DEFAULT 0,
  benchmark_sample_count    INT DEFAULT 0,
  promoted_at               TIMESTAMPTZ,
  deprecated_at             TIMESTAMPTZ,
  notes                     TEXT
);

ALTER TABLE public.ada_model_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view model versions"
  ON public.ada_model_versions FOR SELECT
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_model_versions_active ON public.ada_model_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_model_versions_created ON public.ada_model_versions(created_at DESC);

-- ── 4. Precision Metrics (time series) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ada_precision_metrics (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  model_version_id UUID REFERENCES public.ada_model_versions(id) ON DELETE CASCADE,
  metric_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  precision_pct    NUMERIC(5,2) NOT NULL,
  sample_size      INT NOT NULL DEFAULT 0,
  context          JSONB DEFAULT '{}'::jsonb,
  measured_by      TEXT DEFAULT 'auto'
);

ALTER TABLE public.ada_precision_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view precision metrics"
  ON public.ada_precision_metrics FOR SELECT
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_precision_metrics_date ON public.ada_precision_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_precision_metrics_model ON public.ada_precision_metrics(model_version_id);

-- ── 5. Seed: base model version ──────────────────────────────────────────
INSERT INTO public.ada_model_versions (
  version_tag, model_id, model_provider, is_active, is_base, precision_score, notes
) VALUES (
  'v0.1-base',
  'google/gemini-2.5-flash',
  'gemini',
  TRUE,
  TRUE,
  62.0,
  'Baseline Gemini 2.5 Flash — no fine-tuning yet. Precision improves with each training run targeting 92%.'
);

-- ── 6. Seed: initial precision metric ────────────────────────────────────
INSERT INTO public.ada_precision_metrics (model_version_id, precision_pct, sample_size, measured_by)
SELECT id, 62.0, 0, 'seed'
FROM public.ada_model_versions WHERE version_tag = 'v0.1-base' LIMIT 1;

-- ── 7. Updated_at trigger on training_runs ───────────────────────────────
CREATE OR REPLACE FUNCTION public.update_ada_training_run_ts()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_ada_training_runs_ts
  BEFORE UPDATE ON public.ada_training_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_ada_training_run_ts();

-- ── 8. Function: should_retrain check ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ada_should_retrain()
RETURNS JSONB AS $$
DECLARE
  v_closed_total   INT;
  v_last_run_count INT;
  v_sample_count   INT;
BEGIN
  SELECT COUNT(*) INTO v_closed_total
  FROM public.ada_sessions WHERE state = 'closed';

  SELECT COALESCE(trigger_closing_count, 0) INTO v_last_run_count
  FROM public.ada_training_runs ORDER BY created_at DESC LIMIT 1;

  SELECT COUNT(*) INTO v_sample_count
  FROM public.ada_training_samples;

  RETURN jsonb_build_object(
    'should_retrain', (v_closed_total - COALESCE(v_last_run_count, 0)) >= 50,
    'closed_total',   v_closed_total,
    'last_run_count', COALESCE(v_last_run_count, 0),
    'delta',          v_closed_total - COALESCE(v_last_run_count, 0),
    'sample_count',   v_sample_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── 9. Enable Realtime ───────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.ada_training_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ada_model_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ada_precision_metrics;
