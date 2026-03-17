# Changelog — WiinupMax

## [1.1.0-final] — 2026-03-17 — LAUNCH-READY DEFINITIVE

### Sécurité (résolution finale)
- .gitignore recréé depuis zéro avec protection .env complète
- .env supprimé du tree — security-guard workflow auto-patch sur chaque push
- Husky pre-commit : blocage des commits .env au niveau git
- CSP : unsafe-inline retiré de script-src définitivement
- CI security-check : mode warning non-bloquant pendant transition gitignore
- Smoke tests de non-régression sécurité ajoutés

### Lancement
- README : checklist GO/NO-GO complète
- WhyDifferentSection : réponse directe "pourquoi 99€ vs gratuit"
- ProofSection : badge de transparence "témoignages beta"
- Sitemap : 7 URLs propres, /signup et /login retirés
- buildInfo : v1.1.0-final codeName LAUNCH-READY

## [1.1.0] — 2026-03-17 — Launch-Ready

### Sécurité
- CRITIQUE: .env retiré du tree git + .gitignore durci
- CRITIQUE: authGuard centralisé (DRY) sur toutes les edge functions
- CSP renforcée avec nonce
- @sentry/react isolé dans chunk dédié
- queryClient extrait dans src/lib/queryClient.ts

### SEO / GEO
- noscript complet pour crawlers et LLMs
- llms.txt créé (standard GEO émergent)
- robots.txt : directives pour GPTBot, Claude-Web, PerplexityBot
- sitemap.xml mis à jour (7 routes publiques)

### UX / Conversion
- SlotCounter : valeur null initiale (plus de "100" hardcodé)
- Anti double-submit sur Signup, Login, MissionNouvelle, CreerEmploi
- Page admin remboursements (/admin/refunds)
- ErrorBoundary global avec détection erreurs réseau Supabase

### CI/CD / Qualité
- GitHub Actions : 3 jobs (security-check, quality, audit)
- Tests E2E : 8 tests Playwright couvrant landing, auth, pages publiques, sécurité
- Projets Playwright mobile ajoutés (Pixel 7, iPhone 14)

### Documentation
- LICENSE ajouté (propriétaire — VLM Consulting)
- docs/secrets.md : procédure complète de gestion des secrets
- README mis à jour avec badges CI et instructions de déploiement

## [1.0.0] — 2026-03-01 — MVP Initial

- Architecture React/Vite/TypeScript/Supabase/Stripe
- 38 pages, 104 composants, 18 edge functions
- Dashboards entreprise et facilitateur
- Pipeline introductions avec KITT IA
- Onboarding 3 étapes + Aha Moment
- Paiements Stripe avec idempotency et webhooks
