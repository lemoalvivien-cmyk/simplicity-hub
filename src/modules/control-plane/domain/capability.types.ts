// PROOF:CONTROL_PLANE_V2:capability_types_domain
/**
 * Capability Types — Runtime Truth Engine V2
 *
 * Règle absolue:
 * - "ready" uniquement si preuve réelle calculée
 * - secrets cloud toujours "external-config", jamais "ready" côté client
 * - "partial" si code présent mais runtime non prouvé
 * - "unknown" si impossible à vérifier depuis ce contexte
 */

export type CapabilityStatus = "ready" | "partial" | "blocked" | "unknown";

export type EvidenceType =
  | "code"            // prouvé par la présence dans le code source
  | "runtime"         // prouvé par comportement observé en base (DB/edge fn response)
  | "external-config" // dépend d'une config dans un service externe (Stripe, DNS...)
  | "manual-step"     // nécessite une action manuelle documentée
  | "unknown";        // impossible à déterminer dans ce contexte

export type BlockingLevel = "critical" | "high" | "medium" | "low" | "none";

export type CapabilityGroup =
  | "Billing"
  | "Crons"
  | "OpenClaw"
  | "Sécurité"
  | "Lancement"
  | "Infrastructure"
  | "Tests";

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
  group: CapabilityGroup;
  status: CapabilityStatus;
  evidenceType: EvidenceType;
  summary: string;
  details: string;
  blocking: boolean;
  blockingLevel: BlockingLevel;
  cta?: string;
  ctaLink?: string;
  lastCheckedAt?: string;       // ISO string, quand le check a été calculé
  staleAfterMs?: number;        // durée avant péremption
  confidenceScore?: number;     // 0–100, degré de confiance dans le verdict
  source?: string;              // source de la preuve (table, fn, fichier...)
}

export interface CapabilityCheckResult {
  key: CapabilityKey;
  status: CapabilityStatus;
  evidenceType: EvidenceType;
  detail: string;
  checkedAt: string;
  confidenceScore: number;
  source: string;
}
