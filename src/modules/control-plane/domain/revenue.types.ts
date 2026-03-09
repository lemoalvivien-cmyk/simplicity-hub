// PROOF:CONTROL_PLANE_V2:revenue_types_domain
export type LeakSeverity = "critical" | "high" | "medium" | "low";

export interface RevenueLeak {
  id: string;
  leakType: string;
  label: string;
  severity: LeakSeverity;
  estimatedValue: number | null;
  usersAffected: number;
  confidence: number; // 0–100
  evidence: string;
  recommendedAction: string;
  routeTarget?: string;
  blockerIfAny?: string;
}

export interface RevenueLeakResult {
  primary: RevenueLeak | null;
  secondary: RevenueLeak[];
  computedAt: string;
  totalEstimatedLoss: number;
}
