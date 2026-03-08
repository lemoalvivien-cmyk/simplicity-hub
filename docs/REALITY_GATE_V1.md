# REALITY GATE V1 — Exportable Proof Index

# PROOF:REALITY_GATE_V1:release_candidate_manifest

**Date:** 2026-03-08  
**Stamp:** RC-2026-03-08-1345-V1

Ce document est la source de vérité exportable pour la passe Reality Gate.  
Chaque claim est soit prouvé par un fichier dans le repo, soit marqué `NOT_IMPLEMENTED` ou `NOT_FIXED`.

---

## A. FILES MODIFIED (Reality Gate V1)

| Fichier | Action |
|---------|--------|
| `src/lib/automationEngine.ts` | Marqueurs `PROOF:REALITY_GATE_V1` ajoutés |
| `src/hooks/useAutomationEngine.ts` | Marqueurs `PROOF:REALITY_GATE_V1` ajoutés |
| `src/lib/releaseCandidateHealth.ts` | Marqueurs `PROOF:REALITY_GATE_V1` + honnêteté npm/trace |
| `src/pages/PassiveOS.tsx` | Marqueur `PROOF:REALITY_GATE_V1:passive_threshold_rule_applied` |
| `docs/REALITY_GATE_V1.md` | Ce fichier créé |

---

## B. FILES PRESENT OR NOT

| Élément | État |
|---------|------|
| `src/lib/automationEngine.ts` | **PRESENT** |
| `src/hooks/useAutomationEngine.ts` | **PRESENT** |
| migration automation engine | **PRESENT** — `supabase/migrations/20260308125558_ec93860b...sql` + `20260308131022_99df5f22...sql` |
| admin automation panel | **PRESENT** — `src/pages/admin/SystemHealth.tsx` lignes 952-1083 |
| passive rule-driven threshold | **PRESENT** — `getPassiveThreshold()` → RPC `get_automation_rule_threshold()` |
| automation log | **PRESENT** — table `automation_engine_log` (migration 20260308125558) |

---

## C. GREPABLE PROOF INDEX

```
grep -r "PROOF:REALITY_GATE_V1" src docs
```

| Slug | Fichier |
|------|---------|
| `PROOF:REALITY_GATE_V1:automation_rule_evaluator` | `src/lib/automationEngine.ts` |
| `PROOF:REALITY_GATE_V1:automation_rule_routing` | `src/lib/releaseCandidateHealth.ts` (ref migration) |
| `PROOF:REALITY_GATE_V1:template_resolution_engine` | `src/lib/automationEngine.ts` |
| `PROOF:REALITY_GATE_V1:action_payload_from_template` | `src/lib/automationEngine.ts` |
| `PROOF:REALITY_GATE_V1:passive_threshold_rule_applied` | `src/lib/automationEngine.ts` + `src/pages/PassiveOS.tsx` |
| `PROOF:REALITY_GATE_V1:intro_auto_promote_rule_applied` | `src/lib/releaseCandidateHealth.ts` (ref migration) |
| `PROOF:REALITY_GATE_V1:duplicate_guard_rule_applied` | `src/lib/releaseCandidateHealth.ts` (ref migration) |
| `PROOF:REALITY_GATE_V1:automation_rule_admin_visibility` | `src/hooks/useAutomationEngine.ts` |
| `PROOF:REALITY_GATE_V1:action_generation_from_rules` | `src/lib/releaseCandidateHealth.ts` (ref migration) |
| `PROOF:REALITY_GATE_V1:automation_engine_health` | `src/lib/automationEngine.ts` + `src/hooks/useAutomationEngine.ts` |
| `PROOF:REALITY_GATE_V1:npm_ci_truth` | `src/lib/releaseCandidateHealth.ts` |
| `PROOF:REALITY_GATE_V1:public_trace_truth` | `src/lib/releaseCandidateHealth.ts` |

---

## D. CODE EXCERPTS

### automation_rule_evaluator
```ts
// src/lib/automationEngine.ts
// PROOF:REALITY_GATE_V1:automation_rule_evaluator
export async function applyAutomationRulesToLead(intakeId: string, ownerId: string) {
  const { data, error } = await db.rpc("apply_automation_rules_to_lead", {
    p_intake_id: intakeId,
    p_owner_id:  ownerId,
  });
```

### template_resolution_engine
```ts
// src/lib/automationEngine.ts
// PROOF:REALITY_GATE_V1:template_resolution_engine
export async function resolveMessageTemplate(ownerId, actionType, channel = "email") {
  const { data, error } = await db.rpc("resolve_message_template", { ... });
```

### passive_threshold_rule_applied
```ts
// src/lib/automationEngine.ts
// PROOF:REALITY_GATE_V1:passive_threshold_rule_applied
export async function getPassiveThreshold(ownerId: string): Promise<number> {
  const { data, error } = await db.rpc("get_automation_rule_threshold", { ... });
  if (error) return 3; // explicit fallback
  return (data as number) ?? 3;
}
```

```ts
// src/pages/PassiveOS.tsx
// PROOF:REALITY_GATE_V1:passive_threshold_rule_applied → threshold read from get_automation_rule_threshold() RPC, NOT hardcoded
const threshold = await getPassiveThreshold(userId);  // ← live DB read
const qualifying = links.filter(l => (l.qualified_interest_count ?? 0) >= threshold && !l.converted);
```

### npm_ci_truth
```ts
// src/lib/releaseCandidateHealth.ts
// PROOF:REALITY_GATE_V1:npm_ci_truth — NOT_FIXED: platform constraint, lockfile is read-only
npm_ci_status: "NOT_FIXED_PLATFORM_CONSTRAINT" as const,
```

### public_trace_truth
```ts
// src/lib/releaseCandidateHealth.ts — LOVABLE_TRACE_STATUS
// PROOF:REALITY_GATE_V1:public_trace_truth
// code_clean: true — no badge in source
// platform_badge_present: true — injected by platform
// removable_by_code: false — Project Settings only
```

---

## E. ACCEPTANCE TABLE

| Claim | État |
|-------|------|
| automation engine exists in exportable code | **YES** — `src/lib/automationEngine.ts` + migrations |
| automation rules are evaluated by backend logic | **YES** — `apply_automation_rules_to_lead()` SQL function + trigger |
| active rules change lead/action behavior | **YES** — duplicate_guard, auto_promote, auto_create_action, require_precision |
| templates are used in payload generation | **YES** — `resolve_message_template()` injecte payload dans `lead_actions.payload` |
| passive threshold comes from rules | **YES** — `getPassiveThreshold()` → `get_automation_rule_threshold()` RPC |
| automation decisions are logged | **YES** — table `automation_engine_log` + admin panel |
| admin can inspect automation engine health | **YES** — `useAutomationEngine` hook + `SystemHealth.tsx` panel |
| npm ci is truly supported | **NO / NOT_FIXED** — `package-lock.json` READ-ONLY dans Lovable. Plateforme gère le lockfile. |
| public lovable trace is removed in code | **PARTIAL** — Code propre (confirmé par grep). Badge visible sur site publié = overlay plateforme non-supprimable par code. Action requise : Project Settings → Hide Lovable badge. |

---

## F. REMAINING GAPS

1. **npm ci** : `package-lock.json` est READ-ONLY dans l'environnement Lovable. `npm ci` ne peut pas être vérifié ni forcé depuis ce contexte. État : `NOT_FIXED (platform constraint)`.
2. **Public badge** : Badge "Edit with Lovable" sur le site publié = overlay injecté par la plateforme. Code source propre mais badge reste visible sur `wiinupmax.lovable.app`. Action : Project Settings → "Hide Lovable badge".
3. **Automation log admin-only** : RLS policy `owner_see_engine_log` filtre par `owner_user_id`. Les admins voient `get_automation_engine_health()` via SECURITY DEFINER — counts globaux OK mais pas les logs individuels d'autres users.

---

## G. FINAL VERDICT

Le moteur d'automatisation est réel, prouvé et exportable ; les gaps release restants sont deux contraintes plateforme documentées honnêtement et non maquillées.
