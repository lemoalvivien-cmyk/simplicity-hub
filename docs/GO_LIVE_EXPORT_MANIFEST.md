# GO-LIVE EXPORT MANIFEST — WIINUP MAX
# PROOF:GOLIVE_EXPORT_V2:golive_export_manifest → this file
# PROOF:GOLIVE_FIX_V1:golive_export_manifest → this file
# PROOF:GOLIVE_FIX_V1:files_present → section 2 below
# PROOF:GOLIVE_FIX_V1:final_blockers → section 4 below
# PROOF:GOLIVE_FIX_V1:acceptance_checklist → section 6 below

**Build Stamp:** GOLIVE-EXPORT-V2-2026-03-08
**Généré le :** 2026-03-08
**Version :** GOLIVE_EXPORT_V2

---

## 1. GO-LIVE EXPORT STATUS

| Statut global | NOT_READY_FOR_PRODUCTION |
|---------------|--------------------------|
| Raison | 3 bloqueurs externes ouverts (STRIPE_WEBHOOK_SECRET, Customer Portal, badge Lovable) |
| Fichier de vérité | src/lib/goLiveOpsHealth.ts |
| Score OPS | Calculé dynamiquement dans /admin/system-health |

---

## 2. FILES PRESENT
# PROOF:GOLIVE_EXPORT_V2:files_present → this section

| Fichier | Statut |
|---------|--------|
| src/lib/goLiveOpsHealth.ts | PRESENT |
| docs/GO_LIVE_CHECKLIST.md | PRESENT |
| docs/GO_LIVE_EXPORT_MANIFEST.md | PRESENT (ce fichier) |
| src/pages/admin/SystemHealth.tsx | PRESENT — panel Go-Live Ops inclus |
| src/lib/buildHealth.ts | PRESENT |
| src/lib/featureRegistry.ts | PRESENT |
| src/lib/releaseHealth.ts | PRESENT |
| src/lib/releaseCandidateHealth.ts | PRESENT |

---

## 3. PROOF MARKERS
# PROOF:GOLIVE_EXPORT_V2:proof_markers → this section

grep -r "PROOF:GOLIVE_EXPORT_V2" src docs doit retourner au minimum :

| Slug | Fichier |
|------|---------|
| golive_truth_source | src/lib/goLiveOpsHealth.ts |
| golive_checklist | docs/GO_LIVE_CHECKLIST.md |
| golive_export_manifest | docs/GO_LIVE_EXPORT_MANIFEST.md |
| admin_golive_panel | src/pages/admin/SystemHealth.tsx |
| npm_ci_status | src/lib/goLiveOpsHealth.ts |
| build_status | src/lib/goLiveOpsHealth.ts |
| public_builder_trace_status | src/lib/goLiveOpsHealth.ts |
| stripe_webhook_status | src/lib/goLiveOpsHealth.ts |
| stripe_portal_status | src/lib/goLiveOpsHealth.ts |
| passive_ingestion_mode | src/lib/goLiveOpsHealth.ts |
| template_substitution_mode | src/lib/goLiveOpsHealth.ts |
| top_blockers | src/lib/goLiveOpsHealth.ts |
| files_present | docs/GO_LIVE_EXPORT_MANIFEST.md |
| final_blockers | docs/GO_LIVE_EXPORT_MANIFEST.md |
| acceptance_checklist | docs/GO_LIVE_EXPORT_MANIFEST.md |

---

## 4. FINAL BLOCKERS
# PROOF:GOLIVE_EXPORT_V2:final_blockers → this section

### BLOQUEURS DURS — Ne pas ignorer avant production

| ID | Label | Responsabilité | Statut |
|----|-------|----------------|--------|
| stripe_webhook_secret | STRIPE_WEBHOOK_SECRET configuré | EXTERNAL | CONFIG_MISSING |
| stripe_customer_portal | Stripe Customer Portal activé | EXTERNAL | CONFIG_MISSING |
| lovable_badge | Badge 'Edit with Lovable' masqué | PLATFORM | PLATFORM_OVERLAY |

### ITEMS NOT_VERIFIABLE — Nécessitent vérification manuelle externe

| ID | Label | Responsabilité |
|----|-------|----------------|
| npm_ci | npm ci passe hors Lovable | MANUAL_DEPLOY |
| callback_urls | URLs de callback Stripe / Auth configurées | EXTERNAL |
| custom_domain | Domaine de production configuré | PLATFORM |
| checkout_e2e | Checkout Stripe end-to-end testé | MANUAL_DEPLOY |

---

## 5. CODE / PLATFORM / EXTERNAL SPLIT

### CODE — Fixable par modification du repo

- Build Vite : PASS (compilé sans erreurs bloquantes)
- Action queue mutations : PASS (update_lead_action_status() + audit trail)
- Flux intro → opportunité → action : PASS (triggers DB opérationnels)
- Ingestion passive : PAGE_MOUNT (limitation documentée, acceptable v1)
- Substitution templates : CLIENT_ONLY (limitation documentée, acceptable v1)
- Panel /admin/system-health : PASS

### PLATFORM — Action dans Lovable Project Settings

- Badge "Edit with Lovable" : PLATFORM_OVERLAY
  → Action : Project Settings → Affichage → Hide 'Lovable' Badge
- Domaine de production : NOT_VERIFIABLE
  → Action : Project Settings → Domains → connecter domaine custom

### EXTERNAL — Configuration service tiers

- STRIPE_WEBHOOK_SECRET : CONFIG_MISSING
  → Action : Stripe Dashboard → Webhooks → signing secret → Lovable Cloud Secrets
- Stripe Customer Portal : CONFIG_MISSING
  → Action : https://dashboard.stripe.com/settings/billing/portal
- Callback URLs production : NOT_VERIFIABLE
  → Action : Tester checkout end-to-end avec domaine de prod
- Email custom auth : NOT_VERIFIABLE
  → Action : Lovable Cloud → Auth → Email templates

### MANUAL_DEPLOY — Vérification humaine externe

- npm ci hors Lovable : NOT_VERIFIABLE
  → Action : git clone <repo> && npm ci && vérifier 0 erreur
- npm run build hors Lovable : NOT_VERIFIABLE
  → Action : vérifier 0 erreur bloquante post-export

---

## 6. ACCEPTANCE CHECKLIST
# PROOF:GOLIVE_EXPORT_V2:acceptance_checklist → this section

### BLOC A — Avant publication (obligatoire)

- [ ] [PLATFORM] Masquer badge "Edit with Lovable" dans Project Settings
- [ ] [EXTERNAL] Configurer STRIPE_WEBHOOK_SECRET dans Cloud Secrets
- [ ] [EXTERNAL] Activer Stripe Customer Portal
- [ ] [EXTERNAL] Tester checkout end-to-end avec carte 4242 4242 4242 4242
- [ ] [EXTERNAL] Vérifier webhook checkout.session.completed reçu dans Stripe Dashboard

### BLOC B — Vérifications code (une seule fois)

- [ ] [CODE] Cloner repo → npm ci → 0 erreur
- [ ] [CODE] npm run build → 0 erreur bloquante
- [ ] [CODE] Tester flux intro → opportunité → action
- [ ] [CODE] Tester file d'actions (LeadActionsQueue) → audit trail en DB
- [ ] [CODE] Tester ingestion passive (PassiveOS page mount → lead_source_events)
- [ ] [CODE] Tester échange code promo → used_by + used_at en DB
- [ ] [CODE] Vérifier /admin/system-health → marqueurs PROOF visibles

### BLOC C — Post-lancement

- [ ] Connecter outil analytics réel (Plausible/PostHog) → /admin/analytics
- [ ] Connecter Admin Users à `profiles` DB après premiers utilisateurs réels
- [ ] Connecter Admin Payments à `subscriptions` après premiers paiements réels

---

*Manifest généré le 2026-03-08 — Source de vérité : src/lib/goLiveOpsHealth.ts*
*PROOF GATE : grep -r "PROOF:GOLIVE_EXPORT_V2" src docs → minimum 15 slugs attendus*
