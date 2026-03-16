/**
 * Service layer — missions
 * Centralises all Supabase queries for missions.
 * UI must import from here, never call supabase directly in components.
 */
import { supabase } from "@/integrations/supabase/client";

export interface MissionFilters {
  statut?: string;
  page?: number;
  pageSize?: number;
}

export interface MissionsPage {
  data: Mission[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Mission {
  id: string;
  titre: string;
  statut: string | null;
  secteur: string | null;
  zone: string | null;
  recompense: string | null;
  description: string | null;
  entreprise_id: string;
  type_client_recherche: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchMissions(
  userId: string,
  filters: MissionFilters = {}
): Promise<MissionsPage> {
  const { page = 1, pageSize = 20, statut } = filters;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("missions")
    .select("*", { count: "exact" })
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (statut) query = query.eq("statut", statut);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: (data ?? []) as Mission[],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function fetchMissionById(id: string): Promise<Mission | null> {
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as Mission | null;
}
