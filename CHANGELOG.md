# Changelog — WiinupMax

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
