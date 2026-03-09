// PROOF:CONTROL_PLANE_V3:release_gate_engine_billing_first
/**
 * Release Gate Engine — Calculé depuis les résultats réels du moteur de capacités
 *
 * POLICY STRICTE V3 — BILLING-FIRST :
 * - RÈGLE ABSOLUE : 0 full_proof_event observé → jamais PRIVATE_BETA_READY
 * - Un secret cloud ne peut JAMAIS être "ready" côté client
 * - Un flux billing sans E2E = au mieux "partial"
 * - Une capability bloquée critique = PROD_BLOCKED
 * - Plusieurs blocking high = PUBLIC_BETA_BLOCKED
 * - Scripts présents sans exécution = partial, jamais ready
 * - Customer Portal non activé = billing incomplet → BETA_BLOCKED
 * - Stripe webhook non exercé = flux revenu non prouvé
 *
 * billingProofContext est optionnel — si fourni, il pilote directement le verdict.
 * Si absent, on se rabat sur les capabilities statiques (comportement V2 conservé).
 */

import type { Capability } from "../domain/capability.types";
import type { ReleaseGateResult, ReleaseVerdict } from "../domain/gate.types";

export interface BillingProofContext {
  /** Nombre d'événements billing_events en base */
  totalBillingEvents: number;
  /** Nombre de proof_level='full' en base — RÈGLE ABSOLUE : 0 = jamais PRIVATE_BETA_READY */
  fullProofEvents: number;
  /** Nombre de checkout.session.completed reçus */
  checkoutCompletedEvents: number;
  /** Nombre de preuve partielle (checkout + sub, quota non consommé) */
  partialProofEvents: number;
  /** Nombre d'événements cassés (sans corrélation) */
  brokenEvents: number;
  /** Nombre de launch_quota_consumed */
  quotaConsumedCount: number;
  /** Slots utilisés / total */
  quotaUsedSlots: number | null;
  quotaTotalSlots: number | null;
}

export function computeReleaseGate(
  capabilities: Capability[],
  billingProof?: BillingProofContext
): ReleaseGateResult {
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

  // ── BILLING PROOF GATE — PRIORITAIRE SUR TOUT ─────────────────────────────
  // RÈGLE ABSOLUE : sans full_proof_event observé, jamais PRIVATE_BETA_READY.
  // Chaque champ du BillingProofContext pilote le verdict de façon explicite.
  const billingCtxPresent = billingProof !== undefined;
  const fullProofCount     = billingProof?.fullProofEvents          ?? 0;
  const checkoutCount      = billingProof?.checkoutCompletedEvents  ?? 0;
  const brokenCount        = billingProof?.brokenEvents             ?? 0;
  const partialCount       = billingProof?.partialProofEvents       ?? 0;
  const totalEvents        = billingProof?.totalBillingEvents       ?? 0;

  // 0 full_proof = gate bloqué (ne peut être PRIVATE_BETA_READY)
  const billingProofBlocked = billingCtxPresent && fullProofCount === 0;
  // chaîne partiellement exercée (webhooks reçus mais pas de full proof)
  const billingRuntime = billingCtxPresent && totalEvents > 0 && fullProofCount === 0;
  // chaîne cassée détectée
  const billingBroken = billingCtxPresent && brokenCount > 0 && fullProofCount === 0;

  let verdict: ReleaseVerdict;
  let justification: string;

  if (criticalBlockers.length > 0) {
    verdict = "PROD_BLOCKED";
    justification = `${criticalBlockers.length} bloquant(s) critique(s): ${criticalBlockers.map((c) => c.label).join(", ")}`;
  } else if (hardBlockers.length > 0 && highBlockers.length > 2) {
    verdict = "PUBLIC_BETA_BLOCKED";
    justification = `${hardBlockers.length} hard blockers + ${highBlockers.length} high: ${highBlockers.slice(0, 2).map((c) => c.label).join(", ")} et autres`;
  } else if (billingNotReady.length >= 2) {
    // POLICY: 2+ billing capabilities non ready = beta bloquée pour utilisateurs payants
    verdict = "PUBLIC_BETA_BLOCKED";
    justification =
      `Billing incomplet: ${billingNotReady.map((c) => c.label).join(", ")}. ` +
      `Flux paiement non prouvé E2E — ouverture publique bloquée.`;
  } else if (billingBroken) {
    // Chaîne cassée détectée : blocage plus sévère que simplement "non exercé"
    verdict = "PUBLIC_BETA_BLOCKED";
    justification =
      `Billing cassé: ${brokenCount} événement(s) sans corrélation. ` +
      `total_events=${totalEvents}, checkouts=${checkoutCount}, partial=${partialCount}. ` +
      `Diagnostiquer via /admin/payments → BillingFailurePanel.`;
  } else if (billingProofBlocked) {
    // 0 full_proof_event = au mieux PRIVATE_BETA_POSSIBLE — jamais READY
    verdict = "PRIVATE_BETA_POSSIBLE";
    if (!billingCtxPresent) {
      justification =
        "Billing proof context non disponible (non-admin ou RPC inaccessible). " +
        "Impossible de certifier le flux revenu.";
    } else if (totalEvents === 0) {
      justification =
        "Billing proof gate: 0 événement billing reçu. Architecture CODE_READY, runtime non exercé. " +
        "Exécuter scripts/verify-stripe-webhook.sh pour atteindre PRIVATE_BETA_READY.";
    } else {
      // Events reçus mais pas de full proof
      justification =
        `Billing partiellement exercé: ${totalEvents} event(s), ${checkoutCount} checkout(s) complété(s), ` +
        `${partialCount} partiel(s). Aucun full_proof_event. ` +
        `Tester checkout complet avec offre launch sur /pricing.`;
    }
  } else if (hardBlockers.length > 0 || highBlockers.length > 0) {
    verdict = "PRIVATE_BETA_POSSIBLE";
    justification =
      `${hardBlockers.length + highBlockers.length} points à valider avant ouverture publique. ` +
      `Points: ${[...hardBlockers, ...highBlockers].slice(0, 3).map((c) => c.label).join(", ")}.`;
  } else if (mediumIssues.length > 3) {
    verdict = "PRIVATE_BETA_POSSIBLE";
    justification = `${mediumIssues.length} points medium non résolus. Beta privée possible avec monitoring.`;
  } else {
    // Seul chemin vers PRIVATE_BETA_READY : full_proof_events > 0 observé
    verdict = "PRIVATE_BETA_READY";
    justification = billingProof && fullProofCount > 0
      ? `${fullProofCount} preuve(s) E2E billing confirmée(s). ` +
        `Quota: ${billingProof.quotaUsedSlots ?? "?"}/${billingProof.quotaTotalSlots ?? "?"} slots. ` +
        `Tous bloquants critiques résolus. Beta privée autorisée.`
      : "Tous les bloquants critiques résolus. Beta privée possible.";
  }

  return {
    verdict,
    justification,
    blockers: [...hardBlockers, ...highBlockers, ...billingNotReady]
      .map((c) => c.label)
      .filter((v, i, a) => a.indexOf(v) === i),
    warnings: [
      ...warnings.map((c) => c.label),
      ...(billingProofBlocked ? [`Billing E2E non prouvé — full_proof_events=${fullProofCount}`] : []),
      ...(billingRuntime && checkoutCount > 0 && fullProofCount === 0 ? [`Checkout(s) reçu(s) mais pas de full_proof — vérifier quotaEngine`] : []),
    ],
    criticalCount: criticalBlockers.length,
    highCount: highBlockers.length,
    mediumCount: mediumIssues.length,
    computedAt: now,
    confidenceScore: avgConfidence,
  };
}
