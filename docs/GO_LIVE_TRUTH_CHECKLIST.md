# GO-LIVE TRUTH CHECKLIST — WIINUP MAX
**Build ID:** WIINUP-MAX-20260307-001  
**Généré le :** 2026-03-07  
**Source de vérité :** Repo + DB + Supabase

---

## 1. CE QUI EST RÉELLEMENT PRÊT

### Auth & Comptes
- [x] Auth email/password — Supabase Auth + ProtectedRoute + RLS
- [x] Rôles (entreprise / facilitateur / admin) — `profiles.role`, vérifié côté serveur
- [x] Onboarding obligatoire — redirect auto si `onboarding_done = false`
- [x] Logout réel — `signOut()` Supabase avant redirect `/login`

### Billing
- [x] Checkout Stripe offre lancement 99 € (`price_1T8GOWEG497aCUFxjNjFjk4t`)
- [x] Checkout Stripe offre standard 490 € (`price_1T8GR0EG497aCUFxNS9BV3ko`)
- [x] Edge fn `stripe-webhook` déployée — dédup par `stripe_event_id`
- [x] Edge fn `check-subscription` déployée — consultée au login + toutes les 5 min
- [x] Edge fn `customer-portal` déployée
- [x] Quota lancement — `launch_quota` en DB, lu en temps réel sur la landing

### Codes Promo
- [x] Edge fn `redeem-promo` déployée
- [x] 304 codes créés en base de données
- [x] Durée 12 mois par design
- [x] Traçabilité `used_by`, `used_at` en DB

### Flows Métier
- [x] Mission → Introduction → Validation → Gain — flux SQL complet
- [x] Triggers automatiques trust engine (score refresh sur validations/gains)
- [x] Graph engine — edges + best_path + auto-feed on intro validée / gain confirmé
- [x] Passive OS — shared_offers + offer_share_links + link_events + click tracking
- [x] Trust engine — scores, litiges, anti-circumvention flags

### OpenClaw Engine
- [x] Job queue avec verrouillage atomique (`claim_next_job`)
- [x] Scheduler edge fn + pg_cron (heartbeat 5 min, daily 07h00, weekly Lun 06h00)
- [x] Event bus — triggers DB sur missions, offers, introductions, gains, disputes
- [x] Channel dispatch — email + introduction opérationnels
- [x] Kill switch global
- [x] Smoke test edge fn

### Admin
- [x] `/admin/revenue` — métriques réelles depuis la DB
- [x] `/admin/go-live` — readiness panel honnête
- [x] `/admin/promo-codes` — CRUD codes promo
- [x] `/admin/analytics` — données simulées (documenté)
- [x] `/admin/users` — UI présente (données mock)
- [x] `/admin/payments` — UI présente (données mock)

### PWA
- [x] Installable — vite-plugin-pwa + manifest
- [x] `/install` — page d'installation
- [x] Service worker configuré

---

## 2. CE QUI EST PARTIELLEMENT PRÊT

| Brique | Limitation | Action recommandée |
|--------|-----------|-------------------|
| Admin Users | Données mock | Connecter à `profiles` DB après premiers vrais users |
| Admin Payments | Données mock | Connecter à `subscriptions` + Stripe API après premiers paiements |
| Admin Overview | Stats hardcodées | Utiliser `/admin/revenue` pour les vraies métriques |
| Mobile UX | Nav OK, vues denses non optimisées | Passe UX mobile post-lancement |
| Responsive WarRoom/Operations | Lisible mais non tactile-optimisé | Post-lancement v1.1 |

---

## 3. CE QUI DÉPEND DE L'ENVIRONNEMENT

| Brique | Dépendance | Statut |
|--------|-----------|--------|
| Stripe Webhook signature | `STRIPE_WEBHOOK_SECRET` secret | Non configuré → pas de vérification signature |
| Customer Portal Stripe | Activation dans Stripe Dashboard | À activer avant go-live |
| ElevenLabs Voice | `ELEVENLABS_API_KEY` configurée | Secret configuré — dépend connexion ElevenLabs |
| Gateway OpenClaw externe | Instance auto-hébergée user + `gateway_url` + `gateway_secret` | Env-dep par design |
| Scheduler cron | pg_cron + pg_net actifs | Configuré, non observé (DB vide) |
| WhatsApp / LinkedIn envoi | API externe ou gateway | Préparation message = prêt, envoi = env-dep |

---

## 4. À FAIRE ABSOLUMENT AVANT OUVERTURE PUBLIQUE

- [ ] Configurer `STRIPE_WEBHOOK_SECRET` dans les secrets Supabase
- [ ] Activer le Customer Portal dans Stripe Dashboard
- [ ] Tester un vrai checkout end-to-end avec carte de test Stripe (`4242 4242 4242 4242`)
- [ ] Tester `redeem-promo` avec un code réel en DB
- [ ] Vérifier que le webhook Stripe reçoit et traite `checkout.session.completed`
- [ ] Configurer le domaine email custom (templates auth)
- [ ] Connecter un outil analytics réel (Plausible, PostHog, ou équivalent)

---

## 5. CE QUI PEUT ÊTRE LANCÉ MAINTENANT

- Landing page publique `/`
- Pricing `/pricing`
- Checkout Stripe (lancement 99 €)
- Signup / Login / Onboarding
- Dashboard Entreprise + Facilitateur
- Codes promo (redeem)
- Toutes les routes protégées (onboarding requis)
- Passive OS (dépend data utilisateur)
- OpenClaw (dépend gateway si auto)

---

## 6. SURVEILLANCE — 7 PREMIERS JOURS

| Signal | Objectif | Où vérifier |
|--------|---------|------------|
| Signup → Onboarding | > 70% | DB `profiles.onboarding_done` |
| Onboarding → Mission / Import | > 50% | DB `missions`, `contacts` |
| Conversion payant / promo | Suivre | `/admin/revenue` |
| Quota lancement | Alerte si > 80 slots | `launch_quota.used_slots` |
| Premiers checkouts Stripe | Vérifier webhook | Logs `billing_events` |
| Jobs scheduler exécutés | > 0 dans 24h | `openclaw_job_queue` |
| Premiers clics liens passifs | Mesurer | `link_events` |
| Erreurs edge functions | 0 critique | Logs Supabase |

---

## 7. LIMITATIONS HONNÊTES RESTANTES

1. **Analytics funnel** — `/admin/analytics` affiche des données simulées. Tracking réel = post-lancement.
2. **Admin Users/Payments** — données mock. À connecter post-premiers-users.
3. **NetworkValueMap** — précision dépend de la qualité des CSV importés.
4. **Mobile UX dense** — WarRoom, Operations, DashboardEntreprise = utilisables mais non optimisés tactile.
5. **Revenu estimé** — calculé côté back-office (actifs × tarif). Source de vérité = Stripe Dashboard.
6. **Scheduler** — non encore observé (DB vide au lancement). Activé dès 1er utilisateur réel.
7. **WhatsApp/LinkedIn** — envoi réel nécessite gateway ou API externe. Aujourd'hui = préparation + export humain.

---

*Checklist générée automatiquement. Dernière mise à jour : 2026-03-07.*
