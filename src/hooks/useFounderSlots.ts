/**
 * useFounderSlots — re-exports from FounderSlotsContext singleton.
 * All consumers share ONE fetch + ONE realtime channel → no duplicate requests.
 */
export type { FounderSlotsState } from "@/contexts/FounderSlotsContext";
export { useFounderSlotsContext as useFounderSlots } from "@/contexts/FounderSlotsContext";
