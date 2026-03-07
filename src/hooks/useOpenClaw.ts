/**
 * Hook React pour interagir avec le vrai gateway OpenClaw
 * Toutes les calls passent par les edge functions Supabase (jamais côté client direct)
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OpenClawConfig {
  gateway_url: string | null;
  autonomie_level: "lecture" | "preparation" | "assiste" | "semi-auto" | "etendu";
  kill_switch_global: boolean;
  is_connected: boolean;
  healthcheck_status: "ok" | "error" | "unknown";
  last_healthcheck_at: string | null;
}

export interface OpenClawAgent {
  id: string;
  agent_id: string;
  nom: string;
  role: string;
  statut: "actif" | "pause" | "attente" | "bloque";
  kill_switch: boolean;
  action_en_cours: string | null;
  actions_aujourd_hui: number;
  outils_autorises: { label: string; niveau: string }[];
  derniere_activite_at: string | null;
}

export interface OpenClawValidation {
  id: string;
  agent_id: string;
  type_validation: string;
  titre: string;
  description: string;
  consequence_valide: string;
  consequence_refuse: string;
  risque: "faible" | "moyen" | "eleve";
  statut: "en_attente" | "validee" | "refusee" | "expiree";
  details: string[];
  payload: Record<string, unknown>;
  created_at: string;
}

export interface OpenClawLog {
  id: string;
  agent_id: string | null;
  event_type: string;
  summary: string;
  details: Record<string, unknown>;
  risque: string;
  created_at: string;
}

async function callEdgeFunction(name: string, body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Non authentifié");

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const url = `https://${projectId}.supabase.co/functions/v1/${name}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
      "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Edge function ${name} failed (${res.status}): ${text}`);
  }

  return res.json();
}

export function useOpenClaw() {
  const { toast } = useToast();
  const [config, setConfig] = useState<OpenClawConfig | null>(null);
  const [agents, setAgents] = useState<OpenClawAgent[]>([]);
  const [validations, setValidations] = useState<OpenClawValidation[]>([]);
  const [logs, setLogs] = useState<OpenClawLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // ── Charger la config depuis Supabase ─────────────────────────────────────
  const loadConfig = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [configRes, agentsRes, validationsRes, logsRes] = await Promise.all([
      supabase.from("openclaw_config").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("openclaw_agents").select("*").eq("user_id", user.id).order("agent_id"),
      supabase.from("openclaw_validations").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(50),
      supabase.from("openclaw_logs").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(30),
    ]);

    if (configRes.data) {
      setConfig(configRes.data as OpenClawConfig);
    } else {
      // Config par défaut si pas encore créée
      setConfig({
        gateway_url: null,
        autonomie_level: "preparation",
        kill_switch_global: false,
        is_connected: false,
        healthcheck_status: "unknown",
        last_healthcheck_at: null,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setAgents((agentsRes.data ?? []) as unknown as OpenClawAgent[]);
    setValidations((validationsRes.data ?? []) as OpenClawValidation[]);
    setLogs((logsRes.data ?? []) as OpenClawLog[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // ── Sauvegarder la config gateway ─────────────────────────────────────────
  const saveConfig = useCallback(async (updates: Partial<OpenClawConfig>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("openclaw_config").upsert(
      { user_id: user.id, ...updates },
      { onConflict: "user_id" }
    );
    setConfig((prev) => prev ? { ...prev, ...updates } : null);
  }, []);

  // ── Healthcheck ────────────────────────────────────────────────────────────
  const checkHealth = useCallback(async () => {
    try {
      const result = await callEdgeFunction("openclaw-healthcheck", {});
      setConfig((prev) => prev ? {
        ...prev,
        is_connected: result.connected,
        healthcheck_status: result.status,
        last_healthcheck_at: result.checked_at,
      } : null);
      return result;
    } catch (err) {
      console.error("[useOpenClaw] healthcheck failed:", err);
      return { connected: false, status: "error" };
    }
  }, []);

  // ── Synchroniser le dossier avec OpenClaw ─────────────────────────────────
  const syncDossier = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await callEdgeFunction("openclaw-dossier-sync", { force: true });
      if (result.success || result.agents_initialized) {
        await loadConfig();
        toast({
          title: result.gateway_connected
            ? "Dossier synchronisé avec OpenClaw ✓"
            : "Agents initialisés",
          description: result.message,
        });
      }
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast({ title: "Erreur de synchronisation", description: msg, variant: "destructive" });
      return { success: false, message: msg };
    } finally {
      setSyncing(false);
    }
  }, [loadConfig, toast]);

  // ── Kill Switch ────────────────────────────────────────────────────────────
  const toggleKillSwitch = useCallback(async (
    type: "global" | "agent",
    activate: boolean,
    agentId?: string,
    reason?: string
  ) => {
    try {
      const result = await callEdgeFunction("openclaw-kill-switch", {
        type,
        activate,
        agent_id: agentId,
        reason,
      });

      if (result.success) {
        await loadConfig();
        toast({
          title: activate
            ? type === "global" ? "Kill Switch activé" : `Agent ${agentId} mis en pause`
            : type === "global" ? "Kill Switch désactivé" : `Agent ${agentId} réactivé`,
          description: result.message,
          variant: activate ? "destructive" : "default",
        });
      }
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
      return { success: false };
    }
  }, [loadConfig, toast]);

  // ── Valider / Refuser une action ──────────────────────────────────────────
  const processValidation = useCallback(async (
    validationId: string,
    decision: "approve" | "reject",
    note?: string
  ) => {
    try {
      const result = await callEdgeFunction("openclaw-validate", {
        validation_id: validationId,
        decision,
        note,
      });

      if (result.success) {
        setValidations((prev) => prev.map((v) =>
          v.id === validationId
            ? { ...v, statut: decision === "approve" ? "validee" : "refusee" }
            : v
        ));
        await loadConfig(); // recharge les logs aussi
        toast({
          title: decision === "approve" ? "Action approuvée ✓" : "Action refusée",
          description: result.message,
        });
      }
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
      return { success: false };
    }
  }, [loadConfig, toast]);

  // ── Appel gateway direct (pour fonctions avancées) ────────────────────────
  const callGateway = useCallback(async (
    tool: string,
    args: Record<string, unknown> = {},
    agentId?: string,
    dryRun = false
  ) => {
    try {
      return await callEdgeFunction("openclaw-gateway", {
        tool,
        args,
        agent_id: agentId,
        dry_run: dryRun,
      });
    } catch (err) {
      console.error("[useOpenClaw] gateway call failed:", err);
      throw err;
    }
  }, []);

  const pendingValidations = validations.filter((v) => v.statut === "en_attente");

  return {
    // State
    config,
    agents,
    validations,
    pendingValidations,
    logs,
    loading,
    syncing,
    // Actions
    loadConfig,
    saveConfig,
    checkHealth,
    syncDossier,
    toggleKillSwitch,
    processValidation,
    callGateway,
  };
}
