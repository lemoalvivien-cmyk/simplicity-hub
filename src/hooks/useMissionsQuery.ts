/**
 * TanStack Query v5 hooks — missions
 * Thin wrapper over missionsService with server-side pagination + error handling.
 * Components use these hooks; they NEVER call supabase or missionsService directly.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchMissions,
  fetchMissionById,
  type MissionFilters,
} from "@/services/missionsService";
import { supabase } from "@/integrations/supabase/client";

// ── Query keys (centralised so invalidations are consistent) ─────────────────
export const missionKeys = {
  all: ["missions"] as const,
  list: (userId: string, filters: MissionFilters) =>
    ["missions", "list", userId, filters] as const,
  detail: (id: string) => ["missions", "detail", id] as const,
};

// ── List with pagination ──────────────────────────────────────────────────────
export function useMissions(filters: MissionFilters = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: missionKeys.list(user?.id ?? "", filters),
    queryFn: () => fetchMissions(user!.id, filters),
    enabled: !!user,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

// ── Single mission ────────────────────────────────────────────────────────────
export function useMission(id: string | undefined) {
  return useQuery({
    queryKey: missionKeys.detail(id ?? ""),
    queryFn: () => fetchMissionById(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

// ── Create mission ────────────────────────────────────────────────────────────
export function useCreateMission() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      titre: string;
      description?: string;
      secteur?: string;
      zone?: string;
      recompense?: string;
    }) => {
      const { data, error } = await supabase
        .from("missions")
        .insert({ ...payload, entreprise_id: user!.id, statut: "active" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: missionKeys.all });
    },
  });
}
