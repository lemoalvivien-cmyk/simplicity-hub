/**
 * TanStack Query v5 hooks — launch quota
 * Wraps Zustand store read (store owns fetch + realtime).
 * Components use this hook for consistent loading/error states.
 */
import { useFounderSlots } from "@/hooks/useFounderSlots";

// Re-export Zustand-backed hook under a query-consistent name
export function useQuotaQuery() {
  return useFounderSlots();
}
