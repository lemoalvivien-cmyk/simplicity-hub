/**
 * FounderSlotsContext — DEPRECATED shell kept for backward compat.
 * All state now lives in Zustand (src/stores/founderSlotsStore.ts).
 * This file re-exports the Zustand hook under the old context API so
 * existing consumers don't need to change.
 *
 * @deprecated — use `useFounderSlots` from `@/hooks/useFounderSlots` directly.
 */
import React from "react";
import { initFounderSlots } from "@/stores/founderSlotsStore";
import { useFounderSlots } from "@/hooks/useFounderSlots";

export type { FounderSlotsState } from "@/stores/founderSlotsStore";

/** Thin provider: just initializes the Zustand store once at mount. */
export function FounderSlotsProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    return initFounderSlots();
  }, []);
  return <>{children}</>;
}

/** @deprecated — use `useFounderSlots` from `@/hooks/useFounderSlots` */
export function useFounderSlotsContext() {
  return useFounderSlots();
}
