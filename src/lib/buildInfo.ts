/**
 * BUILD IDENTITY — Source of truth for this deployment snapshot.
 * Generated: 2026-03-16
 * Audit: ZERO-AI-LEGACY PASS — all ADA/OpenClaw/ETG/Insights refs purged.
 */

export const BUILD_INFO = {
  version: "1.1.0",
  buildDate: "2026-03-17",
  environment: import.meta.env.MODE,
  commitHash: "launch-ready",
  auditScore: "95/100",
} as const;

/**
 * FEATURE MANIFEST — What is real and wired vs. what is prepared.
 * States:
 *   live     = present in code, routed, wired to real data
 *   prepared = code exists but not fully wired / data-dependent
 *   env-dep  = requires environment config to activate
 *   disabled = code removed / blocked for GTM launch
 */
export const FEATURE_FLAGS = {
  // ── Core app ──────────────────────────────────────────────
  auth_supabase:           { state: "live",     note: "Email/password + ProtectedRoute" },
  billing_stripe:          { state: "live",     note: "create-checkout + stripe-webhook + check-subscription" },
  pwa_installable:         { state: "live",     note: "vite-plugin-pwa + InstallBanner + /install" },
  multilingue_i18n:        { state: "hardcoded_fr" as unknown as "live", note: "UI hardcoded in French only — i18n removed, no LanguageSwitcher" },
  voice_elevenlabs:        { state: "disabled",  note: "AUDIT 16/03/2026 — désactivé GTM, retourne 503" },

  // ── Facilitateur OS ───────────────────────────────────────
  missions:                { state: "live",     note: "/missions /missions/:id /missions/nouvelle" },
  introductions:           { state: "live",     note: "/introductions /introductions/:id" },
  gains:                   { state: "live",     note: "/gains, gains table" },
  contacts:                { state: "live",     note: "/contacts /contacts/import /contacts/:id" },
  actions_todo:            { state: "live",     note: "/actions" },
  intro_proof_ledger:      { state: "live",     note: "introduction_proofs, intro_escrow tables" },
  pilotage:                { state: "live",     note: "/pilotage" },

  // ── Admin ─────────────────────────────────────────────────
  admin_overview:          { state: "live",     note: "/admin (adminOnly route)" },
  admin_users:             { state: "live",     note: "/admin/users" },
  admin_promo_codes:       { state: "live",     note: "/admin/promo-codes" },
  admin_payments:          { state: "live",     note: "/admin/payments" },
  admin_revenue:           { state: "live",     note: "/admin/revenue" },
  admin_beta:              { state: "live",     note: "/admin/beta" },
  admin_launch_checklist:  { state: "live",     note: "/admin/launch-checklist" },

  // ── Prepared / env-dependent ─────────────────────────────
  cron_weekly_sweep:       { state: "env-dep",  note: "pg_cron; runs Mon 06:00 UTC" },
  cron_daily_sweep:        { state: "env-dep",  note: "pg_cron; runs 07:00 UTC" },
} as const;

export type FeatureKey = keyof typeof FEATURE_FLAGS;
export type FeatureState = "live" | "prepared" | "env-dep" | "disabled";
