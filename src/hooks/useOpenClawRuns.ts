/**
 * useOpenClawRuns — Gestion des runs, sessions et mémoire OpenClaw
 */
import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface OpenClawRun {
  id: string;
  run_type: string;
  status: string;
  trigger_source: string;
  agent_names: string[];
  requires_validation: boolean;
  validation_id: string | null;
  summary: string | null;
  outcome: Record<string, unknown>;
  error_detail: string | null;
  started_at: string | null;
  ended_at: string | null;
  next_run_at: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface OpenClawSession {
  id: string;
  session_type: string;
  status: string;
  autonomie_level: string;
  runs_count: number;
  last_run_at: string | null;
  next_scheduled_at: string | null;
  session_score: number;
  node_host?: string | null;
  started_at: string;
  ended_at: string | null;
  memory_snapshot: Record<string, unknown>;
}

export interface OpenClawMemoryEntry {
  id: string;
  memory_type: string;
  key: string;
  value: Record<string, unknown>;
  confidence: number;
  times_used: number;
  last_used_at: string | null;
}

// ── Labels humains pour les types de runs ────────────────────────────────────
export const RUN_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  scan:              { label: "Scan du radar",         icon: "📡", color: "hsl(218 72% 50%)" },
  brief:             { label: "Préparation du brief",  icon: "📋", color: "hsl(38 80% 40%)" },
  passive:           { label: "Diffusion passive",     icon: "🌐", color: "hsl(var(--success))" },
  radar:             { label: "Analyse des signaux",   icon: "🎯", color: "hsl(218 72% 50%)" },
  matching:          { label: "Matching facilitateurs",icon: "🤝", color: "hsl(24 100% 52%)" },
  relance:           { label: "Relance intelligente",  icon: "🔄", color: "hsl(250 60% 50%)" },
  validation_check:  { label: "Vérification actions", icon: "✅", color: "hsl(var(--success))" },
};

export const RUN_STATUS_LABELS: Record<string, { label: string; color: string; pulse?: boolean }> = {
  planifie:  { label: "Planifié",  color: "hsl(var(--muted-foreground))" },
  en_cours:  { label: "En cours",  color: "hsl(218 72% 50%)", pulse: true },
  termine:   { label: "Terminé",   color: "hsl(var(--success))" },
  bloque:    { label: "Bloqué",    color: "hsl(38 80% 40%)" },
  erreur:    { label: "Erreur",    color: "hsl(0 65% 40%)" },
  expire:    { label: "Expiré",    color: "hsl(var(--muted-foreground))" },
};

// ── Agents spécialisés du cerveau ─────────────────────────────────────────────
export const BRAIN_AGENTS = [
  { id: "signal_hunter",      label: "Signal Hunter",       desc: "Détecte les signaux d'intention business",    icon: "📡", color: "hsl(218 72% 50%)" },
  { id: "opportunity_builder", label: "Opportunity Builder", desc: "Construit les opportunités qualifiées",        icon: "🎯", color: "hsl(38 80% 40%)" },
  { id: "matchmaker",          label: "Matchmaker",          desc: "Associe facilitateurs et missions",            icon: "🤝", color: "hsl(24 100% 52%)" },
  { id: "message_crafter",     label: "Message Crafter",     desc: "Rédige les messages et packs de diffusion",   icon: "✍️", color: "hsl(250 60% 50%)" },
  { id: "passive_distributor", label: "Passive Distributor", desc: "Pilote la diffusion passive multi-canaux",     icon: "🌐", color: "hsl(var(--success))" },
  { id: "validator",           label: "Validator",           desc: "Prépare et soumet les actions à validation",  icon: "✅", color: "hsl(var(--primary))" },
  { id: "trust_sentinel",      label: "Trust Sentinel",      desc: "Surveille la confiance et les risques",       icon: "🛡️", color: "hsl(0 65% 40%)" },
  { id: "brief_writer",        label: "Brief Writer",        desc: "Génère les rapports quotidiens du cerveau",   icon: "📋", color: "hsl(38 60% 40%)" },
];

// ── Modes OpenClaw ─────────────────────────────────────────────────────────────
export const OPENCLAW_MODES = [
  {
    id: "lecture",
    label: "Observation",
    desc: "Le cerveau observe. Rien n'est exécuté.",
    effect: "Lecture seule — zéro action.",
    color: "hsl(var(--muted-foreground))",
  },
  {
    id: "preparation",
    label: "Préparation",
    desc: "Le cerveau prépare. Vous décidez.",
    effect: "Propose sans exécuter.",
    color: "hsl(218 72% 50%)",
  },
  {
    id: "assiste",
    label: "Assisté",
    desc: "Vous validez chaque action importante.",
    effect: "Actions simples auto, importantes = votre accord.",
    color: "hsl(38 80% 40%)",
  },
  {
    id: "semi-auto",
    label: "Semi-autonome",
    desc: "Actions courantes automatiques.",
    effect: "Relances, messages, diffusion — autonomes.",
    color: "hsl(24 100% 52%)",
  },
  {
    id: "etendu",
    label: "Intensif",
    desc: "Le cerveau travaille à pleine puissance.",
    effect: "Tout est automatisé sauf les actions critiques.",
    color: "hsl(var(--success))",
  },
];

export function useOpenClawRuns() {
  const { user } = useAuth();
  const [runs, setRuns] = useState<OpenClawRun[]>([]);
  const [sessions, setSessions] = useState<OpenClawSession[]>([]);
  const [memory, setMemory] = useState<OpenClawMemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRuns = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [runsRes, sessionsRes, memRes] = await Promise.all([
      db.from("openclaw_runs").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(20),
      db.from("openclaw_sessions").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(5),
      db.from("openclaw_memory").select("*").eq("user_id", user.id)
        .order("confidence", { ascending: false }).limit(10),
    ]);
    setRuns(runsRes.data || []);
    setSessions(sessionsRes.data || []);
    setMemory(memRes.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const createRun = useCallback(async (
    run_type: string,
    trigger_source = "manual",
    summary?: string,
    agent_names?: string[]
  ) => {
    if (!user) return null;
    const next_run_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data } = await db.from("openclaw_runs").insert({
      user_id: user.id,
      run_type,
      trigger_source,
      status: "planifie",
      summary: summary ?? `Run ${RUN_TYPE_LABELS[run_type]?.label ?? run_type} planifié`,
      agent_names: agent_names ?? [],
      next_run_at,
      started_at: new Date().toISOString(),
    }).select().single();
    await loadRuns();
    return data;
  }, [user, loadRuns]);

  const ensureActiveSession = useCallback(async (session_type = "prospection", autonomie_level = "preparation") => {
    if (!user) return null;
    const active = sessions.find(s => s.status === "active" && s.session_type === session_type);
    if (active) return active;
    const next = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
    const { data } = await db.from("openclaw_sessions").insert({
      user_id: user.id,
      session_type,
      status: "active",
      autonomie_level,
      next_scheduled_at: next,
      started_at: new Date().toISOString(),
    }).select().single();
    await loadRuns();
    return data;
  }, [user, sessions, loadRuns]);

  const recordMemory = useCallback(async (
    memory_type: string,
    key: string,
    value: Record<string, unknown>,
    confidence = 60
  ) => {
    if (!user) return;
    await db.from("openclaw_memory").upsert({
      user_id: user.id,
      memory_type,
      key,
      value,
      confidence,
      last_used_at: new Date().toISOString(),
    }, { onConflict: "user_id,memory_type,key" });
    await loadRuns();
  }, [user, loadRuns]);

  const activeRun = runs.find(r => r.status === "en_cours");
  const lastRun = runs.find(r => r.status === "termine");
  const blockedRuns = runs.filter(r => r.status === "bloque" || r.requires_validation);
  const nextRun = runs.find(r => r.status === "planifie" && r.next_run_at);
  const activeSession = sessions.find(s => s.status === "active");

  return {
    runs, sessions, memory, loading,
    activeRun, lastRun, blockedRuns, nextRun, activeSession,
    createRun, ensureActiveSession, recordMemory, loadRuns,
  };
}
