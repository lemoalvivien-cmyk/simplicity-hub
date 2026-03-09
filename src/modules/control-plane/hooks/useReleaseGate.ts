// PROOF:CONTROL_PLANE_V3:use_release_gate_hook_billing_first
import { useMemo } from "react";
import { computeReleaseGate } from "../services/release-gate-engine";
import type { BillingProofContext } from "../services/release-gate-engine";
import type { Capability } from "../domain/capability.types";

export function useReleaseGate(capabilities: Capability[], billingProof?: BillingProofContext) {
  return useMemo(() => computeReleaseGate(capabilities, billingProof), [capabilities, billingProof]);
}
