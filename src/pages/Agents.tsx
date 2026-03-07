import { useState } from "react";
import UserLayout from "@/components/layout/UserLayout";
import {
  Brain, Zap, Shield, Clock, CheckCircle2, AlertTriangle,
  Pause, Play, ChevronRight, Eye, Target, MessageSquare,
  BarChart3, Filter, Activity, Lock, Radio, Sparkles,
  TrendingUp, Users, XCircle, RotateCcw, Cpu
} from "lucide-react";
import { Link } from "react-router-dom";

// ── Types ────────────────────────────────────────────────────────────────────
type AgentStatus = "actif" | "pause" | "attente" | "bloque";
type AutonomiLevel = "lecture" | "preparation" | "assiste" | "semi-auto" | "etendu";

interface Agent {
  id: string;
  nom: string;
  role: string;
  description: string;
  icon: React.ElementType;
  statut: AgentStatus;
  actionEnCours?: string;
  actionsAujourd?: number;
  couleur: string;
}

interface PendingValidation {
  id: string;
  agent: string;
  action: string;
  description: string;
  risque: "faible" | "moyen" | "eleve";
  depuis: string;
}

interface RecentAction {
  id: string;
  agent: string;
  action: string;
  statut: "executee" | "bloquee" | "validee" | "en_attente";
  heure: string;
}

// ── Données mock ─────────────────────────────────────────────────────────────
const AGENTS: Agent[] = [
  {
    id: "stratege",
    nom: "Agent Stratège",
    role: "Analyse & Priorités",
    description: "Lit votre dossier entreprise, définit les cibles et choisit les zones à attaquer en priorité.",
    icon: Target,
    statut: "actif",
    actionEnCours: "Analyse des secteurs prioritaires",
    actionsAujourd: 3,
    couleur: "218 72% 18%",
  },
  {
    id: "sourcing",
    nom: "Agent Sourcing",
    role: "Recherche & Opportunités",
    description: "Identifie les bons contacts, entreprises et signaux d'opportunité dans votre réseau.",
    icon: Users,
    statut: "actif",
    actionEnCours: "Identification de 12 contacts potentiels",
    actionsAujourd: 8,
    couleur: "250 60% 40%",
  },
  {
    id: "message",
    nom: "Agent Message",
    role: "Rédaction & Contenu",
    description: "Prépare les messages, propose les angles et adapte le ton à chaque interlocuteur.",
    icon: MessageSquare,
    statut: "attente",
    actionEnCours: "En attente de validation humaine",
    actionsAujourd: 5,
    couleur: "24 100% 45%",
  },
  {
    id: "execution",
    nom: "Agent Exécution",
    role: "Actions & Envois",
    description: "Prépare et lance les actions autorisées. Remonte ce qui exige votre validation.",
    icon: Zap,
    statut: "pause",
    actionsAujourd: 0,
    couleur: "142 50% 35%",
  },
  {
    id: "qualification",
    nom: "Agent Qualification",
    role: "Analyse des Réponses",
    description: "Trie les réponses, détecte les opportunités intéressantes et les rattache à vos missions.",
    icon: Filter,
    statut: "actif",
    actionEnCours: "Tri de 4 réponses reçues",
    actionsAujourd: 4,
    couleur: "190 60% 35%",
  },
  {
    id: "controle",
    nom: "Agent Contrôle",
    role: "Sécurité & Garde-fous",
    description: "Surveille tous les agents, bloque en cas d'anomalie et déclenche les revues humaines.",
    icon: Shield,
    statut: "actif",
    actionEnCours: "Surveillance active de 5 agents",
    actionsAujourd: 12,
    couleur: "0 60% 40%",
  },
];

const VALIDATIONS: PendingValidation[] = [
  {
    id: "v1",
    agent: "Agent Message",
    action: "Envoi de 23 messages LinkedIn",
    description: "L'agent a préparé une séquence de 23 messages pour votre campagne SaaS B2B. Vérifiez le contenu avant envoi.",
    risque: "moyen",
    depuis: "il y a 2h",
  },
  {
    id: "v2",
    agent: "Agent Exécution",
    action: "Lancement d'une nouvelle campagne",
    description: "Une campagne ciblant 47 contacts dans le secteur Finance est prête. Elle attend votre feu vert.",
    risque: "moyen",
    depuis: "il y a 45min",
  },
];

const RECENT_ACTIONS: RecentAction[] = [
  { id: "a1", agent: "Agent Stratège", action: "Analyse dossier entreprise complétée", statut: "executee", heure: "09:12" },
  { id: "a2", agent: "Agent Sourcing", action: "12 nouveaux contacts identifiés", statut: "executee", heure: "09:34" },
  { id: "a3", agent: "Agent Contrôle", action: "Volume dépassé — campagne email suspendue", statut: "bloquee", heure: "10:05" },
  { id: "a4", agent: "Agent Qualification", action: "2 opportunités chaudes détectées", statut: "executee", heure: "10:22" },
  { id: "a5", agent: "Agent Message", action: "Séquence LinkedIn en attente de validation", statut: "en_attente", heure: "10:41" },
  { id: "a6", agent: "Agent Exécution", action: "Mise en pause par règle de volume", statut: "bloquee", heure: "11:00" },
];

const AUTONOMIE_LEVELS: { id: AutonomiLevel; label: string; description: string }[] = [
  { id: "lecture", label: "Lecture seule", description: "OpenClaw observe et analyse, mais n'agit pas." },
  { id: "preparation", label: "Préparation", description: "Prépare les actions, vous décidez de tout." },
  { id: "assiste", label: "Exécution assistée", description: "Lance les actions après votre validation." },
  { id: "semi-auto", label: "Semi-autonome", description: "Agit seul sur les actions simples, vous valide les sensibles." },
  { id: "etendu", label: "Autonomie étendue", description: "Grande latitude, avec alertes sur les points critiques." },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function StatutBadge({ statut }: { statut: AgentStatus }) {
  const map = {
    actif: { label: "Actif", bg: "hsl(142 50% 35% / 0.12)", color: "hsl(142 50% 28%)", dot: "hsl(142 50% 35%)" },
    pause: { label: "En pause", bg: "hsl(220 14% 60% / 0.12)", color: "hsl(220 14% 40%)", dot: "hsl(220 14% 55%)" },
    attente: { label: "En attente", bg: "hsl(24 100% 45% / 0.12)", color: "hsl(24 80% 36%)", dot: "hsl(24 100% 45%)" },
    bloque: { label: "Bloqué", bg: "hsl(0 60% 40% / 0.12)", color: "hsl(0 60% 32%)", dot: "hsl(0 60% 40%)" },
  };
  const s = map[statut];
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

function RisqueBadge({ risque }: { risque: "faible" | "moyen" | "eleve" }) {
  const map = {
    faible: { label: "Faible", color: "hsl(142 50% 28%)", bg: "hsl(142 50% 35% / 0.1)" },
    moyen: { label: "Modéré", color: "hsl(24 80% 36%)", bg: "hsl(24 100% 45% / 0.1)" },
    eleve: { label: "Élevé", color: "hsl(0 60% 32%)", bg: "hsl(0 60% 40% / 0.1)" },
  };
  const r = map[risque];
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-lg" style={{ background: r.bg, color: r.color }}>
      Risque {r.label}
    </span>
  );
}

function ActionStatutIcon({ statut }: { statut: RecentAction["statut"] }) {
  if (statut === "executee") return <CheckCircle2 size={14} style={{ color: "hsl(142 50% 35%)" }} />;
  if (statut === "bloquee") return <XCircle size={14} style={{ color: "hsl(0 60% 40%)" }} />;
  if (statut === "en_attente") return <Clock size={14} style={{ color: "hsl(24 100% 45%)" }} />;
  return <CheckCircle2 size={14} style={{ color: "hsl(218 72% 40%)" }} />;
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function Agents() {
  const [autonomie, setAutonomie] = useState<AutonomiLevel>("assiste");
  const [openclawActif, setOpenclawActif] = useState(true);
  const [agentsPaused, setAgentsPaused] = useState<Set<string>>(new Set(["execution"]));

  const toggleAgent = (id: string) => {
    setAgentsPaused((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const agentsActifs = AGENTS.filter((a) => !agentsPaused.has(a.id) && a.id !== "controle").length;
  const actionsTotal = AGENTS.reduce((s, a) => s + (a.actionsAujourd || 0), 0);

  return (
    <UserLayout jarvisContext="dashboard">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Brain size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-0.5">
                OpenClaw <span className="text-muted-foreground font-normal text-lg">— Cerveau central</span>
              </h1>
              <p className="text-muted-foreground text-sm">
                Vos agents travaillent pour vous. Vous gardez le contrôle total.
              </p>
            </div>
          </div>

          {/* Kill Switch global */}
          <button
            onClick={() => setOpenclawActif((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              openclawActif ? "shadow-sm" : ""
            }`}
            style={{
              background: openclawActif ? "hsl(0 60% 40% / 0.1)" : "hsl(142 50% 35% / 0.1)",
              color: openclawActif ? "hsl(0 60% 32%)" : "hsl(142 50% 28%)",
              border: `1px solid ${openclawActif ? "hsl(0 60% 40% / 0.2)" : "hsl(142 50% 35% / 0.2)"}`,
            }}
          >
            {openclawActif ? <><Pause size={14} /> Tout mettre en pause</> : <><Play size={14} /> Reprendre</>}
          </button>
        </div>

        {/* ── Statut global ──────────────────────────────────────────────── */}
        <div
          className="p-5 rounded-2xl border"
          style={{
            background: openclawActif
              ? "linear-gradient(135deg, hsl(var(--secondary)), hsl(218 72% 18% / 0.04))"
              : "hsl(var(--muted))",
            borderColor: openclawActif ? "hsl(218 72% 18% / 0.15)" : "hsl(var(--border))",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: openclawActif ? "var(--gradient-primary)" : "hsl(var(--muted-foreground) / 0.2)" }}
              >
                <Cpu size={14} className={openclawActif ? "text-white" : "text-muted-foreground"} />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">OpenClaw Core</p>
                <p className="text-xs text-muted-foreground">
                  {openclawActif ? "Analyse et coordination active" : "Mis en pause — aucune action en cours"}
                </p>
              </div>
            </div>
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{
                background: openclawActif ? "hsl(142 50% 35% / 0.12)" : "hsl(var(--muted))",
                color: openclawActif ? "hsl(142 50% 28%)" : "hsl(var(--muted-foreground))",
              }}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${openclawActif ? "animate-pulse" : ""}`}
                style={{ background: openclawActif ? "hsl(142 50% 35%)" : "hsl(var(--muted-foreground))" }}
              />
              {openclawActif ? "En ligne" : "Pausé"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Agents actifs", value: openclawActif ? `${agentsActifs}/5`, icon: Radio },
              { label: "Actions aujourd'hui", value: openclawActif ? actionsTotal : 0, icon: Activity },
              { label: "En attente de vous", value: openclawActif ? VALIDATIONS.length : 0, icon: Clock },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="card-surface p-3 rounded-xl text-center">
                <Icon size={16} className="text-primary mx-auto mb-1.5" />
                <p className="font-bold text-foreground text-lg leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Niveau d'autonomie ─────────────────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground text-sm">Niveau d'autonomie</h2>
            <span className="ml-auto text-xs text-muted-foreground">Vous contrôlez ce qu'OpenClaw peut faire</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {AUTONOMIE_LEVELS.map((level, i) => {
              const isActive = autonomie === level.id;
              const isPast = AUTONOMIE_LEVELS.findIndex((l) => l.id === autonomie) >= i;
              return (
                <button
                  key={level.id}
                  onClick={() => setAutonomie(level.id)}
                  className={`text-left p-3 rounded-xl border text-xs transition-all ${
                    isActive ? "shadow-sm" : "hover:border-primary/30"
                  }`}
                  style={{
                    borderColor: isActive ? "hsl(var(--primary))" : isPast ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))",
                    background: isActive ? "hsl(var(--primary) / 0.06)" : "transparent",
                  }}
                >
                  <p className={`font-semibold mb-1 ${isActive ? "text-primary" : isPast ? "text-foreground" : "text-muted-foreground"}`}>
                    {level.label}
                  </p>
                  <p className="text-muted-foreground leading-tight hidden sm:block">{level.description}</p>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3 pl-1">
            Mode actuel : <strong className="text-foreground">{AUTONOMIE_LEVELS.find((l) => l.id === autonomie)?.label}</strong> — {AUTONOMIE_LEVELS.find((l) => l.id === autonomie)?.description}
          </p>
        </div>

        {/* ── Validations en attente ─────────────────────────────────────── */}
        {VALIDATIONS.length > 0 && openclawActif && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} style={{ color: "hsl(24 100% 45%)" }} />
              <h2 className="font-semibold text-foreground text-sm">
                {VALIDATIONS.length} validation{VALIDATIONS.length > 1 ? "s" : ""} en attente de votre avis
              </h2>
            </div>
            <div className="space-y-3">
              {VALIDATIONS.map((v) => (
                <div key={v.id} className="card-surface p-4 rounded-xl border" style={{ borderColor: "hsl(24 100% 45% / 0.2)" }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{v.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Par {v.agent} · {v.depuis}</p>
                    </div>
                    <RisqueBadge risque={v.risque} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{v.description}</p>
                  <div className="flex gap-2">
                    <button className="btn-cta flex-1 py-2 text-sm">
                      <CheckCircle2 size={14} /> Valider
                    </button>
                    <button className="flex-1 py-2 text-sm rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors">
                      Refuser
                    </button>
                    <button className="px-3 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors">
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Agents spécialisés ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Sparkles size={15} className="text-primary" /> Votre équipe d'agents
            </h2>
            <span className="text-xs text-muted-foreground">Chaque agent a un rôle précis</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AGENTS.map((agent) => {
              const Icon = agent.icon;
              const isPaused = agentsPaused.has(agent.id) || !openclawActif;
              const effectiveStatut: AgentStatus = isPaused ? "pause" : agent.statut;
              return (
                <div key={agent.id} className={`card-surface p-4 rounded-xl transition-all ${isPaused ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `hsl(${agent.couleur} / 0.1)` }}
                      >
                        <Icon size={16} style={{ color: `hsl(${agent.couleur})` }} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm leading-none">{agent.nom}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{agent.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatutBadge statut={effectiveStatut} />
                    {agent.id !== "controle" && (
                        <button
                          onClick={() => toggleAgent(agent.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title={isPaused ? "Reprendre" : "Pause"}
                        >
                          {isPaused ? <Play size={12} /> : <Pause size={12} />}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{agent.description}</p>
                  {agent.actionEnCours && !isPaused && (
                    <div
                      className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                      style={{ background: "hsl(var(--muted))" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: `hsl(${agent.couleur})` }} />
                      <span className="text-muted-foreground">{agent.actionEnCours}</span>
                    </div>
                  )}
                  {agent.actionsAujourd !== undefined && (
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong className="text-foreground">{agent.actionsAujourd}</strong> action{agent.actionsAujourd > 1 ? "s" : ""} aujourd'hui
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Actions récentes ───────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Activity size={15} className="text-primary" /> Journal d'activité
            </h2>
            <span className="text-xs text-muted-foreground">Aujourd'hui</span>
          </div>
          <div className="card-surface rounded-xl divide-y divide-border">
            {RECENT_ACTIONS.map((action) => (
              <div key={action.id} className="flex items-center gap-3 p-4">
                <ActionStatutIcon statut={action.statut} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{action.action}</p>
                  <p className="text-xs text-muted-foreground">{action.agent}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{action.heure}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recommandations JARVIS ─────────────────────────────────────── */}
        <div
          className="p-5 rounded-2xl border"
          style={{
            background: "linear-gradient(135deg, hsl(var(--secondary)), hsl(218 72% 18% / 0.04))",
            borderColor: "hsl(218 72% 18% / 0.15)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground text-sm">Ce que JARVIS recommande maintenant</h2>
          </div>
          <div className="space-y-3">
            {[
              { texte: "Validez les 2 actions en attente pour débloquer la prospection LinkedIn.", href: "#validations", cta: "Valider maintenant" },
              { texte: "Votre dossier entreprise est incomplet. OpenClaw ne peut pas optimiser sans cibles précises.", href: "/dossier", cta: "Compléter le dossier" },
              { texte: "2 opportunités chaudes identifiées hier n'ont pas encore été traitées.", href: "/opportunites", cta: "Voir les opportunités" },
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "hsl(var(--primary) / 0.1)" }}>
                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground leading-relaxed">{r.texte}</p>
                </div>
                <Link
                  to={r.href}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
                >
                  {r.cta} <ChevronRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* ── Liens rapides ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Dossier entreprise", desc: "Base d'analyse d'OpenClaw", icon: BarChart3, href: "/dossier" },
            { label: "Règles de sécurité", desc: "Vos garde-fous actifs", icon: Shield, href: "/regles" },
            { label: "Rapport du matin", desc: "Voir le brief quotidien", icon: TrendingUp, href: "/pilotage" },
          ].map(({ label, desc, icon: Icon, href }) => (
            <Link
              key={label}
              to={href}
              className="card-surface p-4 rounded-xl flex items-center gap-3 hover:border-primary/30 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(var(--secondary))" }}>
                <Icon size={16} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm leading-none truncate">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground ml-auto shrink-0 group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>

      </div>
    </UserLayout>
  );
}
