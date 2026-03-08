# GO-LIVE CHECKLIST — WIINUP MAX
# PROOF:GOLIVE_OPS_V1:golive_checklist → this file

**Build Stamp:** GOLIVE-OPS-2026-03-08-V1  
**Généré le :** 2026-03-08  
**Mis à jour le :** 2026-03-08  

---

## COMMENT LIRE CE DOCUMENT

Chaque item appartient à **une seule colonne** :

| Colonne | Signifie | Qui agit |
|---------|---------|---------|
| **CODE** | Fixable par modification du repo | Développeur |
| **PLATFORM** | Action dans les paramètres Lovable | Vous, dans Project Settings |
| **EXTERNAL** | Configuration d'un service tiers | Vous, dans dashboard Stripe / email |

**Règle :** Ne pas mélanger. Ne pas marquer DONE sans avoir vérifié.

---

## BLOC 1 — AVANT PUBLICATION (obligatoire)

### 1.1 PLATFORM — Lovable Settings

- [ ] **[PLATFORM]** Masquer le badge "Edit with Lovable"  
  → `Project Settings → Affichage → Hide 'Lovable' Badge`  
  → Sans ça, le badge s'affiche sur la landing publique.

- [ ] **[PLATFORM]** Configurer le domaine de production (si custom domain voulu)  
  → `Project Settings → Domains → Connecter domaine custom`

- [ ] **[PLATFORM]** Vérifier que la publication (Publish) est à jour  
  → Cliquer "Update" après tout changement frontend.

### 1.2 EXTERNAL — Stripe

- [ ] **[EXTERNAL]** Configurer `STRIPE_WEBHOOK_SECRET` dans les secrets Cloud  
  → Stripe Dashboard → Webhooks → Sélectionner l'endpoint → Signing secret  
  → Ajouter dans Lovable Cloud → Secrets → Nouvelle variable `STRIPE_WEBHOOK_SECRET`

- [ ] **[EXTERNAL]** Activer le Customer Portal Stripe  
  → https://dashboard.stripe.com/settings/billing/portal  
  → Activer et configurer les options autorisées (annulation, changement de plan, etc.)

- [ ] **[EXTERNAL]** Tester un checkout end-to-end avec carte de test  
  → Carte : `4242 4242 4242 4242` — exp: 12/34 — CVC: 123  
  → Vérifier : `billing_events` en DB + `subscriptions.status = 'active'`

- [ ] **[EXTERNAL]** Vérifier que le webhook Stripe reçoit `checkout.session.completed`  
  → Stripe Dashboard → Webhooks → Logs d'événements

- [ ] **[EXTERNAL]** Configurer les URLs de callback en production  
  → success_url et cancel_url dans `create-checkout/index.ts` utilisent l'`origin` de la requête.  
  → Tester que ces URLs fonctionnent avec le domaine de prod.

### 1.3 EXTERNAL — Email / Auth

- [ ] **[EXTERNAL]** Configurer un domaine email custom pour les emails d'auth  
  → Lovable Cloud → Auth → Email templates  
  → Évite les emails "noreply@supabase.io" en production.

---

## BLOC 2 — VÉRIFICATIONS CODE (à faire une seule fois)

- [ ] **[CODE]** Cloner le repo et exécuter `npm ci` hors Lovable  
  → `git clone <repo> && npm ci`  
  → Si erreur : regénérer le lockfile avec `npm install` et committer `package-lock.json`

- [ ] **[CODE]** Exécuter `npm run build` hors Lovable  
  → Vérifier : 0 erreur bloquante, warnings acceptables

- [ ] **[CODE]** Vérifier toutes les routes protégées via `ProtectedRoute`  
  → `/dashboard`, `/missions`, `/contacts`, `/actions`, etc.  
  → Tenter l'accès sans session → doit rediriger vers `/login`

- [ ] **[CODE]** Tester le flux intro → opportunité → action  
  → Créer une introduction → valider → vérifier qu'une opportunité est créée automatiquement  
  → Vérifier que `lead_action_events` contient un événement d'audit

- [ ] **[CODE]** Tester la file d'actions (LeadActionsQueue)  
  → Créer une action → la passer à "done" → vérifier l'audit trail en DB

- [ ] **[CODE]** Tester l'ingestion passive (PassiveOS)  
  → Ouvrir la page PassiveOS → vérifier que `ingest_passive_signal()` RPC est appelé  
  → Vérifier dans `lead_source_events` que l'événement est tracé

- [ ] **[CODE]** Tester l'échange de code promo  
  → Edge function `redeem-promo` → utiliser un code réel en DB  
  → Vérifier : `used_by` et `used_at` mis à jour en DB

- [ ] **[CODE]** Vérifier le panel admin `/admin/system-health`  
  → Doit se charger sans erreur  
  → Les marqueurs PROOF doivent être visibles dans les sections

---

## BLOC 3 — SURVEILLANCE — 7 PREMIERS JOURS

| Signal | Objectif | Où vérifier |
|--------|---------|------------|
| Signup → Onboarding complet | > 70% | `profiles.onboarding_done` en DB |
| Onboarding → 1re mission | > 50% | `missions` en DB |
| Quota lancement (`launch_quota`) | Alerte si > 80/100 | `/admin/revenue` |
| Premiers checkouts Stripe | Webhook reçu et traité | Logs Stripe + `billing_events` |
| Jobs OpenClaw scheduler | > 0 exécutés en 24h | `openclaw_job_queue` en DB |
| Erreurs edge functions | 0 critique | Logs Lovable Cloud |
| Clics liens passifs | Mesurer conversion | `link_events` en DB |

---

## BLOC 4 — LIMITATIONS CONNUES ET DOCUMENTÉES

Ces points sont **connus, acceptés et documentés**. Ils ne bloquent pas le lancement v1.

| Brique | Limitation | Priorité post-lancement |
|--------|-----------|------------------------|
| Analytics funnel | `/admin/analytics` = données simulées | v1.1 — connecter Plausible/PostHog |
| Template substitution | Client-side seulement, pas dans les envois | v1.1 |
| Passive ingestion | Déclenché au mount page, pas en temps réel | v1.1 |
| Admin Users/Payments | Données mock, à connecter post-vrais-users | v1.1 |
| WhatsApp/LinkedIn envoi | Préparation = prête, envoi réel = gateway externe | v2 |
| Scheduler cron | Non observable en env sandbox | Sera visible dès 1er user réel |
| TypeScript strict | `strict=false` dans tsconfig — ~50 erreurs latentes | v1.1 |

---

## BLOC 5 — QUI FAIT QUOI

```
AVANT PUBLICATION (obligatoire) :
  → [VOUS]  Masquer badge Lovable dans Project Settings
  → [VOUS]  Ajouter STRIPE_WEBHOOK_SECRET dans Cloud Secrets
  → [VOUS]  Activer Customer Portal dans Stripe Dashboard
  → [VOUS]  Tester checkout end-to-end avec carte test

APRÈS PUBLICATION (validation) :
  → [DEV]   npm ci + npm run build hors sandbox
  → [VOUS]  Tester flux intro → opportunité → action
  → [VOUS]  Tester redemption code promo
  → [VOUS]  Vérifier panel /admin/system-health
```

---

*Checklist générée manuellement — Source de vérité : `src/lib/goLiveOpsHealth.ts`*  
*Dernière mise à jour : 2026-03-08*
