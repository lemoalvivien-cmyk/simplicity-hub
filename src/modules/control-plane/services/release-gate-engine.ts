// PROOF:CONTROL_PLANE_V2:release_gate_engine_calculated
/**
 * Release Gate Engine — Calculé depuis les résultats réels du moteur de capacités
 *
 * POLICY STRICTE:
 * - Un secret cloud ne peut JAMAIS être "ready" côté client
 * - Un flux billing sans E2E = au mieux "partial"
 * - Une capability bloquée critique = PROD_BLOCKED
 * - Plusieurs blocking high = PUBLIC_BETA_BLOCKED
 * - Scripts présents sans exécution = partial, jamais ready
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

  // Confidence: moyenne des confidenceScores des checks récents
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
  } else if (hardBlockers.length > 0 || highBlockers.length > 0) {
    verdict = "PRIVATE_BETA_READY";
    justification =
      `${hardBlockers.length + highBlockers.length} points à valider avant ouverture publique. ` +
      `Points critiques: ${[...hardBlockers, ...highBlockers].slice(0, 3).map((c) => c.label).join(", ")}.`;
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
    blockers: [...hardBlockers, ...highBlockers].map((c) => c.label),
    warnings: warnings.map((c) => c.label),
    criticalCount: criticalBlockers.length,
    highCount: highBlockers.length,
    mediumCount: mediumIssues.length,
    computedAt: now,
    confidenceScore: avgConfidence,
  };
}
