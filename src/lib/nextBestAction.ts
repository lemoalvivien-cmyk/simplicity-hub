/**
 * nextBestAction.ts — Simplified stub (capabilityMatrix removed).
 * Returns a static "all good" result; extend later with real DB checks.
 */

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

export function computeNBA(): NBAResult {
  return {
    primary: {
      id: "nba_stripe_webhook_e2e",
      title: "Exercer le flux Stripe end-to-end",
      description: "Valider le premier paiement réel avec carte de test Stripe.",
      why: "Le flux billing complet doit être validé avant d'ouvrir aux premiers utilisateurs payants.",
      evidence: "stripe-webhook edge function déployée — NON PROUVÉ PAR EXÉCUTION.",
      priority: "high",
      impact: "revenue",
      estimatedMinutes: 15,
      riskIfIgnored: "high",
      category: "billing",
      executableInLovable: false,
      cta: "Tester avec carte Stripe 4242 4242 4242 4242",
      ctaLink: "/pricing",
      source: "manual",
    },
    secondary: [
      {
        id: "nba_smoke_test",
        title: "Exécuter le smoke test complet",
        description: "scripts/smoke-test.sh valide toutes les edge functions critiques.",
        why: "Aucune preuve d'exécution des edge functions avant beta réelle.",
        evidence: "scripts/smoke-test.sh présent — NON PROUVÉ PAR EXÉCUTION.",
        priority: "medium",
        impact: "reliability",
        estimatedMinutes: 5,
        riskIfIgnored: "medium",
        category: "testing",
        executableInLovable: false,
        cta: "bash scripts/smoke-test.sh $URL $KEY",
        source: "manual",
      },
    ],
    computedAt: new Date().toISOString(),
    blockerCount: 0,
    blockerSummary: "Analyse manuelle requise — capabilityMatrix supprimé.",
  };
}
