/**
 * useDashboardFacilitateurData
 * ─────────────────────────────
 * React Query hook for DashboardFacilitateur parallel data fetching.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Gain {
  id: string;
  montant: number | null;
  statut: string | null;
}

interface Mission {
  id: string;
  titre: string;
  secteur: string | null;
  zone: string | null;
  recompense: string | null;
  match_score?: number | null;
}

interface Intro {
  id: string;
  contact_nom: string;
  statut: string | null;
  created_at: string;
  mission_id: string | null;
}

interface Request {
  id: string;
  request_context: string | null;
  openclaw_note: string | null;
}

export interface DashboardFacilitateurData {
  gains: Gain[];
  intros: Intro[];
  introsCount: number;
  missions: Mission[];
  missionsCount: number;
  trustScore: number | null;
  requests: Request[];
}

async function fetchDashboardFacilitateurData(
  userId: string
): Promise<DashboardFacilitateurData> {
  const [
    gainsRes,
    introsRes,
    introsCountRes,
    missionsRes,
    missionsCountRes,
    trustRes,
    reqRes,
  ] = await Promise.all([
    supabase
      .from("gains")
      .select("id, montant, statut")
      .eq("facilitateur_id", userId)
      .limit(200),

    supabase
      .from("introductions")
      .select("id, contact_nom, statut, created_at, mission_id")
      .eq("facilitateur_id", userId)
      .order("created_at", { ascending: false })
      .limit(3),

    supabase
      .from("introductions")
      .select("id", { count: "exact", head: true })
      .eq("facilitateur_id", userId),

    supabase
      .from("missions")
      .select("id, titre, secteur, zone, recompense")
      .eq("statut", "active")
      .order("created_at", { ascending: false })
      .limit(10),

    supabase
      .from("missions")
      .select("id", { count: "exact", head: true })
      .eq("statut", "active"),

    supabase
      .from("trust_scores")
      .select("global_score")
      .eq("user_id", userId)
      .maybeSingle(),

    supabase
      .from("facilitator_requests")
      .select("id, request_context, openclaw_note")
      .eq("facilitator_user_id", userId)
      .in("status", ["envoyee", "vue"])
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const introsData = (introsRes.data ?? []) as Intro[];
  const allMissions = (missionsRes.data ?? []) as Mission[];
  const myMissionIds = new Set(
    introsData.map((i) => i.mission_id).filter((id): id is string => id !== null)
  );
  const recommendedMissions = allMissions
    .filter((m) => !myMissionIds.has(m.id))
    .slice(0, 3);

  const trustData = trustRes.data as { global_score: number | null } | null;

  return {
    gains: (gainsRes.data ?? []) as Gain[],
    intros: introsData,
    introsCount: introsCountRes.count ?? 0,
    missions: recommendedMissions,
    missionsCount: missionsCountRes.count ?? 0,
    trustScore: trustData?.global_score ?? null,
    requests: (reqRes.data ?? []) as Request[],
  };
}

export function useDashboardFacilitateurData(userId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard-facilitateur", userId],
    queryFn: () => fetchDashboardFacilitateurData(userId!),
    enabled: !!userId,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
