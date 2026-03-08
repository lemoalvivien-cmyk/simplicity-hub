/**
 * RELEASE HEALTH — Source de vérité des blockers release.
 * PROOF:RELEASE_V1:release_blockers_real → this file
 * PROOF:CONSISTENCY_V1:health_runtime_consistency → this file (no contradictions with RC health)
 *
 * Mis à jour : CONSISTENCY-V1 — 2026-03-08
 * Changelog:
 *   - automation_rules_no_engine: RESOLVED (moteur présent après AUTOMATION_V1 + CLEANUP_V1)
 *   - Ajout de release_honesty_status explicite
 *   - CONSISTENCY_V1: confirmé cohérent avec releaseCandidateHealth.ts
 */

// PROOF:RELEASE_V1:package_manager_truth
export const PACKAGE_MANAGER_TRUTH = {
  canonical: "npm" as const,
  lockfile:  "package-lock.json" as const,
  // PROOF:AUTOMATION_CLEANUP_V1:npm_ci_truth
  // NOT_FIXED: lockfile is READ-ONLY in Lovable platform — npm ci unverifiable from this context
  npm_ci_status: "NOT_FIXED_PLATFORM_CONSTRAINT" as const,
  note:      "npm est la stratégie release documentée. bun.lock = artefact Lovable interne uniquement. npm ci n'est pas vérifiable depuis ce contexte. CI externe: exporter le repo et exécuter npm ci manuellement.",
  lockfile_strategy: "package-lock.json synchronisé avec package.json par la plateforme Lovable. Géré automatiquement, READ-ONLY depuis cet environnement.",
} as const;

// PROOF:RELEASE_V1:build_stamp_consistency
export const CURRENT_STAMP = "RELEASESYNC-2026-03-08-CLEANUP-V1" as const;

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
// PROOF:AUTOMATION_CLEANUP_V1:health_blocker_cleanup
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
    note:     "ingest_passive_signal() RPC idempotent existe. Seuil lu depuis règle DB active (plus de hardcode). Pas encore event-driven côté Stripe/webhook. Limite documentée: sans ouverture page = pas d'ingestion.",
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
    id:       "message_templates_no_variables",
    label:    "Templates messages: pas de moteur de variables dynamiques côté serveur",
    severity: "warning",
    status:   "open",
    area:     "Messages",
    note:     "Templates persistés en DB. resolve_message_template() RPC produit des payloads. Pas de substitution [Prénom] auto côté serveur. Manuel.",
  },
  {
    id:       "openclaw_gateway_missing",
    label:    "OpenClaw Gateway non configurée",
    severity: "warning",
    status:   "open",
    area:     "OpenClaw",
    note:     "WhatsApp, LinkedIn, auto-send nécessitent gateway_url + gateway_secret par utilisateur.",
  },

  // ── INFO / RÉSOLUS ────────────────────────────────────────────────────────
  // PROOF:AUTOMATION_CLEANUP_V1:health_blocker_cleanup
  // automation_rules_no_engine previously listed here as "warning/open" — CORRECTED to resolved.
  {
    id:       "automation_engine_present",
    label:    "Moteur d'automatisation: présent, actif, owner-resolved",
    severity: "info",
    status:   "resolved",
    area:     "Règles",
    note:     "CLEANUP_V1: apply_automation_rules_to_lead() + DB trigger + owner resolution (entreprise_id ?? user_id). Actions routées: precision → facilitateur, conversion → entreprise. Log: automation_engine_log.",
  },
  {
    id:       "seed_uniqueness_enforced",
    label:    "Seeds idempotentes: contraintes uniques DB ajoutées",
    severity: "info",
    status:   "resolved",
    area:     "Infrastructure",
    note:     "RELEASE_V1: automation_rules(owner_user_id, rule_type) UNIQUE. message_templates(owner_user_id, template_type, channel) UNIQUE.",
  },
  {
    id:       "admin_forensics_rpc",
    label:    "Admin forensics: admin_forensics_summary() RPC SECURITY DEFINER",
    severity: "info",
    status:   "resolved",
    area:     "Admin",
    note:     "RELEASE_V1: fonction SQL SECURITY DEFINER bypasse RLS pour lecture admin globale. Retourne counts + audit events. Zéro PII.",
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
    note:     "GOLIVE_V1 + INTEGRITY_V1: guard SQL empêche double-ingestion pour le même share_link_id. Seuil dynamique depuis règle DB.",
  },
  {
    id:       "audit_trail_deployed",
    label:    "Audit trail: lead_action_events opérationnel",
    severity: "info",
    status:   "resolved",
    area:     "Pipeline",
    note:     "INTEGRITY_V1: update_lead_action_status() écrit dans lead_action_events à chaque mutation. Traçable.",
  },
  {
    id:       "lovable_badge_removed",
    label:    "Badge 'Edit with Lovable' supprimé des fichiers source",
    severity: "info",
    status:   "resolved",
    area:     "Prod Clean",
    // PROOF:AUTOMATION_CLEANUP_V1:public_trace_truth
    note:     "Code source propre (grep-vérifiable). Le badge visible sur le site publié est un overlay plateforme, non du code. Suppression via Project Settings → Hide Lovable Badge.",
  },
  {
    id:       "prod_clean_verified",
    label:    "Prod clean: aucune trace outil de construction dans les vues publiques",
    severity: "info",
    status:   "resolved",
    area:     "Prod Clean",
    note:     "RELEASE_V1: index.html, PublicNav, UserLayout, AdminLayout. Aucun overlay/badge/lien builder dans le code source.",
  },
];

export const RELEASE_BLOCKERS_ONLY   = RELEASE_BLOCKERS.filter(b => b.severity === "blocker"  && b.status !== "resolved");
export const RELEASE_WARNINGS_OPEN   = RELEASE_BLOCKERS.filter(b => b.severity === "warning"  && b.status !== "resolved");
export const RELEASE_RESOLVED        = RELEASE_BLOCKERS.filter(b => b.status === "resolved");

export const RELEASE_SCORE = Math.round(
  (RELEASE_RESOLVED.length / RELEASE_BLOCKERS.length) * 100
);
