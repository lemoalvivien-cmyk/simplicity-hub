// PROOF:CONTROL_PLANE_V2:use_revenue_leaks_hook
import { useQuery } from "@tanstack/react-query";
import { computeRevenueLeaks } from "../services/revenue-leak-engine";

export function useRevenueLeaks() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["revenue-leaks"],
    queryFn: computeRevenueLeaks,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    result: data ?? { primary: null, secondary: [], computedAt: new Date().toISOString(), totalEstimatedLoss: 0 },
    loading: isLoading,
    error: error ? String(error) : null,
    refetch,
  };
}
