/**
 * CAPABILITY MATRIX — Single Source of Runtime Truth
 *
 * Chaque capability expose:
 *   status: ready | partial | blocked | unknown
 *   evidenceType: code | runtime | external-config | manual-step | unverifiable
 *   blockingLevel: critical | high | medium | low | none
 *
 * RÈGLE ABSOLUE: jamais de status "ready" sans preuve réelle.
 * Si inconnu côté client → "unknown" ou "external-config".
 */

export type CapabilityStatus = "ready" | "partial" | "blocked" | "unknown";
export type EvidenceType = "code" | "runtime" | "external-config" | "manual-step" | "unverifiable";
export type BlockingLevel = "critical" | "high" | "medium" | "low" | "none";
export type CapabilityKey =
  | "stripeWebhook"
  | "stripeCustomerPortal"
  | "stripeCheckout"
  | "resendEmail"
  | "payoutPipeline"
  | "pgCronReactivation"
  | "pgCronPayout"
  | "pgCronOpenClaw"
  | "openClawGateway"
  | "canonicalDomain"
  | "rateLimitMode"
  | "envHygiene"
  | "typescriptStrict"
  | "smokeTestAvailable"
  | "loadTestAvailable"
  | "authRLS"
  | "launchQuota"
  | "promoCodes";

export interface Capability {
  key: CapabilityKey;
  label: string;
  group: string;
  status: CapabilityStatus;
  evidenceType: EvidenceType;
  summary: string;
  details: string;
  blocking: boolean;
  blockingLevel: BlockingLevel;
  cta?: string;
  ctaLink?: string;
  lastVerifiedAt?: string;
}

// ── MATRICE CANONIQUE ─────────────────────────────────────────────────────────
// Classée par blocant → criticité → groupe

export const CAPABILITY_MATRIX: Capability[] = [
  // ── BILLING ───────────────────────────────────────────────────────────────
  {
    key: "stripeWebhook",
    label: "Stripe Webhook",
    group: "Billing",
    status: "partial",
    evidenceType: "code",
    summary: "STRIPE_WEBHOOK_SECRET configuré — vérification signature active dans le code. Flux E2E non exercé.",
    details:
      "stripe-webhook edge fn déployée, STRIPE_WEBHOOK_SECRET configuré (PROUVÉ PAR LE REPO). Vérification de signature Stripe présente. " +
      "NON PROUVÉ PAR EXÉCUTION : aucun checkout réel effectué. Exercer scripts/verify-stripe-webhook.sh avant toute ouverture billing.",
    blocking: true,
    blockingLevel: "high",
    cta: "Exercer verify-stripe-webhook.sh",
    ctaLink: "https://github.com",
  },
  {
    key: "stripeCheckout",
    label: "Stripe Checkout",
    group: "Billing",
    status: "partial",
    evidenceType: "code",
    summary: "create-checkout edge fn déployée — aucun achat réel effectué.",
    details:
      "create-checkout edge fn présente, STRIPE_SECRET_KEY configurée. " +
      "NON PROUVÉ PAR EXÉCUTION : test de checkout réel avec carte de test Stripe requis avant beta.",
    blocking: true,
    blockingLevel: "high",
    cta: "Tester un checkout avec carte Stripe test",
  },
  {
    key: "stripeCustomerPortal",
    label: "Stripe Customer Portal",
    group: "Billing",
    status: "blocked",
    evidenceType: "external-config",
    summary: "Edge fn déployée. Activation requise dans Stripe Dashboard.",
    details:
      "customer-portal edge fn déployée et codée. BLOQUÉ : le Customer Portal doit être activé manuellement dans le Dashboard Stripe " +
      "(Billing → Customer Portal → Activate). Sans ça, la gestion d'abonnement par les utilisateurs est inutilisable.",
    blocking: true,
    blockingLevel: "high",
    cta: "Activer dans Stripe Dashboard → Billing → Customer Portal",
  },
  {
    key: "resendEmail",
    label: "Email Réactivation (Resend)",
    group: "Billing",
    status: "partial",
    evidenceType: "code",
    summary: "RESEND_API_KEY configurée, send-reactivation-email déployée. Livraison email réelle non prouvée.",
    details:
      "PROUVÉ PAR LE REPO : send-reactivation-email edge fn déployée, RESEND_API_KEY configurée. " +
      "NON PROUVÉ PAR EXÉCUTION : aucun email testé en conditions réelles. Tester un envoi depuis /admin/reactivation.",
    blocking: false,
    blockingLevel: "medium",
    cta: "Envoyer un email test depuis /admin/reactivation",
    ctaLink: "/admin/reactivation",
  },

  // ── CRONS / JOBS ──────────────────────────────────────────────────────────
  {
    key: "pgCronOpenClaw",
    label: "pg_cron OpenClaw Scheduler",
    group: "Crons",
    status: "ready",
    evidenceType: "runtime",
    summary: "PROUVÉ PAR EXÉCUTION — jobid 4, runs observés dans openclaw_scheduled_runs.",
    details:
      "openclaw-scheduler tick configuré et observé (jobid 4, */5 min). " +
      "PROUVÉ PAR EXÉCUTION via cron-jobs.md et openclaw_scheduled_runs. Jobs executor branché.",
    blocking: false,
    blockingLevel: "none",
  },
  {
    key: "pgCronReactivation",
    label: "pg_cron Réactivation Quotidienne",
    group: "Crons",
    status: "blocked",
    evidenceType: "manual-step",
    summary: "Script SQL disponible — NON exécuté en base. Déclenchement = manuel via UI admin.",
    details:
      "Script SQL dans supabase/infra/scheduled-jobs.md. NON CRÉÉ EN BASE. " +
      "Déclenchement actuel = manuel via bouton 'Lancer le scan' dans /admin/reactivation. " +
      "ÉTAPE MANUELLE REQUISE : exécuter le script SQL dans le backend → Run SQL.",
    blocking: false,
    blockingLevel: "medium",
    cta: "Exécuter SQL dans Backend → Run SQL",
  },
  {
    key: "pgCronPayout",
    label: "pg_cron Payout Quotidien",
    group: "Crons",
    status: "blocked",
    evidenceType: "manual-step",
    summary: "Script SQL disponible — NON exécuté en base. Déclenchement = manuel via UI admin.",
    details:
      "Script SQL dans supabase/infra/scheduled-jobs.md. NON CRÉÉ EN BASE. " +
      "Déclenchement actuel = manuel via /admin/payout-ops. " +
      "ÉTAPE MANUELLE REQUISE : exécuter le script SQL dans le backend → Run SQL.",
    blocking: false,
    blockingLevel: "medium",
    cta: "Exécuter SQL dans Backend → Run SQL",
    ctaLink: "/admin/payout-ops",
  },

  // ── OPENCLAW ──────────────────────────────────────────────────────────────
  {
    key: "openClawGateway",
    label: "OpenClaw Gateway Externe",
    group: "OpenClaw",
    status: "unknown",
    evidenceType: "external-config",
    summary: "Edge fn déployée. Gateway externe non configurée = canaux avancés inactifs.",
    details:
      "openclaw-gateway edge fn présente. IMPOSSIBLE À VÉRIFIER CÔTÉ CLIENT. " +
      "Canaux avancés (WhatsApp, LinkedIn, auto-send) nécessitent gateway_url + gateway_secret par utilisateur. " +
      "Sans config = ces canaux restent en mode 'préparation manuelle'.",
    blocking: false,
    blockingLevel: "low",
    cta: "Configurer gateway_url + gateway_secret per-user",
  },

  // ── AUTH / SÉCURITÉ ───────────────────────────────────────────────────────
  {
    key: "authRLS",
    label: "Auth + RLS",
    group: "Sécurité",
    status: "ready",
    evidenceType: "code",
    summary: "PROUVÉ PAR LE REPO — Supabase Auth + ProtectedRoute + RLS sur toutes les tables critiques.",
    details:
      "Auth email/password opérationnelle. ProtectedRoute avec adminOnly. RLS activé sur toutes les tables critiques. " +
      "user_roles table + has_role() SECURITY DEFINER. PROUVÉ PAR LE REPO.",
    blocking: false,
    blockingLevel: "none",
  },

  // ── LANCEMENT ─────────────────────────────────────────────────────────────
  {
    key: "launchQuota",
    label: "Quota Lancement (100 slots)",
    group: "Lancement",
    status: "ready",
    evidenceType: "code",
    summary: "PROUVÉ PAR LE REPO — table launch_quota + increment_launch_quota_used_slots() RPC atomique.",
    details:
      "launch_quota table présente. increment_launch_quota_used_slots() RPC avec SELECT FOR UPDATE (atomique). " +
      "Branché dans stripe-webhook. Compteur affiché en temps réel sur la landing. PROUVÉ PAR LE REPO.",
    blocking: false,
    blockingLevel: "none",
  },
  {
    key: "promoCodes",
    label: "Codes Promo",
    group: "Lancement",
    status: "ready",
    evidenceType: "code",
    summary: "PROUVÉ PAR LE REPO — redeem-promo edge fn + promo_codes table. 304 codes créés.",
    details:
      "redeem-promo edge fn déployée. promo_codes table avec is_used flag. 304 codes créés en DB. " +
      "Branché dans l'UI Checkout. PROUVÉ PAR LE REPO.",
    blocking: false,
    blockingLevel: "none",
  },

  // ── INFRA ─────────────────────────────────────────────────────────────────
  {
    key: "canonicalDomain",
    label: "Domaine Canonique",
    group: "Infrastructure",
    status: "unknown",
    evidenceType: "external-config",
    summary: "wiinupmax.com — statut DNS non vérifiable depuis Lovable.",
    details:
      "IMPOSSIBLE À VÉRIFIER DANS CET ENVIRONNEMENT. " +
      "DNS canonical doit pointer vers la preview. " +
      "Vérifier dans Project Settings → Domains.",
    blocking: false,
    blockingLevel: "low",
    cta: "Vérifier dans Settings → Domains",
  },
  {
    key: "rateLimitMode",
    label: "Rate Limiting",
    group: "Infrastructure",
    status: "partial",
    evidenceType: "code",
    summary: "Rate limiting in-process uniquement — pas de distributed rate limiting.",
    details:
      "Quota engine présent (quotaEngine.ts). Pas de Redis/distributed rate limiting. " +
      "En-dessous de 1k req/s, le rate limiting Supabase natif tient. " +
      "LIMITE DOCUMENTÉE : scale prod non validée sans load test réel.",
    blocking: false,
    blockingLevel: "low",
    cta: "Lancer scripts/load-test-k6.js pour valider",
  },
  {
    key: "envHygiene",
    label: "Hygiène Env / Secrets",
    group: "Infrastructure",
    status: "ready",
    evidenceType: "code",
    summary: ".env.example présent. .gitignore corrigé. Clés sensibles dans Edge Function secrets.",
    details:
      ".env.example présent dans le repo. .gitignore configuré. " +
      "Clés sensibles (STRIPE_WEBHOOK_SECRET, RESEND_API_KEY) stockées dans Edge Function secrets, non exposées. " +
      "PROUVÉ PAR LE REPO.",
    blocking: false,
    blockingLevel: "none",
  },
  {
    key: "typescriptStrict",
    label: "TypeScript Strictness",
    group: "Infrastructure",
    status: "partial",
    evidenceType: "code",
    summary: "strict:false — Phase 1 hardening actif (strictFunctionTypes, strictBindCallApply).",
    details:
      "tsconfig.app.json: strict=false. strictFunctionTypes + strictBindCallApply + noFallthroughCasesInSwitch activés. " +
      "strictNullChecks désactivé = ~50 null-deref potentiels. " +
      "Phase 2 (strictNullChecks) requiert corrections ciblées. LIMITE CONNUE ET DOCUMENTÉE.",
    blocking: false,
    blockingLevel: "low",
  },
  {
    key: "smokeTestAvailable",
    label: "Smoke Tests",
    group: "Tests",
    status: "partial",
    evidenceType: "code",
    summary: "scripts/smoke-test.sh présent — NON PROUVÉ PAR EXÉCUTION (requiert environnement externe).",
    details:
      "PROUVÉ PAR LE REPO : scripts/smoke-test.sh présent. " +
      "NON PROUVÉ PAR EXÉCUTION : requiert curl + environnement shell externe à Lovable. " +
      "Commande : bash scripts/smoke-test.sh $SUPABASE_URL $ANON_KEY",
    blocking: false,
    blockingLevel: "low",
    cta: "bash scripts/smoke-test.sh hors Lovable",
  },
  {
    key: "loadTestAvailable",
    label: "Load Tests (k6)",
    group: "Tests",
    status: "partial",
    evidenceType: "code",
    summary: "scripts/load-test-k6.js présent — NON PROUVÉ PAR EXÉCUTION.",
    details:
      "PROUVÉ PAR LE REPO : scripts/load-test-k6.js présent. " +
      "NON PROUVÉ PAR EXÉCUTION : requiert k6 installé localement. " +
      "Commande : k6 run scripts/load-test-k6.js",
    blocking: false,
    blockingLevel: "low",
    cta: "k6 run scripts/load-test-k6.js hors Lovable",
  },
];

// ── SELECTORS ─────────────────────────────────────────────────────────────────

export const BLOCKING_CAPABILITIES = CAPABILITY_MATRIX.filter(
  (c) => c.blocking && c.status !== "ready"
);

export const CRITICAL_CAPABILITIES = CAPABILITY_MATRIX.filter(
  (c) => c.blockingLevel === "critical" || c.blockingLevel === "high"
);

export const BLOCKED_CAPABILITIES = CAPABILITY_MATRIX.filter(
  (c) => c.status === "blocked"
);

export const UNKNOWN_CAPABILITIES = CAPABILITY_MATRIX.filter(
  (c) => c.status === "unknown"
);

export const CAPABILITIES_BY_GROUP = CAPABILITY_MATRIX.reduce(
  (acc, cap) => {
    if (!acc[cap.group]) acc[cap.group] = [];
    acc[cap.group].push(cap);
    return acc;
  },
  {} as Record<string, Capability[]>
);

export function getCapabilityStatusSummary() {
  const ready = CAPABILITY_MATRIX.filter((c) => c.status === "ready").length;
  const partial = CAPABILITY_MATRIX.filter((c) => c.status === "partial").length;
  const blocked = CAPABILITY_MATRIX.filter((c) => c.status === "blocked").length;
  const unknown = CAPABILITY_MATRIX.filter((c) => c.status === "unknown").length;
  const total = CAPABILITY_MATRIX.length;
  const score = Math.round((ready / total) * 100);
  return { ready, partial, blocked, unknown, total, score };
}

export function getReleaseGate(): {
  verdict: "PROD_BLOCKED" | "PUBLIC_BETA_BLOCKED" | "PRIVATE_BETA_READY" | "INTERNAL_TEST" | "DEV_ONLY";
  justification: string;
} {
  const hardBlockers = CAPABILITY_MATRIX.filter(
    (c) => c.blocking && (c.status === "blocked" || c.status === "unknown")
  );
  const highBlockers = CAPABILITY_MATRIX.filter(
    (c) => c.blockingLevel === "high" && c.status !== "ready"
  );
  const criticalBlockers = CAPABILITY_MATRIX.filter(
    (c) => c.blockingLevel === "critical" && c.status !== "ready"
  );

  if (criticalBlockers.length > 0) {
    return {
      verdict: "PROD_BLOCKED",
      justification: `${criticalBlockers.length} bloquant(s) critique(s) : ${criticalBlockers.map((c) => c.label).join(", ")}`,
    };
  }

  if (highBlockers.length > 2) {
    return {
      verdict: "PUBLIC_BETA_BLOCKED",
      justification: `${highBlockers.length} bloquants niveau HIGH dont : ${highBlockers.slice(0, 2).map((c) => c.label).join(", ")}`,
    };
  }

  if (hardBlockers.length > 0 || highBlockers.length > 0) {
    return {
      verdict: "PRIVATE_BETA_READY",
      justification: `${hardBlockers.length + highBlockers.length} points à valider avant public. Stripe E2E non exercé, Customer Portal non activé, crons pg_cron non créés.`,
    };
  }

  return {
    verdict: "PRIVATE_BETA_READY",
    justification: "Tous les bloquants critiques sont résolus. Beta privée possible avec monitoring actif.",
  };
}
