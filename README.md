# WIINUP MAX — Plateforme B2B d'acquisition par recommandation

> **Founder Pass 99 €/an · 100 places max · Prix garanti à vie · Remboursé si insatisfait 30 jours**

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
