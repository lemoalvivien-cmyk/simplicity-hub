# REPO SYNC MANIFEST
## Passe courante : RELEASE SYNC GATE V1

> Generated: 2026-03-08  
> Stamp courant : `RELEASESYNC-2026-03-08-1315-V1`  
> Ce document est la source de vérité de synchronisation entre le repo Git, l'export zip et le preview déployé.  
> Pour vérifier le stamp courant : `grep -r "RELEASESYNC-2026-03-08-1315-V1" src/`
> PROOF:RELEASE_V1:repo_manifest_consistency
> PROOF:RELEASE_SYNC_V1:repo_sync_manifest

---

## 1. BUILD STAMP COURANT

```
RELEASESYNC-2026-03-08-1315-V1
```

File: `src/lib/buildStamp.ts`  
Constant: `BUILD_STAMP`  
Proof markers:
- `PROOF:RELEASE_SYNC_V1:build_stamp_visible`
- `PROOF:RELEASE_V1:build_stamp_consistency`

### Historique des stamps

| Stamp | Passe | Date |
|-------|-------|------|
| `SYNCGATE-2026-03-08-1147-V1`      | REPO_SYNC_GATE_V1       | 2026-03-08 |
| `GOLIVE-2026-03-08-1200-V1`        | GOLIVE_HARDENING_V1     | 2026-03-08 |
| `RELEASE-2026-03-08-1300-V1`       | RELEASE_INTEGRITY_V1    | 2026-03-08 |
| `RELEASESYNC-2026-03-08-1315-V1`   | RELEASE_SYNC_GATE_V1    | 2026-03-08 (courant) |

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
PROOF:RELEASE_SYNC_V1:package_lock_present

---

## 3. FILES EXPECTED

// PROOF:RELEASE_SYNC_V1:regles_page_present → src/pages/Regles.tsx
// PROOF:RELEASE_SYNC_V1:messages_page_present → src/pages/Messages.tsx
// PROOF:RELEASE_SYNC_V1:passive_page_present → src/pages/PassiveOS.tsx
// PROOF:RELEASE_SYNC_V1:system_health_present → src/pages/admin/SystemHealth.tsx
// PROOF:RELEASE_SYNC_V1:build_health_present → src/lib/buildHealth.ts

| Fichier | Statut |
|---------|--------|
| `src/lib/buildStamp.ts` | PRESENT |
| `src/lib/featureRegistry.ts` | PRESENT |
| `src/lib/buildHealth.ts` | PRESENT |
| `src/lib/goLiveHealth.ts` | PRESENT |
| `src/lib/releaseHealth.ts` | PRESENT |
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
| `src/pages/Regles.tsx` | PRESENT |
| `src/pages/Messages.tsx` | PRESENT |
| `package.json` | PRESENT |
| `package-lock.json` | PRESENT |
| `docs/REPO_SYNC_MANIFEST.md` | PRESENT (ce fichier) |

---

## 4. PROOF MARKERS EXPECTED

Commandes de vérification :

```bash
grep -r "PROOF:RELEASE_SYNC_V1" src/ docs/
grep -r "PROOF:RELEASE_V1"      src/ supabase/ docs/
grep -r "PROOF:GOLIVE_V1"       src/ supabase/ docs/
grep -r "PROOF:SYNC_GATE_V1"    src/ docs/
grep -r "PROOF:"                src/ | grep -v node_modules
```

### Marqueurs RELEASE_SYNC_V1

| Marqueur | Fichier |
|----------|---------|
| `PROOF:RELEASE_SYNC_V1:build_stamp_visible` | `src/lib/buildStamp.ts` |
| `PROOF:RELEASE_SYNC_V1:repo_sync_manifest` | `docs/REPO_SYNC_MANIFEST.md` |
| `PROOF:RELEASE_SYNC_V1:system_health_sync_stamp` | `src/pages/admin/SystemHealth.tsx` |
| `PROOF:RELEASE_SYNC_V1:regles_page_present` | `docs/REPO_SYNC_MANIFEST.md` + `src/pages/Regles.tsx` |
| `PROOF:RELEASE_SYNC_V1:messages_page_present` | `docs/REPO_SYNC_MANIFEST.md` + `src/pages/Messages.tsx` |
| `PROOF:RELEASE_SYNC_V1:passive_page_present` | `docs/REPO_SYNC_MANIFEST.md` + `src/pages/PassiveOS.tsx` |
| `PROOF:RELEASE_SYNC_V1:system_health_present` | `docs/REPO_SYNC_MANIFEST.md` + `src/pages/admin/SystemHealth.tsx` |
| `PROOF:RELEASE_SYNC_V1:build_health_present` | `docs/REPO_SYNC_MANIFEST.md` + `src/lib/buildHealth.ts` |
| `PROOF:RELEASE_SYNC_V1:package_lock_present` | `docs/REPO_SYNC_MANIFEST.md` |
| `PROOF:RELEASE_SYNC_V1:migrations_present` | `docs/REPO_SYNC_MANIFEST.md` |

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

PROOF:RELEASE_SYNC_V1:migrations_present

---

## 6. ACCEPTANCE CHECKLIST

- [x] BUILD_STAMP courant `RELEASESYNC-2026-03-08-1315-V1` dans `src/lib/buildStamp.ts`
- [x] Package manager truth explicite : npm = release, bun = Lovable internal
- [x] Lockfile strategy documentée et cohérente
- [x] `automation_rules` seed idempotente (unique constraint sur owner + rule_type)
- [x] `message_templates` seed idempotente (unique constraint sur owner + type + channel)
- [x] `admin_forensics_summary()` RPC SECURITY DEFINER déployée
- [x] Lovable badge absent des vues publiques
- [x] `src/lib/releaseHealth.ts` = source de vérité release blockers
- [x] Tous les marqueurs PROOF:RELEASE_SYNC_V1 grep-ables
- [x] Section "Release Sync Gate" visible dans `/admin/system-health`

---

## 7. GREP COMMANDS

```bash
# Stamp courant
grep -r "RELEASESYNC-2026-03-08-1315-V1" src/

# Release Sync V1 proof layer
grep -r "PROOF:RELEASE_SYNC_V1" src/ docs/

# Release V1 proof layer
grep -r "PROOF:RELEASE_V1" src/ supabase/ docs/

# All proof layers
grep -r "PROOF:" src/ docs/ | grep -v node_modules

# Package manager truth
grep -r "package_manager_truth" src/
```

---

*Mis à jour : PROMPT 12 — RELEASE SYNC GATE V1 — 2026-03-08*  
*PROOF:RELEASE_V1:repo_manifest_consistency*  
*PROOF:RELEASE_SYNC_V1:repo_sync_manifest*
