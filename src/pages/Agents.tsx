import { useState } from "react";
import type { OpenClawConfig } from "@/hooks/useOpenClaw";
import UserLayout from "@/components/layout/UserLayout";
import {
  Brain, Zap, Shield, CheckCircle2, AlertTriangle,
  Pause, Play, ChevronRight, Eye, Target, MessageSquare,
  Briefcase, Filter, Activity, Radio, Sparkles,
  TrendingUp, Users, Cpu, BookOpen, Wifi, WifiOff,
  Settings, RefreshCw, ExternalLink, AlertCircle,
  Info, ArrowRight, Lightbulb, RotateCcw, Clock,
  Mail, Star, Link, FlaskConical, Ban,
} from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { useOpenClaw, OpenClawAgent, ConnectionStatus } from "@/hooks/useOpenClaw";
import { supabase } from "@/integrations/supabase/client";
import { MorningBrief } from "@/components/openclaw/MorningBrief";

type TabId = "monitoring" | "agents" | "plans" | "configuration";

// ── Métadonnées visuelles par agent ─────────────────────────────────────────
const AGENT_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  stratege:      { icon: Target,        color: "hsl(218 72% 30%)", bg: "hsl(218 72% 95%)" },
  sourcing:      { icon: Users,         color: "hsl(250 60% 40%)", bg: "hsl(250 60% 95%)" },
  message:       { icon: MessageSquare, color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
  execution:     { icon: Zap,           color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
  qualification: { icon: Filter,        color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
  controle:      { icon: Shield,        color: "hsl(0 65% 40%)", bg: "hsl(0 65% 95%)" },
};

const NIVEAU_LABELS: Record<string, { label: string; color: string }> = {
  lecture:      { label: "Peut consulter", color: "hsl(var(--muted-foreground))" },
  preparation:  { label: "Peut préparer",  color: "hsl(218 72% 30%)" },
  assiste:      { label: "Peut proposer",  color: "hsl(38 80% 30%)" },
  execution:    { label: "Peut lancer ✓",  color: "hsl(var(--success))" },
  bloque:       { label: "Bloqué",         color: "hsl(0 65% 40%)" },
};

const AUTONOMIE_OPTIONS = [
  { value: "lecture",     label: "Lecture seule",    desc: "Les agents observent. Aucune action." },
  { value: "preparation", label: "Préparation",       desc: "Les agents préparent, n'exécutent pas." },
  { value: "assiste",     label: "Assisté",           desc: "Vous validez avant chaque action." },
  { value: "semi-auto",   label: "Semi-autonome",     desc: "Actions simples auto, importantes = validation." },
  { value: "etendu",      label: "Autonomie étendue", desc: "Libres sauf actions critiques." },
];

// ── Composant : statut de connexion ──────────────────────────────────────────
function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const map: Record<ConnectionStatus, { label: string; color: string; bg: string; dot?: boolean }> = {
    not_configured: { label: "Non configuré",  color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
    checking:       { label: "Vérification…",  color: "hsl(38 80% 30%)", bg: "hsl(38 80% 90%)", dot: true },
    connected:      { label: "Connecté",        color: "hsl(var(--success))", bg: "hsl(var(--success-light))", dot: true },
    error:          { label: "Inaccessible",    color: "hsl(0 65% 40%)", bg: "hsl(0 65% 95%)" },
    kill_switch_on: { label: "Kill Switch ON",  color: "white", bg: "hsl(0 65% 40%)" },
  };
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {s.dot && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: s.color }} />}
      {s.label}
    </span>
  );
}

// ── Composant : statut agent ──────────────────────────────────────────────────
function AgentStatutBadge({ statut, killSwitch }: { statut: string; killSwitch: boolean }) {
  if (killSwitch) return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "hsl(0 65% 95%)", color: "hsl(0 65% 40%)" }}>
      ⛔ Stoppé
    </span>
  );
  const m: Record<string, [string, string, boolean?]> = {
    actif:   ["Actif",       "hsl(var(--success))", true],
    pause:   ["En pause",    "hsl(var(--muted-foreground))"],
    attente: ["En attente",  "hsl(38 80% 30%)"],
    bloque:  ["Bloqué",      "hsl(0 65% 40%)"],
  };
  const [label, color, pulse] = m[statut] ?? m.pause;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${color}20`, color }}>
      {pulse && <Radio size={9} className="animate-pulse" />}
      {label}
    </span>
  );
}

// ── Composant : carte agent ───────────────────────────────────────────────────
function AgentCard({ agent, onKillSwitch }: {
  agent: OpenClawAgent;
  onKillSwitch: (id: string, activate: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = AGENT_META[agent.agent_id] ?? AGENT_META.controle;
  const Icon = meta.icon;

  return (
    <div className="card-surface p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: agent.kill_switch ? "hsl(var(--muted))" : meta.bg }}>
          <Icon size={16} style={{ color: agent.kill_switch ? "hsl(var(--muted-foreground))" : meta.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-sm font-semibold text-foreground">{agent.nom}</p>
            <AgentStatutBadge statut={agent.statut} killSwitch={agent.kill_switch} />
          </div>
          <p className="text-xs text-muted-foreground">{agent.role}</p>
          {agent.action_en_cours && !agent.kill_switch && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: meta.color }} />
              <p className="text-xs truncate" style={{ color: meta.color }}>{agent.action_en_cours}</p>
            </div>
          )}
          {agent.derniere_activite_at && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Actif à {new Date(agent.derniere_activite_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>

        {/* Toggle kill switch individuel */}
        <button
          onClick={() => onKillSwitch(agent.agent_id, !agent.kill_switch)}
          className="shrink-0 relative rounded-full transition-all"
          style={{
            width: 40, height: 22,
            background: agent.kill_switch ? "hsl(var(--muted))" : "hsl(var(--primary))",
          }}
          aria-label={agent.kill_switch ? "Réactiver l'agent" : "Mettre en pause"}
        >
          <span className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all"
            style={{ left: agent.kill_switch ? 3 : 20 }} />
        </button>
      </div>

      {/* Outils */}
      <button
        className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground w-full"
        onClick={() => setExpanded(!expanded)}
      >
        <BookOpen size={10} />
        <span>{agent.outils_autorises?.length ?? 0} outils</span>
        <ChevronRight size={10} className={`ml-auto transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>
      {expanded && (
        <div className="mt-2 space-y-1.5 pt-2 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          {(agent.outils_autorises ?? []).map((o, i) => {
            const niv = NIVEAU_LABELS[o.niveau] ?? NIVEAU_LABELS.bloque;
            return (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-foreground">{o.label}</span>
                <span className="text-xs font-medium" style={{ color: niv.color }}>{niv.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Composant : log entry ─────────────────────────────────────────────────────
function LogEntry({ log }: { log: { event_type: string; summary: string; created_at: string; risque: string } }) {
  const riskColor = log.risque === "eleve" ? "hsl(0 65% 40%)"
    : log.risque === "moyen" ? "hsl(38 80% 30%)"
    : "hsl(var(--success))";

  const eventIcon: Record<string, React.ElementType> = {
    healthcheck: Wifi, gateway_call: Brain, dossier_sent: RefreshCw,
    kill_switch_activated: Ban, kill_switch_deactivated: Play,
    validation_requested: Clock, validation_approved: CheckCircle2,
    validation_rejected: AlertCircle, rule_blocked: Shield,
    error: AlertTriangle,
  };
  const Icon = eventIcon[log.event_type] ?? Activity;

  return (
    <div className="flex items-start gap-2.5">
      <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${riskColor}20` }}>
        <Icon size={10} style={{ color: riskColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground leading-snug">{log.summary}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(log.created_at).toLocaleString("fr-FR", {
            day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════
export default function Agents() {
  const [activeTab, setActiveTab] = useState<TabId>("monitoring");
  const [gatewayUrlInput, setGatewayUrlInput] = useState("");
  const [gatewaySecretInput, setGatewaySecretInput] = useState("");

  const {
    config, connectionStatus, agents, logs, loading, syncing, healthChecking,
    activeAgents, pendingValidations, dossierSync, diagnostic,
    lastActivity, lastSyncLog,
    saveConfig, checkHealth, syncDossier, toggleKillSwitch, createTestValidation,
    loadAll,
  } = useOpenClaw();

  const handleSaveGateway = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const updates: Record<string, string | null> = {
      gateway_url: gatewayUrlInput.trim() || config?.gateway_url || null,
    };
    if (gatewaySecretInput.trim()) {
      // On passe le secret directement (la table accepte gateway_secret)
      await supabase.from("openclaw_config").upsert(
        { user_id: user.id, ...updates, gateway_secret: gatewaySecretInput.trim() },
        { onConflict: "user_id" }
      );
      setGatewaySecretInput("");
    } else {
      await saveConfig(updates as Partial<OpenClawConfig>);
    }
    setGatewayUrlInput("");
    await checkHealth(false);
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "monitoring",    label: "Monitoring",   icon: Activity },
    { id: "agents",        label: "Mes agents",   icon: Cpu },
    { id: "plans",         label: "Plans",        icon: BookOpen },
    { id: "configuration", label: "Connexion",    icon: Settings },
  ];

  if (loading) {
    return (
      <UserLayout jarvisContext="agents">
        <div className="max-w-2xl mx-auto flex items-center justify-center h-48">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Brain size={20} className="animate-pulse" />
            <span className="text-sm">Connexion à OpenClaw…</span>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout jarvisContext="agents">
      <div className="max-w-2xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "hsl(var(--secondary))" }}>
              <Brain size={20} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">Agent OS · OpenClaw</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <ConnectionBadge status={connectionStatus} />
                {activeAgents.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {activeAgents.length} agent{activeAgents.length > 1 ? "s" : ""} actif{activeAgents.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Kill switch global */}
          <button
            onClick={() => toggleKillSwitch("global", !config?.kill_switch_global, undefined, "Activé manuellement")}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
            style={{
              background: config?.kill_switch_global ? "hsl(0 65% 40%)" : "hsl(var(--muted))",
              color: config?.kill_switch_global ? "white" : "hsl(var(--foreground))",
            }}
          >
            {config?.kill_switch_global ? <Play size={13} /> : <Pause size={13} />}
            {config?.kill_switch_global ? "Réactiver" : "Kill Switch"}
          </button>
        </div>

        {/* ── Bannière kill switch ────────────────────────────────────────── */}
        {config?.kill_switch_global && (
          <div className="rounded-2xl p-3 mb-4 flex items-center gap-3"
            style={{ background: "hsl(0 65% 95%)", border: "1px solid hsl(0 65% 85%)" }}>
            <Ban size={15} style={{ color: "hsl(0 65% 40%)" }} className="shrink-0" />
            <p className="text-xs font-semibold" style={{ color: "hsl(0 65% 40%)" }}>
              Kill Switch global activé — tous les agents sont stoppés. Aucune action ne peut être exécutée.
            </p>
          </div>
        )}

        {/* ── Validations en attente ─────────────────────────────────────── */}
        {pendingValidations.length > 0 && (
          <RouterLink to="/validations">
            <div className="rounded-2xl p-3 mb-4 flex items-center justify-between gap-3 hover:opacity-90 transition-opacity"
              style={{ background: "hsl(38 80% 90%)", border: "1px solid hsl(38 80% 75%)" }}>
              <div className="flex items-center gap-2">
                <Clock size={14} style={{ color: "hsl(38 80% 30%)" }} />
                <p className="text-xs font-semibold" style={{ color: "hsl(38 80% 30%)" }}>
                  {pendingValidations.length} action{pendingValidations.length > 1 ? "s" : ""} attend{pendingValidations.length > 1 ? "ent" : ""} votre accord
                </p>
              </div>
              <ChevronRight size={13} style={{ color: "hsl(38 80% 30%)" }} />
            </div>
          </RouterLink>
        )}

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-2xl mb-5" style={{ background: "hsl(var(--muted))" }}>
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl transition-all"
                style={{
                  background: activeTab === t.id ? "hsl(var(--background))" : "transparent",
                  color: activeTab === t.id ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  boxShadow: activeTab === t.id ? "0 1px 4px hsl(var(--foreground)/0.06)" : "none",
                }}>
                <Icon size={12} />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB : MONITORING
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "monitoring" && (
          <div className="space-y-3">

            {/* ── Diagnostic connexion ─────────────────────────────────── */}
            <div className="card-surface p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {connectionStatus === "connected"
                    ? <Wifi size={16} style={{ color: "hsl(var(--success))" }} />
                    : connectionStatus === "checking"
                      ? <RefreshCw size={16} className="animate-spin" style={{ color: "hsl(38 80% 30%)" }} />
                      : <WifiOff size={16} className="text-muted-foreground" />
                  }
                  <p className="text-sm font-semibold text-foreground">{diagnostic.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => checkHealth(false)}
                    disabled={healthChecking || !config?.gateway_url}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-40"
                    style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
                  >
                    <RefreshCw size={10} className={healthChecking ? "animate-spin" : ""} />
                    Tester
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{diagnostic.message}</p>

              {/* Grille de statuts */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: "Gateway",
                    value: config?.gateway_url
                      ? config.gateway_url.replace(/^https?:\/\//, "").substring(0, 24) + (config.gateway_url.length > 32 ? "…" : "")
                      : "Non configuré",
                    ok: !!config?.gateway_url,
                  },
                  {
                    label: "Connexion",
                    value: connectionStatus === "connected" ? "Opérationnelle"
                      : connectionStatus === "error" ? "Inaccessible"
                      : connectionStatus === "checking" ? "Test en cours…"
                      : "Non testée",
                    ok: connectionStatus === "connected",
                  },
                  {
                    label: "Dossier sync",
                    value: dossierSync.synced
                      ? "Synchronisé"
                      : dossierSync.error
                        ? "Erreur"
                        : "Jamais synchronisé",
                    ok: dossierSync.synced,
                  },
                  {
                    label: "Agents",
                    value: agents.length > 0
                      ? `${agents.length} configurés`
                      : "Non initialisés",
                    ok: agents.length > 0,
                  },
                  {
                    label: "Autonomie",
                    value: AUTONOMIE_OPTIONS.find((o) => o.value === config?.autonomie_level)?.label ?? "—",
                    ok: true,
                  },
                  {
                    label: "Kill Switch",
                    value: config?.kill_switch_global ? "ACTIVÉ ⛔" : "Désactivé",
                    ok: !config?.kill_switch_global,
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl p-2.5"
                    style={{ background: "hsl(var(--muted))" }}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <div className="w-1.5 h-1.5 rounded-full"
                        style={{ background: item.ok ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }} />
                    </div>
                    <p className="text-xs font-semibold text-foreground truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Actions rapides */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={syncDossier}
                  disabled={syncing}
                  className="flex-1 text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}
                >
                  <RefreshCw size={11} className={syncing ? "animate-spin" : ""} />
                  {syncing ? "Sync…" : agents.length === 0 ? "Initialiser" : "Synchroniser"}
                </button>
                {agents.length > 0 && (
                  <button
                    onClick={createTestValidation}
                    className="flex-1 text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                    style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
                  >
                    <FlaskConical size={11} />
                    Tester validation
                  </button>
                )}
              </div>
            </div>

            {/* ── Preuve de vie ─────────────────────────────────────────── */}
            {(lastActivity || dossierSync.last_sync_at) && (
              <div className="card-surface p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Radio size={14} className="animate-pulse" style={{ color: "hsl(var(--primary))" }} />
                  <p className="text-sm font-semibold text-foreground">Preuve de vie</p>
                </div>
                <div className="space-y-2">
                  {dossierSync.last_sync_at && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={12} style={{ color: "hsl(var(--success))" }} />
                      <span className="text-xs text-foreground">
                        Dernière sync dossier : {new Date(dossierSync.last_sync_at).toLocaleString("fr-FR", {
                          day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  {lastActivity && (
                    <div className="flex items-center gap-2">
                      <Activity size={12} style={{ color: "hsl(var(--primary))" }} />
                      <span className="text-xs text-foreground truncate">{lastActivity.summary}</span>
                    </div>
                  )}
                  {pendingValidations.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Clock size={12} style={{ color: "hsl(38 80% 30%)" }} />
                      <span className="text-xs text-foreground">
                        {pendingValidations.length} validation{pendingValidations.length > 1 ? "s" : ""} en attente
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Journal des activités récentes ───────────────────────── */}
            <div className="card-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity size={14} style={{ color: "hsl(var(--primary))" }} />
                  <p className="text-sm font-semibold text-foreground">Journal</p>
                </div>
                <button onClick={loadAll}
                  className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
                  <RefreshCw size={10} />
                  Actualiser
                </button>
              </div>
              {logs.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Aucune activité enregistrée. Lancez un test de connexion ou synchronisez votre dossier.
                </p>
              ) : (
                <div className="space-y-3">
                  {logs.slice(0, 10).map((log) => (
                    <LogEntry key={log.id} log={log} />
                  ))}
                </div>
              )}
            </div>

            {/* ── Agents status rapide ─────────────────────────────────── */}
            {agents.length > 0 && (
              <div className="card-surface p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu size={14} style={{ color: "hsl(var(--primary))" }} />
                  <p className="text-sm font-semibold text-foreground">État des agents</p>
                </div>
                <div className="space-y-2">
                  {agents.map((agent) => {
                    const meta = AGENT_META[agent.agent_id] ?? AGENT_META.controle;
                    const Icon = meta.icon;
                    return (
                      <div key={agent.id} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: meta.bg }}>
                          <Icon size={11} style={{ color: meta.color }} />
                        </div>
                        <span className="text-xs text-foreground flex-1 truncate">{agent.nom}</span>
                        <AgentStatutBadge statut={agent.statut} killSwitch={agent.kill_switch} />
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setActiveTab("agents")}
                  className="mt-3 text-xs font-semibold flex items-center gap-1"
                  style={{ color: "hsl(var(--primary))" }}>
                  Gérer les agents <ChevronRight size={11} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB : AGENTS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "agents" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {agents.length === 0
                  ? "Cliquez sur Synchroniser pour initialiser vos agents."
                  : `${agents.length} agents — synchronisés depuis votre dossier`}
              </p>
              <button onClick={syncDossier} disabled={syncing}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
                style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
                <RefreshCw size={11} className={syncing ? "animate-spin" : ""} />
                {syncing ? "Sync…" : agents.length === 0 ? "Initialiser" : "Synchroniser"}
              </button>
            </div>

            {agents.length === 0 ? (
              <div className="card-surface p-8 text-center">
                <Brain size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-semibold text-foreground mb-2">Agents non initialisés</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Cliquez sur Synchroniser pour créer vos 6 agents spécialisés à partir de votre dossier entreprise.
                </p>
                <button onClick={syncDossier} disabled={syncing}
                  className="text-xs font-semibold px-4 py-2 rounded-xl"
                  style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                  {syncing ? "Initialisation…" : "Initialiser les agents"}
                </button>
              </div>
            ) : (
              agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onKillSwitch={(id, act) => toggleKillSwitch("agent", act, id)}
                />
              ))
            )}

            {/* Architecture visible */}
            {agents.length > 0 && (
              <div className="rounded-2xl p-4 mt-2" style={{ background: "hsl(var(--secondary))" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={13} style={{ color: "hsl(var(--primary))" }} />
                  <p className="text-xs font-semibold text-foreground">Architecture WIINUP MAX</p>
                </div>
                {[
                  { icon: MessageSquare, label: "JARVIS",     desc: "Interface humaine",    color: "hsl(var(--primary))" },
                  { icon: Brain,         label: "OpenClaw",   desc: "Cerveau central",      color: "hsl(250 60% 40%)" },
                  { icon: Cpu,           label: "Agents",     desc: "Exécution spécialisée",color: "hsl(var(--success))" },
                  { icon: Shield,        label: "Garde-fous", desc: "Contrôle externe",     color: "hsl(0 65% 40%)" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-2 mb-1.5 last:mb-0">
                      <Icon size={11} style={{ color: item.color }} />
                      <span className="text-xs font-semibold text-foreground">{item.label}</span>
                      <span className="text-xs text-muted-foreground">— {item.desc}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB : PLANS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "plans" && (
          <MorningBrief compact={false} />
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB : CONFIGURATION
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "configuration" && (
          <div className="space-y-4">

            {/* Statut actuel */}
            <div className="card-surface p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">Statut de la connexion</p>
                <ConnectionBadge status={connectionStatus} />
              </div>
              {config?.gateway_url && (
                <div className="flex items-center gap-1.5 mb-2">
                  <Link size={10} className="text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground break-all">{config.gateway_url}</p>
                </div>
              )}
              {config?.last_healthcheck_at && (
                <p className="text-xs text-muted-foreground">
                  Dernier test : {new Date(config.last_healthcheck_at).toLocaleString("fr-FR")}
                </p>
              )}
              <button onClick={() => checkHealth(false)} disabled={healthChecking || !config?.gateway_url}
                className="mt-3 w-full text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-40"
                style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>
                <RefreshCw size={11} className={healthChecking ? "animate-spin" : ""} />
                {healthChecking ? "Test en cours…" : "Tester la connexion"}
              </button>
            </div>

            {/* Instructions */}
            <div className="rounded-2xl p-4" style={{ background: "hsl(var(--muted))" }}>
              <div className="flex items-center gap-2 mb-3">
                <Info size={13} style={{ color: "hsl(var(--primary))" }} />
                <p className="text-xs font-semibold text-foreground">Comment connecter OpenClaw</p>
              </div>
              {[
                "Installez OpenClaw : npm install -g openclaw@latest",
                "Démarrez le gateway : openclaw gateway start",
                "Exposez-le publiquement : ngrok http 18789",
                "Copiez l'URL (ex: https://abc.ngrok.io) ci-dessous",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                    {i + 1}
                  </span>
                  <p className="text-xs text-muted-foreground">{step}</p>
                </div>
              ))}
              <a href="https://docs.openclaw.ai" target="_blank" rel="noreferrer"
                className="mt-3 text-xs font-semibold flex items-center gap-1"
                style={{ color: "hsl(var(--primary))" }}>
                Documentation OpenClaw <ExternalLink size={10} />
              </a>
            </div>

            {/* Formulaire URL */}
            <div className="card-surface p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Configurer le gateway</p>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">URL du gateway</label>
                <input
                  type="url"
                  placeholder={config?.gateway_url ?? "https://votre-url.ngrok.io"}
                  value={gatewayUrlInput}
                  onChange={(e) => setGatewayUrlInput(e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2.5 border outline-none focus:ring-2 transition-all"
                  style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Secret partagé (optionnel)</label>
                <input
                  type="password"
                  placeholder="Laissez vide si non configuré"
                  value={gatewaySecretInput}
                  onChange={(e) => setGatewaySecretInput(e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2.5 border outline-none focus:ring-2 transition-all"
                  style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                />
              </div>
              <button
                onClick={handleSaveGateway}
                disabled={!gatewayUrlInput && !config?.gateway_url}
                className="w-full text-sm font-semibold py-2.5 rounded-xl disabled:opacity-40 transition-all"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
              >
                Enregistrer et tester
              </button>
            </div>

            {/* Niveau d'autonomie */}
            <div className="card-surface p-4">
              <p className="text-sm font-semibold text-foreground mb-3">Niveau d'autonomie</p>
              <div className="space-y-2">
                {AUTONOMIE_OPTIONS.map((opt) => (
                  <button key={opt.value}
                    onClick={() => saveConfig({ autonomie_level: opt.value as OpenClawConfig["autonomie_level"] })}
                    className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all"
                    style={{
                      background: config?.autonomie_level === opt.value ? "hsl(var(--secondary))" : "hsl(var(--muted))",
                      border: `1.5px solid ${config?.autonomie_level === opt.value ? "hsl(var(--primary))" : "transparent"}`,
                    }}>
                    <div className="w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center"
                      style={{ borderColor: "hsl(var(--primary))" }}>
                      {config?.autonomie_level === opt.value && (
                        <div className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--primary))" }} />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lien règles */}
            <RouterLink to="/regles"
              className="card-surface p-4 flex items-center justify-between hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "hsl(var(--secondary))" }}>
                  <Shield size={14} style={{ color: "hsl(var(--primary))" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Règles & garde-fous</p>
                  <p className="text-xs text-muted-foreground">Limites, volumes, comportements</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-muted-foreground" />
            </RouterLink>
          </div>
        )}

      </div>
    </UserLayout>
  );
}
