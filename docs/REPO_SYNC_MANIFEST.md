# REPO SYNC MANIFEST
## Passe : REPO SYNC GATE V1

> Generated: 2026-03-08  
> This document is the canonical synchronisation proof between the GitHub repo, the exported zip, and the deployed preview.  
> To verify: `grep -r "SYNCGATE-2026-03-08-1147-V1" src/`

---

## 1. BUILD STAMP

```
SYNCGATE-2026-03-08-1147-V1
```

File: `src/lib/buildStamp.ts`  
Constant: `BUILD_STAMP`  
Proof marker: `PROOF:SYNC_GATE_V1:build_stamp_visible`

---

## 2. FILES EXPECTED

| File | Status | Proof Marker |
|------|--------|--------------|
| `src/lib/buildStamp.ts` | PRESENT (created this pass) | `PROOF:SYNC_GATE_V1:build_stamp_visible` |
| `src/lib/featureRegistry.ts` | PRESENT | `PROOF:SYNC_GATE_V1:feature_registry_present` |
| `src/lib/buildHealth.ts` | PRESENT | `PROOF:SYNC_GATE_V1:build_health_present` |
| `src/lib/leadPipeline.ts` | PRESENT | — |
| `src/hooks/useLeadIntakes.ts` | PRESENT | — |
| `src/hooks/useLeadActions.ts` | PRESENT | `PROOF:SYNC_GATE_V1:lead_actions_file_present` |
| `src/hooks/usePipelineMetrics.ts` | PRESENT | `PROOF:SYNC_GATE_V1:pipeline_metrics_file_present` |
| `src/components/leads/LeadActionsQueue.tsx` | PRESENT | — |
| `src/components/leads/LeadActionBadge.tsx` | PRESENT | — |
| `src/components/leads/LeadIntakeStatus.tsx` | PRESENT | — |
| `src/components/leads/UnifiedLeadsBlock.tsx` | PRESENT | — |
| `src/pages/admin/SystemHealth.tsx` | PRESENT | `PROOF:SYNC_GATE_V1:system_health_sync_stamp` |
| `src/pages/Opportunites.tsx` | PRESENT | `PROOF:SYNC_GATE_V1:opportunities_page_present` |
| `src/pages/PassiveOS.tsx` | PRESENT | `PROOF:SYNC_GATE_V1:passive_page_present` |
| `docs/REPO_SYNC_MANIFEST.md` | PRESENT (this file) | `PROOF:SYNC_GATE_V1:repo_sync_manifest` |

---

## 3. PROOF MARKERS EXPECTED

Run to verify: `grep -r "PROOF:SYNC_GATE_V1" src/ docs/`

| Marker | File |
|--------|------|
| `PROOF:SYNC_GATE_V1:build_stamp_visible` | `src/lib/buildStamp.ts` |
| `PROOF:SYNC_GATE_V1:repo_sync_manifest` | `docs/REPO_SYNC_MANIFEST.md` |
| `PROOF:SYNC_GATE_V1:system_health_sync_stamp` | `src/pages/admin/SystemHealth.tsx` |
| `PROOF:SYNC_GATE_V1:lead_actions_file_present` | `src/hooks/useLeadActions.ts` |
| `PROOF:SYNC_GATE_V1:pipeline_metrics_file_present` | `src/hooks/usePipelineMetrics.ts` |
| `PROOF:SYNC_GATE_V1:opportunities_page_present` | `src/pages/Opportunites.tsx` |
| `PROOF:SYNC_GATE_V1:passive_page_present` | `src/pages/PassiveOS.tsx` |
| `PROOF:SYNC_GATE_V1:feature_registry_present` | `src/lib/featureRegistry.ts` |
| `PROOF:SYNC_GATE_V1:build_health_present` | `src/lib/buildHealth.ts` |

Run to verify previous passes: `grep -r "PROOF:PIPELINE_V2\|PROOF:EXECUTION_V1\|PROOF:INTEGRITY_V1" src/`

---

## 4. MIGRATIONS EXPECTED

| File | Role | Status |
|------|------|--------|
| `20260308092314_aed804f3-ff6c-4498-98a8-7a78b7325989.sql` | Pipeline V2 — lead_source_events, lead_intakes, lead_entity_links, apply_lead_policy(), triggers, shared RLS | PRESENT |
| `20260308100159_fd20c7f8-d5c7-40e6-8106-b6429d43fb57.sql` | Pipeline V2 — lead_actions, upsert_lead_action(), promote_lead_to_opportunity(), enterprise ownership | PRESENT |
| `20260308101534_0fb4055e-9a39-47a2-8e26-ff573d848b47.sql` | Proof Gate V6 — documentation index migration | PRESENT |
| `20260308103452_9128e8ca-5408-4620-ad7d-d8cde576bb4f.sql` | Execution V1 — enterprise ownership fix, action routing trigger trg_lead_intake_action_routing | PRESENT |
| `20260308104926_0c36b949-46de-425d-b62a-dc15a315b68f.sql` | Integrity V1 — update_lead_action_status() canonical RPC, lead_action_events audit trail | PRESENT |

Total migrations in repo: 37

---

## 5. ACCEPTANCE CHECKLIST

- [x] BUILD_STAMP `SYNCGATE-2026-03-08-1147-V1` is in `src/lib/buildStamp.ts`
- [x] BUILD_STAMP is visible in `/admin/system-health` (Repo Sync Gate section)
- [x] All PROOF:SYNC_GATE_V1 markers are grep-able
- [x] All PROOF:PIPELINE_V2 markers are grep-able (PROMPT 6)
- [x] All PROOF:EXECUTION_V1 markers are grep-able (PROMPT 7)
- [x] All PROOF:INTEGRITY_V1 markers are grep-able (PROMPT 8)
- [x] 5 pipeline migrations confirmed present in `supabase/migrations/`
- [x] Critical source files confirmed present

---

## 6. GREP COMMANDS FOR VERIFICATION

```bash
# Sync Gate stamp
grep -r "SYNCGATE-2026-03-08-1147-V1" src/

# All proof layers
grep -r "PROOF:SYNC_GATE_V1" src/ docs/
grep -r "PROOF:PIPELINE_V2" src/
grep -r "PROOF:EXECUTION_V1" src/
grep -r "PROOF:INTEGRITY_V1" src/

# All proof layers combined
grep -r "PROOF:" src/ | grep -v node_modules
```

---

*This manifest is generated as part of PROMPT 9 — REPO SYNC GATE.*  
*PROOF:SYNC_GATE_V1:repo_sync_manifest*
