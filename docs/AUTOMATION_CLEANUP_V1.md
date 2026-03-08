# PROOF:AUTOMATION_CLEANUP_V1 — Automation Ownership Fix / Release Honesty

Date: 2026-03-08
Stamp: AUTOMATION-CLEANUP-2026-03-08-V1

## Grep Command

```sh
grep -r "PROOF:AUTOMATION_CLEANUP_V1" src supabase docs
```

---

## A. FILES MODIFIED

- `supabase/migrations/20260308..._automation_ownership_fix_v1.sql` — SQL owner resolution fix
- `src/lib/automationEngine.ts` — TS proof markers + owner_source in return type
- `src/lib/releaseCandidateHealth.ts` — Removed false blockers, reclassified engine to RESOLVED
- `src/lib/releaseHealth.ts` — Removed false automation_rules_no_engine blocker
- `src/pages/admin/SystemHealth.tsx` — Engine panel shows owner resolution + "ACTIF" badge
- `docs/AUTOMATION_CLEANUP_V1.md` — This file

---

## B. STRATEGY (8 lines max)

Owner resolution strategy: `COALESCE(entreprise_id, user_id)` — enterprise leads use enterprise rules, facilitator-originated leads use facilitator rules.
Actions are routed by type: `request_facilitator_precision` → `facilitator_id`; all other actions (conversion, auto-promote, review) → resolved owner (company).
Health files corrected: `automation_rules_no_engine` blocker removed from both `releaseHealth.ts` and `releaseCandidateHealth.ts`; engine reclassified as RESOLVED.
New SQL function `resolve_rule_owner(intake_id)` exposes the strategy for RPC-level use.
Admin health panel updated: shows "ACTIF" badge, owner resolution strategy, and action routing clearly.
npm ci status: honestly documented as `NOT_FIXED_PLATFORM_CONSTRAINT` — lockfile is read-only in Lovable.
Public trace: code is clean (confirmed by grep), platform badge requires Project Settings toggle — documented as PLATFORM_CONSTRAINT.

---

## C. GREPABLE PROOF INDEX

| Marker | File |
|--------|------|
| `PROOF:AUTOMATION_CLEANUP_V1:rule_owner_resolution` | `supabase/migrations/..._automation_ownership_fix_v1.sql` + `src/lib/automationEngine.ts` |
| `PROOF:AUTOMATION_CLEANUP_V1:enterprise_rules_apply_to_enterprise_leads` | `supabase/migrations/..._automation_ownership_fix_v1.sql` |
| `PROOF:AUTOMATION_CLEANUP_V1:facilitator_rules_apply_to_facilitator_leads` | `supabase/migrations/..._automation_ownership_fix_v1.sql` |
| `PROOF:AUTOMATION_CLEANUP_V1:action_routing_coherence` | `supabase/migrations/..._automation_ownership_fix_v1.sql` + `src/pages/admin/SystemHealth.tsx` |
| `PROOF:AUTOMATION_CLEANUP_V1:health_blocker_cleanup` | `src/lib/releaseCandidateHealth.ts` + `src/lib/releaseHealth.ts` |
| `PROOF:AUTOMATION_CLEANUP_V1:release_honesty_status` | `src/lib/releaseCandidateHealth.ts` |
| `PROOF:AUTOMATION_CLEANUP_V1:npm_ci_truth` | `src/lib/releaseCandidateHealth.ts` + `src/lib/releaseHealth.ts` |
| `PROOF:AUTOMATION_CLEANUP_V1:public_trace_truth` | `src/lib/releaseCandidateHealth.ts` + `src/lib/releaseHealth.ts` |
| `PROOF:AUTOMATION_CLEANUP_V1:admin_health_consistency` | `src/pages/admin/SystemHealth.tsx` + `supabase/migrations/..._automation_ownership_fix_v1.sql` |

---

## D. CODE EXCERPTS

### rule_owner_resolution (SQL)
```sql
-- PROOF:AUTOMATION_CLEANUP_V1:rule_owner_resolution
v_resolved_owner := COALESCE(p_owner_id, v_intake.entreprise_id, v_intake.user_id);
-- ...
'owner_source', CASE WHEN v_intake.entreprise_id IS NOT NULL THEN 'entreprise_id' ELSE 'user_id' END
```

### enterprise_rules / facilitator_rules (SQL trigger)
```sql
-- PROOF:AUTOMATION_CLEANUP_V1:enterprise_rules_apply_to_enterprise_leads
-- PROOF:AUTOMATION_CLEANUP_V1:facilitator_rules_apply_to_facilitator_leads
v_owner := COALESCE(NEW.entreprise_id, NEW.user_id);
PERFORM public.apply_automation_rules_to_lead(NEW.id, v_owner);
```

### action_routing_coherence (SQL)
```sql
-- PROOF:AUTOMATION_CLEANUP_V1:action_routing_coherence
CASE WHEN v_action_type = 'request_facilitator_precision' THEN v_intake.facilitator_id
     ELSE v_resolved_owner END,
```

### health_blocker_cleanup (TS)
```typescript
// PROOF:AUTOMATION_CLEANUP_V1:health_blocker_cleanup
// Was previously listed here as blocker/open "automation_rules_no_engine" — CORRECTED to resolved
{
  id: "automation_engine_present",
  severity: "info",
  status: "resolved",
  note: "AUTOMATION_V1 + CLEANUP_V1: apply_automation_rules_to_lead() RPC + DB trigger active..."
}
```

### npm_ci_truth (TS)
```typescript
// PROOF:AUTOMATION_CLEANUP_V1:npm_ci_truth
npm_ci_status: "NOT_FIXED_PLATFORM_CONSTRAINT" as const,
note: "package-lock.json est READ-ONLY dans l'environnement Lovable..."
```

### public_trace_truth (TS)
```typescript
// PROOF:AUTOMATION_CLEANUP_V1:public_trace_truth
platform_badge_present: true as const,
removable_by_code: false as const,
removal_method: "Project Settings → Hide Lovable badge (platform option, not code-level)"
```

---

## E. ACCEPTANCE TABLE

| Check | Status |
|-------|--------|
| rule owner resolution is explicit | YES |
| enterprise rules apply to enterprise-owned leads | YES |
| facilitator rules apply to facilitator-owned leads | YES |
| generated actions route to the correct actor | YES |
| release health files are no longer contradictory | YES |
| npm ci truth is stated honestly | YES — NOT_FIXED_PLATFORM_CONSTRAINT |
| public trace truth is stated honestly | YES — code clean / badge = platform overlay |
| admin health reflects the real current state | YES — ACTIF badge, owner strategy visible |

---

## F. REMAINING GAPS

- npm ci: NOT_FIXED — lockfile is READ-ONLY in Lovable environment (platform constraint, not code)
- Public badge: visible on published site until Project Settings → Hide Lovable badge is toggled (platform constraint)
- `passive_semi_batch`: passive ingestion still requires page mount (no background cron/webhook)
- `message_templates_no_variables`: no server-side [Prénom] substitution engine yet
- Stripe webhook secret + customer portal: still hard-blockers for production

---

## G. FINAL VERDICT

L'ownership du moteur d'automatisation est désormais explicite et cohérent, les faux blockers health ont été supprimés, et la vérité release est documentée sans bullshit.
