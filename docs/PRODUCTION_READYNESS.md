# PRODUCTION READYNESS — WIINUP MAX
> Version: 2026-03-09 | Stamp: RC-2026-03-09-TRUTH-V2
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
| `cta_click` writer | **PROUVÉ PAR LE REPO** | `src/pages/Pricing.tsx` — onClick CTA → `trackEvent("cta_click")` |
| `checkout_start` writer | **PROUVÉ PAR LE REPO** | `src/pages/Checkout.tsx` — `handleStripeCheckout` |
| `checkout_success` writer | **PROUVÉ PAR LE REPO** | `src/pages/Checkout.tsx` — useEffect `?success=true` |
| `onboarding_done` writer | **PROUVÉ PAR LE REPO** | `src/pages/Onboarding.tsx` — `saveProfile` success |
| `mission_created` writer | **PROUVÉ PAR LE REPO** | `src/pages/MissionNouvelle.tsx` — `handleSave` success |
| `intro_submitted` writer | **PROUVÉ PAR LE REPO** | `src/pages/MissionDetail.tsx` — IntroductionForm.handleSubmit |
| `intro_validated` writer | **PROUVÉ PAR LE REPO** | `src/pages/IntroductionsEntreprise.tsx` — `handleValidate` |
| `signup_started` writer | **PROUVÉ PAR LE REPO** | `src/pages/Signup.tsx` — handleSubmit, avant signUp |
| `login_success` writer | **PROUVÉ PAR LE REPO** | `src/pages/Login.tsx` — handleSubmit, après signIn success |
| `promo_redeemed` writer | **PROUVÉ PAR LE REPO** | `src/pages/Checkout.tsx` — checkPromo result.valid |
| CTAs landing (hero, final, etc.) | **PROUVÉ PAR LE REPO** | `src/lib/landingTracking.ts` → `landing_ab_events` (Option B séparation assumée) |
| Dashboard analytics source-honnête | **PROUVÉ PAR LE REPO** | `src/pages/admin/Analytics.tsx` — source affichée par métrique, statuts env_dependent déclarés |

**Séparation télémétrie (Option B — assumée) :**
- `analytics_events` = runtime app (13 events writers réels)
- `landing_ab_events` = marketing landing (trackEvent via `landingTracking.ts`)
- `openclaw_logs` / `openclaw_scheduled_runs` = interne automation

### 1.2 Revenue / Payouts

| Item | Statut | Preuve |
|------|--------|--------|
| `generate_payouts_from_validated_gains()` RPC | **PROUVÉ PAR LE REPO** | migration DB — idempotent, `NOT EXISTS` guard |
| `update_payout_status()` RPC | **PROUVÉ PAR LE REPO** | migration DB — admin only, écrit `payout_audit_log` |
| `create_payout_batch()` RPC | **PROUVÉ PAR LE REPO** | migration DB — admin only |
| `PayoutOps.tsx` appelle les RPCs | **PROUVÉ PAR LE REPO** | `src/pages/admin/PayoutOps.tsx` — `supabase.rpc("generate_payouts_from_validated_gains")` |
| Tables `payouts`, `payout_batches`, `payout_audit_log` | **PROUVÉ PAR LE REPO** | migrations DB |
| Génération automatique payout (cron) | **CRÉÉ MAIS NON BRANCHÉ** | Script SQL dans `supabase/infra/scheduled-jobs.md` — pas encore exécuté en base |
| Webhook Stripe → quota → payout | **BRANCHÉ MAIS NON PROUVÉ** | `stripe-webhook/index.ts` → `quotaEngine.ts` → `launch_quota` — STRIPE_WEBHOOK_SECRET non confirmé configuré |

### 1.3 Réactivation

| Item | Statut | Preuve |
|------|--------|--------|
| `scan_reactivation_candidates()` RPC | **PROUVÉ PAR LE REPO** | migration DB — détecte 3 types de candidats |
| Table `reactivation_jobs` | **PROUVÉ PAR LE REPO** | migration DB |
| UI admin lit `reactivation_jobs` | **PROUVÉ PAR LE REPO** | `src/pages/admin/Reactivation.tsx` |
| Déclenchement manuel scan (UI) | **PROUVÉ PAR LE REPO** | `Reactivation.tsx` — bouton appelle `supabase.rpc("scan_reactivation_candidates")` |
| Déclenchement automatique scan (cron) | **CRÉÉ MAIS NON BRANCHÉ** | Script SQL dans `supabase/infra/scheduled-jobs.md` — pas encore exécuté en base |
| Envoi email réel (provider) | **ABSENT** | Aucun provider email (Resend, Loops, Brevo) n'est configuré |
| Mode manuel assisté (UI) | **PROUVÉ PAR LE REPO** | `Reactivation.tsx` — "Marquer envoyé", "Ignorer" — audit manuel opérateur |

**Verdict réactivation :** Détection réelle. Queue visible et actable. Envoi = ABSENT (manuel explicitement assumé).

### 1.4 Infrastructure Planifiée

| Job | Statut | Preuve |
|-----|--------|--------|
| `openclaw-scheduler-tick` (5min) | **PROUVÉ PAR EXÉCUTION** | `supabase/infra/cron-jobs.md` — jobid 4, runs observés en base |
| `openclaw-daily-sweep` (7h UTC) | **BRANCHÉ MAIS NON PROUVÉ** | `supabase/infra/cron-jobs.md` — jobid 5, jamais observé en run |
| `openclaw-weekly-sweep` (lun 6h) | **BRANCHÉ MAIS NON PROUVÉ** | `supabase/infra/cron-jobs.md` — jobid 6, jamais observé en run |
| `reactivation-daily-scan` (3h UTC) | **CRÉÉ MAIS NON BRANCHÉ** | `supabase/infra/scheduled-jobs.md` — script SQL prêt, pas exécuté |
| `payout-generation-daily` (4h UTC) | **CRÉÉ MAIS NON BRANCHÉ** | `supabase/infra/scheduled-jobs.md` — script SQL prêt, pas exécuté |

### 1.5 Tests

| Item | Statut | Preuve |
|------|--------|--------|
| `runtime-truth.test.ts` | **PROUVÉ PAR LE REPO** | `src/test/runtime-truth.test.ts` — 5 suites, 15 tests |
| `example.test.ts` | **PROUVÉ PAR LE REPO** | `src/test/example.test.ts` |
| `security.test.ts` | **PROUVÉ PAR LE REPO** | `src/test/security.test.ts` |
| Tests exécutés en CI | **PROUVÉ PAR LE REPO** | `.github/workflows/ci.yml` — `npm run test` |
| Tests d'intégration Stripe réels | **ABSENT** | Nécessite Stripe CLI + STRIPE_WEBHOOK_SECRET |
| Tests OS-level concurrent (wrk/k6) | **ABSENT** | Nécessite outil de charge externe |

### 1.6 Secrets / Environnement

| Variable | Requis pour | Statut |
|----------|-------------|--------|
| `STRIPE_SECRET_KEY` | create-checkout, create-payout | **BRANCHÉ MAIS NON PROUVÉ** (configuré selon GoLive.tsx) |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook (CRITIQUE) | **ABSENT / non confirmé** |
| `SUPABASE_URL` | Toutes les edge functions | ✅ Auto-injecté Lovable Cloud |
| `SUPABASE_SERVICE_ROLE_KEY` | Toutes les edge functions | ✅ Auto-injecté Lovable Cloud |
| `ALLOWED_EXTRA_ORIGINS` | create-checkout (optionnel) | **ABSENT** (pas bloquant) |
| Provider email (Resend/Brevo) | Réactivation automatique | **ABSENT** |

---

## 2. Bloquants Go-Live

### 🔴 BLOQUANTS RÉELS (empêchent tout argent réel)

| Bloquant | Impact | Action requise |
|----------|--------|----------------|
| `STRIPE_WEBHOOK_SECRET` non configuré | Tous les webhooks Stripe échouent avec 500. Aucun abonnement traité. | Configurer dans les secrets Edge Function MAINTENANT |
| Webhook Stripe jamais testé end-to-end | Gap 3 non exercé | Stripe CLI relay + `stripe trigger checkout.session.completed` |
| Customer Portal Stripe non activé | `customer-portal` edge fn inutilisable | Activer dans Stripe Dashboard |

### 🟠 SÉRIEUX (fix avant lancement public)

| Item | Impact | Action |
|------|--------|--------|
| Crons `reactivation` + `payout` non créés en base | Exécution manuelle uniquement | Exécuter scripts dans `supabase/infra/scheduled-jobs.md` |
| Aucun provider email | Réactivation = queue admin manuelle uniquement | Intégrer Resend ou Brevo |
| TypeScript `strict: false` | Risque de null-deref latent (~50 erreurs estimées) | Activer progressivement |

### 🟡 ACCEPTABLES (documentés, non bloquants pour beta privée)

| Item | Note |
|------|------|
| `openclaw-daily-sweep` jamais observé | Fenêtre 7h UTC — pas encore passée depuis création |
| `openclaw-weekly-sweep` jamais observé | Fenêtre lundi 6h UTC — même raison |
| `cta_click` analytics = pricing CTA uniquement | Landing CTAs dans `landing_ab_events` — assumé Option B |
| Rate limiting in-process | Reset sur cold start — acceptable en beta privée |

---

## 3. Commandes de Vérification

```bash
# Tests unitaires + registry télémétrie
npm run test

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build production
npm run build

# Idempotency quota (5 scénarios DB)
npm run verify:quota

# Race condition concurrent (JS-level)
deno run --allow-env --allow-net scripts/verify-quota-race.ts
```

```sql
-- Vérifier jobs planifiés actifs en base
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN (
  'openclaw-scheduler-tick',
  'openclaw-daily-sweep',
  'openclaw-weekly-sweep',
  'reactivation-daily-scan',
  'payout-generation-daily'
)
ORDER BY jobid;

-- Vérifier RPCs critiques existent
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'generate_payouts_from_validated_gains',
    'scan_reactivation_candidates',
    'increment_launch_quota_used_slots',
    'update_payout_status',
    'create_payout_batch'
  );

-- Générer payouts manuellement
SELECT public.generate_payouts_from_validated_gains();

-- Scanner candidats réactivation manuellement
SELECT public.scan_reactivation_candidates();
```

---

## 4. Procédure Manuelle Go-Live (Gap 3 — Stripe)

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe
stripe login

# Forwarder vers l'edge function déployée
stripe listen --forward-to https://usnriklfiagazpffsqew.supabase.co/functions/v1/stripe-webhook

# Dans un second terminal
stripe trigger checkout.session.completed

# Logs attendus :
#   [STRIPE-WEBHOOK] Event verified — { type: "checkout.session.completed", id: "evt_..." }
#   [STRIPE-WEBHOOK] Quota consume result — { consumeResult: "incremented" | "skipped_not_launch" }
```

---

## 5. Sécurité Endpoints Publics

### `stripe-webhook` (POST)
| Check | Statut |
|-------|--------|
| Signature Stripe | ✅ Obligatoire (`constructEventAsync`) — retourne 400 si absente |
| Secret manquant → 500 | ✅ Message explicite "Webhook secret not configured." |
| Dédup `stripe_event_id` | ✅ `ignoreDuplicates: true` |
| Rate limit | ⚠️ Aucun (Stripe throttle côté Stripe) |

### `create-checkout` (POST)
| Check | Statut |
|-------|--------|
| JWT obligatoire | ✅ |
| Origin allowlist | ✅ |
| Logs structurés | ✅ `logStep` sur chaque path |

### `track-click` (GET — public)
| Check | Statut |
|-------|--------|
| `code` requis | ✅ 400 si absent |
| Longueur max 64 | ✅ |
| Pattern `[a-zA-Z0-9_-]` | ✅ |
| Rate limit in-process | ✅ 20 req/min/IP (reset cold start) |

---

## 6. Ce Qui Reste Non Prouvé (aucune omission)

1. **STRIPE_WEBHOOK_SECRET** configuré et fonctionnel — non confirmé
2. **Gap 3** (Stripe end-to-end) — jamais exercé avec Stripe CLI relay
3. **Gap 1+2** (rollback RPC / no_quota_row) — nécessite DDL access (psql ou execute_ddl RPC admin)
4. **Crons reactivation + payout** en base de production — scripts prêts, non exécutés
5. **openclaw-daily-sweep + weekly-sweep** — configurés, jamais observés en run autonome
6. **Concurrence OS-level** (wrk/k6 sur stripe-webhook) — non testée
7. **Provider email réactivation** — ABSENT
8. **TypeScript strict mode** — désactivé
9. **Full E2E Stripe** (carte test → checkout → webhook → quota) — non exercé

---

## 7. Verdict Go-Live

| Cible | Décision | Condition |
|-------|----------|-----------|
| **Dev / test interne** | ✅ GO | État actuel suffisant |
| **Beta privée (billing réel)** | ⚠️ CONDITIONNEL | Exige : STRIPE_WEBHOOK_SECRET configuré + Gap 3 exercé manuellement |
| **Prod publique** | ⚠️ CONDITIONNEL | Exige : tous les BLOQUANTS résolus + crons réactivation/payout créés en base + Gap 3 exercé |
| **Prod scale-ready** | ❌ PAS ENCORE | Exige : rate limiting Redis, OS-level race test, strict TS, provider email |

**VERDICT ACTUEL : BETA PRIVÉE**

---

*Dernière mise à jour : 2026-03-09 — RC-2026-03-09-TRUTH-V2*
*Auteur : Principal Engineer audit — zéro fiction*
