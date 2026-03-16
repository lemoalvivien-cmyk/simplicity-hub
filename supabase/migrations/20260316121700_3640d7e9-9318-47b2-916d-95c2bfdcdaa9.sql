-- WIINUP MAX v8 — Drop legacy AI/ADA/ETG/OpenClaw tables
-- Safe to run multiple times (IF EXISTS on all)

-- ADA (Autonomous Deal Agent)
DROP TABLE IF EXISTS public.ada_transcriptions     CASCADE;
DROP TABLE IF EXISTS public.ada_node_events        CASCADE;
DROP TABLE IF EXISTS public.ada_consent_logs       CASCADE;
DROP TABLE IF EXISTS public.ada_precision_metrics  CASCADE;
DROP TABLE IF EXISTS public.ada_training_samples   CASCADE;
DROP TABLE IF EXISTS public.ada_model_versions     CASCADE;
DROP TABLE IF EXISTS public.ada_training_runs      CASCADE;
DROP TABLE IF EXISTS public.ada_sessions           CASCADE;

-- ETG (Eternal Trust Graph)
DROP TABLE IF EXISTS public.etg_hidden_links       CASCADE;
DROP TABLE IF EXISTS public.etg_links              CASCADE;
DROP TABLE IF EXISTS public.etg_opportunities      CASCADE;
DROP TABLE IF EXISTS public.etg_persons            CASCADE;
DROP TABLE IF EXISTS public.etg_companies          CASCADE;
DROP TABLE IF EXISTS public.etg_audit_log          CASCADE;

-- OpenClaw
DROP TABLE IF EXISTS public.openclaw_queue         CASCADE;
DROP TABLE IF EXISTS public.openclaw_logs          CASCADE;
DROP TABLE IF EXISTS public.openclaw_config        CASCADE;
DROP TABLE IF EXISTS public.offer_packs            CASCADE;

-- Company graph (ETG/OpenClaw only)
DROP TABLE IF EXISTS public.company_aliases        CASCADE;
DROP TABLE IF EXISTS public.companies              CASCADE;

-- Facilitator match scores (OpenClaw-generated)
DROP TABLE IF EXISTS public.facilitator_match_scores CASCADE;

-- Drop ADA enum
DROP TYPE IF EXISTS public.ada_state CASCADE;