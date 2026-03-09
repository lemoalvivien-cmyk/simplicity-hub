// PROOF:CONTROL_PLANE_V2:use_nba_hook
import { useMemo } from "react";
import { computeNBAFromCapabilities } from "../services/next-best-action-engine";
import type { Capability } from "../domain/capability.types";

export function useNextBestAction(capabilities: Capability[]) {
  return useMemo(() => computeNBAFromCapabilities(capabilities), [capabilities]);
}
