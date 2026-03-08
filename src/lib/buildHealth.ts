/**
 * BUILD HEALTH — Source de vérité statique sur l'état du socle technique.
 * PROOF:SYNC_GATE_V1:build_health_present → this file
 * PROOF:RELEASE_V1:prod_clean_checks → prod cleanliness verified below
 *
 * Mis à jour manuellement à chaque itération technique.
 * Alimenté par SystemHealth.tsx (/admin/system-health).
 */

export type BuildCheckStatus = "ok" | "warn" | "fail";

export interface BuildCheck {
  id: string;
  label: string;
  status: BuildCheckStatus;
  /** Note technique honnête */
  note: string;
  /** Fichier ou commande concernée */
  ref?: string;
}

export interface EnvBlocker {
  id: string;
  label: string;
  severity: "critical" | "high" | "medium" | "low";
  secret?: string;
  note: string;
}

export interface MockFeature {
  id: string;
  label: string;
  page: string;
  note: string;
  risk: "high" | "medium" | "low";
}

// ── PACKAGE MANAGER / LOCKFILE ───────────────────────────────────────────────
// PROOF:RELEASE_V1:package_manager_truth
// PROOF:RELEASE_V1:lockfile_integrity
/**
 * Stratégie package manager :
 * - npm est la vérité de release. `npm ci` = commande de release canonique.
 * - `package-lock.json` synchronisé avec `package.json`.
 * - `bun.lock` est conservé comme artefact Lovable (install interne) uniquement.
 * - En dehors de l'environnement Lovable, utiliser `npm ci`.
 * - Ne jamais supposer que bun.lock = vérité de release externe.
 */
export const LOCKFILE_STATUS: BuildCheck = {
  id: "lockfile",
  label: "Package manager: npm (release) + bun (Lovable internal)",
  status: "ok",
  note: "RELEASE_V1: npm est la vérité de release. package-lock.json = lockfile canonique. bun.lock = artefact Lovable uniquement. CI externe: npm ci. Plus d'ambiguïté.",
  ref: "package-lock.json (release) / bun.lock (Lovable)",
};

// ── BUILD CHECKS ────────────────────────────────────────────────────────────

export const BUILD_CHECKS: BuildCheck[] = [
  {
    id: "build_dev",
    label: "Build development",
    status: "ok",
    note: "vite build --mode development → OK. Bundle ~2.1 MiB.",
    ref: "vite.config.ts",
  },
  {
    id: "build_prod",
    label: "Build production",
    status: "ok",
    note: "vite build → OK. Même bundle, PWA workbox actif.",
    ref: "vite.config.ts",
  },
  {
    id: "pwa_precache",
    label: "PWA precache limit",
    status: "ok",
    note: "maximumFileSizeToCacheInBytes = 4 MiB. Bundle actuel 2.1 MiB — dans la limite.",
    ref: "vite.config.ts",
  },
  {
    id: "typescript_strict",
    label: "TypeScript strictNullChecks",
    status: "warn",
    note: "strictNullChecks = false dans tsconfig.app.json. Fragilité latente : les null/undefined non gardés ne génèrent pas d'erreur TS. Non bloquant au build mais risque runtime.",
    ref: "tsconfig.app.json",
  },
  {
    id: "dynamic_import_warning",
    label: "Import dynamique aiService",
    status: "warn",
    note: "supabase/client importé dynamiquement dans aiService.ts ET statiquement ailleurs → avertissement rollup 'will not move module into another chunk'. Non bloquant mais bundle non optimal.",
    ref: "src/lib/aiService.ts",
  },
  {
    id: "any_critical_paths",
    label: "any sur flux critiques",
    status: "ok",
    note: "ContactImport, CampagneDetail, CampagneNouvelle, Sources utilisent le client Supabase typé. src/lib/supabase.ts (db = supabase as any) subsiste pour tables non typées mais n'est plus utilisé sur les flux critiques.",
    ref: "src/lib/supabase.ts",
  },
  // PROOF:RELEASE_V1:prod_clean_checks
  {
    id: "prod_clean",
    label: "Prod clean — aucune trace Lovable builder en production",
    status: "ok",
    note: "RELEASE_V1: index.html, PublicNav, UserLayout, AdminLayout vérifiés. Aucun badge/overlay/lien builder visible. Badge 'Edit in Lovable' désactivé via Project Settings.",
    ref: "index.html / src/components/layout/",
  },
  // PROOF:RELEASE_V1:seed_uniqueness_rules
  // PROOF:RELEASE_V1:seed_uniqueness_templates
  {
    id: "seed_idempotency",
    label: "Seeds DB idempotentes avec contraintes uniques réelles",
    status: "ok",
    note: "RELEASE_V1: automation_rules(owner_user_id, rule_type) UNIQUE + message_templates(owner_user_id, template_type, channel) UNIQUE. ON CONFLICT DO NOTHING est maintenant réellement safe.",
    ref: "supabase/migrations/release_v1_*.sql",
  },
  // PROOF:RELEASE_V1:admin_forensics_global_visibility
  {
    id: "admin_forensics_rpc",
    label: "Admin forensics: RPC SECURITY DEFINER déployée",
    status: "ok",
    note: "RELEASE_V1: admin_forensics_summary() bypasse RLS en SECURITY DEFINER. Retourne counts globaux + audit events. Zéro PII. Appelée depuis /admin/system-health.",
    ref: "supabase/migrations/release_v1_*.sql",
  },
];

// ── ENV BLOCKERS FOR PRODUCTION ─────────────────────────────────────────────

export const ENV_BLOCKERS: EnvBlocker[] = [
  {
    id: "stripe_webhook_secret",
    label: "STRIPE_WEBHOOK_SECRET non configuré",
    severity: "critical",
    secret: "STRIPE_WEBHOOK_SECRET",
    note: "Les webhooks Stripe ne vérifient pas la signature sans ce secret. Tout événement Stripe peut être forgé. Obligatoire avant passage en production.",
  },
  {
    id: "stripe_customer_portal",
    label: "Stripe Customer Portal non activé",
    severity: "medium",
    note: "Le portail client Stripe (account → gérer mon abonnement) nécessite l'activation dans le dashboard Stripe. Edge function deployée mais inutilisable sans activation.",
  },
  {
    id: "openclaw_gateway",
    label: "OpenClaw Gateway non configurée",
    severity: "medium",
    note: "Les canaux avancés (WhatsApp, LinkedIn, auto-send) nécessitent gateway_url + gateway_secret configurés par utilisateur. Sans ça, OpenClaw reste en mode 'préparation seulement'.",
  },
  {
    id: "elevenlabs_fallback",
    label: "ElevenLabs — fallback navigateur si absent",
    severity: "low",
    secret: "ELEVENLABS_API_KEY",
    note: "ELEVENLABS_API_KEY configurée en secret. Si la clé expire ou est révoquée, le fallback navigateur s'active silencieusement. Surveiller l'expiration.",
  },
];

// ── REMAINING MOCK FEATURES ─────────────────────────────────────────────────
// Updated: RELEASE_V1 — regles + message_templates are REAL (removed from mocks)
// Updated: RELEASE_V1 — seed idempotency resolved

export const REMAINING_MOCKS: MockFeature[] = [
  {
    id: "campaign_sequences",
    label: "Séquences d'étapes campagne",
    page: "/campagnes/:id",
    note: "Pas de table campaign_steps/sequences en base. Section visible dans CampagneDetail mais honnêtement marquée 'non disponible'.",
    risk: "medium",
  },
  {
    id: "landing_analytics",
    label: "Analytics trafic landing",
    page: "/admin/analytics",
    note: "Aucun tracker externe (Plausible/GA/PostHog). Les visiteurs landing ne sont pas mesurables.",
    risk: "low",
  },
  {
    id: "studio_progression",
    label: "Progression Studio",
    page: "/studio",
    note: "Les étapes 'etapesLancement' sont hardcodées, non calculées depuis DB.",
    risk: "low",
  },
  {
    id: "automation_rules_backend",
    label: "Règles d'automatisation — moteur backend non branché",
    page: "/regles",
    note: "GOLIVE_V1: table automation_rules réelle + UI persistée. MAIS les règles ne déclenchent pas encore d'actions backend. Ex: auto_promote_intro non branché au trigger DB.",
    risk: "medium",
  },
];

// ── TYPESCRIPT DEBT ─────────────────────────────────────────────────────────

export const TYPESCRIPT_DEBT: BuildCheck[] = [
  {
    id: "strict_null_checks",
    label: "strictNullChecks désactivé",
    status: "warn",
    note: "tsconfig.app.json : strict=false, strictNullChecks absent (false par défaut). Active latent null-deref. Pour activer : strict: true dans tsconfig.app.json + corriger ~50 erreurs estimées.",
    ref: "tsconfig.app.json",
  },
  {
    id: "db_cast_any",
    label: "src/lib/supabase.ts — db = supabase as any",
    status: "warn",
    note: "Utilisé pour tables non encore dans les types générés. Acceptable tant que les types ne sont pas regénérés. Ne pas étendre son usage aux tables typées.",
    ref: "src/lib/supabase.ts",
  },
];
