/**
 * BUILD IDENTITY — Source of truth for this deployment snapshot.
 * Generated: 2026-03-07
 * DO NOT edit manually — reflects real repo state at this point in time.
 */

export const BUILD_INFO = {
  build_id: "WIINUP-MAX-20260307-001",
  app_version: "1.0.0",
  generated_at: "2026-03-07T00:00:00Z",
  git_sha: "see GitHub → wiinupmax repo",
  environment: import.meta.env.MODE ?? "production",
} as const;

/**
 * FEATURE MANIFEST — What is real and wired vs. what is prepared.
 * States:
 *   live     = present in code, routed, wired to real data
 *   prepared = code exists but not fully wired / data-dependent
 *   env-dep  = requires environment config to activate
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

  // ── OpenClaw Autonomous Engine ────────────────────────────
  openclaw_agents:         { state: "live",     note: "/agents, openclaw_agents table" },
  openclaw_dossier:        { state: "live",     note: "/dossier, openclaw_dossier table" },
  openclaw_validations:    { state: "live",     note: "/validations, openclaw_channel_actions" },
  openclaw_operations:     { state: "live",     note: "/operations, all runtime hooks" },
  openclaw_war_room:       { state: "live",     note: "/war-room" },
  openclaw_scheduler:      { state: "live",     note: "openclaw-scheduler edge fn + pg_cron jobid:4,5,6" },
  openclaw_job_executor:   { state: "live",     note: "openclaw-job-executor edge fn + openclaw_job_queue" },
  openclaw_event_bus:      { state: "live",     note: "openclaw-event-bus edge fn + DB triggers on 5 tables" },
  openclaw_channel_probe:  { state: "live",     note: "openclaw-channel-probe edge fn" },
  openclaw_smoke_test:     { state: "live",     note: "openclaw-smoke-test edge fn + UI trigger" },
  openclaw_cron_diagnostic: { state: "live",   note: "useOpenClawCronDiagnostic + openclaw_cron_status view" },
  openclaw_kill_switch:    { state: "live",     note: "openclaw-kill-switch edge fn + kill_switch_global" },

  // ── Admin ─────────────────────────────────────────────────
  admin_overview:          { state: "live",     note: "/admin (adminOnly route)" },
  admin_users:             { state: "live",     note: "/admin/users" },
  admin_promo_codes:       { state: "live",     note: "/admin/promo-codes" },
  admin_payments:          { state: "live",     note: "/admin/payments" },
  admin_analytics:         { state: "live",     note: "/admin/analytics" },

  // ── Prepared / env-dependent ─────────────────────────────
  openclaw_gateway_external: { state: "env-dep", note: "openclaw-gateway fn exists; gateway_url/secret must be configured per-user" },
  cron_weekly_sweep:       { state: "env-dep",  note: "jobid:6 configured in pg_cron; not yet observed (runs Mon 06:00 UTC)" },
  cron_daily_sweep:        { state: "env-dep",  note: "jobid:5 configured in pg_cron; not yet observed outside 07:00 UTC window" },
} as const;

export type FeatureKey = keyof typeof FEATURE_FLAGS;
export type FeatureState = "live" | "prepared" | "env-dep";
