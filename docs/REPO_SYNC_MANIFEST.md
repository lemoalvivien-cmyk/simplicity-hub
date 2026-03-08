# REPO SYNC MANIFEST
## Passe courante : RELEASE INTEGRITY V1

> Generated: 2026-03-08  
> Stamp courant : `RELEASE-2026-03-08-1300-V1`  
> Ce document est la source de vérité de synchronisation entre le repo Git, l'export zip et le preview déployé.  
> Pour vérifier le stamp courant : `grep -r "RELEASE-2026-03-08-1300-V1" src/`
> PROOF:RELEASE_V1:repo_manifest_consistency

---

## 1. BUILD STAMP COURANT

```
RELEASE-2026-03-08-1300-V1
```

File: `src/lib/buildStamp.ts`  
Constant: `BUILD_STAMP`  
Proof marker: `PROOF:RELEASE_V1:build_stamp_consistency`

### Historique des stamps

| Stamp | Passe | Date |
|-------|-------|------|
| `SYNCGATE-2026-03-08-1147-V1`  | REPO_SYNC_GATE_V1    | 2026-03-08 |
| `GOLIVE-2026-03-08-1200-V1`    | GOLIVE_HARDENING_V1  | 2026-03-08 |
| `RELEASE-2026-03-08-1300-V1`   | RELEASE_INTEGRITY_V1 | 2026-03-08 (courant) |

---

## 2. PACKAGE MANAGER TRUTH

**Vérité de release : npm**  
PROOF:RELEASE_V1:package_manager_truth

| Fichier | Rôle | Stratégie |
|---------|------|-----------|
| `package.json` | Source de vérité des dépendances | Canonique |
| `package-lock.json` | Lockfile de release | `npm ci` pour CI/CD externe |
| `bun.lock` | Artefact Lovable uniquement | Install interne Lovable |

**Règle** : Pour toute CI externe ou release, utiliser `npm ci`. Le `bun.lock` est conservé pour la compatibilité Lovable mais ne remplace pas `package-lock.json` en contexte de release.

PROOF:RELEASE_V1:lockfile_integrity

---

## 3. FILES EXPECTED

| Fichier | Statut |
|---------|--------|
| `src/lib/buildStamp.ts` | PRESENT |
| `src/lib/featureRegistry.ts` | PRESENT |
| `src/lib/buildHealth.ts` | PRESENT |
| `src/lib/goLiveHealth.ts` | PRESENT |
| `src/lib/releaseHealth.ts` | PRESENT (créé RELEASE_V1) |
| `src/lib/leadPipeline.ts` | PRESENT |
| `src/hooks/useLeadIntakes.ts` | PRESENT |
| `src/hooks/useLeadActions.ts` | PRESENT |
| `src/hooks/usePipelineMetrics.ts` | PRESENT |
| `src/hooks/useAutomationRules.ts` | PRESENT |
| `src/hooks/useMessageTemplates.ts` | PRESENT |
| `src/components/leads/LeadActionsQueue.tsx` | PRESENT |
| `src/pages/admin/SystemHealth.tsx` | PRESENT |
| `src/pages/Opportunites.tsx` | PRESENT |
| `src/pages/PassiveOS.tsx` | PRESENT |
| `docs/REPO_SYNC_MANIFEST.md` | PRESENT (ce fichier) |

---

## 4. PROOF MARKERS EXPECTED

Commandes de vérification :

```bash
grep -r "PROOF:RELEASE_V1"    src/ supabase/ docs/
grep -r "PROOF:GOLIVE_V1"     src/ supabase/ docs/
grep -r "PROOF:SYNC_GATE_V1"  src/ docs/
grep -r "PROOF:INTEGRITY_V1"  src/ supabase/
grep -r "PROOF:PIPELINE_V2"   src/
grep -r "PROOF:"              src/ | grep -v node_modules
```

### Marqueurs RELEASE_V1

| Marqueur | Fichier |
|----------|---------|
| `PROOF:RELEASE_V1:package_manager_truth` | `src/lib/releaseHealth.ts` |
| `PROOF:RELEASE_V1:lockfile_integrity` | `src/lib/releaseHealth.ts` |
| `PROOF:RELEASE_V1:build_stamp_consistency` | `src/lib/buildStamp.ts` |
| `PROOF:RELEASE_V1:repo_manifest_consistency` | `docs/REPO_SYNC_MANIFEST.md` |
| `PROOF:RELEASE_V1:seed_uniqueness_rules` | migration SQL + `src/lib/releaseHealth.ts` |
| `PROOF:RELEASE_V1:seed_uniqueness_templates` | migration SQL + `src/lib/releaseHealth.ts` |
| `PROOF:RELEASE_V1:admin_forensics_global_visibility` | migration SQL + `src/pages/admin/SystemHealth.tsx` |
| `PROOF:RELEASE_V1:lovable_badge_removed` | `src/lib/releaseHealth.ts` |
| `PROOF:RELEASE_V1:prod_clean_checks` | `src/lib/releaseHealth.ts` |
| `PROOF:RELEASE_V1:release_blockers_real` | `src/lib/releaseHealth.ts` |

---

## 5. MIGRATIONS EXPECTED

| Fichier | Rôle | Statut |
|---------|------|--------|
| `20260308092314_aed804f3-ff6c-4498-98a8-7a78b7325989.sql` | Pipeline V2 — lead_source_events, lead_intakes, lead_entity_links, triggers, RLS | PRESENT |
| `20260308100159_fd20c7f8-d5c7-40e6-8106-b6429d43fb57.sql` | Pipeline V2 — lead_actions, upsert_lead_action(), promote_lead_to_opportunity() | PRESENT |
| `20260308101534_0fb4055e-9a39-47a2-8e26-ff573d848b47.sql` | Proof Gate V6 — documentation migration index | PRESENT |
| `20260308103452_9128e8ca-5408-4620-ad7d-d8cde576bb4f.sql` | Execution V1 — enterprise ownership, action routing trigger | PRESENT |
| `20260308104926_0c36b949-46de-425d-b62a-dc15a315b68f.sql` | Integrity V1 — update_lead_action_status() RPC, lead_action_events | PRESENT |
| `20260308114134_e820484c-5489-4575-a9c2-c1846aff2d1d.sql` | Go-Live V1 — automation_rules, message_templates, ingest_passive_signal RPC | PRESENT |
| `release_v1_seed_uniqueness_admin_forensics.sql` | Release V1 — unique constraints seeds, admin_forensics_summary() RPC | PRESENT |

Total migrations pipeline/integrity/release : 7

---

## 6. SEED IDEMPOTENCY

PROOF:RELEASE_V1:seed_uniqueness_rules  
PROOF:RELEASE_V1:seed_uniqueness_templates

| Table | Contrainte unique | Seed safe |
|-------|------------------|-----------|
| `automation_rules` | `(owner_user_id, rule_type)` UNIQUE | YES |
| `message_templates` | `(owner_user_id, template_type, channel)` UNIQUE | YES |

Les fonctions `seed_default_automation_rules()` et `seed_default_message_templates()` utilisent `ON CONFLICT DO NOTHING` qui est maintenant réellement idempotent grâce aux contraintes uniques.

---

## 7. ADMIN FORENSICS

PROOF:RELEASE_V1:admin_forensics_global_visibility

- Fonction `admin_forensics_summary()` déployée en SECURITY DEFINER
- Retourne counts globaux (action_events, automation_rules, message_templates, passive_events)
- Retourne les 10 derniers audit events sans PII
- Appelée depuis `/admin/system-health` → section "Ops Forensics"
- Accès : authentifié uniquement (rôle admin vérifié au niveau app)

---

## 8. PROD CLEAN

PROOF:RELEASE_V1:lovable_badge_removed  
PROOF:RELEASE_V1:prod_clean_checks

- `index.html` : aucune référence Lovable dans les meta/scripts publics
- `PublicNav.tsx` : aucun badge/lien Lovable
- `UserLayout.tsx` : aucun badge/lien Lovable
- `AdminLayout.tsx` : aucun badge/lien Lovable
- Badge "Edit in Lovable" : désactivé via Project Settings → Hide Lovable Badge

---

## 9. ACCEPTANCE CHECKLIST

- [x] BUILD_STAMP courant `RELEASE-2026-03-08-1300-V1` dans `src/lib/buildStamp.ts`
- [x] Package manager truth explicite : npm = release, bun = Lovable internal
- [x] Lockfile strategy documentée et cohérente
- [x] `automation_rules` seed idempotente (unique constraint sur owner + rule_type)
- [x] `message_templates` seed idempotente (unique constraint sur owner + type + channel)
- [x] `admin_forensics_summary()` RPC SECURITY DEFINER déployée
- [x] Lovable badge absent des vues publiques
- [x] `src/lib/releaseHealth.ts` = source de vérité release blockers
- [x] Tous les marqueurs PROOF:RELEASE_V1 grep-ables

---

## 10. GREP COMMANDS

```bash
# Stamp courant
grep -r "RELEASE-2026-03-08-1300-V1" src/

# Release V1 proof layer
grep -r "PROOF:RELEASE_V1" src/ supabase/ docs/

# All proof layers
grep -r "PROOF:" src/ docs/ | grep -v node_modules

# Package manager truth
grep -r "package_manager_truth" src/
```

---

*Mis à jour : PROMPT 11 — RELEASE INTEGRITY V1 — 2026-03-08*  
*PROOF:RELEASE_V1:repo_manifest_consistency*
