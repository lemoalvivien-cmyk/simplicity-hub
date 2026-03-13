# WIINUP MAX — Roadmap Produit

> **Vision** : Devenir l'OS de croissance commerciale B2B en Europe — chaque deal tracé, chaque réseau monétisé, chaque fermeture assistée par IA.

---

## Phase 1 — Aujourd'hui : Fondations & Revenue Live

**Horizon : J0 → J30**

### Moteur IA
- [x] **ADA 95 %** — Agent Deal Accelerator v1 : scoring, négociation adaptative, fermeture vocale via ElevenLabs
- [x] **Eternal Trust Graph** — graphe de confiance multi-nœuds (etg_persons, etg_companies, etg_links, etg_hidden_links)
- [x] **OpenClaw** — pipeline de génération de leads autonome (scheduler, job executor, channel dispatch, lead generator)
- [x] **Royalty 7 %** — système de commissions automatiques facilitateur→entreprise, payouts Stripe Connect
- [x] **AI Lead Scoring** — modèle ML in-edge pour qualifier les intakes entrants

### Infrastructure
- [x] Auth multi-rôle (facilitateur / entreprise / admin) avec RLS strict
- [x] Stripe Checkout annuel 99 €/an + webhooks vérifiés HMAC
- [x] Rate limiting 100 req/min/user via `check_rate_limit` SECURITY DEFINER
- [x] Email transactionnel (queue pgmq + process-email-queue)
- [x] CI/CD : TypeScript strict + ESLint + Vitest + build + npm audit
- [x] PWA installable (VitePWA)
- [x] Conformité RGPD : CGU, Confidentialité, Mentions Légales, Bloctel, consentement vocal

### Monétisation
- [x] Abonnement Entreprise : 99 €/an (offre de lancement, 100 slots)
- [x] Facilitateurs : gratuit à vie
- [x] Codes promo VIP (admin)
- [x] Eternal Insights API : 15 k€ → 75 k€/mois (B2B fonds/banques)

---

## Phase 2 — 60 jours : Full Autonomous Closing + ZK + Web3

**Horizon : J30 → J90**

### Full Autonomous Closing (ADA v2)
- [ ] **Pipeline 100 % autonome** : ADA orchestre closing sans intervention humaine (mode God)
- [ ] **Multi-canal** : LinkedIn outreach automatisé + email séquences + appel vocal ADA
- [ ] **Adaptive script v2** : LoRA fine-tuning sur 500+ closes réels, précision cible > 95 %
- [ ] **Deal Radar** : détection préemptive des signaux d'achat (technographics + firmographics)

### Zero-Knowledge Proof sur les données réseau
- [ ] **ZK-proof d'introduction** : prouver qu'une intro a eu lieu sans révéler les parties (zk-SNARKs via snarkjs)
- [ ] **Graph privacy layer** : etg_hidden_links + ZK commitments pour protection des chemins de confiance
- [ ] **Audit trail immuable** : chaque deal fermé → preuve cryptographique stockée on-chain

### Polygon / Web3 Royalty
- [ ] **Smart contract royalty** : paiement automatique 7 % en USDC via Polygon PoS
- [ ] **NFT d'accréditation facilitateur** : badge soul-bound, non-transférable, preuve de réseau vérifié
- [ ] **DAO governance** : vote facilitateurs sur pondération des missions (Q3 2026)

### Scale & API
- [ ] **Eternal Insights API v2** : webhooks temps réel + GraphQL endpoint + SDK Python/Node
- [ ] **Intégrations natives** : Salesforce, HubSpot, Pipedrive (bidirectionnel)
- [ ] **Multilingue** : EN, ES, DE (i18n complet)
- [ ] **SLA 99.9 %** : multi-région AWS + Supabase read replicas

---

## Phase 3 — 6 mois : Marketplace & Réseau Européen

**Horizon : J90 → J180**

- [ ] **Marketplace facilitateurs** : profils publics, système de notation, appel d'offres
- [ ] **Franchise réseau** : modules blancs pour cabinets de conseil et accélérateurs
- [ ] **B2B Data Exchange** : vente de signaux agrégés anonymisés aux fonds de PE/VC
- [ ] **IPO-ready metrics** : ARR dashboard, NPS, cohort analysis, investor portal

---

## KPIs Cibles

| Métrique | J30 | J90 | J180 |
|---|---|---|---|
| MRR | 10 k€ | 50 k€ | 200 k€ |
| Entreprises actives | 100 | 500 | 2 000 |
| Facilitateurs | 300 | 1 500 | 5 000 |
| Introductions/mois | 500 | 3 000 | 15 000 |
| Taux closing ADA | 72 % | 85 % | 92 % |
| Precision ETG | 68 % | 80 % | 90 % |

---

## Risques & Mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| Réglementation vocale IA (RGPD + directive IA) | Haut | Consentement double opt-in + Bloctel + logs chiffrés |
| Fraude facilitateurs (faux contacts) | Haut | anti_circumvention_flags + dispute system + ZK-proof |
| Scaling DB (etg_links > 10M rows) | Moyen | pg_partman + read replicas + etg-aggregate cron |
| Stripe webhook failure | Haut | HMAC strict + retry queue + billing_proof_chain |
| Concurrence (Salesforce, Affinity) | Moyen | Moat = graph propriétaire + royalty automatisé + ADA |
