# WIINUP MAX
### 🏆 Phase 1 terminée — Monopole data + exécution autonome + cash machine verrouillé

> **WiinupMax est une machine de guerre B2B.**
> Eternal Trust Graph · ADA Autonomous Agents · Insights Licensing API · Silent Royalty 12%
> **Founder Pass 99 €/an (100 places max)** – ADA prospecte en voix + apporte des affaires + exécute en autonomie 24/7 via swarm + 12 % royalty tokenisée WMAX revendable sur secondary market.

---

> ## 🔥 SÉCURITÉ CRITIQUE — À FAIRE EN PREMIER
> **Si `.env` est visible sur GitHub → double-clique sur `FIX-SECURITY-FINAL.bat`**
> ```bash
> git rm --cached .env
> git add .gitignore
> git commit -m "SECURITY: remove .env from git history forever"
> git push
> ```

---

## Stack technique

- **Frontend** : React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + React Flow
- **Backend** : Lovable Cloud (Supabase PostgreSQL + pgvector + Auth + Edge Functions)
- **Paiements** : Stripe (checkout + Connect + webhooks idempotents)
- **IA** : Gemini 2.5 Pro/Flash via Lovable AI Gateway
- **IA Vocale** : ElevenLabs (TTS + STT + Conversational AI)
- **PWA** : VitePWA (installable mobile)

## Architecture

```
src/
  pages/         — Pages React (user / admin / public / ADA / insights)
  components/    — Composants UI (graph, ai, activation, leads…)
  contexts/      — AuthContext, SubscriptionContext
  hooks/         — Hooks métier (useEternalGraph, useADASessions…)
  lib/           — analytics, pricingConfig, insightsPricingConfig…
  integrations/  — Client Supabase (auto-généré, ne pas modifier)
supabase/
  functions/     — Edge Functions Deno (ada-orchestrator, etg-*, insights-api…)
  migrations/    — Migrations SQL versionnées
```

## Moteurs principaux

| Module | Statut | Description |
|--------|--------|-------------|
| **Eternal Trust Graph v2** | ✅ PROD | pgvector + shortest_path_trust + hidden links |
| **ADA Autonomous Deal Agent** | ✅ PROD | 95% autonome · LangGraph-style · ElevenLabs |
| **Silent Royalty 12%** | ✅ PROD | Webhook Stripe auto · split automatique · 7% platform + 5% engine fee |
| **WMAX Token** | ✅ PROD | Royalty tokenisée · Base L2 · revendable secondary market |
| **Insights Licensing API** | ✅ PROD | 15k€→75k€/mois · B2B institutionnel |
| **God Mode** | 🔄 P2 | Triple swarm · War Caller · AutoPilot |

## Rôles utilisateurs

| Rôle | Description |
|---|---|
| `facilitateur` | Apporteur d'affaires — gratuit, recommande des contacts |
| `entreprise` | Acheteur d'introductions — abonnement 99 € TTC/an |
| `admin` | Back-office — accès via `/admin` |

## Monétisation

- **🔥 Founder Pass** : 99 € TTC/an (100 places max) — ADA prospecte en voix + apporte des affaires + exécute en autonomie 24/7 via swarm + 12 % royalty tokenisée WMAX revendable sur secondary market
- **Insights API Starter** : 15 000 € / mois
- **Insights API Growth** : 35 000 € / mois
- **Insights API Enterprise** : 75 000 € / mois
- **Royalty ADA** : 12% sur chaque deal fermé automatiquement (7% platform + 5% engine fee swarm)

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

## Variables d'environnement

Gérées automatiquement par Lovable Cloud. Ne pas modifier `.env`.

| Variable | Usage |
|---|---|
| `VITE_SUPABASE_URL` | URL projet |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé anon publique |
| `STRIPE_SECRET_KEY` | Secret Stripe (Edge Functions) |
| `STRIPE_WEBHOOK_SECRET` | Validation webhooks Stripe |
| `LOVABLE_API_KEY` | Gateway AI (auto-provisionné) |

## État de production

**Verdict : ✅ PRODUCTION READY — Phase 1 verrouillée**

- ✅ ETG v2 : pgvector + shortest_path + hidden links
- ✅ ADA 95% : machine d'état LangGraph · ElevenLabs · Gemini
- ✅ Royalty 7% : webhook silent · Stripe split automatique
- ✅ Insights API : 3 tiers · vector search · OpenAPI
- ✅ Sécurité : RLS strict · JWT in-code · CORS hardened · CI/CD
- ✅ RGPD · EU AI Act · Bloctel : templates + page `/legal`
- ⚙️ Webhook Stripe : nécessite `STRIPE_WEBHOOK_SECRET` configuré
- ⚙️ ElevenLabs voice : nécessite `ELEVENLABS_API_KEY` configuré
