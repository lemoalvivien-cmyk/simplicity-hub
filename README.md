# WIINUP MAX — Plateforme B2B d'acquisition par recommandation

> **Founder Pass 99 €/an · 100 places max · Prix garanti à vie · Remboursé si insatisfait 30 jours**

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

Les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` sont des clés **publiques** — elles peuvent figurer dans le code frontend.

---

## 🛠️ Purge de l'historique Git — Script exact

> **À exécuter si un fichier `.env` ou un secret a été commité par erreur.**

```bash
# ── ÉTAPE 1 — Installer git-filter-repo ─────────────────────────────────────
pip install git-filter-repo
# ou : brew install git-filter-repo (macOS)

# ── ÉTAPE 2 — Purger .env de TOUT l'historique ──────────────────────────────
git filter-repo --path .env --invert-paths --force
git filter-repo --path .env.example --invert-paths --force
git filter-repo --path .env.local --invert-paths --force

# ── ÉTAPE 3 — Forcer la mise à jour du remote ────────────────────────────────
git push origin --force --all
git push origin --force --tags

# ── ÉTAPE 4 — Rotation OBLIGATOIRE des clés exposées ────────────────────────
# Stripe   → https://dashboard.stripe.com/apikeys → Roll key
# Supabase → Lovable Cloud → Settings → API → Regenerate anon key
```

> ⚠️ **Après la purge, tous les collaborateurs doivent faire `git clone` à nouveau.**  
> Les forks et pulls requests GitHub peuvent encore contenir l'historique — supprimer les forks concernés.

---

## 🔒 Rendre le repo GitHub privé (manuel)

1. GitHub → Settings → Danger Zone → **Change repository visibility** → **Make private**
2. Confirmer avec le nom du repo

---

## 🔒 Closed Beta

La beta privée est contrôlée par `src/lib/betaConfig.ts` :

```typescript
export const CLOSED_BETA = true;   // true = mode beta, false = public
export const BETA_MAX_SLOTS = 50;  // places max en beta
```

Pour ouvrir au public : mettre `CLOSED_BETA = false` et vérifier que `launch_quota.total_slots = 100`.

---

## Stack technique

- **Frontend** : React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend** : Lovable Cloud (Supabase PostgreSQL + Auth + Edge Functions)
- **Paiements** : Stripe (checkout + webhooks idempotents)
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
✅ Monitoring : alertes email auto · business_alerts DB
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
- Toute mention de royalties, tokens, IA vocale ou autonomous agents est strictement hors-scope GTM
