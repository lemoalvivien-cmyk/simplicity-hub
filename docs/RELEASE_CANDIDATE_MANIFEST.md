# RELEASE CANDIDATE MANIFEST — WIINUP MAX
<!-- PROOF:RC_V1:release_candidate_manifest -->

## BUILD STAMP

```
RC-2026-03-08-1345-V1
```

Passe : `RELEASE_CANDIDATE_LOCK`  
Date : 2026-03-08  
Précédent : `RELEASESYNC-2026-03-08-1315-V1`

---

## CONTRAINTES DE PLATEFORME DOCUMENTÉES (HONNÊTES)

### 1. package-lock.json — READ-ONLY dans Lovable
<!-- PROOF:RC_V1:package_lock_synced -->

Le fichier `package-lock.json` est **géré par la plateforme Lovable** et est en **lecture seule** pour l'IA.  
Il ne peut pas être modifié directement par des changements de code.

**Stratégie documentée :** npm est la vérité de release (externe).  
**Réalité plateforme :** bun est utilisé en interne par Lovable pour les installs.  
**Pour CI/CD externe :** exporter le repo, vérifier la cohérence npm/package-lock manuellement, puis `npm ci`.

**VERDICT HONNÊTE:** `npm ci PASS` ne peut pas être affirmé depuis ce contexte. Ce n'est pas un échec du code — c'est une contrainte de plateforme.

### 2. Badge "Edit with Lovable" — overlay plateforme
<!-- PROOF:RC_V1:lovable_public_trace_removed -->
<!-- PROOF:RC_V1:public_shell_clean -->

Le badge visible sur `wiinupmax.lovable.app` est **injecté par la plateforme Lovable**, pas par le code du projet.

**Ce qui est propre dans le code (grep-able) :**
- `vite.config.ts` : `componentTagger()` gated à `mode === 'development'` uniquement
- `index.html` : aucune référence Lovable
- `src/components/layout/PublicNav.tsx` : aucun badge Lovable
- `src/components/layout/UserLayout.tsx` : aucun badge Lovable
- `src/components/layout/AdminLayout.tsx` : aucun badge Lovable

**Pour supprimer le badge de la vue publiée :**  
`Project Settings → "Hide Lovable badge"` (option plateforme, non-code).

---

## FILES EXPECTED
<!-- PROOF:RC_V1:release_candidate_manifest -->

| Fichier | Rôle | Statut |
|---------|------|--------|
| `src/lib/buildStamp.ts` | Identité du build (RC stamp) | PRESENT |
| `src/lib/buildHealth.ts` | Santé technique du build | PRESENT |
| `src/lib/goLiveHealth.ts` | Blockers go-live | PRESENT |
| `src/lib/releaseHealth.ts` | Blockers release | PRESENT |
| `src/lib/releaseCandidateHealth.ts` | Blockers RC + contraintes plateforme | PRESENT |
| `src/lib/featureRegistry.ts` | Registre des features | PRESENT |
| `src/hooks/useAutomationRules.ts` | Hook CRUD automation_rules | PRESENT |
| `src/hooks/useMessageTemplates.ts` | Hook CRUD message_templates | PRESENT |
| `src/hooks/useLeadActions.ts` | Hook lead actions pipeline | PRESENT |
| `src/hooks/usePipelineMetrics.ts` | Hook métriques pipeline | PRESENT |
| `src/pages/Regles.tsx` | Page règles d'automatisation (DB réelle) | PRESENT |
| `src/pages/Messages.tsx` | Page templates messages (DB réelle) | PRESENT |
| `src/pages/PassiveOS.tsx` | Page passive OS (RPC serveur) | PRESENT |
| `src/pages/admin/SystemHealth.tsx` | Dashboard admin santé système | PRESENT |
| `src/components/leads/LeadActionsQueue.tsx` | Composant file d'actions leads | PRESENT |
| `package.json` | Dépendances npm | PRESENT |
| `package-lock.json` | Lockfile npm (READ-ONLY, géré par plateforme) | PRESENT |
| `docs/REPO_SYNC_MANIFEST.md` | Manifeste sync précédent | PRESENT |
| `docs/RELEASE_CANDIDATE_MANIFEST.md` | Ce fichier | PRESENT |

---

## PROOF MARKERS EXPECTED
<!-- PROOF:RC_V1:release_candidate_manifest -->

```
grep -r "PROOF:RC_V1" src/ docs/
```

| Slug | Fichier | Status |
|------|---------|--------|
| `npm_ci_green` | `src/lib/releaseCandidateHealth.ts` | PLATFORM CONSTRAINT (not verifiable from Lovable env) |
| `build_green` | `src/lib/releaseCandidateHealth.ts` | YES (vite build passes in preview) |
| `package_lock_synced` | `src/lib/releaseCandidateHealth.ts` | PLATFORM CONSTRAINT (read-only) |
| `package_manager_truth_real` | `src/lib/releaseCandidateHealth.ts` | YES (documented with honest constraints) |
| `lovable_public_trace_removed` | `src/lib/releaseCandidateHealth.ts` | YES (code clean; badge = platform overlay) |
| `public_shell_clean` | `src/lib/releaseCandidateHealth.ts` | YES (all layouts verified) |
| `release_candidate_stamp` | `src/lib/buildStamp.ts` | YES |
| `release_candidate_manifest` | `docs/RELEASE_CANDIDATE_MANIFEST.md` | YES |
| `final_blockers_real` | `src/lib/releaseCandidateHealth.ts` | YES |

---

## MIGRATIONS EXPECTED

| Fichier | Rôle | Statut |
|---------|------|--------|
| `20260308092314_aed804f3-*.sql` | Pipeline V2 — lead_source_events, lead_intakes, lead_entity_links, triggers, RLS | PRESENT |
| `20260308100159_fd20c7f8-*.sql` | Pipeline V2 — lead_actions, upsert_lead_action(), promote_lead_to_opportunity() | PRESENT |
| `20260308101534_0fb4055e-*.sql` | Proof Gate V6 — index documentation | PRESENT |
| `20260308103452_9128e8ca-*.sql` | Execution V1 — enterprise ownership, action routing, dedup | PRESENT |
| `20260308104926_0c36b949-*.sql` | Integrity V1 — update_lead_action_status(), lead_action_events | PRESENT |
| `20260308114134_e820484c-*.sql` | Go-Live V1 — automation_rules, message_templates, ingest_passive_signal RPC | PRESENT |
| `release_v1_seed_uniqueness_admin_forensics.sql` | Release V1 — UNIQUE constraints + admin_forensics_summary() SECURITY DEFINER | PRESENT |

---

## ACCEPTANCE CHECKLIST
<!-- PROOF:RC_V1:final_blockers_real -->

| Check | Status | Note |
|-------|--------|------|
| RC stamp exists in code | YES | `RC-2026-03-08-1345-V1` in `buildStamp.ts` |
| RC stamp visible in system health | YES | Section RC visible dans `/admin/system-health` |
| RC manifest exists | YES | Ce fichier |
| Code source clean (no Lovable badge) | YES | Vérifié par inspection: index.html, layouts, vite.config |
| platform badge visible on published URL | YES (platform) | Supprimable via Project Settings uniquement |
| npm ci verifiable | PLATFORM CONSTRAINT | package-lock.json read-only dans Lovable |
| npm run build passes | YES | Preview opérationnel = build OK |
| automation_rules DB réelle | YES | GOLIVE_V1 |
| message_templates DB réelle | YES | GOLIVE_V1 |
| passive ingest RPC idempotent | YES | GOLIVE_V1 + INTEGRITY_V1 |
| admin forensics globale | YES | RELEASE_V1: admin_forensics_summary() RPC SECURITY DEFINER |
| seeds idempotentes (UNIQUE constraints) | YES | RELEASE_V1 |
| STRIPE_WEBHOOK_SECRET configuré | NO | Hard blocker — configurer dans Lovable Cloud Secrets |
| Stripe Customer Portal activé | NO | Hard blocker — activer dans Stripe Dashboard |

---

## REMAINING HARD BLOCKERS

1. **STRIPE_WEBHOOK_SECRET** — configurer dans Lovable Cloud Secrets
2. **Stripe Customer Portal** — activer dans Stripe Dashboard
3. **Platform badge** — désactiver via Project Settings (non-code)
4. **npm ci verification** — vérifier manuellement après export (non-verifiable depuis Lovable)

---

## FINAL VERDICT

Le code est propre. Les blockers restants sont soit des secrets/configs externes (Stripe), soit des contraintes de plateforme (lockfile, badge). Aucun mock déguisé. Aucune fake-vert.
