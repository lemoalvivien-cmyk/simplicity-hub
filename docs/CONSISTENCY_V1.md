# CONSISTENCY_V1 — Final Runtime Truth Pass
# PROOF:CONSISTENCY_V1:final_consistency_blockers

Stamp: CONSISTENCY-V1-2026-03-08

## Purpose

This document is the canonical proof manifest for the **FINAL CONSISTENCY PASS**.
It verifies that UI logic, backend logic, and health documentation tell the same story.

---

## Grepable Proof Index

```
grep -r "PROOF:CONSISTENCY_V1" src supabase docs
```

| Slug | File | Status |
|------|------|--------|
| `passive_ui_uses_runtime_threshold` | `src/pages/PassiveOS.tsx` | PRESENT |
| `passive_no_hardcoded_business_threshold` | `src/pages/PassiveOS.tsx` | PRESENT |
| `passive_runtime_truth_visible` | `src/pages/PassiveOS.tsx` | PRESENT |
| `critical_flow_qa_panel` | `src/pages/admin/SystemHealth.tsx` | PRESENT |
| `qa_checks_real` | `src/pages/admin/SystemHealth.tsx` | PRESENT |
| `intro_validation_truth` | `src/pages/admin/SystemHealth.tsx` | PRESENT |
| `action_queue_truth` | `src/pages/admin/SystemHealth.tsx` | PRESENT |
| `opportunity_origin_truth` | `src/pages/admin/SystemHealth.tsx` | PRESENT |
| `health_runtime_consistency` | `src/pages/admin/SystemHealth.tsx` | PRESENT |
| `final_consistency_blockers` | `src/pages/admin/SystemHealth.tsx` + this file | PRESENT |

---

## Strategy (8 lines)

1. **Passive runtime threshold unified**: `runtimeThreshold` state loaded from `getPassiveThreshold()` RPC on mount. All display logic (badge, qualifies check) uses `activeThreshold = runtimeThreshold ?? FALLBACK_PASSIVE_THRESHOLD`. Constant renamed `FALLBACK_PASSIVE_THRESHOLD` — never used for business display silently.
2. **Critical flows verified**: IntroductionsEntreprise (reads real lead_intakes + lead_actions), Opportunites (resolveOriginKey priority chain), LeadActionsQueue (real DB via useLeadActions), DashboardEntreprise + DashboardFacilitateur (UnifiedLeadsBlock reading real pipeline).
3. **QA Panel**: `Critical Flow QA` section added to `/admin/system-health`. Each check has: PASS/PARTIAL/FAIL status, source file reference, proof marker.
4. **Health docs consistent**: `releaseHealth.ts` + `releaseCandidateHealth.ts` both mark automation engine as RESOLVED. npm_ci = NOT_FIXED_PLATFORM_CONSTRAINT (honest). Badge = platform overlay (not code).
5. **Remaining gaps honest**: Passive semi-batch, npm ci platform constraint, template variable substitution, OpenClaw gateway, Stripe secrets. All documented in QA panel.

---

## Acceptance Table

| Check | Result |
|-------|--------|
| Passive UI uses same runtime threshold as ingestion | YES |
| No hardcoded business threshold remains in PassiveOS | YES |
| Critical UI flows reflect real backend truth | YES |
| Admin can inspect critical flow QA status | YES |
| Health/docs are no longer contradictory | YES |
| Opportunity pages show truthful origin/status | YES |
| Action queue UI reflects real persisted actions | YES |

---

## Remaining Gaps

1. **Passive ingestion semi-batch**: fires on page mount only, not true event-driven
2. **npm ci**: NOT_FIXED — lockfile read-only (platform constraint)
3. **Template variable substitution**: no `[Prénom]` auto-replace server-side
4. **OpenClaw Gateway**: needs gateway_url + gateway_secret per user
5. **Stripe**: STRIPE_WEBHOOK_SECRET + Customer Portal must be configured

---

## Final Verdict

The runtime truth is unified: UI uses the same DB-driven threshold as ingestion, all critical flows read real data, and the QA panel exposes the exact truth with no decorative claims.
