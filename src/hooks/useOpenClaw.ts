/**
 * useOpenClaw — Hook central pour l'intégration réelle OpenClaw
 * ─────────────────────────────────────────────────────────────
 * Toutes les interactions avec OpenClaw passent par les edge functions Supabase.
 * Jamais d'appel direct au gateway depuis le frontend.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ── Types exportés ────────────────────────────────────────────────────────────

export type ConnectionStatus =
  | "not_configured"   // pas d'URL gateway
  | "checking"         // healthcheck en cours
  | "connected"        // gateway répond OK
  | "error"            // gateway ne répond pas
  | "kill_switch_on";  // kill switch global actif

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
  updated_at?: string;
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

export interface DossierSyncStatus {
  synced: boolean;
  last_sync_at: string | null;
  error: string | null;
  completion_score: number;
}

// ── Diagnostic humain ─────────────────────────────────────────────────────────

export function getConnectionDiagnostic(
  config: OpenClawConfig | null,
  connectionStatus: ConnectionStatus
): { title: string; message: string; action: string | null; severity: "ok" | "warn" | "error" | "info" } {
  if (!config?.gateway_url) {
    return {
      title: "Gateway non configuré",
      message: "Entrez l'URL de votre gateway OpenClaw pour connecter le cerveau central.",
      action: "Configurer",
      severity: "info",
    };
  }
  if (config.kill_switch_global) {
    return {
      title: "Kill Switch activé",
      message: "Tous les agents sont en pause. Désactivez le Kill Switch pour reprendre.",
      action: "Désactiver",
      severity: "warn",
    };
  }
  if (connectionStatus === "checking") {
    return {
      title: "Vérification en cours…",
      message: "Nous testons la connexion avec votre gateway OpenClaw.",
      action: null,
      severity: "info",
    };
  }
  if (connectionStatus === "connected") {
    const lastCheck = config.last_healthcheck_at
      ? new Date(config.last_healthcheck_at).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      : null;
    return {
      title: "OpenClaw connecté",
      message: `Le cerveau central répond correctement.${lastCheck ? ` Dernière vérification à ${lastCheck}.` : ""}`,
      action: null,
      severity: "ok",
    };
  }
  if (connectionStatus === "error") {
    return {
      title: "Le cerveau ne répond pas",
      message: "Votre gateway OpenClaw est inaccessible. Vérifiez qu'il est démarré et que l'URL est correcte.",
      action: "Réessayer",
      severity: "error",
    };
  }
  return {
    title: "Statut inconnu",
    message: "Lancez un test de connexion pour vérifier l'état d'OpenClaw.",
    action: "Tester",
    severity: "info",
  };
}

// ── Appel edge function ───────────────────────────────────────────────────────

async function callEdgeFunction(name: string, body: Record<string, unknown> = {}) {
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
    const text = await res.text().catch(() => "Erreur inconnue");
    throw new Error(`${name} (${res.status}): ${text}`);
  }

  return res.json();
}

// ── Hook principal ─────────────────────────────────────────────────────────────

export function useOpenClaw() {
  const { toast } = useToast();
  const [config, setConfig] = useState<OpenClawConfig | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("not_configured");
  const [agents, setAgents] = useState<OpenClawAgent[]>([]);
  const [validations, setValidations] = useState<OpenClawValidation[]>([]);
  const [logs, setLogs] = useState<OpenClawLog[]>([]);
  const [dossierSync, setDossierSync] = useState<DossierSyncStatus>({
    synced: false, last_sync_at: null, error: null, completion_score: 0,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [healthChecking, setHealthChecking] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Charger depuis Supabase (OpenClaw tables removed v8 — returns empty state) ──
  const loadAll = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // OpenClaw tables dropped in v8 migration — reset to disabled state
    setConfig({
      gateway_url: null, autonomie_level: "preparation",
      kill_switch_global: false, is_connected: false,
      healthcheck_status: "unknown", last_healthcheck_at: null,
    });
    setConnectionStatus("not_configured");
    setAgents([]);
    setValidations([]);
    setLogs([]);
    setDossierSync({ synced: false, last_sync_at: null, error: null, completion_score: 0 });
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
    // Polling léger toutes les 30s pour actualiser l'état des agents + logs
    pollRef.current = setInterval(() => {
      loadAll();
    }, 30_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadAll]);

  // ── Sauvegarder config (OpenClaw tables removed v8 — local state only) ──────
  const saveConfig = useCallback(async (updates: Partial<OpenClawConfig & { gateway_secret?: string }>) => {
    // OpenClaw config table dropped — update local state only
    setConfig((prev) => prev ? { ...prev, ...updates } : null);

    if (updates.gateway_url !== undefined) {
      setConnectionStatus(updates.gateway_url ? "error" : "not_configured");

    }
  }, []);

  // ── Healthcheck réel ───────────────────────────────────────────────────────
  const checkHealth = useCallback(async (silent = false) => {
    if (!config?.gateway_url) {
      if (!silent) toast({
        title: "URL manquante",
        description: "Configurez l'URL de votre gateway OpenClaw d'abord.",
        variant: "destructive",
      });
      return { connected: false, status: "no_gateway" };
    }

    setHealthChecking(true);
    setConnectionStatus("checking");

    try {
      const result = await callEdgeFunction("openclaw-healthcheck", {});
      const newStatus: ConnectionStatus = result.connected ? "connected" : "error";
      setConnectionStatus(newStatus);
      setConfig((prev) => prev ? {
        ...prev,
        is_connected: result.connected,
        healthcheck_status: result.status,
        last_healthcheck_at: result.checked_at,
      } : null);

      if (!silent) {
        toast({
          title: result.connected ? "OpenClaw répond ✓" : "Le cerveau ne répond pas",
          description: result.connected
            ? "La connexion avec votre gateway OpenClaw est opérationnelle."
            : "Vérifiez qu'OpenClaw est démarré et que l'URL est correcte.",
          variant: result.connected ? "default" : "destructive",
        });
      }
      return result;
    } catch (err) {
      setConnectionStatus("error");
      if (!silent) toast({
        title: "Erreur de connexion",
        description: "Impossible de contacter le gateway. Réessayez dans quelques instants.",
        variant: "destructive",
      });
      return { connected: false, status: "error" };
    } finally {
      setHealthChecking(false);
    }
  }, [config?.gateway_url, toast]);

  // ── Synchroniser le dossier ────────────────────────────────────────────────
  const syncDossier = useCallback(async () => {
    setSyncing(true);
    setDossierSync((prev) => ({ ...prev, error: null }));

    try {
      const result = await callEdgeFunction("openclaw-dossier-sync", { force: true });

      if (result.success || result.agents_initialized) {
        setDossierSync({
          synced: !!result.gateway_connected,
          last_sync_at: result.gateway_connected ? new Date().toISOString() : null,
          error: result.gateway_connected ? null : (result.setup_required ? null : "sync_failed"),
          completion_score: dossierSync.completion_score,
        });
        await loadAll();
        toast({
          title: result.gateway_connected
            ? "Dossier synchronisé ✓"
            : result.agents_initialized
              ? "Agents initialisés"
              : "Synchronisation terminée",
          description: result.message,
        });
      } else {
        setDossierSync((prev) => ({
          ...prev, error: "sync_failed",
        }));
        toast({
          title: "Synchronisation incomplète",
          description: result.message ?? "Réessayez dans quelques instants.",
          variant: "destructive",
        });
      }
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setDossierSync((prev) => ({ ...prev, error: msg }));
      toast({
        title: "Erreur de synchronisation",
        description: "Le dossier n'a pas pu être envoyé. Vérifiez votre connexion OpenClaw.",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setSyncing(false);
    }
  }, [loadAll, toast, dossierSync.completion_score]);

  // ── Kill Switch ─────────────────────────────────────────────────────────────
  const toggleKillSwitch = useCallback(async (
    type: "global" | "agent",
    activate: boolean,
    agentId?: string,
    reason?: string
  ) => {
    try {
      const result = await callEdgeFunction("openclaw-kill-switch", {
        type, activate, agent_id: agentId, reason,
      });

      if (result.success) {
        await loadAll();
        if (type === "global") {
          setConnectionStatus(activate ? "kill_switch_on" : (config?.is_connected ? "connected" : "error"));
        }
        toast({
          title: activate
            ? type === "global" ? "⛔ Kill Switch activé" : `Agent mis en pause`
            : type === "global" ? "Kill Switch désactivé" : `Agent réactivé`,
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
  }, [loadAll, toast, config?.is_connected]);

  // ── Valider / Refuser ──────────────────────────────────────────────────────
  const processValidation = useCallback(async (
    validationId: string,
    decision: "approve" | "reject",
    note?: string
  ) => {
    try {
      const result = await callEdgeFunction("openclaw-validate", {
        validation_id: validationId, decision, note,
      });

      if (result.success) {
        setValidations((prev) => prev.map((v) =>
          v.id === validationId
            ? { ...v, statut: decision === "approve" ? "validee" : "refusee" }
            : v
        ));
        await loadAll();
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
  }, [loadAll, toast]);

  // ── Probe complet (openclaw-status) ───────────────────────────────────────
  const runStatusProbe = useCallback(async () => {
    setHealthChecking(true);
    setConnectionStatus("checking");
    try {
      const result = await callEdgeFunction("openclaw-status", {});
      const newStatus: ConnectionStatus = result.gateway_reachable
        ? "connected"
        : result.gateway_configured
          ? "error"
          : "not_configured";
      if (config?.kill_switch_global) {
        setConnectionStatus("kill_switch_on");
      } else {
        setConnectionStatus(newStatus);
      }
      setConfig((prev) => prev ? {
        ...prev,
        is_connected: result.gateway_reachable,
        healthcheck_status: result.gateway_reachable ? "ok" : "error",
        last_healthcheck_at: result.checked_at,
      } : null);
      await loadAll();
      return result;
    } catch (err) {
      setConnectionStatus("error");
      return { gateway_configured: false, gateway_reachable: false, auth_ok: false, health_score: 0, probes: [], bootstrap_required: true };
    } finally {
      setHealthChecking(false);
    }
  }, [config?.kill_switch_global, loadAll]);

  // ── Appel gateway direct ───────────────────────────────────────────────────
  const callGateway = useCallback(async (
    tool: string,
    args: Record<string, unknown> = {},
    agentId?: string,
    dryRun = false
  ) => {
    return callEdgeFunction("openclaw-gateway", {
      tool, args, agent_id: agentId, dry_run: dryRun,
    });
  }, []);

  // ── Insérer une validation de test (démo / debug) ──────────────────────────
  const createTestValidation = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("openclaw_validations").insert({
      user_id: user.id,
      agent_id: "execution",
      type_validation: "action",
      titre: "Envoi de 5 messages LinkedIn — Test",
      description: "Ceci est une validation de test générée pour prouver le fonctionnement du circuit de validation.",
      consequence_valide: "Les 5 messages seraient envoyés (test uniquement, aucun envoi réel).",
      consequence_refuse: "Le test est annulé.",
      risque: "faible",
      details: ["5 contacts test", "Canal : LinkedIn", "Généré automatiquement pour démonstration"],
      payload: { tool: "test_validation", args: {}, test: true },
    });

    await loadAll();
    toast({ title: "Validation de test créée", description: "Consultez la boîte de validation." });
  }, [loadAll, toast]);

  // ── Données dérivées ───────────────────────────────────────────────────────
  const pendingValidations = validations.filter((v) => v.statut === "en_attente");
  const activeAgents = agents.filter((a) => a.statut === "actif" && !a.kill_switch);

  const lastActivity = logs[0] ?? null;
  const lastSyncLog = logs.find((l) => l.event_type === "dossier_sent");
  const lastHealthLog = logs.find((l) => l.event_type === "healthcheck");

  const diagnostic = getConnectionDiagnostic(config, connectionStatus);

  return {
    // State
    config, connectionStatus, agents, validations, pendingValidations,
    activeAgents, logs, dossierSync, loading, syncing, healthChecking,
    // Dérivés
    lastActivity, lastSyncLog, lastHealthLog, diagnostic,
    // Actions
    loadAll, saveConfig, checkHealth, syncDossier, runStatusProbe,
    toggleKillSwitch, processValidation, callGateway, createTestValidation,
  };
}
