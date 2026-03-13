# WIINUP MAX

> ## 🔥 SÉCURITÉ CRITIQUE — À FAIRE EN PREMIER
> **Le fichier `.env` peut être exposé sur GitHub.**
> **Suivez immédiatement les instructions dans [`FIX_SECURITY.md`](./FIX_SECURITY.md) avant tout développement.**
> ```bash
> git rm --cached .env
> git add .gitignore
> git commit -m "SECURITY: remove .env from git history forever"
> git push
> ```

Plateforme B2B de développement commercial par apport d'affaires et introductions qualifiées.

## Stack technique

- **Frontend** : React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend** : Lovable Cloud (Supabase PostgreSQL + Auth + Edge Functions)
- **Paiements** : Stripe (checkout annuel)
- **IA vocale** : ElevenLabs (optionnel)
- **PWA** : VitePWA (installable mobile)

## Architecture

```
src/
  pages/         — Pages React (user / admin / public)
  components/    — Composants UI réutilisables
  contexts/      — AuthContext, SubscriptionContext
  hooks/         — Hooks métier
  lib/           — analytics.ts, landingTracking.ts, pricingConfig.ts…
  integrations/  — Client Supabase (auto-généré, ne pas modifier)
supabase/
  functions/     — Edge Functions Deno
  migrations/    — Migrations SQL versionnées
```

## Rôles utilisateurs

| Rôle | Description |
|---|---|
| `facilitateur` | Apporteur d'affaires — gratuit, recommande des contacts |
| `entreprise` | Acheteur d'introductions — abonnement annuel |
| `admin` | Back-office — accès via `/admin` |

## Monétisation

- **Offre Launch** : 99 € / an (100 premiers slots)
- **Offre Standard** : 490 € / an
- **Accès promo** : codes VIP 12 mois (gratuit, via admin)
- Facilitateurs : toujours gratuits

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
```

## Quality Gate (CI)

Le pipeline `.github/workflows/ci.yml` exécute :
1. `tsc --noEmit` — vérification types
2. `eslint` — lint
3. `vitest` — tests unitaires
4. `vite build` — build de production
5. `npm audit --audit-level=high` — audit sécurité dépendances

## État de production

**Verdict actuel : BETA PRIVÉE**

- ✅ Sécurité multi-tenant : gardes JWT sur Edge Functions, RLS strict, user_roles
- ✅ Analytics runtime : `analytics_events` écrit/lu réellement
- ✅ Payout ops : tables + RPC + audit_log fonctionnels
- ✅ Moteur réactivation : `reactivation_jobs` + `scan_reactivation_candidates()`
- ✅ ROI Dashboard entreprise : métriques réelles depuis DB
- ⚠️ Envoi email réactivation : nécessite provider externe (Resend, Brevo…)
- ⚠️ Webhook Stripe : nécessite `STRIPE_WEBHOOK_SECRET` configuré

## Variables d'environnement

Gérées automatiquement par Lovable Cloud. Ne pas modifier `.env`.

| Variable | Usage |
|---|---|
| `VITE_SUPABASE_URL` | URL projet Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé anon publique |
| `STRIPE_SECRET_KEY` | Secret Stripe (Edge Functions uniquement) |
| `STRIPE_WEBHOOK_SECRET` | Validation webhooks Stripe |
