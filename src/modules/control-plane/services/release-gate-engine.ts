// PROOF:CONTROL_PLANE_V2:release_gate_engine_hardened
/**
 * Release Gate Engine — Calculé depuis les résultats réels du moteur de capacités
 *
 * POLICY STRICTE V2:
 * - Un secret cloud ne peut JAMAIS être "ready" côté client
 * - Un flux billing sans E2E = au mieux "partial"
 * - Une capability bloquée critique = PROD_BLOCKED
 * - Plusieurs blocking high = PUBLIC_BETA_BLOCKED
 * - Scripts présents sans exécution = partial, jamais ready
 * - Customer Portal non activé = billing incomplet → BETA_BLOCKED
 * - Stripe webhook non exercé = flux revenu non prouvé
 */

import type { Capability } from "../domain/capability.types";
import type { ReleaseGateResult, ReleaseVerdict } from "../domain/gate.types";

export function computeReleaseGate(capabilities: Capability[]): ReleaseGateResult {
  const now = new Date().toISOString();

  const criticalBlockers = capabilities.filter(
    (c) => c.blockingLevel === "critical" && c.status !== "ready"
  );
  const hardBlockers = capabilities.filter(
    (c) => c.blocking && (c.status === "blocked" || c.status === "unknown")
  );
  const highBlockers = capabilities.filter(
    (c) => c.blockingLevel === "high" && c.status !== "ready"
  );
  const mediumIssues = capabilities.filter(
    (c) => c.blockingLevel === "medium" && c.status !== "ready"
  );
  const warnings = capabilities.filter(
    (c) => c.status === "partial" && !c.blocking
  );

  // POLICY: billing keys that are external-config and not ready = hard penalty
  const billingKeys = ["stripeWebhook", "stripeCheckout", "stripeCustomerPortal"];
  const billingNotReady = capabilities.filter(
    (c) => billingKeys.includes(c.key) && c.status !== "ready"
  );

  // Confidence: average of all confidenceScores
  const withConfidence = capabilities.filter((c) => (c.confidenceScore ?? 0) > 0);
  const avgConfidence =
    withConfidence.length > 0
      ? Math.round(
          withConfidence.reduce((s, c) => s + (c.confidenceScore ?? 0), 0) /
            withConfidence.length
        )
      : 0;

  let verdict: ReleaseVerdict;
  let justification: string;

  if (criticalBlockers.length > 0) {
    verdict = "PROD_BLOCKED";
    justification = `${criticalBlockers.length} bloquant(s) critique(s): ${criticalBlockers.map((c) => c.label).join(", ")}`;
  } else if (hardBlockers.length > 0 && highBlockers.length > 2) {
    verdict = "PUBLIC_BETA_BLOCKED";
    justification = `${hardBlockers.length} hard blockers + ${highBlockers.length} high: ${highBlockers.slice(0, 2).map((c) => c.label).join(", ")} et autres`;
  } else if (billingNotReady.length >= 2) {
    // POLICY: if 2+ billing capabilities are not ready, beta is blocked for paying users
    verdict = "PUBLIC_BETA_BLOCKED";
    justification =
      `Billing incomplet: ${billingNotReady.map((c) => c.label).join(", ")}. ` +
      `Flux paiement non prouvé E2E — ouverture publique bloquée.`;
  } else if (hardBlockers.length > 0 || highBlockers.length > 0) {
    verdict = "PRIVATE_BETA_POSSIBLE";
    justification =
      `${hardBlockers.length + highBlockers.length} points à valider avant ouverture publique. ` +
      `Points: ${[...hardBlockers, ...highBlockers].slice(0, 3).map((c) => c.label).join(", ")}.`;
  } else if (mediumIssues.length > 3) {
    verdict = "PRIVATE_BETA_POSSIBLE";
    justification = `${mediumIssues.length} points medium non résolus. Beta privée possible avec monitoring.`;
  } else {
    verdict = "PRIVATE_BETA_READY";
    justification = "Tous les bloquants critiques résolus. Beta privée possible.";
  }

  return {
    verdict,
    justification,
    blockers: [...hardBlockers, ...highBlockers, ...billingNotReady]
      .map((c) => c.label)
      .filter((v, i, a) => a.indexOf(v) === i), // deduplicate
    warnings: warnings.map((c) => c.label),
    criticalCount: criticalBlockers.length,
    highCount: highBlockers.length,
    mediumCount: mediumIssues.length,
    computedAt: now,
    confidenceScore: avgConfidence,
  };
}
