/**
 * Service layer — gains
 * Centralises all Supabase queries for gains (earnings).
 * UI must import from here, never call supabase directly in components.
 */
import { supabase } from "@/integrations/supabase/client";

export interface GainsFilters {
  statut?: string;
  page?: number;
  pageSize?: number;
}

export interface Gain {
  id: string;
  facilitateur_id: string;
  mission_id: string | null;
  introduction_id: string | null;
  montant: number | null;
  statut: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface GainsPage {
  data: Gain[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totalMontant: number;
}

export async function fetchGains(
  userId: string,
  filters: GainsFilters = {}
): Promise<GainsPage> {
  const { page = 1, pageSize = 20, statut } = filters;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("gains")
    .select("*", { count: "exact" })
    .eq("facilitateur_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (statut) query = query.eq("statut", statut);

  const { data, error, count } = await query;

  if (error) throw error;

  const gains = (data ?? []) as Gain[];
  const totalMontant = gains.reduce((acc, g) => acc + (g.montant ?? 0), 0);

  return {
    data: gains,
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
    totalMontant,
  };
}
