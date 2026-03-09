# PRODUCTION READYNESS — WIINUP MAX
> Version: 2026-03-09 | Stamp: RC-2026-03-09-HARDENING-V3
>
> Document factuel. Chaque claim mappe vers un fichier ou une exécution réelle.
> Vocabulaire : ABSENT / CRÉÉ MAIS NON BRANCHÉ / BRANCHÉ MAIS NON PROUVÉ / PROUVÉ PAR LE REPO / PROUVÉ PAR EXÉCUTION

---

## 1. État Actuel — Inventaire Vérité

### 1.1 Télémétrie

| Item | Statut | Preuve |
|------|--------|--------|
| `analytics.ts` (writer singleton) | **PROUVÉ PAR LE REPO** | `src/lib/analytics.ts` — `ANALYTICS_EVENTS` const + `trackEvent()` |
| `landing_view` writer | **PROUVÉ PAR LE REPO** | `src/pages/Index.tsx` — useEffect mount |
| `pricing_view` writer | **PROUVÉ PAR LE REPO** | `src/pages/Pricing.tsx` — useEffect mount |
| `cta_click` writer | **PROUVÉ PAR LE REPO** | `src/pages/Pricing.tsx` — onClick CTA |
| `checkout_start` writer | **PROUVÉ PAR LE REPO** | `src/pages/Checkout.tsx` — `handleStripeCheckout` |
| `checkout_success` writer | **PROUVÉ PAR LE REPO** | `src/pages/Checkout.tsx` — useEffect `?success=true` |
| `onboarding_done` writer | **PROUVÉ PAR LE REPO** | `src/pages/Onboarding.tsx` — `saveProfile` success |
| `mission_created` writer | **PROUVÉ PAR LE REPO** | `src/pages/MissionNouvelle.tsx` — `handleSave` success |
| `intro_submitted` writer | **PROUVÉ PAR LE REPO** | `src/pages/MissionDetail.tsx` — IntroductionForm.handleSubmit |
| `intro_validated` writer | **PROUVÉ PAR LE REPO** | `src/pages/IntroductionsEntreprise.tsx` — `handleValidate` |
| `signup_started` writer | **PROUVÉ PAR LE REPO** | `src/pages/Signup.tsx` |
| `login_success` writer | **PROUVÉ PAR LE REPO** | `src/pages/Login.tsx` |
| `promo_redeemed` writer | **PROUVÉ PAR LE REPO** | `src/pages/Checkout.tsx` |
| Dashboard analytics source-honnête | **PROUVÉ PAR LE REPO** | `src/pages/admin/Analytics.tsx` — source affichée par métrique |

### 1.2 Revenue / Payouts

| Item | Statut | Preuve |
|------|--------|--------|
| `generate_payouts_from_validated_gains()` RPC | **PROUVÉ PAR LE REPO** | migration DB — idempotent |
| `update_payout_status()` RPC | **PROUVÉ PAR LE REPO** | migration DB — admin only |
| `create_payout_batch()` RPC | **PROUVÉ PAR LE REPO** | migration DB |
| `PayoutOps.tsx` appelle les RPCs | **PROUVÉ PAR LE REPO** | `src/pages/admin/PayoutOps.tsx` |
| Webhook Stripe → quota → payout | **PROUVÉ PAR LE REPO** | `stripe-webhook/index.ts` + `quotaEngine.ts` + `STRIPE_WEBHOOK_SECRET` configuré |
| Génération automatique payout (cron) | **CRÉÉ MAIS NON BRANCHÉ** | Script SQL dans `supabase/infra/scheduled-jobs.md` |

### 1.3 Réactivation

| Item | Statut | Preuve |
|------|--------|--------|
| `scan_reactivation_candidates()` RPC | **PROUVÉ PAR LE REPO** | migration DB |
| Table `reactivation_jobs` | **PROUVÉ PAR LE REPO** | migration DB |
| UI admin lit `reactivation_jobs` | **PROUVÉ PAR LE REPO** | `src/pages/admin/Reactivation.tsx` |
| Déclenchement manuel scan (UI) | **PROUVÉ PAR LE REPO** | bouton `scan_reactivation_candidates()` |
| Envoi email Resend réel | **PROUVÉ PAR LE REPO** | `supabase/functions/send-reactivation-email/index.ts` + `RESEND_API_KEY` configurée |
| Déclenchement automatique scan (cron) | **CRÉÉ MAIS NON BRANCHÉ** | Script dans `supabase/infra/scheduled-jobs.md` |

**Verdict réactivation :** Détection réelle. Queue visible. Envoi email RÉEL via Resend. Cron = CRÉÉ MAIS NON BRANCHÉ.

### 1.4 Infrastructure Planifiée

| Job | Statut | Preuve |
|-----|--------|--------|
| `openclaw-scheduler-tick` (5min) | **PROUVÉ PAR EXÉCUTION** | jobid 4, runs observés en base |
| `openclaw-daily-sweep` (7h UTC) | **BRANCHÉ MAIS NON PROUVÉ** | configuré, jamais observé en run |
| `openclaw-weekly-sweep` (lun 6h) | **BRANCHÉ MAIS NON PROUVÉ** | configuré, jamais observé en run |
| `reactivation-daily-scan` (3h UTC) | **CRÉÉ MAIS NON BRANCHÉ** | Script SQL dans `supabase/infra/scheduled-jobs.md` |
| `payout-generation-daily` (4h UTC) | **CRÉÉ MAIS NON BRANCHÉ** | Script SQL dans `supabase/infra/scheduled-jobs.md` |

### 1.5 Tests

| Item | Statut | Preuve |
|------|--------|--------|
| `runtime-truth.test.ts` | **PROUVÉ PAR LE REPO** | `src/test/runtime-truth.test.ts` — 5 suites, 15 tests |
| `example.test.ts` | **PROUVÉ PAR LE REPO** | `src/test/example.test.ts` |
| `security.test.ts` | **PROUVÉ PAR LE REPO** | `src/test/security.test.ts` |
| Tests exécutés en CI | **PROUVÉ PAR LE REPO** | `.github/workflows/ci.yml` — `npm run test` |
| Smoke tests (curl/bash) | **PROUVÉ PAR LE REPO** | `scripts/smoke-test.sh` — exécutable hors Lovable |
| Load test k6 | **PROUVÉ PAR LE REPO** | `scripts/load-test-k6.js` — exécutable hors Lovable |
| Tests d'intégration Stripe réels | **BRANCHÉ MAIS NON PROUVÉ** | `scripts/verify-stripe-webhook.sh` — procédure Stripe CLI documentée |
| Tests OS-level concurrent (wrk/k6) | **CRÉÉ MAIS NON BRANCHÉ** | `scripts/load-test-k6.js` — nécessite k6 installé externe |

### 1.6 Secrets / Environnement

| Variable | Requis pour | Statut |
|----------|-------------|--------|
| `STRIPE_SECRET_KEY` | create-checkout, create-payout | **PROUVÉ PAR LE REPO** (configuré) |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook (CRITIQUE) | **PROUVÉ PAR LE REPO** (configuré 2026-03-09) |
| `RESEND_API_KEY` | send-reactivation-email | **PROUVÉ PAR LE REPO** (configuré) |
| `ELEVENLABS_API_KEY` | VoiceWelcome | **PROUVÉ PAR LE REPO** (configuré) |
| `SUPABASE_URL` | Toutes les edge functions | ✅ Auto-injecté Lovable Cloud |
| `SUPABASE_SERVICE_ROLE_KEY` | Toutes les edge functions | ✅ Auto-injecté Lovable Cloud |

### 1.7 TypeScript Hardening

| Item | Statut | Preuve |
|------|--------|--------|
| `strictFunctionTypes: true` | **PROUVÉ PAR LE REPO** | `tsconfig.app.json` |
| `strictBindCallApply: true` | **PROUVÉ PAR LE REPO** | `tsconfig.app.json` |
| `noFallthroughCasesInSwitch: true` | **PROUVÉ PAR LE REPO** | `tsconfig.app.json` |
| `strict: true` | **NON PROUVÉ** | Deferred — ~150+ errors in existing base. Phase 2 target. |
| `strictNullChecks: true` | **NON PROUVÉ** | Deferred — Phase 2 target. |
| `noImplicitAny: true` | **NON PROUVÉ** | Deferred — Phase 3 target. |

### 1.8 Lockfile / Package Manager

| Item | Statut | Preuve |
|------|--------|--------|
| `npm` = source de vérité release | **PROUVÉ PAR LE REPO** | `package-lock.json` + `npm run test` en CI |
| `bun.lock` = artefact interne Lovable | **IMPOSSIBLE DANS CET ENVIRONNEMENT** | bun.lock read-only, non modifiable depuis Lovable |
| `.env.example` | **PROUVÉ PAR LE REPO** | `.env.example` — template sans valeurs sensibles |
| `.env` avec valeurs réelles | Présent en env Lovable uniquement | Ne doit pas être committé en production |

**Procédure de recovery npm externe (si package-lock diverge) :**
```bash
rm bun.lock      # supprime l'artefact Lovable hors env
npm install      # régénère package-lock.json propre
npm run test     # valide
npm run build    # valide
```
⚠️ Cette procédure ne peut PAS être exécutée depuis Lovable. Doit être faite en dehors de l'environnement.

---

## 2. Bloquants Go-Live

### ✅ ANCIENS BLOQUANTS — FERMÉS

| Bloquant | Résolution |
|----------|------------|
| `STRIPE_WEBHOOK_SECRET` non configuré | ✅ Configuré le 2026-03-09 |
| Email réactivation absent | ✅ Resend branché via `send-reactivation-email` edge fn |

### 🟠 SÉRIEUX (fix avant lancement public)

| Item | Impact | Action |
|------|--------|--------|
| Crons `reactivation` + `payout` non créés en base | Exécution manuelle uniquement | Exécuter scripts dans `supabase/infra/scheduled-jobs.md` |
| TypeScript `strict: false` | Risque de null-deref latent | Activer progressivement — Phase 2 |
| Gap 3 (Stripe end-to-end) jamais exercé | Webhook testé par sig seulement | Exécuter `scripts/verify-stripe-webhook.sh` |

### 🟡 ACCEPTABLES (documentés, non bloquants pour beta privée)

| Item | Note |
|------|------|
| `openclaw-daily-sweep` jamais observé | Fenêtre 7h UTC |
| `openclaw-weekly-sweep` jamais observé | Fenêtre lundi 6h UTC |
| Rate limiting in-process `track-click` | Reset sur cold start — acceptable beta |
| `bun.lock` ambiguïté lockfile | Impossible à résoudre dans Lovable — npm est la vérité CI |

---

## 3. Commandes de Vérification

```bash
# Tests unitaires
npm run test

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build production
npm run build

# Smoke test (externe)
bash scripts/smoke-test.sh

# Load test (externe, nécessite k6)
k6 run --env SUPABASE_URL=... --env ANON_KEY=... scripts/load-test-k6.js

# Vérification crons (externe, nécessite psql)
bash scripts/verify-crons.sh

# Vérification Stripe webhook (externe, nécessite Stripe CLI)
bash scripts/verify-stripe-webhook.sh

# Quota idempotency (DB-level)
npm run verify:quota
```

---

## 4. Procédure Manuelle Go-Live (Gap 3 — Stripe)

Voir `scripts/verify-stripe-webhook.sh` pour la procédure complète.

---

## 5. Ce Qui Reste Non Prouvé (aucune omission)

1. **Gap 3** (Stripe end-to-end) — webhook sig test exercé manuellement non encore effectué
2. **Gap 1+2** (rollback RPC / no_quota_row) — nécessite DDL access
3. **Crons reactivation + payout** — scripts prêts, non exécutés en base
4. **openclaw-daily-sweep + weekly-sweep** — configurés, jamais observés en run autonome
5. **Concurrence OS-level** (k6 load test) — script créé, non encore exécuté
6. **Full E2E Stripe** (carte test → checkout → webhook → quota) — non exercé
7. **TypeScript strict mode complet** — Phase 2/3 déferré
8. **Customer Portal Stripe** — edge fn présente, activation Dashboard Stripe requise
9. **Lockfile cohérence npm/bun** — IMPOSSIBLE DANS LOVABLE

---

## 6. Verdict Go-Live

| Cible | Décision | Condition |
|-------|----------|-----------|
| **Dev / test interne** | ✅ GO | État actuel suffisant |
| **Beta privée (billing réel)** | ✅ GO CONDITIONNEL | Tous les bloquants résolus (STRIPE_WEBHOOK_SECRET ✅, Resend ✅). Exercer Gap 3 manuellement recommandé. |
| **Prod publique** | ⚠️ CONDITIONNEL | Exige : Gap 3 exercé + crons créés en base |
| **Prod scale-ready** | ❌ PAS ENCORE | Exige : rate limiting Redis, OS-level race test, strict TS |

**VERDICT ACTUEL : PRIVATE BETA READY (avec réserves documentées)**

---

*Dernière mise à jour : 2026-03-09 — RC-2026-03-09-HARDENING-V3*
*Auteur : Principal Engineer audit adversarial — zéro fiction*
