/**
 * TanStack Query v5 hooks — gains
 * Server-side pagination + error handling.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchGains, type GainsFilters } from "@/services/gainsService";

export const gainKeys = {
  all: ["gains"] as const,
  list: (userId: string, filters: GainsFilters) =>
    ["gains", "list", userId, filters] as const,
};

export function useGains(filters: GainsFilters = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: gainKeys.list(user?.id ?? "", filters),
    queryFn: () => fetchGains(user!.id, filters),
    enabled: !!user,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}
