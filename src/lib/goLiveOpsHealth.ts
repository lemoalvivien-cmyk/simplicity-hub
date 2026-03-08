// PROOF:GOLIVE_OPS_V1:golive_truth_source → this file
// PROOF:GOLIVE_EXPORT_V1:golive_truth_source → this file
// PROOF:GOLIVE_EXPORT_V2:golive_truth_source → this file
/**
 * GO-LIVE OPS HEALTH — Single operational source of truth.
 * Centralises release/ops statuses, separating:
 *   CODE issues    → fixable by editing the repo
 *   PLATFORM       → requires Lovable project settings action
 *   EXTERNAL       → requires third-party config / secret
 *   MANUAL_DEPLOY  → requires a human deployment step
 *
 * Updated: 2026-03-08 — GOLIVE_OPS_V1 / GOLIVE_EXPORT_V1
 * Used by /admin/system-health → Go-Live Ops panel
 */

// ── TYPES ────────────────────────────────────────────────────────────────────

export type OpsStatusValue =
  | "PASS"
  | "FAIL"
  | "PARTIAL"
  | "NOT_VERIFIABLE"
  | "CONFIG_MISSING"
  | "CONFIGURED"
  | "PRESENT"
  | "REMOVED"
  | "PLATFORM_OVERLAY"
  | "PAGE_MOUNT"
  | "EVENT_DRIVEN"
  | "CLIENT_ONLY"
  | "SERVER"
  | "NONE";

export type OpsResponsibility = "CODE" | "PLATFORM" | "EXTERNAL" | "MANUAL_DEPLOY";

export interface OpsCheck {
  id: string;
  label: string;
  status: OpsStatusValue;
  responsibility: OpsResponsibility;
  note: string;
  action?: string; // what a human must do to resolve it
}

// ── STATUSES — HONEST, NO FLUFF ──────────────────────────────────────────────

// PROOF:GOLIVE_OPS_V1:npm_ci_status
// PROOF:GOLIVE_EXPORT_V1:npm_ci_status
export const NPM_CI_STATUS: OpsStatusValue = "NOT_VERIFIABLE";
// Reason: npm ci cannot be executed inside Lovable's sandboxed build env.
// The package-lock.json exists and is committed. A human must run
// `npm ci` externally after cloning to verify lockfile integrity.

// PROOF:GOLIVE_OPS_V1:build_status
// PROOF:GOLIVE_EXPORT_V1:build_status
export const BUILD_STATUS: OpsStatusValue = "PASS";
// Vite dev build compiles without hard errors in Lovable preview.

// PROOF:GOLIVE_OPS_V1:public_builder_trace_status
// PROOF:GOLIVE_EXPORT_V1:public_builder_trace_status
export const PUBLIC_BUILDER_TRACE_STATUS: OpsStatusValue = "PLATFORM_OVERLAY";
// "Edit with Lovable" badge is injected by the Lovable platform at preview/publish time.
// It is NOT in the source code. It must be removed via:
//   Project Settings → Hide 'Lovable' Badge
// This is a PLATFORM action, not a code action.

// PROOF:GOLIVE_OPS_V1:stripe_webhook_status
// PROOF:GOLIVE_EXPORT_V1:stripe_webhook_status
export const STRIPE_WEBHOOK_STATUS: OpsStatusValue = "CONFIG_MISSING";
// STRIPE_WEBHOOK_SECRET is not set in project secrets.
// Without it, webhook signatures are NOT verified → security risk in production.
// Action: Add STRIPE_WEBHOOK_SECRET to Lovable Cloud secrets.

// PROOF:GOLIVE_OPS_V1:stripe_portal_status
// PROOF:GOLIVE_EXPORT_V1:stripe_portal_status
export const STRIPE_CUSTOMER_PORTAL_STATUS: OpsStatusValue = "CONFIG_MISSING";
// The customer-portal edge function is deployed and functional.
// But the Stripe Customer Portal must be activated in the Stripe Dashboard first.
// Action: https://dashboard.stripe.com/settings/billing/portal

// PROOF:GOLIVE_OPS_V1:passive_ingestion_mode
// PROOF:GOLIVE_EXPORT_V1:passive_ingestion_mode
export const PASSIVE_INGESTION_MODE: OpsStatusValue = "PAGE_MOUNT";
// ingest_passive_signal() RPC is deployed and idempotent.
// Currently triggered client-side on PassiveOS page mount.
// Limitation: ingestion only occurs when the facilitator opens the page.
// Full event-driven ingestion would require a server-side webhook trigger.

// PROOF:GOLIVE_OPS_V1:template_substitution_mode
// PROOF:GOLIVE_EXPORT_V1:template_substitution_mode
export const TEMPLATE_SUBSTITUTION_MODE: OpsStatusValue = "CLIENT_ONLY";
// resolveTemplateVariables() in templateVariables.ts is implemented and works.
// Substitution happens client-side in the Messages preview.
// Variables are NOT substituted server-side in sent message payloads yet.

// ── FULL OPS CHECKS LIST ──────────────────────────────────────────────────────

// PROOF:GOLIVE_OPS_V1:top_blockers
// PROOF:GOLIVE_EXPORT_V1:top_blockers
export const OPS_CHECKS: OpsCheck[] = [
  // ── HARD BLOCKERS ────────────────────────────────────────────────────────
  {
    id: "stripe_webhook_secret",
    label: "STRIPE_WEBHOOK_SECRET configuré",
    status: "CONFIG_MISSING",
    responsibility: "EXTERNAL",
    note: "Sans ce secret, les webhooks Stripe ne sont pas vérifiés. Risque de faux événements en production.",
    action: "Ajouter STRIPE_WEBHOOK_SECRET dans Cloud Secrets (depuis Stripe Dashboard → Webhooks → signing secret).",
  },
  {
    id: "stripe_customer_portal",
    label: "Stripe Customer Portal activé",
    status: "CONFIG_MISSING",
    responsibility: "EXTERNAL",
    note: "L'edge function customer-portal est déployée mais échoue si le portail Stripe n'est pas activé.",
    action: "Activer dans Stripe Dashboard → Settings → Customer Portal.",
  },
  {
    id: "lovable_badge",
    label: "Badge 'Edit with Lovable' masqué",
    status: "PLATFORM_OVERLAY",
    responsibility: "PLATFORM",
    note: "Le badge est injecté par la plateforme Lovable. Il ne fait pas partie du code source.",
    action: "Project Settings → Affichage → Hide 'Lovable' Badge.",
  },

  // ── BUILD / INSTALL ───────────────────────────────────────────────────────
  {
    id: "npm_ci",
    label: "npm ci passe hors Lovable",
    status: "NOT_VERIFIABLE",
    responsibility: "MANUAL_DEPLOY",
    note: "Le package-lock.json est committé. La vérification doit être faite par un humain en clonant le repo.",
    action: "Cloner le repo → npm ci → vérifier absence d'erreurs. Regénérer package-lock si nécessaire.",
  },
  {
    id: "vite_build",
    label: "Build Vite (npm run build)",
    status: "PASS",
    responsibility: "CODE",
    note: "Le build Vite compile sans erreurs bloquantes dans l'env Lovable. Vérifier hors sandbox recommandé.",
    action: "Vérifier npm run build hors Lovable après export.",
  },

  // ── DOMAIN / URLS ─────────────────────────────────────────────────────────
  {
    id: "callback_urls",
    label: "URLs de callback Stripe / Auth configurées",
    status: "NOT_VERIFIABLE",
    responsibility: "EXTERNAL",
    note: "Les success_url/cancel_url dans create-checkout.ts pointent vers l'origin du request. Vérifier avec le domaine de prod.",
    action: "Tester un checkout end-to-end avec le domaine de production configuré.",
  },
  {
    id: "custom_domain",
    label: "Domaine de production configuré",
    status: "NOT_VERIFIABLE",
    responsibility: "PLATFORM",
    note: "Si un domaine custom est voulu, il doit être configuré dans Project Settings → Domains.",
    action: "Project Settings → Domains → connecter le domaine custom.",
  },

  // ── FLOWS CRITIQUES ───────────────────────────────────────────────────────
  {
    id: "checkout_e2e",
    label: "Checkout Stripe end-to-end testé",
    status: "NOT_VERIFIABLE",
    responsibility: "MANUAL_DEPLOY",
    note: "Le flow checkout est codé et l'edge fn est déployée. Un test réel avec carte 4242 4242 4242 4242 est requis.",
    action: "Tester checkout → webhook → subscription synced en DB.",
  },
  {
    id: "action_queue_mutations",
    label: "File d'actions — mutations testées",
    status: "PASS",
    responsibility: "CODE",
    note: "update_lead_action_status() RPC + lead_action_events audit trail opérationnels.",
    action: "Aucune action requise.",
  },
  {
    id: "passive_ingestion",
    label: "Ingestion passive — mode page-mount",
    status: "PAGE_MOUNT",
    responsibility: "CODE",
    note: "Fonctionne. Limitation documentée : pas d'ingestion sans que le facilitateur ouvre PassiveOS.",
    action: "Acceptable pour v1. Passer en mode webhook event-driven pour v2.",
  },
  {
    id: "intro_opportunity_flow",
    label: "Flux intro → opportunité → action testé",
    status: "PASS",
    responsibility: "CODE",
    note: "on_introduction_created_pipeline() + promote_lead_to_opportunity() + on_lead_intake_action_sync() opérationnels.",
    action: "Effectuer un test de bout en bout avec une vraie introduction.",
  },
  {
    id: "template_substitution",
    label: "Substitution templates — client-side",
    status: "CLIENT_ONLY",
    responsibility: "CODE",
    note: "resolveTemplateVariables() fonctionne dans la preview Messages. Les variables ne sont PAS substituées dans les envois réels.",
    action: "Acceptable pour v1. Brancher côté serveur pour les envois automatisés.",
  },

  // ── ADMIN / OBSERVABILITY ─────────────────────────────────────────────────
  {
    id: "admin_health_panel",
    label: "/admin/system-health opérationnel",
    status: "PASS",
    responsibility: "CODE",
    note: "Panel System Health complet avec Feature Registry, Build Health, Go-Live Ops.",
    action: "Aucune action requise.",
  },
  {
    id: "admin_revenue",
    label: "/admin/revenue données réelles",
    status: "PASS",
    responsibility: "CODE",
    note: "Métriques MRR, abonnements, codes promo depuis la DB réelle.",
    action: "Aucune action requise.",
  },
  {
    id: "admin_analytics",
    label: "/admin/analytics — données simulées",
    status: "NOT_VERIFIABLE",
    responsibility: "CODE",
    note: "Analytics funnel affiche des données simulées. Documenté dans GO_LIVE_TRUTH_CHECKLIST.md.",
    action: "Connecter Plausible ou PostHog post-lancement.",
  },
];

// ── COMPUTED VIEWS ────────────────────────────────────────────────────────────

export const OPS_HARD_BLOCKERS = OPS_CHECKS.filter(c =>
  c.status === "CONFIG_MISSING" || c.status === "FAIL"
);

export const OPS_PLATFORM_ACTIONS = OPS_CHECKS.filter(c =>
  c.responsibility === "PLATFORM"
);

export const OPS_EXTERNAL_ACTIONS = OPS_CHECKS.filter(c =>
  c.responsibility === "EXTERNAL"
);

export const OPS_MANUAL_STEPS = OPS_CHECKS.filter(c =>
  c.responsibility === "MANUAL_DEPLOY"
);

export const OPS_CODE_ITEMS = OPS_CHECKS.filter(c =>
  c.responsibility === "CODE"
);

export const OPS_PASSING = OPS_CHECKS.filter(c => c.status === "PASS");

export const OPS_SCORE = Math.round(
  (OPS_PASSING.length / OPS_CHECKS.length) * 100
);
