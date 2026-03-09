// PROOF:CONTROL_PLANE_V2:nba_engine_from_capabilities
/**
 * Next Best Action Engine — Calculé depuis les capabilities réelles
 */

import type { Capability } from "../domain/capability.types";
import type { NextBestAction, NBAResult } from "../domain/action.types";

function capToAction(cap: Capability): NextBestAction {
  const base = {
    linkedCapabilityKey: cap.key,
    evidence: cap.details,
    isInternal: false,
  };

  switch (cap.key) {
    case "stripeCustomerPortal":
      return {
        ...base, id: "nba_stripe_portal",
        title: "Activer le Customer Portal Stripe",
        description: "Gestion d'abonnements inutilisable sans activation.",
        whyNow: "Bloquant pour tout utilisateur payant qui veut gérer son abonnement.",
        priority: "high", impactRevenue: 90, impactRelease: 80, impactOps: 30, timeToExecuteMin: 5,
        cta: "Activer dans Stripe Dashboard",
        ctaLink: "https://dashboard.stripe.com/settings/billing/portal",
      };
    case "stripeWebhook":
      return {
        ...base, id: "nba_stripe_webhook_e2e",
        title: "Exercer le flux Stripe end-to-end",
        description: "Aucun checkout réel effectué — flux billing non validé.",
        whyNow: "Sans E2E, le premier vrai paiement peut échouer silencieusement.",
        priority: "high", impactRevenue: 95, impactRelease: 85, impactOps: 40, timeToExecuteMin: 15,
        cta: "bash scripts/verify-stripe-webhook.sh",
      };
    case "stripeCheckout":
      return {
        ...base, id: "nba_checkout_test",
        title: "Tester un checkout Stripe réel",
        description: "create-checkout déployée — aucun achat réel effectué.",
        whyNow: "Confiance billing requiert au moins 1 test E2E avant ouverture.",
        priority: "high", impactRevenue: 90, impactRelease: 80, impactOps: 20, timeToExecuteMin: 10,
        cta: "Tester avec carte 4242", ctaLink: "/pricing",
      };
    case "pgCronReactivation":
      return {
        ...base, id: "nba_cron_reactivation",
        title: "Créer les crons pg_cron manquants",
        description: "Scripts SQL prêts — non exécutés en base.",
        whyNow: "Sans crons, réactivation et payouts sont manuels uniquement.",
        priority: "medium", impactRevenue: 60, impactRelease: 50, impactOps: 80, timeToExecuteMin: 10,
        cta: "Exécuter SQL dans Backend → Run SQL",
      };
    default:
      return {
        ...base,
        id: `nba_${cap.key}`,
        title: cap.cta || `Corriger : ${cap.label}`,
        description: cap.summary,
        whyNow: `Capability "${cap.label}" en status "${cap.status}"`,
        priority: cap.blockingLevel === "critical" ? "critical" : cap.blockingLevel === "high" ? "high" : "medium",
        impactRevenue: 30, impactRelease: 40, impactOps: 30, timeToExecuteMin: 15,
        cta: cap.cta || `Corriger ${cap.label}`, ctaLink: cap.ctaLink,
      };
  }
}

export function computeNBAFromCapabilities(capabilities: Capability[]): NBAResult {
  const now = new Date().toISOString();

  const actionable = capabilities
    .filter((c) => c.status === "blocked" || (c.status === "partial" && c.blocking))
    .sort((a, b) => {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
      return (order[a.blockingLevel] || 4) - (order[b.blockingLevel] || 4);
    });

  const actions = actionable.map(capToAction);

  // Sort by combined score
  actions.sort((a, b) => {
    const scoreA = a.impactRevenue * 0.5 + a.impactRelease * 0.3 + a.impactOps * 0.2;
    const scoreB = b.impactRevenue * 0.5 + b.impactRelease * 0.3 + b.impactOps * 0.2;
    return scoreB - scoreA;
  });

  const [primary, ...rest] = actions;

  return {
    primary: primary ?? {
      id: "nba_all_good", title: "Exercer le flux Stripe E2E",
      description: "Aucun bloquant critique. Valider le premier paiement réel.",
      whyNow: "Preuve d'exécution billing = prochaine étape vers la beta.",
      priority: "medium", impactRevenue: 90, impactRelease: 80, impactOps: 20,
      timeToExecuteMin: 15, isInternal: false,
      cta: "bash scripts/verify-stripe-webhook.sh", evidence: "Aucun checkout réel effectué.",
    },
    secondary: rest.slice(0, 3),
    computedAt: now,
    blockerCount: actionable.length,
  };
}
