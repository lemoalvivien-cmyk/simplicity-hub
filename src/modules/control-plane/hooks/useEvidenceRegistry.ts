// PROOF:CONTROL_PLANE_V2:use_evidence_registry_hook
import { useQuery } from "@tanstack/react-query";
import { buildEvidenceRegistry } from "../services/evidence-engine";

export function useEvidenceRegistry() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["evidence-registry"],
    queryFn: buildEvidenceRegistry,
    staleTime: 90 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    records: data ?? [],
    loading: isLoading,
    error: error ? String(error) : null,
    refetch,
  };
}
