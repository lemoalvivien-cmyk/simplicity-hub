/**
 * policyEngine.ts — Client-side mirror of the DB policy function.
 *
 * Used for optimistic UI decisions without a DB round-trip.
 * The DB function `apply_lead_policy` is the authoritative source;
 * this is a deterministic mirror for frontend state rendering.
 *
 * Rules (must stay in sync with DB function apply_lead_policy):
 *  1. confirmed_duplicate → duplicate / no NBA
 *  2. intro validated + contact linked → ready_for_opportunity / promote_to_opportunity
 *  3. has email + company → ready_for_action / contact_email_draft
 *  4. missing name or (no email AND no phone) → needs_enrichment / enrich_lead
 *  5. default → pending_review / review_lead
 */

import type { QualificationStatus, NextBestAction } from "./leadPipeline";

export interface PolicyInput {
  dedupStatus: string;
  sourceType: string;
  introductionValidated?: boolean;
  hasLinkedContact?: boolean;
  personName?: string | null;
  personEmail?: string | null;
  phone?: string | null;
  companyName?: string | null;
}

export interface PolicyOutput {
  qualificationStatus: QualificationStatus;
  nextBestAction: NextBestAction | null;
  reason: string;
}

export function evaluateLeadPolicy(input: PolicyInput): PolicyOutput {
  // Rule 1: duplicate
  if (input.dedupStatus === "confirmed_duplicate") {
    return {
      qualificationStatus: "duplicate",
      nextBestAction: null,
      reason: "Lead déjà présent dans le pipeline (email identique).",
    };
  }

  // Rule 2: validated introduction with linked contact
  if (
    input.sourceType === "introduction" &&
    input.introductionValidated &&
    input.hasLinkedContact
  ) {
    return {
      qualificationStatus: "ready_for_opportunity",
      nextBestAction: "promote_to_opportunity",
      reason: "Introduction validée avec contact lié — prêt pour une opportunité.",
    };
  }

  // Rule 3: has email + company
  if (input.personEmail && input.companyName) {
    return {
      qualificationStatus: "ready_for_action",
      nextBestAction: "contact_email_draft",
      reason: "Email et entreprise présents — action directe possible.",
    };
  }

  // Rule 4: missing critical data
  if (!input.personName || (!input.personEmail && !input.phone)) {
    return {
      qualificationStatus: "needs_enrichment",
      nextBestAction: "enrich_lead",
      reason: "Données insuffisantes — enrichissement nécessaire.",
    };
  }

  // Rule 5: default
  return {
    qualificationStatus: "pending_review",
    nextBestAction: "review_lead",
    reason: "Lead reçu — examen manuel requis.",
  };
}

// ─── NBA display config ───────────────────────────────────────

export const NBA_CONFIG: Record<
  NonNullable<NextBestAction>,
  { label: string; description: string; urgency: "high" | "normal" | "low" }
> = {
  review_lead: {
    label: "Examiner ce lead",
    description: "Vérifier les données et décider de la suite.",
    urgency: "normal",
  },
  enrich_lead: {
    label: "Compléter les données",
    description: "Email ou téléphone manquant — demandez à l'apporteur.",
    urgency: "normal",
  },
  contact_email_draft: {
    label: "Rédiger un email",
    description: "Email disponible — préparez un premier contact.",
    urgency: "high",
  },
  contact_manual_call: {
    label: "Appeler manuellement",
    description: "Un appel direct est la meilleure prochaine étape.",
    urgency: "high",
  },
  request_facilitator_precision: {
    label: "Demander précisions",
    description: "Recontactez le facilitateur pour plus de contexte.",
    urgency: "low",
  },
  promote_to_opportunity: {
    label: "Créer l'opportunité",
    description: "Toutes les conditions sont réunies pour une opportunité commerciale.",
    urgency: "high",
  },
};
