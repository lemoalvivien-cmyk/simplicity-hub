// PROOF:CONTROL_PLANE_V2:revenue_leak_engine
/**
 * Revenue Leak Engine — Détecte les fuites de revenu depuis données réelles
 */

import { supabase } from "@/integrations/supabase/client";
import type { RevenueLeak, RevenueLeakResult } from "../domain/revenue.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export async function computeRevenueLeaks(): Promise<RevenueLeakResult> {
  const now = new Date().toISOString();
  const leaks: RevenueLeak[] = [];

  // 1. Onboarding incomplet
  try {
    const { count } = await db
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("onboarding_done", false);
    const affected = count ?? 0;
    if (affected > 0) {
      leaks.push({
        id: "leak_onboarding_incomplete",
        leakType: "onboarding_incomplete",
        label: "Onboarding non terminé",
        severity: affected > 5 ? "high" : "medium",
        estimatedValue: affected * 99, // prix de lancement
        usersAffected: affected,
        confidence: 90,
        evidence: `${affected} profils avec onboarding_done=false en base`,
        recommendedAction: "Lancer la campagne de réactivation onboarding depuis /admin/reactivation",
        routeTarget: "/admin/reactivation",
      });
    }
  } catch { /* graceful */ }

  // 2. Missions sans introductions
  try {
    const { data: missions } = await db
      .from("missions")
      .select("id")
      .eq("statut", "active");
    const { data: intros } = await db
      .from("introductions")
      .select("mission_id");
    const missionIds = new Set((intros ?? []).map((i: { mission_id: string }) => i.mission_id));
    const orphans = (missions ?? []).filter((m: { id: string }) => !missionIds.has(m.id));
    if (orphans.length > 0) {
      leaks.push({
        id: "leak_missions_no_intro",
        leakType: "missions_no_intro",
        label: "Missions actives sans introduction",
        severity: orphans.length > 3 ? "high" : "medium",
        estimatedValue: null,
        usersAffected: orphans.length,
        confidence: 85,
        evidence: `${orphans.length} missions actives n'ont reçu aucune introduction`,
        recommendedAction: "Relancer les facilitateurs ou élargir le matching",
        routeTarget: "/admin/analytics",
      });
    }
  } catch { /* graceful */ }

  // 3. Introductions en attente > 7 jours
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { count } = await db
      .from("introductions")
      .select("*", { count: "exact", head: true })
      .eq("statut", "en_attente")
      .lt("created_at", sevenDaysAgo);
    const stale = count ?? 0;
    if (stale > 0) {
      leaks.push({
        id: "leak_stale_intros",
        leakType: "stale_intros",
        label: "Introductions en attente depuis 7+ jours",
        severity: stale > 5 ? "high" : "medium",
        estimatedValue: null,
        usersAffected: stale,
        confidence: 92,
        evidence: `${stale} introductions en_attente créées il y a plus de 7 jours`,
        recommendedAction: "Relancer la validation via réactivation ou email",
        routeTarget: "/admin/reactivation",
      });
    }
  } catch { /* graceful */ }

  // 4. Quota lancement sous-exploité
  try {
    const { data } = await db
      .from("launch_quota")
      .select("used_slots, total_slots")
      .single();
    if (data && data.used_slots < data.total_slots * 0.5) {
      const remaining = data.total_slots - data.used_slots;
      leaks.push({
        id: "leak_quota_underused",
        leakType: "quota_underused",
        label: "Offre de lancement sous-exploitée",
        severity: "medium",
        estimatedValue: remaining * 99,
        usersAffected: 0,
        confidence: 95,
        evidence: `${data.used_slots}/${data.total_slots} slots utilisés — ${remaining} places restantes à 99€`,
        recommendedAction: "Accélérer la distribution des codes promo ou le marketing",
        routeTarget: "/admin/promo-codes",
      });
    }
  } catch { /* graceful */ }

  // Sort by severity
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  leaks.sort((a, b) => order[a.severity] - order[b.severity]);

  const [primary, ...secondary] = leaks;
  const totalEstimatedLoss = leaks.reduce((s, l) => s + (l.estimatedValue ?? 0), 0);

  return {
    primary: primary ?? null,
    secondary: secondary.slice(0, 3),
    computedAt: now,
    totalEstimatedLoss,
  };
}
