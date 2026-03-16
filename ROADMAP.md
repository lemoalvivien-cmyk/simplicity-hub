# WIINUP MAX — Roadmap Produit

> **Vision** : La marketplace de recommandation B2B de référence pour les PME françaises — chaque introduction tracée, chaque commission sécurisée, chaque relation monétisée.

---

## ✅ Phase 1 — LIVRÉ — Marketplace fonctionnelle en production

**Statut : PRODUCTION — Abonnements actifs**

### Marketplace Introductions B2B ✅
- [x] Inscription multi-rôle (facilitateur / entreprise / admin) — RLS strict
- [x] Missions entreprise — création, publication, matching facilitateurs
- [x] Soumission d'introductions atomique — PL/pgSQL ACID (`submit_introduction_atomic`)
- [x] Validation introductions côté entreprise — statuts tracés
- [x] Historique introductions + gains facilitateur
- [x] Profils facilitateurs publics — secteur, zone, corridor
- [x] Tableau de bord facilitateur — métriques, pipeline, actions
- [x] Tableau de bord entreprise — introductions reçues, conversions

### Paiements & Abonnement ✅
- [x] Stripe Checkout 99 €/an (Founder Pass — 100 places max)
- [x] Webhooks Stripe HMAC idempotents
- [x] Quota de lancement — 100 slots, premier arrivé premier servi
- [x] Codes promo admin
- [x] Portal client Stripe (gestion abonnement)

### Infrastructure ✅
- [x] Auth email — inscription, connexion, reset password, vérification
- [x] RLS activé sur 100 % des tables métier
- [x] Rate limiting centralisé — 100 req/min/user
- [x] Queue email transactionnel — pgmq + Resend
- [x] CI/CD — TypeScript strict + ESLint + Vitest + build
- [x] PWA installable (VitePWA)
- [x] Conformité RGPD — consentement cookies, export données, suppression compte
- [x] Bandeau RGPD conforme art. 6.1.a — `RGPDConsentBanner`

### Sécurité ✅
- [x] RLS strict sur 100 % des tables (profiles, subscriptions, introductions, gains…)
- [x] CORS hardened — allowlist wiinupmax.com en prod
- [x] Secrets via Lovable Cloud Vault — jamais dans le code
- [x] Pre-commit Husky — bloque `sk_live_`, `whsec_`, `service_role`
- [x] Monitoring — alertes email auto + `business_alerts` DB

---

## 🚧 Phase 2 — 30–90 jours

### Expérience utilisateur
- [ ] Messagerie interne facilitateur ↔ entreprise
- [ ] Notifications push PWA (introductions validées, nouveaux gains)
- [ ] Recherche et filtres avancés facilitateurs

### Croissance
- [ ] Programme de parrainage facilitateurs
- [ ] Page facilitateur publique partageable (lien de référence)
- [ ] Intégrations CRM légères (export CSV, Zapier webhook)

### Fiabilité
- [ ] Tests E2E Playwright complets (signup → intro → validation → gain)
- [ ] SLA monitoring 99.9 % — alertes uptime
- [ ] Backup automatique DB quotidien vérifié

---

## Phase 3 — 6 mois : Scale

- [ ] Marketplace facilitateurs publique + moteur de matching amélioré
- [ ] Multilingue EN/ES
- [ ] Dashboard investisseur — ARR, NPS, métriques clés
- [ ] API partenaires (accès programmatique introductions)

---

## KPIs Cibles

| Métrique             | J30    | J90     | J180    |
|----------------------|--------|---------|---------|
| MRR                  | 1 k€   | 5 k€    | 20 k€   |
| Entreprises actives  | 20     | 100     | 400     |
| Facilitateurs        | 60     | 300     | 1 200   |
| Introductions/mois   | 100    | 600     | 3 000   |
| Taux conversion      | 15 %   | 20 %    | 25 %    |

---

## Risques & Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Fraude facilitateurs | Haut | `anti_circumvention_flags` + dispute + preuve d'introduction |
| Scaling DB >1M rows | Moyen | Index optimisés + pagination stricte |
| Stripe webhook failure | Haut | HMAC strict + retry queue + `billing_proof_chain` |
| Concurrence | Moyen | Moat = réseau propriétaire + atomicité + confiance prouvée |
