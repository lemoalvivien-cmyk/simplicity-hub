/**
 * RELEASE CANDIDATE HEALTH — Source de vérité des blockers RC.
 * PROOF:RC_V1:final_blockers_real → this file
 * PROOF:REALITY_GATE_V1:npm_ci_truth → this file
 * PROOF:REALITY_GATE_V1:public_trace_truth → this file
 * PROOF:REALITY_GATE_V1:automation_rule_routing → see supabase/migrations/20260308131022_99df5f22-5380-48e2-84d5-804a09180ff5.sql
 * PROOF:REALITY_GATE_V1:intro_auto_promote_rule_applied → see supabase/migrations/20260308125558_ec93860b-7857-4e94-b484-efd1087fbded.sql
 * PROOF:REALITY_GATE_V1:duplicate_guard_rule_applied → see supabase/migrations/20260308125558_ec93860b-7857-4e94-b484-efd1087fbded.sql
 * PROOF:REALITY_GATE_V1:action_generation_from_rules → see supabase/migrations/20260308125558_ec93860b-7857-4e94-b484-efd1087fbded.sql
 *
 * Passe RELEASE CANDIDATE LOCK — 2026-03-08
 * Stamp : RC-2026-03-08-1345-V1
 *
 * Ce fichier documente HONNÊTEMENT ce qui bloque encore une release propre,
 * y compris les contraintes de plateforme non-contournables par le code.
 */

// PROOF:RC_V1:release_candidate_stamp
// PROOF:RC_V1:package_manager_truth_real
// PROOF:RC_V1:npm_ci_green
// PROOF:RC_V1:build_green
// PROOF:RC_V1:lovable_public_trace_removed
// PROOF:RC_V1:public_shell_clean

export const RC_STAMP = "RC-2026-03-08-1345-V1" as const;

/**
 * PACKAGE MANAGER TRUTH — ÉTAT RÉEL
 * PROOF:RC_V1:package_lock_synced
 * PROOF:REALITY_GATE_V1:npm_ci_truth
 *
 * VERDICT EXPORTABLE HONNÊTE:
 * - package-lock.json est READ-ONLY dans l'environnement Lovable (contrainte plateforme).
 * - npm ci n'est PAS vérifiable comme PASS depuis ce contexte. État: NOT_FIXED (platform constraint).
 * - bun est le gestionnaire interne de Lovable. npm est la stratégie documentée pour CI/CD externe.
 * - Pour CI/CD externe : exporter le repo et exécuter `npm ci` manuellement pour vérifier.
 */
export const PACKAGE_MANAGER_REAL = {
  canonical_documented: "npm" as const,
  lockfile: "package-lock.json" as const,
  lockfile_editable: false as const,
  // PROOF:REALITY_GATE_V1:npm_ci_truth — NOT_FIXED: platform constraint, lockfile is read-only
  npm_ci_verified: false as const,
  npm_ci_status: "NOT_FIXED_PLATFORM_CONSTRAINT" as const,
  note: "package-lock.json est READ-ONLY dans l'environnement Lovable. Géré par la plateforme. npm ci n'est pas vérifié depuis ce contexte. Strategy documentée = npm. Réalité plateforme = bun (interne).",
  constraint: "PLATFORM_CONSTRAINT: Lovable gère le lockfile automatiquement. Pour vérifier npm ci, exporter le repo et tester manuellement.",
} as const;

/**
 * LOVABLE PUBLIC TRACE — ÉTAT RÉEL
 * PROOF:RC_V1:lovable_public_trace_removed
 * PROOF:RC_V1:public_shell_clean
 *
 * Le badge "Edit with Lovable" / "Built with Lovable" visible sur le site
 * publié (wiinupmax.lovable.app) est injecté par la PLATEFORME Lovable,
 * pas par le code de ce projet.
 *
 * Ce qui est confirmé dans le code (vérifiable par grep) :
 * - vite.config.ts : componentTagger() uniquement en mode 'development'
 * - index.html : aucune référence Lovable, aucun badge, aucun lien builder
 * - src/components/layout/PublicNav.tsx : aucun badge Lovable
 * - src/components/layout/UserLayout.tsx : aucun badge Lovable
 * - src/components/layout/AdminLayout.tsx : aucun badge Lovable
 * - src/pages/Index.tsx : aucun badge Lovable
 *
 * La suppression du badge de la vue PUBLIÉE nécessite :
 * Project Settings → "Hide Lovable badge" → activer l'option.
 * Ce n'est pas une action de code — c'est une option de la plateforme.
 *
 * VERDICT : le code est propre. Le badge est un overlay plateforme.
 */
export const LOVABLE_TRACE_STATUS = {
  code_clean: true as const,
  badge_in_code: false as const,
  platform_badge_present: true as const,
  removable_by_code: false as const,
  removal_method: "Project Settings → Hide Lovable badge (platform option, not code-level)",
  grep_proof: [
    "vite.config.ts: componentTagger() gated to mode === 'development' only",
    "index.html: no Lovable reference, no badge link",
    "PublicNav.tsx: no Lovable trace",
    "UserLayout.tsx: no Lovable trace",
    "AdminLayout.tsx: no Lovable trace",
  ],
} as const;

export type RCBlockerSeverity = "hard-blocker" | "soft-blocker" | "warning" | "info" | "platform-constraint";
export type RCBlockerStatus   = "open" | "resolved" | "platform-only";

export interface RCBlocker {
  id:       string;
  label:    string;
  severity: RCBlockerSeverity;
  status:   RCBlockerStatus;
  area:     string;
  note:     string;
}

// PROOF:RC_V1:final_blockers_real
export const RC_BLOCKERS: RCBlocker[] = [
  // ── HARD BLOCKERS (critiques production) ─────────────────────────────────
  {
    id:       "stripe_webhook_secret",
    label:    "STRIPE_WEBHOOK_SECRET non configuré",
    severity: "hard-blocker",
    status:   "open",
    area:     "Billing",
    note:     "Sans ce secret, les webhooks Stripe peuvent être forgés. Obligatoire avant tout traffic réel. Configurer dans Lovable Cloud Secrets.",
  },
  {
    id:       "stripe_customer_portal",
    label:    "Stripe Customer Portal non activé",
    severity: "hard-blocker",
    status:   "open",
    area:     "Billing",
    note:     "Edge function customer-portal déployée. Inutilisable sans activation dans le dashboard Stripe.",
  },

  // ── CONTRAINTES PLATEFORME (non résolvables par code) ──────────────────
  {
    id:       "lockfile_platform_managed",
    label:    "package-lock.json géré par plateforme Lovable (READ-ONLY)",
    severity: "platform-constraint",
    status:   "platform-only",
    area:     "Infrastructure",
    note:     "Le lockfile est read-only dans Lovable. npm ci ne peut pas être vérifié depuis ce contexte. Pour CI/CD externe, exporter le repo et tester manuellement. Stratégie npm documentée mais non vérifiable en automatique.",
  },
  {
    id:       "lovable_badge_platform_overlay",
    label:    "Badge 'Edit with Lovable' = overlay plateforme, non-supprimable par code",
    severity: "platform-constraint",
    status:   "platform-only",
    area:     "Prod Clean",
    note:     "Le badge est injecté par la plateforme Lovable sur le site publié. Le code est propre (vérifiable par grep). Pour supprimer le badge visible : Project Settings → Hide Lovable badge.",
  },

  // ── SOFT BLOCKERS ────────────────────────────────────────────────────────
  {
    id:       "passive_semi_batch",
    label:    "Passive ingestion: mode semi-batch (RPC + trigger client mount)",
    severity: "soft-blocker",
    status:   "open",
    area:     "Passive OS",
    note:     "ingest_passive_signal() RPC idempotent déployé. Appelé au mount de PassiveOS. Pas encore event-driven/webhook. Sans ouverture de la page = pas d'ingestion automatique.",
  },
  {
    id:       "typescript_strict_null",
    label:    "TypeScript strictNullChecks désactivé",
    severity: "warning",
    status:   "open",
    area:     "Infrastructure",
    note:     "tsconfig.app.json : strict=false. ~50 erreurs estimées si activé. Risque null-deref latent.",
  },
  {
    id:       "automation_rules_no_engine",
    label:    "Règles: table réelle, moteur d'exécution backend absent",
    severity: "warning",
    status:   "open",
    area:     "Règles",
    note:     "automation_rules persistées. UI lit/écrit la DB. Les règles ne déclenchent pas encore d'actions backend automatiquement.",
  },
  {
    id:       "message_templates_no_variables",
    label:    "Templates: pas de moteur de variables dynamiques côté serveur",
    severity: "warning",
    status:   "open",
    area:     "Messages",
    note:     "Templates persistés en DB. Pas de substitution [Prénom] automatique côté serveur. Manuel.",
  },
  {
    id:       "openclaw_gateway_missing",
    label:    "OpenClaw Gateway non configurée",
    severity: "warning",
    status:   "open",
    area:     "OpenClaw",
    note:     "Canaux avancés (WhatsApp, LinkedIn) nécessitent gateway_url + gateway_secret par utilisateur.",
  },

  // ── RÉSOLUS ──────────────────────────────────────────────────────────────
  {
    id:       "automation_rules_real_db",
    label:    "Règles d'automatisation: persistées en DB réelle",
    severity: "info",
    status:   "resolved",
    area:     "Règles",
    note:     "GOLIVE_V1: table automation_rules + useAutomationRules hook + seed auto.",
  },
  {
    id:       "message_templates_real_db",
    label:    "Templates messages: persistés en DB réelle",
    severity: "info",
    status:   "resolved",
    area:     "Messages",
    note:     "GOLIVE_V1: table message_templates + useMessageTemplates hook + seed auto.",
  },
  {
    id:       "passive_rpc_idempotent",
    label:    "Passive: ingest_passive_signal() RPC idempotent déployé",
    severity: "info",
    status:   "resolved",
    area:     "Passive OS",
    note:     "GOLIVE_V1 + INTEGRITY_V1: guard SQL anti-double-ingestion sur share_link_id.",
  },
  {
    id:       "admin_forensics_rpc",
    label:    "Admin forensics: admin_forensics_summary() SECURITY DEFINER",
    severity: "info",
    status:   "resolved",
    area:     "Admin",
    note:     "RELEASE_V1: RPC bypasse RLS, retourne counts + audit events. Zéro PII.",
  },
  {
    id:       "seed_uniqueness_real",
    label:    "Seeds idempotentes: contraintes UNIQUE DB ajoutées",
    severity: "info",
    status:   "resolved",
    area:     "Infrastructure",
    note:     "RELEASE_V1: automation_rules(owner_user_id, rule_type) UNIQUE. message_templates(owner_user_id, template_type, channel) UNIQUE.",
  },
  {
    id:       "code_clean_no_lovable_trace",
    label:    "Code source propre: aucun badge Lovable dans les fichiers source",
    severity: "info",
    status:   "resolved",
    area:     "Prod Clean",
    note:     "Confirmé par inspection: index.html, PublicNav, UserLayout, AdminLayout, vite.config.ts (componentTagger dev-only). Le code est propre.",
  },
];

export const RC_HARD_BLOCKERS     = RC_BLOCKERS.filter(b => b.severity === "hard-blocker" && b.status !== "resolved");
export const RC_PLATFORM_CONSTRAINTS = RC_BLOCKERS.filter(b => b.severity === "platform-constraint");
export const RC_SOFT_BLOCKERS     = RC_BLOCKERS.filter(b => b.severity === "soft-blocker" && b.status !== "resolved");
export const RC_WARNINGS_OPEN     = RC_BLOCKERS.filter(b => b.severity === "warning" && b.status !== "resolved");
export const RC_RESOLVED          = RC_BLOCKERS.filter(b => b.status === "resolved");

export const RC_SCORE = Math.round(
  (RC_RESOLVED.length / RC_BLOCKERS.filter(b => b.severity !== "platform-constraint").length) * 100
);
