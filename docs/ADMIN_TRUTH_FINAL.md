# ADMIN TRUTH FINAL
> Version: 2026-03-07 | WIINUP MAX

## Pages admin : statut vérité

| Page | Statut avant | Statut après | Source réelle |
|------|-------------|-------------|---------------|
| `/admin` (Overview) | Réel | Réel | `profiles`, `subscriptions`, `promo_code_redemptions`, `launch_quota` |
| `/admin/users` | **MOCK** (6 users hardcodés) | **RÉEL** | `profiles` + `subscriptions` + `promo_code_redemptions` |
| `/admin/payments` | **MOCK** (4 paiements hardcodés) | **RÉEL** | `subscriptions` + `promo_code_redemptions` + `profiles` |
| `/admin/analytics` | **MOCK** (tunnel simulé) | **RÉEL + ÉTIQUETÉ** | 12 tables réelles + étiquettes `observé / non mesuré / dépend config` |
| `/admin/revenue` | Réel | Réel | `subscriptions`, `promo_code_redemptions`, `profiles` |
| `/admin/go-live` | Réel | Réel | Audit statique briques + queries DB |
| `/admin/promo-codes` | Réel | Réel | `promo_codes` |
| `/admin/help` | Réel | Réel | `help_articles` |

---

## Données observées (Admin Users)

| Champ | Source | Fiabilité |
|-------|--------|-----------|
| Email | `profiles.email` | Observé |
| Prénom | `profiles.prenom` | Observé |
| Rôle | `profiles.role` | Observé |
| Onboarding terminé | `profiles.onboarding_done` | Observé |
| Date inscription | `profiles.created_at` | Observé |
| Type d'accès | Dérivé de `subscriptions` + `promo_code_redemptions` | Calculé |
| Expiration | `subscriptions.current_period_end` ou `promo_code_redemptions.end_at` | Observé |

---

## Données observées (Admin Payments)

| Champ | Source | Fiabilité |
|-------|--------|-----------|
| Abonnements Stripe actifs | `subscriptions.status = 'active'` | Observé |
| Type offre (launch/standard) | `subscriptions.offer_type` | Observé |
| Montant ARR | Calculé depuis `offer_type` × prix config | Calculé |
| Accès promo actifs | `promo_code_redemptions.status + end_at` | Observé |
| Montant promo | 0 € assumé (accès offerts) | Connu |
| Email utilisateur | `profiles.email` via JOIN | Observé |

### Ce qui dépend de l'environnement
- **Transactions Stripe individuelles** (charge_id, invoice, etc.) : disponibles uniquement après configuration du webhook Stripe (`STRIPE_WEBHOOK_SECRET`) qui alimente `billing_events`
- **Montants exacts encaissés** : la table `billing_events` contiendra les événements réels post-webhook

---

## Données observées (Admin Analytics)

| Métrique | Source | Statut |
|---------|--------|--------|
| Inscriptions | `profiles` COUNT | Observé |
| Onboardings terminés | `profiles WHERE onboarding_done = true` | Observé |
| Missions créées | `missions` COUNT | Observé |
| Offres publiées | `offers` COUNT | Observé |
| Intros soumises | `introductions` COUNT | Observé |
| Intros validées | `introductions WHERE statut = 'validee'` | Observé |
| Gains validés | `gains WHERE statut IN ('valide','recu')` | Observé |
| Jobs exécutés | `openclaw_job_executions` COUNT | Observé |
| Channel actions | `openclaw_channel_actions` COUNT | Observé |
| Link clicks passif | `link_events` COUNT | Observé |
| Deliveries canaux | `openclaw_channel_deliveries` COUNT | Observé |
| Visiteurs landing | — | **Non mesuré** — nécessite analytics externe |
| Taux conversion landing | — | **Non mesuré** — nécessite tracker front |
| Paiements Stripe temps réel | — | **Dépend env** — nécessite `STRIPE_WEBHOOK_SECRET` |

---

## Mocks supprimés

1. `src/pages/admin/Users.tsx` — tableau de 6 utilisateurs fictifs supprimé
2. `src/pages/admin/Payments.tsx` — tableau de 4 paiements fictifs supprimé  
3. `src/pages/admin/Analytics.tsx` — funnel simulé (2840 visiteurs, etc.) supprimé

---

## Limitations restantes honnêtes

1. **RLS admin** : Les requêtes admin nécessitent que l'utilisateur connecté ait accès aux tables `profiles`, `subscriptions`, etc. Si les politiques RLS n'autorisent pas la lecture admin de ces tables, les vues afficheront "base vide" avec un message explicatif.

2. **Webhook Stripe manquant** : Les montants réels encaissés (transactions individuelles) ne seront visibles qu'après configuration du webhook Stripe qui alimente `billing_events`.

3. **Analytics de trafic** : Tout ce qui concerne les visiteurs non authentifiés (landing, CTA, checkout abandons) est hors portée d'une DB Supabase native. Nécessite Plausible, PostHog ou Google Analytics.

4. **Table `opportunities`** : Utilisée dans les compteurs Analytics — si non encore créée, la requête retourne 0 sans crash (graceful fallback).

---

## Ce qui peut être lancé maintenant

- ✅ Gestion des accès (Stripe + promo) visible et pilotable
- ✅ Suivi des comptes par rôle / onboarding / expiration
- ✅ Métriques produit réelles (missions, intros, gains, jobs)
- ✅ Revenue cockpit cohérent avec Payments

## Ce qui doit être configuré avant usage complet

- ⚙️ `STRIPE_WEBHOOK_SECRET` dans les secrets Supabase → active les transactions individuelles
- ⚙️ Outil analytics externe → active le tracking trafic landing
- ⚙️ Politique RLS admin → autoriser lecture des tables depuis le rôle admin
