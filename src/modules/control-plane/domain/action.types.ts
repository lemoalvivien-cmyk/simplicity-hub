// PROOF:CONTROL_PLANE_V2:action_types_domain
export type ActionPriority = "critical" | "high" | "medium" | "low";

export interface NextBestAction {
  id: string;
  title: string;
  description: string;
  whyNow: string;
  evidence: string;
  priority: ActionPriority;
  impactRevenue: number;   // 0–100
  impactRelease: number;   // 0–100
  impactOps: number;       // 0–100
  timeToExecuteMin: number;
  isInternal: boolean;
  cta: string;
  ctaLink?: string;
  linkedCapabilityKey?: string;
}

export interface NBAResult {
  primary: NextBestAction;
  secondary: NextBestAction[];
  computedAt: string;
  blockerCount: number;
}
