/**
 * useDashboardEntrepriseData
 * ──────────────────────────
 * React Query hook that fetches all data needed by DashboardEntreprise.
 * Centralises loading / error states and provides automatic background refetches.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Mission {
  id: string;
  titre: string;
  statut: string;
}

interface Introduction {
  id: string;
  contact_nom: string;
  statut: string;
}

interface OpenClawBrief {
  id: string;
  summary: string;
  created_at: string;
}

interface OpenClawConfig {
  gateway_url: string | null;
  is_connected: boolean;
}

export interface DashboardEntrepriseData {
  missions: Mission[];
  introductions: Introduction[];
  latestBrief: OpenClawBrief | null;
  aiRecoCount: number;
  gainsCount: number;
  totalGains: number;
  leadsCount: number;
  openclawReady: boolean;
}

async function fetchDashboardEntrepriseData(
  userId: string
): Promise<DashboardEntrepriseData> {
  // Step 1: get mission IDs for the user
  const { data: missionIdRows } = await supabase
    .from("missions")
    .select("id")
    .eq("entreprise_id", userId);

  const missionIds = (missionIdRows ?? []).map((m) => m.id);

  // Step 2: parallel fetches
  const [
    missionsRes,
    introsRes,
    briefRes,
    aiRecoRes,
    gainsCountRes,
    gainsValRes,
    leadsRes,
    configRes,
  ] = await Promise.all([
    supabase
      .from("missions")
      .select("id, titre, statut")
      .eq("entreprise_id", userId)
      .order("created_at", { ascending: false })
      .limit(3),

    missionIds.length > 0
      ? supabase
          .from("introductions")
          .select("id, contact_nom, statut")
          .in("mission_id", missionIds)
          .order("created_at", { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] as Introduction[], error: null }),

    // openclaw_briefs is not yet in generated types — use explicit cast
    (supabase as ReturnType<typeof supabase.from> extends never ? never : typeof supabase)
      .from("openclaw_briefs" as never)
      .select("id, summary, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),

    supabase
      .from("openclaw_recommendations" as never)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "nouvelle")
      .eq("ai_generated", true),

    supabase
      .from("gains")
      .select("id", { count: "exact", head: true })
      .eq("facilitateur_id", userId)
      .in("statut", ["valide", "recu"]),

    supabase
      .from("gains")
      .select("montant")
      .eq("facilitateur_id", userId)
      .in("statut", ["valide", "recu"]),

    supabase
      .from("lead_intakes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("dedup_status", "confirmed_duplicate")
      .in("qualification_status", ["pending_review", "ready_for_action"]),

    supabase
      .from("openclaw_config" as never)
      .select("gateway_url, is_connected")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const briefs = (briefRes as { data: OpenClawBrief[] | null }).data ?? [];
  const cfg = (configRes as { data: OpenClawConfig | null }).data;
  const gainsRows = (gainsValRes.data ?? []) as { montant: number | null }[];

  return {
    missions: (missionsRes.data ?? []) as Mission[],
    introductions: (introsRes.data ?? []) as Introduction[],
    latestBrief: briefs[0] ?? null,
    aiRecoCount: (aiRecoRes as { count: number | null }).count ?? 0,
    gainsCount: gainsCountRes.count ?? 0,
    totalGains: gainsRows.reduce((s, g) => s + (g.montant ?? 0), 0),
    leadsCount: leadsRes.count ?? 0,
    openclawReady: !!cfg?.gateway_url && cfg.is_connected === true,
  };
}

export function useDashboardEntrepriseData(userId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard-entreprise", userId],
    queryFn: () => fetchDashboardEntrepriseData(userId!),
    enabled: !!userId,
    staleTime: 60_000,      // 1 min
    refetchOnWindowFocus: true,
  });
}
