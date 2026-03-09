# PRODUCTION READYNESS — WIINUP MAX
> Version: 2026-03-09 | Stamp: RC-2026-03-09-SYNC-V4
>
> Document factuel unique. Chaque claim mappe vers un fichier ou une exécution réelle.
> Vocabulaire : ABSENT / CRÉÉ MAIS NON BRANCHÉ / BRANCHÉ MAIS NON PROUVÉ / PROUVÉ PAR LE CODE / PROUVÉ PAR RUNTIME / DÉPEND CONFIG EXTERNE / ÉTAPE MANUELLE REQUISE / NON PROUVÉ

---

## 1. État Actuel — Inventaire Vérité

### 1.1 Télémétrie

| Item | Statut | Preuve |
|------|--------|--------|
| `analytics.ts` (writer singleton) | **PROUVÉ PAR LE CODE** | `src/lib/analytics.ts` |
| `landing_view` writer | **PROUVÉ PAR LE CODE** | `src/pages/Index.tsx` — useEffect mount |
| `pricing_view` writer | **PROUVÉ PAR LE CODE** | `src/pages/Pricing.tsx` — useEffect mount |
| `cta_click` writer | **PROUVÉ PAR LE CODE** | `src/pages/Pricing.tsx` — onClick CTA |
| `checkout_start` writer | **PROUVÉ PAR LE CODE** | `src/pages/Checkout.tsx` — `handleStripeCheckout` |
| `checkout_success` writer | **PROUVÉ PAR LE CODE** | `src/pages/Checkout.tsx` — useEffect `?success=true` |
| `onboarding_done` writer | **PROUVÉ PAR LE CODE** | `src/pages/Onboarding.tsx` — `saveProfile` success |
| `mission_created` writer | **PROUVÉ PAR LE CODE** | `src/pages/MissionNouvelle.tsx` |
| `intro_submitted` writer | **PROUVÉ PAR LE CODE** | `src/pages/MissionDetail.tsx` |
| `intro_validated` writer | **PROUVÉ PAR LE CODE** | `src/pages/IntroductionsEntreprise.tsx` |
| `signup_started` writer | **PROUVÉ PAR LE CODE** | `src/pages/Signup.tsx` |
| `login_success` writer | **PROUVÉ PAR LE CODE** | `src/pages/Login.tsx` |
| `promo_redeemed` writer | **PROUVÉ PAR LE CODE** | `src/pages/Checkout.tsx` |

### 1.2 Revenue / Payouts

| Item | Statut | Preuve |
|------|--------|--------|
| `generate_payouts_from_validated_gains()` RPC | **PROUVÉ PAR LE CODE** | migration DB |
| `update_payout_status()` RPC | **PROUVÉ PAR LE CODE** | migration DB — admin only |
| `create_payout_batch()` RPC | **PROUVÉ PAR LE CODE** | migration DB |
| `PayoutOps.tsx` appelle les RPCs | **PROUVÉ PAR LE CODE** | `src/pages/admin/PayoutOps.tsx` |
| Webhook Stripe → quota → payout | **DÉPEND CONFIG EXTERNE** | Code présent dans `stripe-webhook/index.ts`. Flux E2E non exercé. |
| Génération automatique payout (cron) | **ÉTAPE MANUELLE REQUISE** | Script SQL dans `supabase/infra/scheduled-jobs.md` — non créé en base |

### 1.3 Réactivation

| Item | Statut | Preuve |
|------|--------|--------|
| `scan_reactivation_candidates()` RPC | **PROUVÉ PAR LE CODE** | migration DB |
| Table `reactivation_jobs` | **PROUVÉ PAR RUNTIME** | Vérifié via capability engine |
| UI admin lit `reactivation_jobs` | **PROUVÉ PAR LE CODE** | `src/pages/admin/Reactivation.tsx` |
| Envoi email Resend réel | **DÉPEND CONFIG EXTERNE** | Code présent dans `send-reactivation-email/index.ts`. RESEND_API_KEY = config cloud non vérifiable ici. |
| Déclenchement automatique scan (cron) | **ÉTAPE MANUELLE REQUISE** | Script dans `supabase/infra/scheduled-jobs.md` — non créé en base |

### 1.4 Infrastructure Planifiée

| Job | Statut | Preuve |
|-----|--------|--------|
| `openclaw-scheduler-tick` (5min) | **PROUVÉ PAR RUNTIME** | runs observés dans openclaw_scheduled_runs |
| `openclaw-daily-sweep` (7h UTC) | **BRANCHÉ MAIS NON PROUVÉ** | configuré, jamais observé en run |
| `openclaw-weekly-sweep` (lun 6h) | **BRANCHÉ MAIS NON PROUVÉ** | configuré, jamais observé en run |
| `reactivation-daily-scan` (3h UTC) | **ÉTAPE MANUELLE REQUISE** | Script SQL dans `supabase/infra/scheduled-jobs.md` |
| `payout-generation-daily` (4h UTC) | **ÉTAPE MANUELLE REQUISE** | Script SQL dans `supabase/infra/scheduled-jobs.md` |

### 1.5 Tests

| Item | Statut | Preuve |
|------|--------|--------|
| `runtime-truth.test.ts` | **PROUVÉ PAR RUNTIME** | 15 tests — passent (vérifié 2026-03-09) |
| `security.test.ts` | **PROUVÉ PAR RUNTIME** | 16 tests — passent |
| `example.test.ts` | **PROUVÉ PAR RUNTIME** | 1 test — passe |
| Tests CI workflow | **PROUVÉ PAR LE CODE** | `.github/workflows/ci.yml` |
| Smoke tests (curl/bash) | **NON PROUVÉ** | `scripts/smoke-test.sh` — requiert exécution externe |
| Load test k6 | **NON PROUVÉ** | `scripts/load-test-k6.js` — requiert exécution externe |
| Stripe webhook E2E | **NON PROUVÉ** | `scripts/verify-stripe-webhook.sh` — requiert Stripe CLI externe |

### 1.6 Secrets / Environnement

| Variable | Requis pour | Statut |
|----------|-------------|--------|
| `STRIPE_SECRET_KEY` | create-checkout | **DÉPEND CONFIG EXTERNE** — non vérifiable côté client |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook | **DÉPEND CONFIG EXTERNE** — non vérifiable côté client |
| `RESEND_API_KEY` | send-reactivation-email | **DÉPEND CONFIG EXTERNE** — non vérifiable côté client |
| `ELEVENLABS_API_KEY` | VoiceWelcome | **DÉPEND CONFIG EXTERNE** — non vérifiable côté client |
| `SUPABASE_URL` | Edge functions | Auto-injecté Lovable Cloud |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge functions | Auto-injecté Lovable Cloud |

> **VÉRITÉ** : Les secrets cloud ne peuvent JAMAIS être classés "PROUVÉ PAR LE REPO". Seule leur présence
> dans Cloud secrets peut être vérifiée via le dashboard Lovable Cloud ou en observant un comportement runtime.

### 1.7 Domaine Canonique

| Item | Statut | Preuve |
|------|--------|--------|
| `index.html` canonical / OG / JSON-LD | **wiinupmax.com** ✅ | Vérifié par grep — 0 occurrence lovable |
| `create-checkout` CANONICAL_ORIGIN | **wiinupmax.com** ✅ | Ligne 30 |
| `create-checkout` BUILTIN_ORIGINS | **wiinupmax.com UNIQUEMENT** ✅ | lovable.app RETIRÉ du code dur — doit aller dans ALLOWED_EXTRA_ORIGINS secret |
| `customer-portal` fallback origin | **wiinupmax.com** ✅ | Ligne 50 |
| `send-reactivation-email` liens emails | **wiinupmax.com** ✅ | APP_BASE_URL ligne 34 |
| `MentionsLegales.tsx` lien lovable.dev | **Acceptable** | Mention légale hébergeur — obligation juridique française |
| AI gateway URLs (lovable.dev) | **Acceptable** | API interne Lovable, jamais exposée aux utilisateurs |
| DNS wiinupmax.com configuré | **DÉPEND CONFIG EXTERNE** | Non vérifiable depuis Lovable |

> **ACTION REQUISE (dev/staging)** : Pour que les previews Lovable fonctionnent avec create-checkout,
> ajouter dans Lovable Cloud > Secrets :
> `ALLOWED_EXTRA_ORIGINS=https://wiinupmax.lovable.app,https://id-preview--7ccca0da-8e02-461c-8a27-4774fed14e51.lovable.app`

### 1.8 Hygiène Env / Lockfile

| Item | Statut |
|------|--------|
| `.env.example` template | **PROUVÉ PAR LE CODE** — présent, sans valeurs sensibles |
| `.env` dans export | **CONTRAINTE PLATEFORME** — Lovable inclut .env dans exports. Ne contient que clés publishable (VITE_SUPABASE_*). Pas de secrets. |
| `.gitignore` modifiable | **NON** — read-only (plateforme Lovable). Impossible d'ajouter .env. |
| `package-lock.json` aligné | **NON CLOS** — plateforme Lovable utilise bun en interne. package-lock.json potentiellement désynchronisé. Résolution requiert `npm install` hors Lovable. |
| `bun.lock` | **ARTEFACT INTERNE** — read-only, non utilisable comme vérité release |

---

## 2. Bloquants Go-Live

### 🔴 BLOQUANTS RÉELS (billing non prouvé E2E)

| Item | Impact | Action |
|------|--------|--------|
| Stripe checkout E2E non exercé | Aucun achat réel confirmé | Tester checkout Stripe avec carte test 4242 |
| Stripe webhook E2E non exercé | Flux paiement → activation non prouvé | Exécuter `scripts/verify-stripe-webhook.sh` |
| Customer Portal non activé | Gestion abonnement utilisateur bloquée | Activer dans Stripe Dashboard → Billing → Customer Portal |
| Secrets cloud non vérifiables | Impossible de confirmer config côté client | Vérifier dans Lovable Cloud > Secrets |

### 🟠 SÉRIEUX (fix avant lancement public)

| Item | Impact | Action |
|------|--------|--------|
| Crons reactivation + payout non créés | Exécution manuelle uniquement | Exécuter SQL dans Backend → Run SQL |
| TypeScript `strict: false` | Risque null-deref latent | Phase 2 |
| Lockfile npm/bun divergence | Reproductibilité build incertaine | `npm install` hors Lovable |

### 🟡 ACCEPTABLES (documentés, non bloquants pour beta privée)

| Item | Note |
|------|------|
| `openclaw-daily-sweep` jamais observé | Fenêtre 7h UTC |
| Rate limiting in-process | Acceptable en beta |
| `.env` visible dans export | Clés publishable uniquement |

---

## 3. Verdict Release Gate

| Cible | Décision | Condition |
|-------|----------|-----------|
| **Dev / test interne** | ✅ GO | État actuel suffisant |
| **Beta privée (billing réel)** | ⚠️ BLOQUÉ | Checkout + Webhook + Customer Portal non prouvés E2E |
| **Prod publique** | ❌ BLOQUÉ | Exige billing E2E + crons + smoke tests exercés |
| **Prod scale-ready** | ❌ PAS ENCORE | Exige rate limiting distribué + strict TS + load tests |

**VERDICT ACTUEL : PUBLIC_BETA_BLOCKED**

Justification : 3 capabilities billing (checkout, webhook, customer portal) non prouvées E2E.
Le release gate engine (`src/modules/control-plane/services/release-gate-engine.ts`) calcule ce verdict automatiquement.

---

## 4. Ce Qui Reste Non Prouvé

1. **Stripe checkout E2E** — aucun achat réel
2. **Stripe webhook E2E** — aucun event signé reçu en prod
3. **Customer Portal** — activation Stripe Dashboard non effectuée
4. **Secrets cloud** — présence non vérifiable côté client
5. **Crons reactivation + payout** — SQL non exécuté en base
6. **Smoke tests** — script présent, non exécuté
7. **Load tests k6** — script présent, non exécuté
8. **DNS canonical domain** — non vérifiable depuis Lovable
9. **Lockfile cohérence** — non résolvable dans Lovable
10. **TypeScript strict mode** — Phase 2

---

## 5. Prochain Chantier Unique

**Stripe E2E complet** : tester checkout → webhook → quota increment → activation abonnement.
C'est le seul chantier qui débloque le passage de PUBLIC_BETA_BLOCKED à PRIVATE_BETA_READY.

---

*Dernière mise à jour : 2026-03-09 — RC-2026-03-09-SYNC-V4*
*Auteur : Release adversary audit — zéro fiction, zéro mensonge*
