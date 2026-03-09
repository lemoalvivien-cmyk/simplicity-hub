// PROOF:CONTROL_PLANE_V2:use_release_gate_hook
import { useMemo } from "react";
import { computeReleaseGate } from "../services/release-gate-engine";
import type { Capability } from "../domain/capability.types";

export function useReleaseGate(capabilities: Capability[]) {
  return useMemo(() => computeReleaseGate(capabilities), [capabilities]);
}
