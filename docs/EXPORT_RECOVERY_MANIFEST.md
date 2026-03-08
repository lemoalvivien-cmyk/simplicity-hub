# EXPORT_RECOVERY_MANIFEST — Export Recovery Lock V1
# PROOF:EXPORT_RECOVERY_V1:export_recovery_manifest → this file
# PROOF:EXPORT_RECOVERY_V1:export_recovery_stamp → src/lib/exportRecoveryStamp.ts

---

## 1. BUILD STAMP

```
EXPORTRECOVERY-2026-03-08-1700-V1
```

Prior stamp: `CANONICAL-2026-03-08-1600-V1`
Regression: **NONE**

---

## 2. FILES REQUIRED

| File | Required |
|------|----------|
| src/lib/automationEngine.ts | YES |
| src/hooks/useAutomationEngine.ts | YES |
| src/hooks/useLeadActions.ts | YES |
| src/hooks/usePipelineMetrics.ts | YES |
| src/components/leads/LeadActionsQueue.tsx | YES |
| src/lib/templateVariables.ts | YES |
| src/lib/releaseHealth.ts | YES |
| src/lib/releaseCandidateHealth.ts | YES |
| src/lib/canonicalBuildStamp.ts | YES |
| docs/CANONICAL_EXPORT_MANIFEST.md | YES |
| docs/PREMIUM_FINISH_MANIFEST.md | YES |
| src/pages/PassiveOS.tsx | YES |
| src/pages/Opportunites.tsx | YES |
| src/pages/admin/SystemHealth.tsx | YES |
| src/lib/exportRecoveryStamp.ts | YES |
| docs/EXPORT_RECOVERY_MANIFEST.md | YES (this file) |

---

## 3. FILES RESTORED (PRESENT in this export)

| File | Status | Recovery Marker |
|------|--------|-----------------|
| src/lib/automationEngine.ts | PRESENT | PROOF:EXPORT_RECOVERY_V1:automation_engine_present |
| src/hooks/useAutomationEngine.ts | PRESENT | PROOF:EXPORT_RECOVERY_V1:automation_hook_present |
| src/hooks/useLeadActions.ts | PRESENT | PROOF:EXPORT_RECOVERY_V1:lead_actions_hook_present |
| src/hooks/usePipelineMetrics.ts | PRESENT | PROOF:EXPORT_RECOVERY_V1:pipeline_metrics_hook_present |
| src/components/leads/LeadActionsQueue.tsx | PRESENT | PROOF:EXPORT_RECOVERY_V1:lead_actions_queue_present |
| src/lib/templateVariables.ts | PRESENT | PROOF:EXPORT_RECOVERY_V1:template_variables_present |
| src/lib/releaseHealth.ts | PRESENT | PROOF:EXPORT_RECOVERY_V1:release_health_present |
| src/lib/releaseCandidateHealth.ts | PRESENT | PROOF:EXPORT_RECOVERY_V1:release_candidate_health_present |
| src/lib/canonicalBuildStamp.ts | PRESENT | PROOF:EXPORT_RECOVERY_V1:canonical_stamp_present |
| docs/CANONICAL_EXPORT_MANIFEST.md | PRESENT | PROOF:EXPORT_RECOVERY_V1:canonical_manifest_present |
| docs/PREMIUM_FINISH_MANIFEST.md | PRESENT | PROOF:EXPORT_RECOVERY_V1:premium_manifest_present |
| src/pages/PassiveOS.tsx | PRESENT | PROOF:EXPORT_RECOVERY_V1:passive_page_present |
| src/pages/Opportunites.tsx | PRESENT | PROOF:EXPORT_RECOVERY_V1:opportunities_page_present |
| src/pages/admin/SystemHealth.tsx | PRESENT | PROOF:EXPORT_RECOVERY_V1:system_health_present |
| src/lib/exportRecoveryStamp.ts | PRESENT | PROOF:EXPORT_RECOVERY_V1:export_recovery_stamp |
| docs/EXPORT_RECOVERY_MANIFEST.md | PRESENT | PROOF:EXPORT_RECOVERY_V1:export_recovery_manifest |

---

## 4. FILES STILL MISSING

**NONE** — all 16 tracked files are present in this export.

---

## 5. PROOF MARKERS

```
grep -r "PROOF:EXPORT_RECOVERY_V1" src docs
```

Expected slugs:
- export_recovery_stamp        → src/lib/exportRecoveryStamp.ts
- export_recovery_manifest     → docs/EXPORT_RECOVERY_MANIFEST.md
- automation_engine_present    → src/lib/automationEngine.ts
- automation_hook_present      → src/hooks/useAutomationEngine.ts
- lead_actions_hook_present    → src/hooks/useLeadActions.ts
- pipeline_metrics_hook_present → src/hooks/usePipelineMetrics.ts
- lead_actions_queue_present   → src/components/leads/LeadActionsQueue.tsx
- template_variables_present   → src/lib/templateVariables.ts
- release_health_present       → src/lib/releaseHealth.ts
- release_candidate_health_present → src/lib/releaseCandidateHealth.ts
- canonical_stamp_present      → src/lib/canonicalBuildStamp.ts
- canonical_manifest_present   → docs/CANONICAL_EXPORT_MANIFEST.md
- premium_manifest_present     → docs/PREMIUM_FINISH_MANIFEST.md
- passive_page_present         → src/pages/PassiveOS.tsx
- opportunities_page_present   → src/pages/Opportunites.tsx
- system_health_present        → src/pages/admin/SystemHealth.tsx

---

## 6. MIGRATIONS PRESENT

| File | Role | Status |
|------|------|--------|
| 20260308092314_aed804f3-ff6c-4498-98a8-7a78b7325989.sql | Pipeline V2 — lead_source_events, lead_intakes, lead_entity_links, triggers, RLS | PRESENT |
| 20260308100159_fd20c7f8-d5c7-40e6-8106-b6429d43fb57.sql | Pipeline V2 — lead_actions, upsert_lead_action(), promote_lead_to_opportunity(), shared RLS | PRESENT |
| 20260308101534_0fb4055e-9a39-47a2-8e26-ff573d848b47.sql | Proof Gate V6 — documentation migration index | PRESENT |
| 20260308103452_9128e8ca-5408-4620-ad7d-d8cde576bb4f.sql | Execution V1 — enterprise ownership, action routing trigger, dedup upgrade | PRESENT |
| 20260308104926_0c36b949-46de-425d-b62a-dc15a315b68f.sql | Integrity V1 — update_lead_action_status RPC, lead_action_events audit trail | PRESENT |
| 20260308114134_e820484c-5489-4575-a9c2-c1846aff2d1d.sql | Go-Live V1 — automation_rules, message_templates, ingest_passive_signal RPC | PRESENT |
| release_v1_seed_uniqueness_admin_forensics.sql | Release V1 — unique constraints, seeds, admin_forensics_summary() SECURITY DEFINER RPC | PRESENT |

---

## 7. REGRESSION STATUS

**NONE** — all files previously validated under `CANONICAL-2026-03-08-1600-V1` remain present.

Known partial items (unchanged, by design for MVP):
- Template variable substitution: client-side only (sent payloads not substituted server-side)
- Passive ingestion: page-mount triggered, not event-driven

---

_Stamp: EXPORTRECOVERY-2026-03-08-1700-V1_
