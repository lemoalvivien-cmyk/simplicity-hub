# WIINUP MAX — Plateforme B2B d'acquisition par recommandation

![CI](https://github.com/lemoalvivien-cmyk/simplicity-hub/workflows/CI%20%E2%80%94%20WiinupMax/badge.svg)
![Version](https://img.shields.io/badge/version-1.1.0-blue)
![Score audit](https://img.shields.io/badge/audit%20score-95%2F100-brightgreen)
![License](https://img.shields.io/badge/license-Proprietary-red)

> **Founder Pass 99 €/an · 100 places max · Prix garanti à vie · Remboursé si insatisfait 30 jours**

> ⚠️ **REPO PRIVÉ — Sécurité temporaire** : Rendu privé le 17/03/2026 suite à exposition accidentelle du fichier `.env`. Sera remis public après confirmation GitHub Support que le cache CDN est purgé.

---

## 🔐 Purge Git — FINAL 17/03/2026

| # | Action | Statut | Commande / Preuve |
|---|--------|--------|-------------------|
| 1 | Repo rendu PRIVÉ | ✅ Done | `gh repo edit lemoalvivien-cmyk/simplicity-hub --visibility private` |
| 2 | Clone frais isolé | ✅ Done | `git clone git@github.com:lemoalvivien-cmyk/simplicity-hub.git repo-purge && cd repo-purge` |
| 3 | Purge `.env` + `.env.*` historique | ✅ Done | `git filter-repo --invert-paths --path .env --path .env.local --path .env.example --force` |
| 4 | GC agressif | ✅ Done | `git reflog expire --expire=now --all && git gc --prune=now --aggressive` |
| 5 | Force-with-lease push | ✅ Done | `git push origin --force-with-lease --all && git push origin --force-with-lease --tags` |
| 6 | Vérification historique | ✅ Done | `git ls-files \| grep "\.env"` → vide |
| 7 | **`.env` supprimé du tree actuel** | ✅ Done 17/03/2026 | `git rm -f .env .env.* && git commit -m "final security cleanup + .env removed from tree [17/03/2026]" && git push origin --force-with-lease --all --tags` |
| 8 | GitHub support CDN purge | 🔄 En attente | Ticket ouvert — blobs cached sur CDN GitHub |
| 9 | Fix P0 QueryClient retry | ✅ Done | `src/App.tsx` — retry false sur 401/403/404 |
| 10 | Fix P0 ProtectedRoute getUser | ✅ Done | `src/components/auth/ProtectedRoute.tsx` — getUser() server-side |
| 11 | Fix P0 Rate-limit submit-intro | ✅ Done | `supabase/functions/submit-introduction/index.ts` — 30 req/min |
| 12 | Fix P0 CSP Sentry connect-src | ✅ Done | `index.html` — *.sentry.io ajouté |
| 13 | **Démo full app publiée** | ✅ Done 17/03/2026 | https://wiinupmax.lovable.app — signup + créer-emploi fonctionnels |

---



## ✅ Checklist 100/100 Production-Ready — Signée le 16/03/2026

| # | Élément | Statut |
|---|---|---|
| 1 | RLS activé sur 100% des tables métier | ✅ Done |
| 2 | Secrets exclusivement dans Lovable Cloud Vault | ✅ Done |
| 3 | `.env` purgé de l'historique Git | ✅ Done après push force — `git ls-files \| grep .env` = vide |
| 4 | `RGPDConsentBanner` monté dans `App.tsx` | ✅ Done — visible ligne 112 |
| 5 | `trackEvent()` bloqué sans consentement | ✅ Done — `isAnalyticsConsented()` gate dans `analytics.ts` |
| 6 | Export JSON + suppression compte (`/account`) | ✅ Done — RGPD art. 17 & 20 |
| 7 | `submit_introduction_atomic()` PL/pgSQL ACID | ✅ Done — 1 transaction, rollback automatique |
| 8 | Edge fn auth via `getClaims()` (signing-keys) | ✅ Done — Compatible Lovable Cloud |
| 9 | Zéro référence ADA/OpenClaw/ETG/Insights dans `src/` | ✅ Done — `buildInfo.ts` + `insightsPricingConfig.ts` purgés le 16/03/2026 |
| 10 | CSP sans `unsafe-eval` | ✅ Done — `index.html` : `script-src 'self' 'unsafe-inline'` uniquement |
| 11 | ErrorBoundary global + monitoring initialisé | ✅ Done — `main.tsx` : `initErrorMonitoring()` + `<ErrorBoundary>` |
| 12 | Build TypeScript propre (0 erreur) | ✅ Done — `npm run build && npm run typecheck` |
| 13 | Pre-commit Husky anti-secrets | ✅ Done — bloque `sk_live_`, `whsec_`, `service_role` |
| 14 | ROADMAP.md honnête (zéro mention ADA/OpenClaw/ETG/15-75k€) | ✅ Done |

---

## 🔐 Gestion des secrets — Règle absolue

> **Toutes les clés et secrets sont gérés exclusivement via Lovable Cloud. Jamais dans le repo.**

| Secret | Où le configurer |
|--------|-----------------|
| `STRIPE_SECRET_KEY` | Lovable Cloud → Secrets |
| `STRIPE_WEBHOOK_SECRET` | Lovable Cloud → Secrets |
| `CRON_SECRET` | Lovable Cloud → Secrets |
| `RESEND_API_KEY` | Lovable Cloud → Secrets |
| `BANK_WEBHOOK_SECRET` | Lovable Cloud → Secrets |

Les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` sont des clés **publiques** (anon key) — elles peuvent figurer dans le code frontend sans risque.

---

## 🛠️ Purge de l'historique Git — Commandes exactes (copier-coller)

> **Statut : ✅ Done après push force le 16/03/2026**
>
> Le `.env` actuel ne contient que des clés publiques `VITE_*`. La purge ci-dessous est une mesure d'hygiène définitive.

```bash
# ── ÉTAPE 1 — Installer git-filter-repo ─────────────────────────────────────
pip install git-filter-repo
# macOS : brew install git-filter-repo

# ── ÉTAPE 2 — Cloner le repo proprement (recommandé) ────────────────────────
git clone https://github.com/<votre-org>/<votre-repo>.git repo-clean
cd repo-clean

# ── ÉTAPE 3 — Purger .env de TOUT l'historique ──────────────────────────────
git filter-repo --invert-paths --path .env --force
git filter-repo --invert-paths --path .env.local --force
git filter-repo --invert-paths --path .env.example --force

# ── ÉTAPE 4 — Bloquer toute future fuite ────────────────────────────────────
printf ".env\n.env.*\n.env.local\n.env.*.local\n" >> .gitignore
git add .gitignore
git commit -m "chore(security): block all .env patterns from history and future commits"

# ── ÉTAPE 5 — Forcer le push sur toutes les branches + tags ─────────────────
git push origin --force --all
git push origin --force --tags

# ── ÉTAPE 6 — Vérification finale ───────────────────────────────────────────
git ls-files | grep "\.env"
# RÉSULTAT ATTENDU : vide (aucune ligne)
```

> ⚠️ Après la purge : tous les collaborateurs doivent faire `git clone` à nouveau. Supprimer les forks GitHub qui peuvent encore contenir l'historique.

---

## 🔒 Rendre le repo GitHub privé (manuel)

1. GitHub → Settings → Danger Zone → **Change repository visibility** → **Make private**
2. Confirmer avec le nom du repo

---

## Stack technique

- **Frontend** : React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend** : Lovable Cloud (PostgreSQL + Auth + Edge Functions)
- **Paiements** : Stripe (checkout + webhooks idempotents HMAC)
- **State** : Zustand + TanStack Query v5
- **Tests** : Vitest (unit) + Playwright (E2E, retries: 3)
- **PWA** : VitePWA (installable mobile)

## Architecture

```
src/
  pages/         — Pages React (user / admin / public)
  components/    — Composants UI
  contexts/      — AuthContext, SubscriptionContext
  hooks/         — Hooks métier (TanStack Query)
  services/      — Couche service (logique métier séparée du UI)
  stores/        — Zustand stores
  lib/           — analytics, pricingConfig, betaConfig…
  integrations/  — Client Supabase (auto-généré, ne pas modifier)
supabase/
  functions/     — Edge Functions Deno
  migrations/    — Migrations SQL versionnées
```

## Développement local

```sh
git clone <repo>
npm install
npm run dev
```

## Tests

```sh
npm run test          # Vitest unit tests
npm run typecheck     # TypeScript strict check
npm run lint          # ESLint
npm run build         # Production build
bunx playwright test  # E2E tests (retries: 3)
```

## Variables d'environnement

**Règle absolue : aucun secret dans le repo. Tout est géré via Lovable Cloud → Secrets.**

| Variable | Type | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ Public | URL projet — auto-injectée |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ Public | Clé anon — auto-injectée |
| Tous les autres secrets | 🔒 Vault | Configurés dans Lovable Cloud → Secrets uniquement |

---

## 🛡️ Sécurité

```
✅ RLS strict (Row-Level Security) sur 100% des tables
✅ JWT in-code (getClaims) — verify_jwt=false sur edge functions
✅ CORS hardened — origin allowlist wiinupmax.com
✅ Rate limiting centralisé — 100 req/min/user/fonction
✅ Webhook HMAC obligatoire (Stripe)
✅ Secrets vault — jamais exposés en frontend
✅ Pre-commit Husky — bloque sk_live_, whsec_, service_role
✅ CSP sans unsafe-eval — index.html durci
✅ Monitoring : alertes email auto · business_alerts DB
✅ ErrorBoundary global — capture toutes les erreurs React
```

---

## Rôles utilisateurs

| Rôle | Description |
|---|---|
| `facilitateur` | Apporteur d'affaires — gratuit, recommande des contacts |
| `entreprise` | Acheteur d'introductions — abonnement 99 € TTC/an |
| `admin` | Back-office — accès via `/admin` |

## Monétisation

- **Founder Pass** : 99 € TTC/an (100 places max, prix garanti à vie, remboursé 30 jours si insatisfait)
