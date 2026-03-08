/**
 * RELEASE HEALTH — Source de vérité des blockers release.
 * PROOF:RELEASE_V1:release_blockers_real → this file
 *
 * Distinct de goLiveHealth.ts (feature/ops) : ce fichier couvre
 * les blockers de release au sens strict : package manager,
 * lockfile, seed intégrité, admin forensics, prod clean.
 *
 * Mis à jour : RELEASE INTEGRITY V1 — 2026-03-08
 */

// PROOF:RELEASE_V1:package_manager_truth
// STRATÉGIE : npm est la vérité de release pour ce projet.
// Raison : Lovable utilise bun en interne pour install, mais le
// package-lock.json est maintenu et publié. Pour CI/CD et portabilité
// externe, npm ci est la commande canonique.
// bun.lock est conservé comme artefact Lovable mais ne remplace pas npm.
// Ne jamais supposer que bun.lock = vérité en dehors de l'environnement Lovable.
export const PACKAGE_MANAGER_TRUTH = {
  canonical: "npm" as const,
  lockfile:  "package-lock.json" as const,
  note:      "npm est la vérité de release. bun.lock = artefact Lovable uniquement. CI externe: npm ci.",
  // PROOF:RELEASE_V1:lockfile_integrity
  lockfile_strategy: "package-lock.json synchronisé avec package.json. bun.lock présent pour install Lovable. Pas de cohabitation ambiguë: npm ci est la commande de release.",
} as const;

// PROOF:RELEASE_V1:build_stamp_consistency
// Stamp courant : RELEASE-2026-03-08-1300-V1
// Ce stamp est le seul stamp de référence pour la passe RELEASE INTEGRITY V1.
// Les anciens stamps (SYNCGATE-*, GOLIVE-*) restent dans l'historique mais
// le stamp courant dans buildStamp.ts doit être RELEASE-2026-03-08-1300-V1.
export const CURRENT_STAMP = "RELEASE-2026-03-08-1300-V1" as const;

// PROOF:RELEASE_V1:repo_manifest_consistency
export const MANIFEST_FILE = "docs/REPO_SYNC_MANIFEST.md" as const;

export type ReleaseBlockerSeverity = "blocker" | "warning" | "info";
export type ReleaseBlockerStatus   = "open" | "resolved" | "partial";

export interface ReleaseBlocker {
  id:       string;
  label:    string;
  severity: ReleaseBlockerSeverity;
  status:   ReleaseBlockerStatus;
  area:     string;
  note:     string;
}

// PROOF:RELEASE_V1:release_blockers_real
export const RELEASE_BLOCKERS: ReleaseBlocker[] = [
  // ── BLOQUANTS CRITIQUES ────────────────────────────────────────────────────
  {
    id:       "stripe_webhook_secret",
    label:    "STRIPE_WEBHOOK_SECRET non configuré",
    severity: "blocker",
    status:   "open",
    area:     "Billing",
    note:     "Sans ce secret, les webhooks Stripe peuvent être forgés. Obligatoire avant tout traffic réel.",
  },
  {
    id:       "stripe_customer_portal",
    label:    "Stripe Customer Portal non activé",
    severity: "blocker",
    status:   "open",
    area:     "Billing",
    note:     "Edge function customer-portal déployée mais inutilisable sans activation dans Stripe Dashboard.",
  },

  // ── WARNINGS ─────────────────────────────────────────────────────────────
  {
    id:       "passive_semi_batch",
    label:    "Passive ingestion: mode semi-batch (RPC + client trigger)",
    severity: "warning",
    status:   "partial",
    area:     "Passive OS",
    note:     "ingest_passive_signal() RPC idempotent existe. Appelé au mount de PassiveOS. Pas encore event-driven côté Stripe/webhook. Limite documentée: sans ouverture page = pas d'ingestion.",
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
    id:       "message_templates_not_versioned",
    label:    "Templates messages: pas de versioning ni variables dynamiques",
    severity: "warning",
    status:   "open",
    area:     "Messages",
    note:     "Templates persistés en DB (GOLIVE_V1). Pas de moteur de variables [Prénom] côté serveur. Manuel.",
  },
  {
    id:       "automation_rules_no_engine",
    label:    "Règles: table réelle, moteur d'exécution backend absent",
    severity: "warning",
    status:   "partial",
    area:     "Règles",
    note:     "automation_rules persistées. UI lit/écrit la DB. Les règles ne déclenchent pas encore d'actions backend.",
  },
  {
    id:       "openclaw_gateway_missing",
    label:    "OpenClaw Gateway non configurée",
    severity: "warning",
    status:   "open",
    area:     "OpenClaw",
    note:     "WhatsApp, LinkedIn, auto-send nécessitent gateway_url + gateway_secret par utilisateur.",
  },
  {
    id:       "campaign_sequences_absent",
    label:    "Séquences de campagne non implémentées",
    severity: "warning",
    status:   "open",
    area:     "Campagnes",
    note:     "Pas de table campaign_steps. CampagneDetail affiche section séquences mais sans DB réelle.",
  },

  // ── INFO / RÉSOLUS ────────────────────────────────────────────────────────
  {
    id:       "seed_uniqueness_enforced",
    label:    "Seeds idempotentes: contraintes uniques DB ajoutées",
    severity: "info",
    status:   "resolved",
    area:     "Infrastructure",
    note:     "RELEASE_V1: automation_rules(owner_user_id, rule_type) UNIQUE. message_templates(owner_user_id, template_type, channel) UNIQUE. ON CONFLICT DO NOTHING est maintenant réellement safe.",
  },
  {
    id:       "admin_forensics_rpc",
    label:    "Admin forensics: admin_forensics_summary() RPC SECURITY DEFINER",
    severity: "info",
    status:   "resolved",
    area:     "Admin",
    note:     "RELEASE_V1: fonction SQL SECURITY DEFINER bypasse RLS pour lecture admin globale. Retourne counts + audit events. Zéro PII exposé.",
  },
  {
    id:       "automation_rules_real",
    label:    "Règles: persistées en DB réelle avec seed auto",
    severity: "info",
    status:   "resolved",
    area:     "Règles",
    note:     "GOLIVE_V1: table automation_rules. useAutomationRules hook. Seed auto 1er accès via seed_default_automation_rules().",
  },
  {
    id:       "message_templates_real",
    label:    "Templates: persistés en DB réelle avec seed auto",
    severity: "info",
    status:   "resolved",
    area:     "Messages",
    note:     "GOLIVE_V1: table message_templates. useMessageTemplates hook. Seed auto 1er accès via seed_default_message_templates().",
  },
  {
    id:       "passive_rpc_deployed",
    label:    "Passive: ingest_passive_signal() RPC déployé et idempotent",
    severity: "info",
    status:   "resolved",
    area:     "Passive OS",
    note:     "GOLIVE_V1 + INTEGRITY_V1: guard SQL empêche double-ingestion pour le même share_link_id.",
  },
  {
    id:       "audit_trail_deployed",
    label:    "Audit trail: lead_action_events opérationnel",
    severity: "info",
    status:   "resolved",
    area:     "Pipeline",
    note:     "INTEGRITY_V1: update_lead_action_status() écrit dans lead_action_events à chaque mutation. Traçable.",
  },
  // PROOF:RELEASE_V1:lovable_badge_removed
  {
    id:       "lovable_badge_removed",
    label:    "Badge 'Edit with Lovable' supprimé des vues publiques",
    severity: "info",
    status:   "resolved",
    area:     "Prod Clean",
    note:     "RELEASE_V1: index.html, PublicNav, UserLayout, AdminLayout ne contiennent aucun badge Lovable. Désactivé via Project Settings → Hide Lovable Badge.",
  },
  // PROOF:RELEASE_V1:prod_clean_checks
  {
    id:       "prod_clean_verified",
    label:    "Prod clean: aucune trace outil de construction dans les vues publiques",
    severity: "info",
    status:   "resolved",
    area:     "Prod Clean",
    note:     "RELEASE_V1: index.html ne contient pas de référence Lovable. Layouts publics vérifiés: PublicNav, UserLayout, AdminLayout. Aucun overlay/badge/lien builder visible pour le visiteur.",
  },
];

export const RELEASE_BLOCKERS_ONLY   = RELEASE_BLOCKERS.filter(b => b.severity === "blocker"  && b.status !== "resolved");
export const RELEASE_WARNINGS_OPEN   = RELEASE_BLOCKERS.filter(b => b.severity === "warning"  && b.status !== "resolved");
export const RELEASE_RESOLVED        = RELEASE_BLOCKERS.filter(b => b.status === "resolved");

export const RELEASE_SCORE = Math.round(
  (RELEASE_RESOLVED.length / RELEASE_BLOCKERS.length) * 100
);
