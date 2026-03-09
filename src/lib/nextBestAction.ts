/**
 * NEXT BEST ACTION ENGINE
 *
 * Analyse l'état du système et produit 1 action principale + N actions secondaires.
 * Chaque action est justifiée par des preuves, classée par impact et risque.
 *
 * Ce moteur est SYNCHRONE côté client et doit rester léger.
 * Les checks runtime (DB) sont injectés en paramètre pour éviter les appels en cascade.
 */

import {
  CAPABILITY_MATRIX,
  BLOCKING_CAPABILITIES,
  CRITICAL_CAPABILITIES,
  type Capability,
} from "./capabilityMatrix";

export type ActionPriority = "critical" | "high" | "medium" | "low";
export type ActionCategory =
  | "billing"
  | "infrastructure"
  | "security"
  | "performance"
  | "observability"
  | "cron"
  | "testing"
  | "ux";

export interface NextBestAction {
  id: string;
  title: string;
  description: string;
  why: string;
  evidence: string;
  priority: ActionPriority;
  impact: "revenue" | "security" | "reliability" | "scale" | "ux";
  estimatedMinutes: number;
  riskIfIgnored: "critical" | "high" | "medium" | "low";
  category: ActionCategory;
  executableInLovable: boolean;
  cta: string;
  ctaLink?: string;
  dependsOn?: string[];
  source: "capability-matrix" | "go-live-health" | "manual";
  capabilityKey?: string;
}

export interface NBAResult {
  primary: NextBestAction;
  secondary: NextBestAction[];
  computedAt: string;
  blockerCount: number;
  blockerSummary: string;
}

// ── ACTION FACTORY ────────────────────────────────────────────────────────────

function capToAction(cap: Capability): NextBestAction {
  const baseAction: Partial<NextBestAction> = {
    source: "capability-matrix",
    capabilityKey: cap.key,
    evidence: cap.details,
    executableInLovable: false,
  };

  switch (cap.key) {
    case "stripeCustomerPortal":
      return {
        ...baseAction as NextBestAction,
        id: "nba_stripe_portal",
        title: "Activer le Customer Portal Stripe",
        description: "Le portail de gestion d'abonnements est inutilisable sans cette activation.",
        why: "Sans Customer Portal actif, les utilisateurs ne peuvent pas gérer ni annuler leur abonnement. Blocant pour la facturation.",
        evidence: cap.details,
        priority: "high",
        impact: "revenue",
        estimatedMinutes: 5,
        riskIfIgnored: "high",
        category: "billing",
        executableInLovable: false,
        cta: "Activer dans Stripe Dashboard → Billing → Customer Portal",
        ctaLink: "https://dashboard.stripe.com/settings/billing/portal",
      };

    case "stripeWebhook":
      return {
        ...baseAction as NextBestAction,
        id: "nba_stripe_webhook_e2e",
        title: "Exercer le flux Stripe end-to-end",
        description: "Le webhook est codé et le secret configuré, mais aucun checkout réel n'a été effectué.",
        why: "Sans preuve d'exécution réelle, le flux billing complet est non validé. Premier vrai paiement = risque d'incident non détecté.",
        evidence: cap.details,
        priority: "high",
        impact: "revenue",
        estimatedMinutes: 15,
        riskIfIgnored: "high",
        category: "testing",
        executableInLovable: false,
        cta: "Lancer bash scripts/verify-stripe-webhook.sh",
      };

    case "pgCronReactivation":
      return {
        ...baseAction as NextBestAction,
        id: "nba_cron_reactivation",
        title: "Créer les crons pg_cron réactivation + payout",
        description: "Scripts SQL prêts dans supabase/infra/scheduled-jobs.md — non exécutés en base.",
        why: "Sans crons actifs, la réactivation et les payouts ne s'exécutent que manuellement. Risque de leads dormants non relancés.",
        evidence: cap.details,
        priority: "medium",
        impact: "reliability",
        estimatedMinutes: 10,
        riskIfIgnored: "medium",
        category: "cron",
        executableInLovable: false,
        cta: "Exécuter scripts/verify-crons.sh puis les SQLs dans Backend → Run SQL",
      };

    case "stripeCheckout":
      return {
        ...baseAction as NextBestAction,
        id: "nba_stripe_checkout_test",
        title: "Tester un checkout réel Stripe",
        description: "create-checkout edge fn est déployée — aucun achat réel effectué.",
        why: "La confiance dans le flux billing requiert au moins un test E2E réussi avant d'ouvrir aux premiers utilisateurs payants.",
        evidence: cap.details,
        priority: "high",
        impact: "revenue",
        estimatedMinutes: 10,
        riskIfIgnored: "high",
        category: "billing",
        executableInLovable: false,
        cta: "Tester avec carte Stripe 4242 4242 4242 4242",
        ctaLink: "/pricing",
      };

    default:
      return {
        ...baseAction as NextBestAction,
        id: `nba_${cap.key}`,
        title: cap.cta || `Corriger : ${cap.label}`,
        description: cap.summary,
        why: `Capability "${cap.label}" est en status "${cap.status}" — niveau ${cap.blockingLevel}.`,
        evidence: cap.details,
        priority: cap.blockingLevel === "critical" ? "critical" : cap.blockingLevel === "high" ? "high" : "medium",
        impact: "reliability",
        estimatedMinutes: 15,
        riskIfIgnored: cap.blockingLevel as NextBestAction["riskIfIgnored"],
        category: "infrastructure",
        executableInLovable: false,
        cta: cap.cta || `Corriger ${cap.label}`,
        ctaLink: cap.ctaLink,
      };
  }
}

// ── STATIC ACTIONS (non capability-driven) ────────────────────────────────────

const STATIC_ACTIONS: NextBestAction[] = [
  {
    id: "nba_load_test",
    title: "Valider la tenue en charge (k6)",
    description: "Le script k6 est prêt — aucun load test n'a été exécuté.",
    why: "Sans validation de charge, les prétentions de scalabilité ne sont pas prouvées.",
    evidence: "scripts/load-test-k6.js PROUVÉ PAR LE REPO. NON PROUVÉ PAR EXÉCUTION.",
    priority: "low",
    impact: "scale",
    estimatedMinutes: 30,
    riskIfIgnored: "medium",
    category: "testing",
    executableInLovable: false,
    cta: "k6 run scripts/load-test-k6.js",
    source: "manual",
  },
  {
    id: "nba_smoke_test",
    title: "Exécuter le smoke test complet",
    description: "scripts/smoke-test.sh valide toutes les edge functions critiques.",
    why: "Aucune preuve d'exécution des edge functions avant beta réelle.",
    evidence: "scripts/smoke-test.sh PROUVÉ PAR LE REPO. NON PROUVÉ PAR EXÉCUTION.",
    priority: "medium",
    impact: "reliability",
    estimatedMinutes: 5,
    riskIfIgnored: "medium",
    category: "testing",
    executableInLovable: false,
    cta: "bash scripts/smoke-test.sh $URL $KEY",
    source: "manual",
  },
];

// ── ENGINE ────────────────────────────────────────────────────────────────────

export function computeNBA(): NBAResult {
  const now = new Date().toISOString();

  // Prioritize: critical blockers → high blockers → partial capabilities → static
  const blockedCaps = CAPABILITY_MATRIX.filter(
    (c) => c.status === "blocked" || (c.status === "partial" && c.blocking)
  ).sort((a, b) => {
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
    return (order[a.blockingLevel] || 4) - (order[b.blockingLevel] || 4);
  });

  const capActions = blockedCaps.map(capToAction);
  const allActions = [...capActions, ...STATIC_ACTIONS];

  // Deduplicate
  const seen = new Set<string>();
  const uniqueActions = allActions.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  const sorted = uniqueActions.sort((a, b) => {
    const prio: Record<ActionPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return prio[a.priority] - prio[b.priority];
  });

  const [primary, ...rest] = sorted;
  const secondary = rest.slice(0, 3);

  const blockerCount = BLOCKING_CAPABILITIES.length;
  const blockerSummary =
    blockerCount === 0
      ? "Aucun bloquant critique détecté."
      : `${blockerCount} capacité(s) bloquante(s) : ${BLOCKING_CAPABILITIES.map((c) => c.label).join(", ")}`;

  return {
    primary: primary || {
      id: "nba_all_good",
      title: "Exercer le flux Stripe end-to-end",
      description: "Valider le premier paiement réel avec carte de test Stripe.",
      why: "Aucun bloquant critique détecté. L'action la plus à valeur est la preuve d'exécution billing.",
      evidence: "stripeWebhook status=partial — NON PROUVÉ PAR EXÉCUTION.",
      priority: "medium",
      impact: "revenue",
      estimatedMinutes: 15,
      riskIfIgnored: "medium",
      category: "testing",
      executableInLovable: false,
      cta: "bash scripts/verify-stripe-webhook.sh",
      source: "manual",
    },
    secondary,
    computedAt: now,
    blockerCount,
    blockerSummary,
  };
}
