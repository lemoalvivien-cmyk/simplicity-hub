# WIINUP MAX — Roadmap Produit

> **Vision** : Devenir l'OS de croissance commerciale B2B en Europe — chaque deal tracé, chaque réseau monétisé, chaque fermeture assistée par IA.

---

## 🔒 Phase 1 — 100% TERMINÉE — Monopole inarrêtable verrouillé

**Statut : PRODUCTION READY — Cash machine live**

### Moteur IA ✅
- [x] **ADA 95%** — State machine complète : Scan ETG → Script Gemini → Consentement RGPD/Bloctel → Voice ElevenLabs → Négociation → Contract Stripe → Human 1-clic → Closed-loop IA
- [x] **Eternal Trust Graph v2** — pgvector + HNSW + `shortest_path_trust` (5 degrés <50ms) + hidden links + vector similarity search
- [x] **OpenClaw** — Pipeline leads autonome (scheduler, job executor, channel dispatch, generator, graph engine)
- [x] **Silent Royalty 7%** — Webhook Stripe HMAC + split auto (93% facilitateur / 7% platform) + payout Stripe Connect
- [x] **AI Lead Scoring** — Modèle ML in-edge, 0–100, temps réel
- [x] **Fine-tuning LoRA** — Pipeline ADA closed-loop, Together AI, re-train auto tous les 50 closings

### Infrastructure ✅
- [x] Auth multi-rôle (facilitateur / entreprise / admin) — RLS strict, zero privilege escalation
- [x] Stripe Checkout 99€/an + webhooks HMAC idempotents
- [x] Rate limiting 100 req/min/user — `check_rate_limit` SECURITY DEFINER
- [x] Email transactionnel — pgmq queue + process-email-queue + Resend
- [x] CI/CD : TypeScript strict + ESLint + Vitest + build + npm audit
- [x] PWA installable (VitePWA)
- [x] Conformité totale : RGPD art 6.1.a, EU AI Act art 52, Bloctel, consentement vocal log

### Monétisation — CASH MACHINE LIVE ✅
- [x] Abonnement Entreprise : **99€/an** — offre de lancement exclusive (100 slots, premier arrivé premier servi)
- [x] Facilitateurs : gratuit à vie
- [x] Codes promo VIP (admin panel)
- [x] **Eternal Insights API Starter** : 15 000€/mois — `prod_U8rcPj1zosK0Il` ✅ Stripe LIVE
- [x] **Eternal Insights API Growth** : 35 000€/mois — `prod_U8pBP1dIGQGAQt` ✅ Stripe LIVE
- [x] **Eternal Insights API Enterprise** : 75 000€/mois — `prod_U8rc4bW6nlPiOm` ✅ Stripe LIVE

### Sécurité verrouillée ✅
- [x] `.env` purgé du repo (FIX-SECURITY-FINAL.bat)
- [x] RLS strict sur 100% des tables (etg_*, ada_*, profiles, subscriptions)
- [x] CORS hardened — allowlist wiinupmax.com uniquement en prod
- [x] Secrets via Lovable Cloud — jamais dans le code

---

## 🧪 Tests de validation (ADA Flow + Royalty)

### Test ADA Flow complet
```bash
# 1. Démarrer une session ADA
curl -X POST https://usnriklfiagazpffsqew.supabase.co/functions/v1/ada-orchestrator \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"action":"start","target_name":"Jean Dupont","target_email":"jean@test.com"}'
# Attendu: { state: "awaiting_consent", script_ready: true }

# 2. Générer annonce vocale RGPD/Bloctel
curl -X POST ... \
  -d '{"action":"voice_consent","session_id":"<id>","target_name":"Jean Dupont"}'
# Attendu: { audio_base64: "...", consent_text: "...", bloctel_check: {...} }

# 3. Enregistrer consentement
curl -X POST ... -d '{"action":"consent","session_id":"<id>","consent_given":true}'
# Attendu: { state: "calling" }

# 4. Négociation
curl -X POST ... -d '{"action":"negotiate","session_id":"<id>","prospect_message":"Intéressant, quel est le prix ?"}'
# Attendu: { agent_response: "...", key_moment_type: "buying_signal", requires_human: true }

# 5. Validation humaine + contrat Stripe
curl -X POST ... -d '{"action":"validate","session_id":"<id>","amount":5000}'
# Attendu: { payment_link: "https://...", commission_7pct: 350 }

# 6. Close
curl -X POST ... -d '{"action":"close","session_id":"<id>","outcome":"deal_closed"}'
# Attendu: { state: "closed" } → Royalty 7% auto via Stripe webhook
```

### Test Royalty Silent Engine
```bash
# Simuler un webhook Stripe (deal closé)
curl -X POST https://usnriklfiagazpffsqew.supabase.co/functions/v1/stripe-webhook \
  -H "Stripe-Signature: <sig>" \
  -d '{"type":"payment_intent.succeeded","data":{"object":{"metadata":{"ada_session_id":"<id>","commission_7pct":"350"}}}}'
# Attendu: ada_sessions.state = "closed", commission_7pct = 350, gain créé
```

---

## Phase 2 — 60 jours : Full Autonomous Closing + ZK

**Horizon : J30 → J90**

### ADA v2
- [ ] Pipeline 100% autonome (mode God — zero human touch)
- [ ] Multi-canal : LinkedIn + email séquences + appel ADA
- [ ] LoRA v2 : 500+ closes réels, précision > 95%
- [ ] Deal Radar : signaux d'achat préemptifs

### Zero-Knowledge Proof
- [ ] ZK-proof d'introduction (zk-SNARKs via snarkjs)
- [ ] Graph privacy layer : hidden links + ZK commitments
- [ ] Audit trail immuable on-chain

### Polygon / Web3 Royalty
- [ ] Smart contract royalty USDC Polygon PoS
- [ ] NFT d'accréditation soul-bound facilitateur
- [ ] DAO governance (Q3 2026)

### Scale
- [ ] Eternal Insights API v2 : webhooks + GraphQL + SDK Python/Node
- [ ] Salesforce / HubSpot / Pipedrive natif
- [ ] Multilingue EN/ES/DE
- [ ] SLA 99.9% multi-région

---

## Phase 3 — 6 mois : Marketplace Européenne

**Horizon : J90 → J180**

- [ ] Marketplace facilitateurs publique + appel d'offres
- [ ] Franchise réseau (modules blancs)
- [ ] B2B Data Exchange (signaux PE/VC)
- [ ] IPO-ready metrics : ARR dashboard, NPS, investor portal

---

## KPIs Cibles

| Métrique             | J30    | J90     | J180    |
|----------------------|--------|---------|---------|
| MRR                  | 10 k€  | 50 k€   | 200 k€  |
| Entreprises actives  | 100    | 500     | 2 000   |
| Facilitateurs        | 300    | 1 500   | 5 000   |
| Introductions/mois   | 500    | 3 000   | 15 000  |
| Taux closing ADA     | 72%    | 85%     | 92%     |
| Precision ETG        | 68%    | 80%     | 90%     |
| Insights API MRR     | 15 k€  | 150 k€  | 750 k€  |

---

## Risques & Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Réglementation vocale IA (RGPD + EU AI Act) | Haut | Double opt-in + Bloctel + logs chiffrés SHA-256 |
| Fraude facilitateurs | Haut | anti_circumvention_flags + dispute + ZK-proof |
| Scaling DB >10M rows | Moyen | pg_partman + read replicas + etg-aggregate cron |
| Stripe webhook failure | Haut | HMAC strict + retry queue + billing_proof_chain |
| Concurrence (Salesforce, Affinity) | Moyen | Moat = graph propriétaire + royalty auto + ADA |
