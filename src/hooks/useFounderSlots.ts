/**
 * useFounderSlots — reads from Zustand store (founderSlotsStore).
 * Uses individual selectors to avoid infinite re-render loops from object identity.
 */
import { useFounderSlotsStore } from "@/stores/founderSlotsStore";
import { useShallow } from "zustand/react/shallow";
export type { FounderSlotsState } from "@/stores/founderSlotsStore";

export function useFounderSlots() {
  return useFounderSlotsStore(
    useShallow((s) => ({
      remaining: s.remaining,
      total: s.total,
      usedPct: s.usedPct,
      isUrgent: s.isUrgent,
      isSoldOut: s.isSoldOut,
      loading: s.loading,
    }))
  );
}
