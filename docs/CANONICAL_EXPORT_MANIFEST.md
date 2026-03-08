# CANONICAL_EXPORT_MANIFEST — Export Lock V1
# PROOF:EXPORT_RECOVERY_V1:canonical_manifest_present → this file
# PROOF:CANONICAL_EXPORT_V1:canonical_manifest → this file
# PROOF:CANONICAL_EXPORT_V1:canonical_build_stamp → src/lib/canonicalBuildStamp.ts

---

## 1. BUILD STAMP

```
CANONICAL-2026-03-08-1600-V1
```

Prior stamp: `RC-2026-03-08-1345-V1`
Regression: **NONE**

---

## 2. FILES REQUIRED — PRESENCE STATUS

| File | Status |
|------|--------|
| src/lib/automationEngine.ts | PRESENT |
| src/hooks/useAutomationEngine.ts | PRESENT |
| src/hooks/useLeadActions.ts | PRESENT |
| src/hooks/usePipelineMetrics.ts | PRESENT |
| src/components/leads/LeadActionsQueue.tsx | PRESENT |
| src/lib/templateVariables.ts | PRESENT |
| src/lib/releaseHealth.ts | PRESENT |
| src/lib/releaseCandidateHealth.ts | PRESENT |
| src/pages/PassiveOS.tsx | PRESENT |
| src/pages/Opportunites.tsx | PRESENT |
| src/pages/admin/SystemHealth.tsx | PRESENT |
| docs/PREMIUM_FINISH_MANIFEST.md | PRESENT |
| src/lib/canonicalBuildStamp.ts | PRESENT |
| docs/CANONICAL_EXPORT_MANIFEST.md | PRESENT (this file) |

---

## 3. PROOF MARKERS REQUIRED

```
PROOF:CANONICAL_EXPORT_V1:canonical_build_stamp     → src/lib/canonicalBuildStamp.ts
PROOF:CANONICAL_EXPORT_V1:canonical_manifest         → docs/CANONICAL_EXPORT_MANIFEST.md
PROOF:CANONICAL_EXPORT_V1:automation_engine_present  → src/lib/automationEngine.ts
PROOF:CANONICAL_EXPORT_V1:automation_hook_present    → src/hooks/useAutomationEngine.ts
PROOF:CANONICAL_EXPORT_V1:lead_actions_hook_present  → src/hooks/useLeadActions.ts
PROOF:CANONICAL_EXPORT_V1:pipeline_metrics_hook_present → src/hooks/usePipelineMetrics.ts
PROOF:CANONICAL_EXPORT_V1:lead_actions_queue_present → src/components/leads/LeadActionsQueue.tsx
PROOF:CANONICAL_EXPORT_V1:template_variables_present → src/lib/templateVariables.ts
PROOF:CANONICAL_EXPORT_V1:release_health_present     → src/lib/releaseHealth.ts
PROOF:CANONICAL_EXPORT_V1:release_candidate_health_present → src/lib/releaseCandidateHealth.ts
PROOF:CANONICAL_EXPORT_V1:passive_page_present       → src/pages/PassiveOS.tsx
PROOF:CANONICAL_EXPORT_V1:opportunities_page_present → src/pages/Opportunites.tsx
PROOF:CANONICAL_EXPORT_V1:system_health_present      → src/pages/admin/SystemHealth.tsx
PROOF:CANONICAL_EXPORT_V1:premium_manifest_present   → docs/PREMIUM_FINISH_MANIFEST.md
```

Verify all with:
```bash
grep -r "PROOF:CANONICAL_EXPORT_V1" src docs
```

---

## 4. MIGRATIONS REQUIRED

| File | Role | Status |
|------|------|--------|
| 20260308092314_aed804f3-ff6c-4498-98a8-7a78b7325989.sql | Pipeline V2 — lead_source_events, lead_intakes, lead_entity_links, triggers, RLS | PRESENT |
| 20260308100159_fd20c7f8-d5c7-40e6-8106-b6429d43fb57.sql | Pipeline V2 — lead_actions, upsert_lead_action(), promote_lead_to_opportunity(), shared RLS | PRESENT |
| 20260308101534_0fb4055e-9a39-47a2-8e26-ff573d848b47.sql | Proof Gate V6 — documentation migration index | PRESENT |
| 20260308103452_9128e8ca-5408-4620-ad7d-d8cde576bb4f.sql | Execution V1 — enterprise ownership, action routing trigger, dedup upgrade | PRESENT |
| 20260308104926_0c36b949-46de-425d-b62a-dc15a315b68f.sql | Integrity V1 — update_lead_action_status RPC, lead_action_events audit trail | PRESENT |
| 20260308114134_e820484c-5489-4575-a9c2-c1846aff2d1d.sql | Go-Live V1 — automation_rules, message_templates, ingest_passive_signal RPC | PRESENT |
| release_v1_seed_uniqueness_admin_forensics.sql | Release V1 — unique constraints seeds, admin_forensics_summary() SECURITY DEFINER RPC | PRESENT |

---

## 5. ACCEPTANCE CHECKLIST

- [x] Canonical build stamp present in `src/lib/canonicalBuildStamp.ts`
- [x] Canonical manifest present in `docs/CANONICAL_EXPORT_MANIFEST.md`
- [x] All 12 critical source files verified PRESENT
- [x] All 7 critical migrations verified PRESENT
- [x] 14 `PROOF:CANONICAL_EXPORT_V1` markers grep-able
- [x] `CANONICAL_BUILD_STAMP` displayed in `/admin/system-health`
- [x] No regression vs RC-2026-03-08-1345-V1

---

## 6. REGRESSION STATUS

**NONE** — all files previously validated under `RC-2026-03-08-1345-V1` remain present.

Known partial items (from prior passes, unchanged):
- Template variable substitution: client-side only (sent payloads not substituted server-side)
- Passive ingestion: page-mount triggered, not event-driven (by design for MVP)

---

_Stamp: CANONICAL-2026-03-08-1600-V1_
