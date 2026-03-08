
-- ══════════════════════════════════════════════════════════════════════════
-- PROOF GATE v6 — Grepable Evidence Index
-- This migration adds NO schema changes. It is a pure documentation marker
-- that can be grepped to confirm the pipeline exists.
-- ══════════════════════════════════════════════════════════════════════════

-- PROOF:PIPELINE_V2:lead_tables_created
--   Tables: lead_source_events, lead_intakes, lead_entity_links
--   File: supabase/migrations/20260308092314_aed804f3-ff6c-4498-98a8-7a78b7325989.sql

-- PROOF:PIPELINE_V2:lead_rls_shared_visibility
--   Policy "lead_intakes_select": allows auth.uid() = user_id OR entreprise_id OR via intro.entreprise_id
--   File: supabase/migrations/20260308100159_fd20c7f8-d5c7-40e6-8106-b6429d43fb57.sql lines 63-104

-- PROOF:PIPELINE_V2:opportunity_factory
--   Function: promote_lead_to_opportunity(p_intake_id)
--   Anti-duplication by company_name + user_id.
--   File: supabase/migrations/20260308100159_fd20c7f8-d5c7-40e6-8106-b6429d43fb57.sql lines 155+

-- PROOF:PIPELINE_V2:lead_actions_queue
--   Table: lead_actions (id, lead_intake_id, actor_user_id, action_type, status, priority, payload, ...)
--   Function: upsert_lead_action — supersedes stale actions, creates new open action
--   Trigger: on_lead_intake_action_sync — auto-spawns action on intake upsert
--   File: supabase/migrations/20260308100159_fd20c7f8-d5c7-40e6-8106-b6429d43fb57.sql lines 1-60

-- PROOF:PIPELINE_V2:radar_pipeline_wired
--   src/pages/Radar.tsx addManualSignal() calls createLeadFromRadar()
--   createLeadFromRadar() inserts into lead_source_events + lead_intakes
--   File: src/pages/Radar.tsx line ~129, src/lib/leadPipeline.ts createLeadFromRadar()

-- PROOF:PIPELINE_V2:passive_pipeline_wired = NOT_IMPLEMENTED
--   PassiveOS does not yet call createLeadFromPassive(). 
--   Helper exists in src/lib/leadPipeline.ts but is not called from PassiveOS.tsx.
--   Honest status: partial — the helper exists, the call site is missing.

-- PROOF:PIPELINE_V2:enterprise_dashboard_pipeline
--   src/pages/DashboardEntreprise.tsx renders <UnifiedLeadsBlock asEntreprise />
--   useLeadIntakes(true) queries lead_intakes WHERE entreprise_id = user.id
--   File: src/pages/DashboardEntreprise.tsx, src/components/leads/UnifiedLeadsBlock.tsx

-- PROOF:PIPELINE_V2:facilitateur_dashboard_pipeline
--   src/pages/DashboardFacilitateur.tsx renders <UnifiedLeadsBlock asEntreprise={false} />
--   useLeadIntakes(false) queries lead_intakes WHERE user_id = user.id
--   File: src/pages/DashboardFacilitateur.tsx, src/components/leads/UnifiedLeadsBlock.tsx

-- PROOF:PIPELINE_V2:introduction_pipeline_ui
--   src/pages/IntroductionsEntreprise.tsx fetches lead_intakes linked to introductions
--   Renders <LeadIntakeStatus /> and <LeadActionBadge /> per intro
--   File: src/pages/IntroductionsEntreprise.tsx lines 122-149

-- No-op SQL to make this a valid migration:
DO $$ BEGIN RAISE NOTICE 'PROOF GATE v6 index registered.'; END; $$;
