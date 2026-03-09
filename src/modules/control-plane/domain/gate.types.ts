// PROOF:CONTROL_PLANE_V2:gate_types_domain
/**
 * Release Gate Types — Verdicts calculés, jamais hardcodés
 */

export type ReleaseVerdict =
  | "PROD_BLOCKED"
  | "PUBLIC_BETA_BLOCKED"
  | "PRIVATE_BETA_READY"
  | "PRIVATE_BETA_POSSIBLE"
  | "INTERNAL_TEST"
  | "DEV_ONLY";

export interface ReleaseGateResult {
  verdict: ReleaseVerdict;
  justification: string;
  blockers: string[];             // labels des capabilities bloquantes
  warnings: string[];             // labels des capabilities partielles non-bloquantes
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  computedAt: string;             // ISO string
  confidenceScore: number;        // 0–100, basé sur la fraîcheur des checks
}

export type ReleaseGatePolicy = {
  // Un secret cloud ne peut JAMAIS être "ready" côté client
  secretsAreNeverReady: true;
  // Un flux billing non exercé = au mieux "partial"
  billingRequiresE2EProof: true;
  // Présence de script sans exécution = partial, jamais ready
  scriptPresenceIsPartial: true;
  // .env dans le repo = fail hygiène
  envFileInRepoIsFail: true;
};
