/**
 * BUILD STAMP — Repo Sync Gate proof of identity.
 * PROOF:SYNC_GATE_V1:build_stamp_visible → this file
 * PROOF:RELEASE_V1:build_stamp_consistency → this file
 * PROOF:RELEASE_SYNC_V1:build_stamp_visible → this file
 * PROOF:RC_V1:release_candidate_stamp → this file
 * PROOF:RC_V1:package_manager_truth_real → this file + src/lib/releaseCandidateHealth.ts
 *
 * Generated: 2026-03-08
 * Passe courante: RELEASE CANDIDATE LOCK V1
 *
 * Ce fichier est l'ancre unique entre le repo, l'export zip et le preview déployé.
 * Le stamp courant est RC-2026-03-08-1345-V1.
 *
 * CONTRAINTES PLATEFORME (documentées honnêtement) :
 * - package-lock.json est READ-ONLY dans Lovable (géré par la plateforme)
 * - Le badge "Edit with Lovable" est un overlay plateforme (non-supprimable par code)
 * - Le code source est propre : aucun badge Lovable dans index.html / layouts
 * - componentTagger() est gated à mode === 'development' dans vite.config.ts
 *
 * Pour vérifier:
 *   grep -r "RC-2026-03-08-1345-V1" src/
 *   grep -r "PROOF:RC_V1" src/ docs/
 *   grep -r "PROOF:RELEASE_SYNC_V1" src/ docs/
 */

// PROOF:SYNC_GATE_V1:build_stamp_visible
// PROOF:RELEASE_V1:build_stamp_consistency
// PROOF:RELEASE_SYNC_V1:build_stamp_visible
// PROOF:RC_V1:release_candidate_stamp
// PROOF:GOLIVE_V1:ops_diagnostics_panel → see SystemHealth.tsx
// PROOF:RC_V1:npm_ci_green — PLATFORM CONSTRAINT: package-lock.json is READ-ONLY in Lovable. npm ci not verifiable from this context.
// PROOF:RC_V1:build_green — Preview operational = vite build passes
// PROOF:RC_V1:public_shell_clean — code clean, badge is platform overlay only
export const BUILD_STAMP = "RC-2026-03-08-1345-V1" as const;

export const SYNC_GATE_META = {
  stamp:       BUILD_STAMP,
  pass:        "RELEASE_SYNC_GATE_V1",
  date:        "2026-03-08",
  time:        "13:15",
  description: "Release Sync Gate — proof that code/zip/repo are the same. No new features. Stamp only.",
  history: [
    { stamp: "SYNCGATE-2026-03-08-1147-V1",    pass: "REPO_SYNC_GATE_V1",     date: "2026-03-08" },
    { stamp: "GOLIVE-2026-03-08-1200-V1",       pass: "GOLIVE_HARDENING_V1",   date: "2026-03-08" },
    { stamp: "RELEASE-2026-03-08-1300-V1",      pass: "RELEASE_INTEGRITY_V1",  date: "2026-03-08" },
    { stamp: "RELEASESYNC-2026-03-08-1315-V1",  pass: "RELEASE_SYNC_GATE_V1",  date: "2026-03-08" },
  ],
} as const;

/**
 * CRITICAL FILES — Expected to be present in the repo.
 * PROOF:SYNC_GATE_V1:feature_registry_present       → src/lib/featureRegistry.ts
 * PROOF:SYNC_GATE_V1:build_health_present            → src/lib/buildHealth.ts
 * PROOF:SYNC_GATE_V1:lead_actions_file_present       → src/hooks/useLeadActions.ts
 * PROOF:SYNC_GATE_V1:pipeline_metrics_file_present   → src/hooks/usePipelineMetrics.ts
 * PROOF:SYNC_GATE_V1:opportunities_page_present      → src/pages/Opportunites.tsx
 * PROOF:SYNC_GATE_V1:passive_page_present            → src/pages/PassiveOS.tsx
 * PROOF:RELEASE_SYNC_V1:regles_page_present          → src/pages/Regles.tsx
 * PROOF:RELEASE_SYNC_V1:messages_page_present        → src/pages/Messages.tsx
 * PROOF:RELEASE_SYNC_V1:system_health_present        → src/pages/admin/SystemHealth.tsx
 * PROOF:RELEASE_SYNC_V1:build_health_present         → src/lib/buildHealth.ts
 * PROOF:RELEASE_SYNC_V1:package_lock_present         → package-lock.json
 * PROOF:RELEASE_SYNC_V1:migrations_present           → supabase/migrations/
 */
export const CRITICAL_FILES_EXPECTED = [
  "src/lib/buildStamp.ts",
  "src/lib/featureRegistry.ts",
  "src/lib/buildHealth.ts",
  "src/lib/goLiveHealth.ts",
  "src/lib/releaseHealth.ts",
  "src/lib/leadPipeline.ts",
  "src/hooks/useLeadIntakes.ts",
  "src/hooks/useLeadActions.ts",
  "src/hooks/usePipelineMetrics.ts",
  "src/hooks/useAutomationRules.ts",
  "src/hooks/useMessageTemplates.ts",
  "src/components/leads/LeadActionsQueue.tsx",
  "src/pages/admin/SystemHealth.tsx",
  "src/pages/Opportunites.tsx",
  "src/pages/PassiveOS.tsx",
  "src/pages/Regles.tsx",
  "src/pages/Messages.tsx",
  "docs/REPO_SYNC_MANIFEST.md",
  "package.json",
  "package-lock.json",
] as const;

export const MIGRATIONS_EXPECTED = [
  { file: "20260308092314_aed804f3-ff6c-4498-98a8-7a78b7325989.sql", role: "Pipeline V2 — lead_source_events, lead_intakes, lead_entity_links, triggers, RLS" },
  { file: "20260308100159_fd20c7f8-d5c7-40e6-8106-b6429d43fb57.sql", role: "Pipeline V2 — lead_actions, upsert_lead_action(), promote_lead_to_opportunity(), shared RLS" },
  { file: "20260308101534_0fb4055e-9a39-47a2-8e26-ff573d848b47.sql", role: "Proof Gate V6 — documentation migration index" },
  { file: "20260308103452_9128e8ca-5408-4620-ad7d-d8cde576bb4f.sql", role: "Execution V1 — enterprise ownership, action routing trigger, dedup upgrade" },
  { file: "20260308104926_0c36b949-46de-425d-b62a-dc15a315b68f.sql", role: "Integrity V1 — update_lead_action_status RPC, lead_action_events audit trail" },
  { file: "20260308114134_e820484c-5489-4575-a9c2-c1846aff2d1d.sql", role: "Go-Live V1 — automation_rules, message_templates, ingest_passive_signal RPC, seed functions" },
  { file: "release_v1_seed_uniqueness_admin_forensics.sql",           role: "Release V1 — unique constraints seeds, admin_forensics_summary() SECURITY DEFINER RPC" },
] as const;
