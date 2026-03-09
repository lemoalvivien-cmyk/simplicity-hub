import { useMemo } from "react";
import { computeNBA, type NBAResult } from "@/lib/nextBestAction";
import {
  CAPABILITY_MATRIX,
  getCapabilityStatusSummary,
  getReleaseGate,
  CAPABILITIES_BY_GROUP,
  type Capability,
  type CapabilityStatus,
} from "@/lib/capabilityMatrix";

export function useCapabilityMatrix() {
  const summary = useMemo(() => getCapabilityStatusSummary(), []);
  const releaseGate = useMemo(() => getReleaseGate(), []);
  return { matrix: CAPABILITY_MATRIX, byGroup: CAPABILITIES_BY_GROUP, summary, releaseGate };
}

export function useNextBestAction(): NBAResult {
  return useMemo(() => computeNBA(), []);
}

export function useReleaseGate() {
  return useMemo(() => getReleaseGate(), []);
}
