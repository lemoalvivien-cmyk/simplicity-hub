/**
 * useActivation — Tracks activation funnel state per user.
 * Measures time-to-first-intro and surfaces progression state.
 */
import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type ActivationEvent =
  | "signup_completed"
  | "onboarding_completed"
  | "first_mission_created"
  | "first_match_shown"
  | "first_intro_request_sent"
  | "first_intro_received"
  | "first_intro_validated"
  | "first_gain_seen";

export interface ActivationState {
  hasProfile: boolean;
  hasMission: boolean;        // entreprise only
  hasIntro: boolean;          // both roles
  hasGain: boolean;
  hasShareLink: boolean;      // facilitateur only
  stepsCompleted: number;     // 0-5
  nextStep: { label: string; path: string; cta: string } | null;
  loading: boolean;
}

const ENTREPRISE_STEPS = [
  { key: "hasProfile", label: "Profil complété", path: "/profil/entreprise", cta: "Compléter mon profil" },
  { key: "hasMission", label: "Première mission créée", path: "/missions/nouvelle", cta: "Créer ma première mission" },
  { key: "hasIntro", label: "Première introduction reçue", path: "/entreprise/introductions", cta: "Voir mes introductions" },
  { key: "hasGain", label: "Premier résultat confirmé", path: "/entreprise/introductions", cta: "Suivre mes résultats" },
];

const FACILITATEUR_STEPS = [
  { key: "hasProfile", label: "Profil complété", path: "/profil/facilitateur", cta: "Compléter mon profil" },
  { key: "hasShareLink", label: "Premier lien créé ou intro envoyée", path: "/missions", cta: "Voir les missions" },
  { key: "hasIntro", label: "Première introduction envoyée", path: "/introductions", cta: "Voir mes introductions" },
  { key: "hasGain", label: "Premier gain en vue", path: "/gains", cta: "Voir mes gains" },
];

export function useActivation(role: "entreprise" | "facilitateur" | null) {
  const { user, profile } = useAuth();
  const [state, setState] = useState<ActivationState>({
    hasProfile: false,
    hasMission: false,
    hasIntro: false,
    hasGain: false,
    hasShareLink: false,
    stepsCompleted: 0,
    nextStep: null,
    loading: true,
  });

  useEffect(() => {
    if (!user || !role) return;

    const load = async () => {
      const hasProfile = !!(profile?.prenom && profile.prenom.length > 0);

      if (role === "entreprise") {
        const [missionsRes, introsRes, gainsRes] = await Promise.all([
          db.from("missions").select("id", { count: "exact", head: true }).eq("entreprise_id", user.id),
          db.from("introductions").select("id", { count: "exact", head: true }).eq("entreprise_id", user.id),
          db.from("gains").select("id", { count: "exact", head: true }).eq("facilitateur_id", user.id),
        ]);
        const hasMission = (missionsRes.count || 0) > 0;
        const hasIntro = (introsRes.count || 0) > 0;
        const hasGain = (gainsRes.count || 0) > 0;

        const steps = ENTREPRISE_STEPS;
        const stateMap: Record<string, boolean> = { hasProfile, hasMission, hasIntro, hasGain };
        const completed = steps.filter(s => stateMap[s.key]).length;
        const nextIdx = steps.findIndex(s => !stateMap[s.key]);
        const nextStep = nextIdx >= 0 ? { label: steps[nextIdx].label, path: steps[nextIdx].path, cta: steps[nextIdx].cta } : null;

        setState({ hasProfile, hasMission, hasIntro, hasGain, hasShareLink: false, stepsCompleted: completed, nextStep, loading: false });

      } else {
        const [introsRes, gainsRes, linksRes] = await Promise.all([
          db.from("introductions").select("id", { count: "exact", head: true }).eq("facilitateur_id", user.id),
          db.from("gains").select("id", { count: "exact", head: true }).eq("facilitateur_id", user.id),
          db.from("offer_share_links").select("id", { count: "exact", head: true }).eq("facilitator_id", user.id),
        ]);
        const hasIntro = (introsRes.count || 0) > 0;
        const hasGain = (gainsRes.count || 0) > 0;
        const hasShareLink = (linksRes.count || 0) > 0;

        const steps = FACILITATEUR_STEPS;
        const stateMap: Record<string, boolean> = { hasProfile, hasShareLink: hasShareLink || hasIntro, hasIntro, hasGain };
        const completed = steps.filter(s => stateMap[s.key]).length;
        const nextIdx = steps.findIndex(s => !stateMap[s.key]);
        const nextStep = nextIdx >= 0 ? { label: steps[nextIdx].label, path: steps[nextIdx].path, cta: steps[nextIdx].cta } : null;

        setState({ hasProfile, hasMission: false, hasIntro, hasGain, hasShareLink, stepsCompleted: completed, nextStep, loading: false });
      }
    };

    load();
  }, [user, role, profile]);

  const trackEvent = useCallback(async (event: ActivationEvent) => {
    if (!user) return;
    try {
      // Activation events logged to analytics_events (openclaw_logs removed v8)
      await db.from("analytics_events").insert({
        user_id: user.id,
        event_type: "activation_event",
        session_id: user.id,
        properties: { event, timestamp: new Date().toISOString() },
      });
    } catch {
      // silent — activation tracking must never break the UX
    }
  }, [user]);

  return { ...state, trackEvent };
}
