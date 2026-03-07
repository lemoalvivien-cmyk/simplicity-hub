/**
 * useOpenClawRuntime
 * ──────────────────
 * Full runtime state: channels, jobs, sessions (context-aware),
 * tool policies, validation relance logic.
 * This is the MAX RUNTIME hook — replaces scattered partial hooks.
 */
import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OpenClawChannel {
  id: string;
  channel_id: string;
  channel_name: string;
  status: "pret" | "assiste" | "probe" | "erreur" | "limite" | "non_configure";
  is_ready: boolean;
  is_openclaw_enabled: boolean;
  last_probe_at: string | null;
  probe_latency_ms: number | null;
  probe_detail: string | null;
}

export interface OpenClawJob {
  id: string;
  job_type: string;
  job_name: string;
  status: "planifie" | "en_cours" | "termine" | "bloque" | "erreur" | "desactive";
  next_run_at: string | null;
  last_run_at: string | null;
  enabled: boolean;
  run_count: number;
  error_count: number;
  last_error: string | null;
  config: Record<string, unknown>;
}

export interface OpenClawContextSession {
  id: string;
  session_type: string;
  context_type: string;
  linked_entity_id: string | null;
  linked_entity_type: string | null;
  status: string;
  autonomie_level: string;
  runs_count: number;
  session_score: number;
  node_host: string;
  started_at: string;
  next_scheduled_at: string | null;
}

export interface ToolPolicy {
  agent_id: string;
  tool_name: string;
  access_level: "lecture" | "analyse" | "preparation" | "proposition" | "execution_limitee" | "execution_approval" | "interdit" | "suspendu";
  context_type: string;
}

// ── Status labels ─────────────────────────────────────────────────────────────

export const CHANNEL_STATUS_META: Record<string, {
  label: string; color: string; bg: string; icon: string; openclaw: string;
}> = {
  pret:          { label: "Prêt",           color: "hsl(var(--success))",          bg: "hsl(var(--success-light))",  icon: "✅", openclaw: "Peut exécuter" },
  assiste:       { label: "Assisté",         color: "hsl(218 72% 50%)",            bg: "hsl(218 72% 95%)",           icon: "🤝", openclaw: "Peut proposer" },
  probe:         { label: "Sonde…",          color: "hsl(38 80% 40%)",             bg: "hsl(38 80% 92%)",            icon: "🔍", openclaw: "Vérification…" },
  erreur:        { label: "Erreur",          color: "hsl(0 65% 40%)",              bg: "hsl(0 65% 95%)",             icon: "⚠️", openclaw: "Inaccessible" },
  limite:        { label: "Limité",          color: "hsl(38 80% 40%)",             bg: "hsl(38 80% 92%)",            icon: "🔒", openclaw: "Quota dépassé" },
  non_configure: { label: "À configurer",    color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))",          icon: "⚙️", openclaw: "Non disponible" },
};

export const JOB_STATUS_META: Record<string, { label: string; color: string; pulse?: boolean }> = {
  planifie:  { label: "Planifié",     color: "hsl(218 72% 50%)" },
  en_cours:  { label: "En cours",     color: "hsl(var(--success))", pulse: true },
  termine:   { label: "Terminé",      color: "hsl(var(--success))" },
  bloque:    { label: "Bloqué",       color: "hsl(38 80% 40%)" },
  erreur:    { label: "Erreur",       color: "hsl(0 65% 40%)" },
  desactive: { label: "Désactivé",    color: "hsl(var(--muted-foreground))" },
};

export const JOB_TYPE_META: Record<string, { label: string; icon: string; desc: string }> = {
  scan_radar:          { label: "Scan radar",           icon: "📡", desc: "Détection des opportunités chaudes" },
  brief_daily:         { label: "Brief quotidien",       icon: "📋", desc: "Rapport de situation OpenClaw" },
  relance_validations: { label: "Relance validations",   icon: "🔔", desc: "Rappel des actions en attente" },
  trust_recheck:       { label: "Réévaluation confiance",icon: "🛡️", desc: "Mise à jour des scores de réputation" },
  passive_recheck:     { label: "Recheck passif",        icon: "🌐", desc: "Surveillance des offres passives" },
};

export const TOOL_ACCESS_META: Record<string, { label: string; color: string; icon: string }> = {
  lecture:            { label: "Lecture",          color: "hsl(var(--muted-foreground))", icon: "👁" },
  analyse:            { label: "Analyse",          color: "hsl(218 72% 50%)",            icon: "🔍" },
  preparation:        { label: "Préparation",      color: "hsl(250 60% 50%)",            icon: "✍️" },
  proposition:        { label: "Proposition",      color: "hsl(38 80% 40%)",             icon: "💡" },
  execution_limitee:  { label: "Exéc. limitée",   color: "hsl(24 100% 45%)",            icon: "⚡" },
  execution_approval: { label: "Avec accord",      color: "hsl(var(--success))",          icon: "✅" },
  interdit:           { label: "Interdit",         color: "hsl(0 65% 40%)",              icon: "🚫" },
  suspendu:           { label: "Suspendu",         color: "hsl(var(--muted-foreground))", icon: "⏸" },
};

// Default tool policy matrix by autonomy level
export const DEFAULT_TOOL_MATRIX: Record<string, Record<string, string>> = {
  signal_hunter: {
    lecture: "lecture", preparation: "analyse", assiste: "preparation",
    "semi-auto": "proposition", etendu: "execution_limitee",
  },
  opportunity_builder: {
    lecture: "lecture", preparation: "analyse", assiste: "proposition",
    "semi-auto": "execution_limitee", etendu: "execution_approval",
  },
  matchmaker: {
    lecture: "lecture", preparation: "preparation", assiste: "proposition",
    "semi-auto": "execution_limitee", etendu: "execution_approval",
  },
  message_crafter: {
    lecture: "lecture", preparation: "preparation", assiste: "preparation",
    "semi-auto": "proposition", etendu: "execution_approval",
  },
  passive_distributor: {
    lecture: "lecture", preparation: "preparation", assiste: "proposition",
    "semi-auto": "execution_limitee", etendu: "execution_approval",
  },
  validator: {
    lecture: "lecture", preparation: "preparation", assiste: "execution_approval",
    "semi-auto": "execution_approval", etendu: "execution_approval",
  },
  trust_sentinel: {
    lecture: "lecture", preparation: "analyse", assiste: "analyse",
    "semi-auto": "proposition", etendu: "execution_limitee",
  },
  brief_writer: {
    lecture: "lecture", preparation: "preparation", assiste: "proposition",
    "semi-auto": "execution_limitee", etendu: "execution_limitee",
  },
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useOpenClawRuntime() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<OpenClawChannel[]>([]);
  const [jobs, setJobs] = useState<OpenClawJob[]>([]);
  const [contextSessions, setContextSessions] = useState<OpenClawContextSession[]>([]);
  const [toolPolicies, setToolPolicies] = useState<ToolPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [autonomieLevel, setAutonomieLevel] = useState("preparation");

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [channelsRes, jobsRes, sessionsRes, configRes, policiesRes] = await Promise.all([
      db.from("openclaw_channels").select("*").eq("user_id", user.id).order("channel_id"),
      db.from("openclaw_jobs").select("*").eq("user_id", user.id).order("next_run_at"),
      db.from("openclaw_sessions").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(10),
      db.from("openclaw_config").select("autonomie_level").eq("user_id", user.id).maybeSingle(),
      db.from("openclaw_tool_policies").select("*").eq("user_id", user.id),
    ]);

    // If no channels yet, seed them
    if (!channelsRes.data?.length) {
      await db.rpc("seed_openclaw_channels", { p_user_id: user.id });
      const recheckChannels = await db.from("openclaw_channels").select("*").eq("user_id", user.id);
      setChannels(recheckChannels.data || []);
    } else {
      setChannels(channelsRes.data || []);
    }

    // If no jobs yet, seed them
    if (!jobsRes.data?.length) {
      await db.rpc("seed_openclaw_jobs", { p_user_id: user.id });
      const recheckJobs = await db.from("openclaw_jobs").select("*").eq("user_id", user.id).order("next_run_at");
      setJobs(recheckJobs.data || []);
    } else {
      setJobs(jobsRes.data || []);
    }

    setContextSessions(sessionsRes.data || []);
    setToolPolicies(policiesRes.data || []);
    if (configRes.data?.autonomie_level) {
      setAutonomieLevel(configRes.data.autonomie_level);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const readyChannels = channels.filter(c => c.is_ready);
  const blockedChannels = channels.filter(c => c.status === "erreur" || c.status === "non_configure");
  const activeJobs = jobs.filter(j => j.status === "en_cours");
  const nextJob = jobs.filter(j => j.enabled && j.status !== "desactive" && j.next_run_at)
    .sort((a, b) => new Date(a.next_run_at!).getTime() - new Date(b.next_run_at!).getTime())[0];

  // Effective tool access for an agent given autonomy level
  const getEffectiveAccess = (agentId: string, tool = "default"): string => {
    // Check DB overrides first
    const override = toolPolicies.find(p =>
      p.agent_id === agentId && (p.tool_name === tool || p.tool_name === "default") && p.context_type === "global"
    );
    if (override) return override.access_level;
    // Fallback to matrix
    return DEFAULT_TOOL_MATRIX[agentId]?.[autonomieLevel] ?? "lecture";
  };

  // ── Actions ─────────────────────────────────────────────────────────────────

  const toggleJob = useCallback(async (jobId: string, enabled: boolean) => {
    if (!user) return;
    await db.from("openclaw_jobs").update({ enabled, status: enabled ? "planifie" : "desactive" }).eq("id", jobId);
    await loadAll();
  }, [user, loadAll]);

  const triggerJob = useCallback(async (job: OpenClawJob) => {
    if (!user) return;
    const runType = (job.config as Record<string, unknown>)?.run_type as string || "scan";
    const agentNames = (job.config as Record<string, unknown>)?.agents as string[] || [];
    // Create a run for this job
    const { data: run } = await db.from("openclaw_runs").insert({
      user_id: user.id,
      run_type: runType,
      trigger_source: "job",
      status: "planifie",
      summary: `${job.job_name} — déclenchement manuel`,
      agent_names: agentNames,
      started_at: new Date().toISOString(),
      next_run_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }).select().single();
    // Update job
    await db.from("openclaw_jobs").update({
      last_run_id: run?.id,
      last_run_at: new Date().toISOString(),
      run_count: (job.run_count || 0) + 1,
    }).eq("id", jobId: job.id);
    await loadAll();
  }, [user, loadAll]);

  const probeChannel = useCallback(async (channelId: string) => {
    if (!user) return;
    // Mark as probing
    await db.from("openclaw_channels").update({ status: "probe", last_probe_at: new Date().toISOString() })
      .eq("user_id", user.id).eq("channel_id", channelId);
    // Simulate probe result (in prod: call real health endpoint)
    await new Promise(r => setTimeout(r, 1200));
    const isReady = ["email", "introduction"].includes(channelId);
    await db.from("openclaw_channels").update({
      status: isReady ? "pret" : "non_configure",
      is_ready: isReady,
      probe_latency_ms: isReady ? Math.floor(Math.random() * 80 + 20) : null,
      probe_detail: isReady ? "Canal opérationnel" : "Configuration requise",
      last_probe_at: new Date().toISOString(),
    }).eq("user_id", user.id).eq("channel_id", channelId);
    await loadAll();
  }, [user, loadAll]);

  const createContextSession = useCallback(async (
    sessionType: string,
    contextType: string,
    linkedEntityId?: string,
    linkedEntityType?: string,
  ) => {
    if (!user) return null;
    const existing = contextSessions.find(s =>
      s.status === "active" && s.session_type === sessionType && s.context_type === contextType
    );
    if (existing) return existing;
    const { data } = await db.from("openclaw_sessions").insert({
      user_id: user.id,
      session_type: sessionType,
      context_type: contextType,
      linked_entity_id: linkedEntityId || null,
      linked_entity_type: linkedEntityType || null,
      status: "active",
      autonomie_level: autonomieLevel,
      started_at: new Date().toISOString(),
      next_scheduled_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    }).select().single();
    await loadAll();
    return data;
  }, [user, contextSessions, autonomieLevel, loadAll]);

  // Health score computation
  const healthScore = (() => {
    let score = 50;
    if (readyChannels.length >= 2) score += 15;
    if (readyChannels.length >= 1) score += 10;
    if (jobs.filter(j => j.enabled).length >= 3) score += 15;
    if (contextSessions.filter(s => s.status === "active").length > 0) score += 10;
    if (blockedChannels.length === 0) score += 10;
    return Math.min(100, score);
  })();

  return {
    channels, jobs, contextSessions, toolPolicies, loading,
    readyChannels, blockedChannels, activeJobs, nextJob,
    autonomieLevel, healthScore,
    getEffectiveAccess, toggleJob, triggerJob, probeChannel,
    createContextSession, loadAll,
  };
}
