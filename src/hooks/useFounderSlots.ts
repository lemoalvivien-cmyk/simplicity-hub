/**
 * useFounderSlots — reads from Zustand store (founderSlotsStore).
 * Zero re-renders unless the selected slice actually changes (subscribeWithSelector).
 * Drop-in replacement: same API as old FounderSlotsContext hook.
 */
import { useFounderSlotsStore, selectSlots } from "@/stores/founderSlotsStore";
export type { FounderSlotsState } from "@/stores/founderSlotsStore";

export function useFounderSlots() {
  return useFounderSlotsStore(selectSlots);
}
