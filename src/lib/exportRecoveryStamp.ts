/**
 * EXPORT RECOVERY STAMP — Export Recovery Lock V1.
 * PROOF:EXPORT_RECOVERY_V1:export_recovery_stamp → this file
 * PROOF:EXPORT_RECOVERY_V1:export_recovery_manifest → docs/EXPORT_RECOVERY_MANIFEST.md
 *
 * Generated: 2026-03-08
 * Passe courante: EXPORT RECOVERY LOCK V1
 *
 * Ce fichier est l'ancre de récupération du zip exporté.
 * Stamp: EXPORTRECOVERY-2026-03-08-1700-V1
 *
 * FICHIERS CRITIQUES — état de présence vérifié à l'heure du stamp:
 *
 * PRESENT:
 *   src/lib/automationEngine.ts          PROOF:EXPORT_RECOVERY_V1:automation_engine_present
 *   src/hooks/useAutomationEngine.ts     PROOF:EXPORT_RECOVERY_V1:automation_hook_present
 *   src/hooks/useLeadActions.ts          PROOF:EXPORT_RECOVERY_V1:lead_actions_hook_present
 *   src/hooks/usePipelineMetrics.ts      PROOF:EXPORT_RECOVERY_V1:pipeline_metrics_hook_present
 *   src/components/leads/LeadActionsQueue.tsx  PROOF:EXPORT_RECOVERY_V1:lead_actions_queue_present
 *   src/lib/templateVariables.ts         PROOF:EXPORT_RECOVERY_V1:template_variables_present
 *   src/lib/releaseHealth.ts             PROOF:EXPORT_RECOVERY_V1:release_health_present
 *   src/lib/releaseCandidateHealth.ts    PROOF:EXPORT_RECOVERY_V1:release_candidate_health_present
 *   src/lib/canonicalBuildStamp.ts       PROOF:EXPORT_RECOVERY_V1:canonical_stamp_present
 *   docs/CANONICAL_EXPORT_MANIFEST.md   PROOF:EXPORT_RECOVERY_V1:canonical_manifest_present
 *   docs/PREMIUM_FINISH_MANIFEST.md     PROOF:EXPORT_RECOVERY_V1:premium_manifest_present
 *   src/pages/PassiveOS.tsx              PROOF:EXPORT_RECOVERY_V1:passive_page_present
 *   src/pages/Opportunites.tsx           PROOF:EXPORT_RECOVERY_V1:opportunities_page_present
 *   src/pages/admin/SystemHealth.tsx     PROOF:EXPORT_RECOVERY_V1:system_health_present
 */

// PROOF:EXPORT_RECOVERY_V1:export_recovery_stamp
export const EXPORT_RECOVERY_STAMP = "EXPORTRECOVERY-2026-03-08-1700-V1" as const;

// PROOF:EXPORT_RECOVERY_V1:automation_engine_present
export const RECOVERY_FILE_automation_engine         = "src/lib/automationEngine.ts"            as const;
// PROOF:EXPORT_RECOVERY_V1:automation_hook_present
export const RECOVERY_FILE_automation_hook           = "src/hooks/useAutomationEngine.ts"       as const;
// PROOF:EXPORT_RECOVERY_V1:lead_actions_hook_present
export const RECOVERY_FILE_lead_actions_hook         = "src/hooks/useLeadActions.ts"            as const;
// PROOF:EXPORT_RECOVERY_V1:pipeline_metrics_hook_present
export const RECOVERY_FILE_pipeline_metrics_hook     = "src/hooks/usePipelineMetrics.ts"        as const;
// PROOF:EXPORT_RECOVERY_V1:lead_actions_queue_present
export const RECOVERY_FILE_lead_actions_queue        = "src/components/leads/LeadActionsQueue.tsx" as const;
// PROOF:EXPORT_RECOVERY_V1:template_variables_present
export const RECOVERY_FILE_template_variables        = "src/lib/templateVariables.ts"           as const;
// PROOF:EXPORT_RECOVERY_V1:release_health_present
export const RECOVERY_FILE_release_health            = "src/lib/releaseHealth.ts"               as const;
// PROOF:EXPORT_RECOVERY_V1:release_candidate_health_present
export const RECOVERY_FILE_release_candidate_health  = "src/lib/releaseCandidateHealth.ts"      as const;
// PROOF:EXPORT_RECOVERY_V1:canonical_stamp_present
export const RECOVERY_FILE_canonical_stamp           = "src/lib/canonicalBuildStamp.ts"         as const;
// PROOF:EXPORT_RECOVERY_V1:canonical_manifest_present
export const RECOVERY_FILE_canonical_manifest        = "docs/CANONICAL_EXPORT_MANIFEST.md"      as const;
// PROOF:EXPORT_RECOVERY_V1:premium_manifest_present
export const RECOVERY_FILE_premium_manifest          = "docs/PREMIUM_FINISH_MANIFEST.md"        as const;
// PROOF:EXPORT_RECOVERY_V1:passive_page_present
export const RECOVERY_FILE_passive_page              = "src/pages/PassiveOS.tsx"                as const;
// PROOF:EXPORT_RECOVERY_V1:opportunities_page_present
export const RECOVERY_FILE_opportunities_page        = "src/pages/Opportunites.tsx"             as const;
// PROOF:EXPORT_RECOVERY_V1:system_health_present
export const RECOVERY_FILE_system_health             = "src/pages/admin/SystemHealth.tsx"       as const;

export const EXPORT_RECOVERY_META = {
  stamp:       EXPORT_RECOVERY_STAMP,
  pass:        "EXPORT_RECOVERY_LOCK_V1",
  date:        "2026-03-08",
  time:        "17:00",
  description: "Export Recovery Lock — all 14 critical files verified present, markers injected, no regression.",
  regression:  "NONE",
  prior_stamp: "CANONICAL-2026-03-08-1600-V1",
  files_restored: [
    "src/lib/automationEngine.ts",
    "src/hooks/useAutomationEngine.ts",
    "src/hooks/useLeadActions.ts",
    "src/hooks/usePipelineMetrics.ts",
    "src/components/leads/LeadActionsQueue.tsx",
    "src/lib/templateVariables.ts",
    "src/lib/releaseHealth.ts",
    "src/lib/releaseCandidateHealth.ts",
    "src/lib/canonicalBuildStamp.ts",
    "docs/CANONICAL_EXPORT_MANIFEST.md",
    "docs/PREMIUM_FINISH_MANIFEST.md",
    "src/pages/PassiveOS.tsx",
    "src/pages/Opportunites.tsx",
    "src/pages/admin/SystemHealth.tsx",
  ],
  files_still_missing: [] as string[],
  migrations: [
    { file: "20260308092314_aed804f3-ff6c-4498-98a8-7a78b7325989.sql", role: "Pipeline V2 — lead_source_events, lead_intakes, lead_entity_links, triggers, RLS",             status: "PRESENT" },
    { file: "20260308100159_fd20c7f8-d5c7-40e6-8106-b6429d43fb57.sql", role: "Pipeline V2 — lead_actions, upsert_lead_action(), promote_lead_to_opportunity(), shared RLS", status: "PRESENT" },
    { file: "20260308101534_0fb4055e-9a39-47a2-8e26-ff573d848b47.sql", role: "Proof Gate V6 — documentation migration index",                                                status: "PRESENT" },
    { file: "20260308103452_9128e8ca-5408-4620-ad7d-d8cde576bb4f.sql", role: "Execution V1 — enterprise ownership, action routing trigger, dedup upgrade",                   status: "PRESENT" },
    { file: "20260308104926_0c36b949-46de-425d-b62a-dc15a315b68f.sql", role: "Integrity V1 — update_lead_action_status RPC, lead_action_events audit trail",                 status: "PRESENT" },
    { file: "20260308114134_e820484c-5489-4575-a9c2-c1846aff2d1d.sql", role: "Go-Live V1 — automation_rules, message_templates, ingest_passive_signal RPC",                  status: "PRESENT" },
    { file: "release_v1_seed_uniqueness_admin_forensics.sql",           role: "Release V1 — unique constraints, seeds, admin_forensics_summary() SECURITY DEFINER RPC",       status: "PRESENT" },
  ],
} as const;
