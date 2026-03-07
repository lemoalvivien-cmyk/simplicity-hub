import { useState } from "react";
import type { OpenClawConfig } from "@/hooks/useOpenClaw";
import UserLayout from "@/components/layout/UserLayout";
import {
  Brain, Zap, Shield, Clock, CheckCircle2, AlertTriangle,
  Pause, Play, ChevronRight, Eye, Target, MessageSquare,
  Briefcase, Filter, Activity, Radio, Sparkles,
  TrendingUp, Users, Cpu, BookOpen, FlaskConical,
  Mail, Star, ArrowRight, Lightbulb, RotateCcw,
  Wifi, WifiOff, Settings, Link, RefreshCw, ExternalLink,
  AlertCircle, Info
} from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { useOpenClaw, OpenClawAgent } from "@/hooks/useOpenClaw";

// ── Types ─────────────────────────────────────────────────────────────────────
type TabId = "agents" | "memoire" | "plans" | "configuration";

// ── Couleurs par agent_id ─────────────────────────────────────────────────────
const AGENT_META: Record<string, {
  couleur: string; bg: string;
  icon: React.ElementType; iconColor: string;
}> = {
  stratege:      { couleur: "hsl(218 72% 30%)", bg: "hsl(218 72% 95%)", icon: Target, iconColor: "hsl(218 72% 30%)" },
  sourcing:      { couleur: "hsl(250 60% 40%)", bg: "hsl(250 60% 95%)", icon: Users, iconColor: "hsl(250 60% 40%)" },
  message:       { couleur: "hsl(var(--success))", bg: "hsl(var(--success-light))", icon: MessageSquare, iconColor: "hsl(var(--success))" },
  execution:     { couleur: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", icon: Zap, iconColor: "hsl(38 80% 30%)" },
  qualification: { couleur: "hsl(var(--primary))", bg: "hsl(var(--secondary))", icon: Filter, iconColor: "hsl(var(--primary))" },
  controle:      { couleur: "hsl(0 65% 40%)", bg: "hsl(0 65% 95%)", icon: Shield, iconColor: "hsl(0 65% 40%)" },
};

const NIVEAU_LABELS: Record<string, { label: string; color: string }> = {
  lecture:      { label: "Peut consulter", color: "hsl(var(--muted-foreground))" },
  preparation:  { label: "Peut préparer", color: "hsl(218 72% 30%)" },
  assiste:      { label: "Peut proposer", color: "hsl(38 80% 30%)" },
  execution:    { label: "Peut lancer ✓", color: "hsl(var(--success))" },
  bloque:       { label: "Bloqué", color: "hsl(0 65% 40%)" },
};

const AUTONOMIE_OPTIONS = [
  { value: "lecture",     label: "Lecture seule",     desc: "Les agents observent uniquement. Aucune action." },
  { value: "preparation", label: "Préparation",        desc: "Les agents préparent des actions sans les exécuter." },
  { value: "assiste",     label: "Assisté",            desc: "Les agents proposent, vous validez avant chaque action." },
  { value: "semi-auto",   label: "Semi-autonome",      desc: "Les agents exécutent les actions simples, vous validez les importantes." },
  { value: "etendu",      label: "Autonomie étendue",  desc: "Les agents agissent librement, sauf actions critiques." },
];

// ── Composant statut ───────────────────────────────────────────────────────────
function StatutBadge({ statut, killSwitch }: { statut: string; killSwitch: boolean }) {
  if (killSwitch) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "hsl(0 65% 95%)", color: "hsl(0 65% 40%)" }}>
      <Pause size={10} /> Stoppé
    </span>
  );
  const map: Record<string, { label: string; bg: string; color: string }> = {
    actif:   { label: "Actif", bg: "hsl(var(--success-light))", color: "hsl(var(--success))" },
    pause:   { label: "En pause", bg: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" },
    attente: { label: "En attente", bg: "hsl(38 80% 90%)", color: "hsl(38 80% 30%)" },
    bloque:  { label: "Bloqué", bg: "hsl(0 65% 95%)", color: "hsl(0 65% 40%)" },
  };
  const s = map[statut] ?? map.pause;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {statut === "actif" && <Radio size={9} className="animate-pulse" />}
      {s.label}
    </span>
  );
}

// ── Carte agent ────────────────────────────────────────────────────────────────
function AgentCard({
  agent,
  onKillSwitch,
}: {
  agent: OpenClawAgent;
  onKillSwitch: (agentId: string, activate: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = AGENT_META[agent.agent_id] ?? AGENT_META.controle;
  const Icon = meta.icon;

  return (
    <div className="card-surface p-4">
      <div className="flex items-start gap-3">
        {/* Icône */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: agent.kill_switch ? "hsl(var(--muted))" : meta.bg }}>
          <Icon size={16} style={{ color: agent.kill_switch ? "hsl(var(--muted-foreground))" : meta.iconColor }} />
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-sm font-semibold text-foreground">{agent.nom}</p>
            <StatutBadge statut={agent.statut} killSwitch={agent.kill_switch} />
          </div>
          <p className="text-xs text-muted-foreground mb-1">{agent.role}</p>

          {agent.action_en_cours && !agent.kill_switch && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: meta.iconColor }} />
              <p className="text-xs" style={{ color: meta.iconColor }}>{agent.action_en_cours}</p>
            </div>
          )}
        </div>

        {/* Kill switch individuel */}
        <button
          onClick={() => onKillSwitch(agent.agent_id, !agent.kill_switch)}
          className="shrink-0 w-10 h-5.5 rounded-full transition-all relative"
          style={{ background: agent.kill_switch ? "hsl(var(--muted))" : "hsl(var(--primary))" }}
          aria-label={agent.kill_switch ? "Réactiver" : "Mettre en pause"}
        >
          <span className="absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all"
            style={{ left: agent.kill_switch ? "2px" : "calc(100% - 20px)" }} />
        </button>
      </div>

      {/* Outils — toggle */}
      <button
        className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground w-full text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <BookOpen size={11} />
        <span>{agent.outils_autorises?.length ?? 0} outils configurés</span>
        <ChevronRight size={11} className={`ml-auto transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5">
          {(agent.outils_autorises ?? []).map((outil, i) => {
            const niv = NIVEAU_LABELS[outil.niveau] ?? NIVEAU_LABELS.bloque;
            return (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-foreground">{outil.label}</span>
                <span className="text-xs font-medium" style={{ color: niv.color }}>{niv.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── PAGE PRINCIPALE ────────────────────────────────────────────────────────────
export default function Agents() {
  const [activeTab, setActiveTab] = useState<TabId>("agents");
  const {
    config, agents, logs, loading, syncing,
    saveConfig, checkHealth, syncDossier, toggleKillSwitch,
    pendingValidations,
  } = useOpenClaw();

  const [gatewayUrlInput, setGatewayUrlInput] = useState("");
  const [gatewaySecretInput, setGatewaySecretInput] = useState("");
  const [healthChecking, setHealthChecking] = useState(false);

  const activeAgents = agents.filter((a) => a.statut === "actif" && !a.kill_switch).length;

  const handleHealthCheck = async () => {
    setHealthChecking(true);
    await checkHealth();
    setHealthChecking(false);
  };

  const handleSaveGateway = async () => {
    await saveConfig({
      gateway_url: gatewayUrlInput || config?.gateway_url || null,
      gateway_secret: gatewaySecretInput || null,
    });
    await handleHealthCheck();
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "agents",        label: "Mes agents",     icon: Cpu },
    { id: "memoire",       label: "Ce qu'ils savent", icon: Brain },
    { id: "plans",         label: "Plans d'action", icon: BookOpen },
    { id: "configuration", label: "Connexion",      icon: Settings },
  ];

  if (loading) {
    return (
      <UserLayout jarvisContext="agents">
        <div className="max-w-2xl mx-auto flex items-center justify-center h-48">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Brain size={20} className="animate-pulse" />
            <span className="text-sm">Chargement d'OpenClaw...</span>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout jarvisContext="agents">
      <div className="max-w-2xl mx-auto">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "hsl(var(--secondary))" }}>
              <Brain size={20} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">Agent OS · OpenClaw</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeAgents > 0
                  ? `${activeAgents} agent${activeAgents > 1 ? "s" : ""} actif${activeAgents > 1 ? "s" : ""}`
                  : "Agents en attente"} ·{" "}
                {config?.is_connected
                  ? <span style={{ color: "hsl(var(--success))" }}>OpenClaw connecté</span>
                  : <span style={{ color: "hsl(38 80% 30%)" }}>Gateway non configuré</span>
                }
              </p>
            </div>
          </div>

          {/* Kill Switch global */}
          <button
            onClick={() => toggleKillSwitch("global", !config?.kill_switch_global)}
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

        {/* ── Alerte kill switch actif ─────────────────────────────────────── */}
        {config?.kill_switch_global && (
          <div className="rounded-2xl p-3 mb-4 flex items-center gap-3"
            style={{ background: "hsl(0 65% 95%)", border: "1px solid hsl(0 65% 85%)" }}>
            <AlertTriangle size={15} style={{ color: "hsl(0 65% 40%)" }} className="shrink-0" />
            <p className="text-xs font-medium" style={{ color: "hsl(0 65% 40%)" }}>
              Kill Switch global activé — tous vos agents sont en pause. Aucune action ne sera exécutée.
            </p>
          </div>
        )}

        {/* ── Validations en attente ───────────────────────────────────────── */}
        {pendingValidations.length > 0 && (
          <RouterLink to="/validations">
            <div className="rounded-2xl p-3 mb-4 flex items-center justify-between gap-3 cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: "hsl(38 80% 90%)", border: "1px solid hsl(38 80% 75%)" }}>
              <div className="flex items-center gap-2">
                <Clock size={15} style={{ color: "hsl(38 80% 30%)" }} />
                <p className="text-xs font-semibold" style={{ color: "hsl(38 80% 30%)" }}>
                  {pendingValidations.length} action{pendingValidations.length > 1 ? "s" : ""} en attente de votre validation
                </p>
              </div>
              <ChevronRight size={13} style={{ color: "hsl(38 80% 30%)" }} />
            </div>
          </RouterLink>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-2xl mb-5" style={{ background: "hsl(var(--muted))" }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-2 rounded-xl transition-all"
                style={{
                  background: activeTab === tab.id ? "hsl(var(--background))" : "transparent",
                  color: activeTab === tab.id ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  boxShadow: activeTab === tab.id ? "0 1px 4px hsl(var(--foreground)/0.08)" : "none",
                }}
              >
                <Icon size={12} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB : MES AGENTS                                                  */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "agents" && (
          <div className="space-y-3">
            {/* Bouton sync */}
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">
                {agents.length === 0
                  ? "Vos agents seront initialisés lors de la première synchronisation."
                  : `${agents.length} agents — mis à jour depuis votre dossier entreprise`}
              </p>
              <button
                onClick={syncDossier}
                disabled={syncing}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}
              >
                <RefreshCw size={11} className={syncing ? "animate-spin" : ""} />
                {syncing ? "Sync..." : agents.length === 0 ? "Initialiser" : "Synchroniser"}
              </button>
            </div>

            {agents.length === 0 ? (
              <div className="card-surface p-6 text-center">
                <Brain size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold text-foreground mb-1">Agents non encore initialisés</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Cliquez sur "Initialiser" pour créer vos 6 agents spécialisés.
                  {!config?.gateway_url && " Configurez ensuite votre gateway OpenClaw pour les connecter au cerveau central."}
                </p>
                <button
                  onClick={syncDossier}
                  disabled={syncing}
                  className="text-xs font-semibold px-4 py-2 rounded-xl"
                  style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                >
                  {syncing ? "Initialisation..." : "Initialiser les agents"}
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

            {/* Résumé Architecture */}
            {agents.length > 0 && (
              <div className="rounded-2xl p-4 mt-4" style={{ background: "hsl(var(--secondary))" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={13} style={{ color: "hsl(var(--primary))" }} />
                  <p className="text-xs font-semibold text-foreground">Architecture WIINUP MAX</p>
                </div>
                <div className="space-y-2">
                  {[
                    { icon: MessageSquare, label: "JARVIS", desc: "Votre interface humaine", color: "hsl(var(--primary))" },
                    { icon: Brain,         label: "OpenClaw", desc: "Le cerveau central", color: "hsl(250 60% 40%)" },
                    { icon: Cpu,           label: "Agents",   desc: "L'exécution spécialisée", color: "hsl(var(--success))" },
                    { icon: Shield,        label: "Garde-fous", desc: "Le contrôle externe", color: "hsl(0 65% 40%)" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-2">
                        <Icon size={12} style={{ color: item.color }} />
                        <span className="text-xs font-semibold text-foreground">{item.label}</span>
                        <span className="text-xs text-muted-foreground">— {item.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB : MÉMOIRE                                                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "memoire" && (
          <div className="space-y-3">
            <div className="rounded-2xl p-4" style={{ background: "hsl(var(--muted))" }}>
              <div className="flex items-center gap-2 mb-2">
                <Info size={13} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Ce que vos agents savent sur votre entreprise. Ces informations viennent de votre{" "}
                  <RouterLink to="/dossier" className="underline">dossier entreprise</RouterLink>.
                </p>
              </div>
            </div>

            {[
              { label: "Votre entreprise", icon: Briefcase, items: ["Activité", "Offre", "Valeur proposée", "Cas d'usage"] },
              { label: "Qui vous cherchez", icon: Target, items: ["Client idéal", "Type d'entreprise", "Taille cible", "Décideur"] },
              { label: "Où vous cherchez", icon: Activity, items: ["Zone géographique", "Villes prioritaires", "Secteurs", "Exclusions"] },
              { label: "Vos objectifs", icon: TrendingUp, items: ["Opportunités / mois", "Introductions / mois", "RDV / mois", "Secteur prioritaire"] },
              { label: "Vos règles", icon: Shield, items: ["Canaux autorisés", "Canaux interdits", "Clients interdits", "Niveau d'autonomie"] },
            ].map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.label} className="card-surface p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={14} style={{ color: "hsl(var(--primary))" }} />
                    <p className="text-sm font-semibold text-foreground">{section.label}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {section.items.map((item) => (
                      <div key={item} className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full shrink-0" style={{ background: "hsl(var(--muted-foreground))" }} />
                        <span className="text-xs text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                  <RouterLink to="/dossier"
                    className="mt-3 text-xs font-semibold flex items-center gap-1"
                    style={{ color: "hsl(var(--primary))" }}>
                    Compléter le dossier <ChevronRight size={11} />
                  </RouterLink>
                </div>
              );
            })}

            {/* Journal des 10 derniers logs */}
            {logs.length > 0 && (
              <div className="card-surface p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={14} style={{ color: "hsl(var(--primary))" }} />
                  <p className="text-sm font-semibold text-foreground">Activité récente</p>
                </div>
                <div className="space-y-2">
                  {logs.slice(0, 8).map((log) => (
                    <div key={log.id} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                        style={{
                          background: log.risque === "eleve" ? "hsl(0 65% 40%)"
                            : log.risque === "moyen" ? "hsl(38 80% 30%)"
                            : "hsl(var(--success))"
                        }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-snug">{log.summary}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB : PLANS D'ACTION                                              */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "plans" && (
          <div className="space-y-3">
            <div className="rounded-2xl p-3 flex items-start gap-2 mb-1" style={{ background: "hsl(var(--muted))" }}>
              <Info size={13} className="text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Les plans d'action guident vos agents étape par étape. OpenClaw choisit automatiquement le plan adapté à votre dossier.
              </p>
            </div>

            {[
              {
                id: "prospection",
                nom: "Prospection entreprise",
                desc: "Trouver de nouvelles opportunités à partir de votre dossier.",
                agents: ["Stratège", "Sourcing", "Message", "Exécution"],
                etapes: [
                  "Stratège analyse le dossier et choisit les cibles",
                  "Sourcing identifie les contacts prioritaires",
                  "Message prépare les messages personnalisés",
                  "Exécution prépare les envois (avec votre validation)",
                ],
                icon: Target, couleur: "hsl(218 72% 30%)",
              },
              {
                id: "relance",
                nom: "Relance intelligente",
                desc: "Relancer les contacts sans réponse de façon personnalisée.",
                agents: ["Message", "Exécution", "Qualification"],
                etapes: [
                  "Qualification trie les contacts sans réponse",
                  "Message adapte le message de relance au contexte",
                  "Exécution prépare la relance (avec votre validation)",
                ],
                icon: RotateCcw, couleur: "hsl(var(--primary))",
              },
              {
                id: "qualification",
                nom: "Qualification rapide",
                desc: "Trier les réponses et détecter les opportunités réelles.",
                agents: ["Qualification", "Stratège"],
                etapes: [
                  "Qualification lit les réponses et détecte les signaux positifs",
                  "Stratège évalue la pertinence et suggère la prochaine étape",
                  "Vous décidez quoi qualifier en opportunité",
                ],
                icon: Star, couleur: "hsl(250 60% 40%)",
              },
              {
                id: "introduction",
                nom: "Préparer une introduction",
                desc: "Relier un contact pertinent à une mission facilitateur.",
                agents: ["Qualification", "Message"],
                etapes: [
                  "Qualification identifie le contact et la mission la plus adaptée",
                  "Message prépare le contexte et la mise en relation",
                  "Vous validez avant envoi",
                ],
                icon: Users, couleur: "hsl(var(--success))",
              },
            ].map((plan) => {
              const Icon = plan.icon;
              return (
                <div key={plan.id} className="card-surface p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${plan.couleur}20` }}>
                      <Icon size={15} style={{ color: plan.couleur }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{plan.nom}</p>
                      <p className="text-xs text-muted-foreground">{plan.desc}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {plan.etapes.map((e, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs font-bold shrink-0 w-4 text-right"
                          style={{ color: plan.couleur }}>{i + 1}.</span>
                        <span className="text-xs text-muted-foreground">{e}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 flex-wrap">
                      {plan.agents.map((a) => (
                        <span key={a} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                          {a}
                        </span>
                      ))}
                    </div>
                    <button className="text-xs font-semibold flex items-center gap-1"
                      style={{ color: plan.couleur }}>
                      Démarrer <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Boucle d'apprentissage */}
            <div className="card-surface p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} style={{ color: "hsl(var(--primary))" }} />
                <p className="text-sm font-semibold text-foreground">Ce que vos agents ont appris</p>
              </div>
              <div className="space-y-2">
                {[
                  { icon: Mail,    text: "Les emails envoyés le mardi matin ont 40% de taux d'ouverture de plus.", trend: "↑" },
                  { icon: Target,  text: "Les PME du secteur tech répondent 2× plus vite.", trend: "↑" },
                  { icon: Star,    text: "Les introductions via LinkedIn convertissent mieux que par email.", trend: "↑" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "hsl(var(--success-light))" }}>
                        <Icon size={11} style={{ color: "hsl(var(--success))" }} />
                      </div>
                      <p className="text-xs text-foreground leading-snug flex-1">{item.text}</p>
                      <span className="text-xs font-bold shrink-0" style={{ color: "hsl(var(--success))" }}>{item.trend}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Lightbulb size={11} />
                Les apprentissages s'affinent au fil de vos campagnes et introductions réelles.
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB : CONFIGURATION GATEWAY                                       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "configuration" && (
          <div className="space-y-4">

            {/* Statut connexion */}
            <div className="card-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {config?.is_connected
                    ? <Wifi size={16} style={{ color: "hsl(var(--success))" }} />
                    : <WifiOff size={16} className="text-muted-foreground" />
                  }
                  <p className="text-sm font-semibold text-foreground">
                    {config?.is_connected ? "OpenClaw connecté" : "Gateway non configuré"}
                  </p>
                </div>
                <button
                  onClick={handleHealthCheck}
                  disabled={healthChecking || !config?.gateway_url}
                  className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all disabled:opacity-40"
                  style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
                >
                  <RefreshCw size={11} className={healthChecking ? "animate-spin" : ""} />
                  Tester
                </button>
              </div>
              {config?.is_connected && config.last_healthcheck_at && (
                <p className="text-xs text-muted-foreground">
                  Dernière vérification : {new Date(config.last_healthcheck_at).toLocaleString("fr-FR")}
                </p>
              )}
              {config?.gateway_url && (
                <div className="mt-2 flex items-center gap-2">
                  <Link size={11} className="text-muted-foreground" />
                  <p className="text-xs text-muted-foreground break-all">{config.gateway_url}</p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="rounded-2xl p-4" style={{ background: "hsl(var(--muted))" }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={13} style={{ color: "hsl(var(--primary))" }} />
                <p className="text-xs font-semibold text-foreground">Comment connecter OpenClaw</p>
              </div>
              <div className="space-y-2">
                {[
                  { step: "1", text: "Installez OpenClaw sur votre serveur : npm install -g openclaw@latest" },
                  { step: "2", text: "Démarrez le gateway : openclaw gateway start" },
                  { step: "3", text: "Exposez-le via ngrok ou votre serveur public : ngrok http 18789" },
                  { step: "4", text: "Copiez l'URL publique (ex: https://abc123.ngrok.io) ci-dessous" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                      {item.step}
                    </span>
                    <p className="text-xs text-muted-foreground">{item.text}</p>
                  </div>
                ))}
              </div>
              <a href="https://docs.openclaw.ai" target="_blank" rel="noreferrer"
                className="mt-3 text-xs font-semibold flex items-center gap-1"
                style={{ color: "hsl(var(--primary))" }}>
                Documentation officielle OpenClaw <ExternalLink size={10} />
              </a>
            </div>

            {/* Formulaire */}
            <div className="card-surface p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">URL du Gateway OpenClaw</p>
              <input
                type="url"
                placeholder={config?.gateway_url ?? "https://votre-url.ngrok.io"}
                value={gatewayUrlInput}
                onChange={(e) => setGatewayUrlInput(e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2.5 border transition-all outline-none focus:ring-2"
                style={{
                  background: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
              />
              <input
                type="password"
                placeholder="Secret partagé (optionnel)"
                value={gatewaySecretInput}
                onChange={(e) => setGatewaySecretInput(e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2.5 border transition-all outline-none focus:ring-2"
                style={{
                  background: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
              />
              <button
                onClick={handleSaveGateway}
                disabled={!gatewayUrlInput && !config?.gateway_url}
                className="w-full text-sm font-semibold py-2.5 rounded-xl transition-all disabled:opacity-40"
                style={{
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                }}
              >
                Enregistrer et tester la connexion
              </button>
            </div>

            {/* Niveau d'autonomie */}
            <div className="card-surface p-4">
              <p className="text-sm font-semibold text-foreground mb-3">Niveau d'autonomie</p>
              <div className="space-y-2">
                {AUTONOMIE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => saveConfig({ autonomie_level: opt.value as OpenClawConfig["autonomie_level"] })}
                    className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all"
                    style={{
                      background: config?.autonomie_level === opt.value ? "hsl(var(--secondary))" : "hsl(var(--muted))",
                      border: config?.autonomie_level === opt.value ? "1.5px solid hsl(var(--primary))" : "1.5px solid transparent",
                    }}
                  >
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

            {/* Règles → lien */}
            <RouterLink to="/regles"
              className="card-surface p-4 flex items-center justify-between hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-2">
                <Shield size={14} style={{ color: "hsl(var(--primary))" }} />
                <div>
                  <p className="text-sm font-semibold text-foreground">Règles & garde-fous</p>
                  <p className="text-xs text-muted-foreground">Définir les limites et comportements autorisés</p>
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
