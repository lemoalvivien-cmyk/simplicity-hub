import { useState } from "react";
import UserLayout from "@/components/layout/UserLayout";
import {
  Brain, Zap, Shield, Clock, CheckCircle2, AlertTriangle,
  Pause, Play, ChevronRight, Eye, Target, MessageSquare,
  Briefcase, Filter, Activity, Lock, Radio, Sparkles,
  TrendingUp, Users, Cpu, BookOpen, FlaskConical,
  Database, Globe, Mail, FileText, Star,
  ArrowRight, ThumbsUp, ThumbsDown, Lightbulb, RotateCcw,
  ChevronDown
} from "lucide-react";
import { Link } from "react-router-dom";

// ── Types ─────────────────────────────────────────────────────────────────────
type AgentStatus = "actif" | "pause" | "attente" | "bloque";
type AutonomiLevel = "lecture" | "preparation" | "assiste" | "semi-auto" | "etendu";
type TabId = "agents" | "memoire" | "plans" | "apprentissage" | "simulation";

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
  outils: { label: string; niveau: "lecture" | "preparation" | "execution" | "bloque" }[];
}

interface Playbook {
  id: string;
  nom: string;
  description: string;
  etapes: string[];
  agents: string[];
  duree: string;
  actif: boolean;
}

interface Apprentissage {
  id: string;
  insight: string;
  detail: string;
  type: "message" | "cible" | "mission" | "canal";
  trend: "hausse" | "baisse";
}

// ── Données ───────────────────────────────────────────────────────────────────
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
    couleur: "218 72% 30%",
    outils: [
      { label: "Dossier entreprise", niveau: "lecture" },
      { label: "Contacts", niveau: "lecture" },
      { label: "Missions", niveau: "lecture" },
      { label: "Campagnes", niveau: "preparation" },
      { label: "Messages", niveau: "bloque" },
      { label: "Envoi email", niveau: "bloque" },
    ],
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
    outils: [
      { label: "Contacts", niveau: "lecture" },
      { label: "Listes", niveau: "preparation" },
      { label: "Imports", niveau: "execution" },
      { label: "Web recherche", niveau: "lecture" },
      { label: "Introductions", niveau: "preparation" },
      { label: "Envoi email", niveau: "bloque" },
    ],
  },
  {
    id: "message",
    nom: "Agent Message",
    role: "Rédaction & Contenu",
    description: "Prépare les messages, propose les angles et adapte le ton à chaque interlocuteur.",
    icon: MessageSquare,
    statut: "attente",
    actionEnCours: "En attente de votre validation",
    actionsAujourd: 5,
    couleur: "24 100% 45%",
    outils: [
      { label: "Messages", niveau: "preparation" },
      { label: "Campagnes", niveau: "preparation" },
      { label: "Dossier entreprise", niveau: "lecture" },
      { label: "Email", niveau: "execution" },
      { label: "LinkedIn", niveau: "execution" },
      { label: "Téléphone", niveau: "bloque" },
    ],
  },
  {
    id: "execution",
    nom: "Agent Exécution",
    role: "Actions & Envois",
    description: "Prépare et lance les actions autorisées. Remonte toujours ce qui exige votre validation.",
    icon: Zap,
    statut: "pause",
    actionsAujourd: 0,
    couleur: "142 50% 35%",
    outils: [
      { label: "Campagnes", niveau: "execution" },
      { label: "Actions", niveau: "execution" },
      { label: "Email", niveau: "execution" },
      { label: "LinkedIn", niveau: "execution" },
      { label: "Téléphone", niveau: "bloque" },
      { label: "Envoi massif", niveau: "bloque" },
    ],
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
    outils: [
      { label: "Contacts", niveau: "lecture" },
      { label: "Opportunités", niveau: "preparation" },
      { label: "Missions", niveau: "lecture" },
      { label: "Introductions", niveau: "preparation" },
      { label: "Gains", niveau: "lecture" },
      { label: "Envoi email", niveau: "bloque" },
    ],
  },
  {
    id: "controle",
    nom: "Agent Contrôle",
    role: "Sécurité & Garde-fous",
    description: "Surveille tous les agents, bloque en cas d'anomalie et déclenche les revues humaines.",
    icon: Shield,
    statut: "actif",
    actionEnCours: "Surveillance active · 5 agents",
    actionsAujourd: 12,
    couleur: "0 60% 40%",
    outils: [
      { label: "Tous les agents", niveau: "lecture" },
      { label: "Règles de sécurité", niveau: "lecture" },
      { label: "Journal d'audit", niveau: "execution" },
      { label: "Kill switch", niveau: "execution" },
      { label: "Validations", niveau: "execution" },
      { label: "Blocages", niveau: "execution" },
    ],
  },
];

const PLAYBOOKS: Playbook[] = [
  {
    id: "prospection",
    nom: "Prospection entreprise",
    description: "Trouve les bonnes cibles, prépare les messages et lance la campagne avec votre accord.",
    etapes: ["Stratège analyse le dossier", "Sourcing identifie les contacts", "Message rédige les textes", "Vous validez", "Exécution lance la campagne"],
    agents: ["Stratège", "Sourcing", "Message", "Exécution"],
    duree: "2–3 jours",
    actif: true,
  },
  {
    id: "relance",
    nom: "Relance intelligente",
    description: "Relance les contacts qui n'ont pas répondu avec un nouveau message adapté.",
    etapes: ["Qualification identifie les silences", "Message prépare la relance", "Vous approuvez", "Exécution envoie"],
    agents: ["Qualification", "Message", "Exécution"],
    duree: "1 jour",
    actif: false,
  },
  {
    id: "qualification",
    nom: "Qualification des réponses",
    description: "Trie automatiquement les réponses et détecte les meilleures opportunités.",
    etapes: ["Qualification trie les réponses", "Rattache aux missions", "Propose une action", "Vous décidez"],
    agents: ["Qualification", "Stratège"],
    duree: "Continu",
    actif: true,
  },
  {
    id: "introduction",
    nom: "Préparation d'une introduction",
    description: "Identifie le bon contact à introduire, prépare le contexte et l'envoie avec votre accord.",
    etapes: ["Sourcing identifie le contact", "Stratège valide la pertinence", "Message prépare l'intro", "Vous validez", "Exécution envoie"],
    agents: ["Sourcing", "Stratège", "Message", "Exécution"],
    duree: "24h",
    actif: false,
  },
];

const APPRENTISSAGES: Apprentissage[] = [
  {
    id: "a1",
    insight: "Les messages courts performent mieux",
    detail: "Les messages de moins de 80 mots obtiennent 34% de réponses en plus sur LinkedIn.",
    type: "message",
    trend: "hausse",
  },
  {
    id: "a2",
    insight: "La cible 'Directeurs financiers PME' répond mieux",
    detail: "Taux de réponse de 28% vs 12% pour les autres profils cette semaine.",
    type: "cible",
    trend: "hausse",
  },
  {
    id: "a3",
    insight: "Les envois le mardi matin convertissent plus",
    detail: "3x plus d'ouvertures entre 8h et 10h le mardi comparé aux autres créneaux.",
    type: "canal",
    trend: "hausse",
  },
  {
    id: "a4",
    insight: "Les introductions SaaS B2B transforment mieux",
    detail: "62% des introductions dans le secteur SaaS mènent à un rendez-vous.",
    type: "mission",
    trend: "hausse",
  },
];

const MEMOIRE_SECTIONS = [
  { label: "Secteur cible", valeur: "SaaS B2B · Fintech · RH Tech", icon: Target },
  { label: "Zone géographique", valeur: "Île-de-France · Lyon · Bordeaux", icon: Globe },
  { label: "Type de décideur", valeur: "DAF · DRH · CEO PME 10–200 pers.", icon: Users },
  { label: "Ton des messages", valeur: "Professionnel, direct, sans jargon", icon: MessageSquare },
  { label: "Canaux autorisés", valeur: "LinkedIn · Email", icon: Mail },
  { label: "Contraintes actives", valeur: "Max 30 envois/jour · Validation requise", icon: Shield },
  { label: "Missions actives", valeur: "3 missions ouvertes", icon: Briefcase },
  { label: "Opportunités suivies", valeur: "7 opportunités en cours", icon: Star },
];

const AUTONOMIE_LEVELS: { id: AutonomiLevel; label: string; description: string }[] = [
  { id: "lecture", label: "Lecture seule", description: "OpenClaw observe et analyse, mais n'agit pas." },
  { id: "preparation", label: "Préparation", description: "Prépare les actions, vous décidez de tout." },
  { id: "assiste", label: "Exécution assistée", description: "Lance les actions après votre validation." },
  { id: "semi-auto", label: "Semi-autonome", description: "Agit seul sur les actions simples, vous valide les sensibles." },
  { id: "etendu", label: "Autonomie étendue", description: "Grande latitude, avec alertes sur les points critiques." },
];

const SIMULATION_STEPS = [
  { etape: "Agent Stratège analyse votre dossier entreprise", agent: "Stratège", validation: false, risque: false },
  { etape: "Agent Sourcing identifie 47 contacts dans le secteur Finance", agent: "Sourcing", validation: false, risque: false },
  { etape: "Agent Message prépare 3 variantes de message", agent: "Message", validation: true, risque: false },
  { etape: "Vous validez les messages avant envoi", agent: "Vous", validation: true, risque: false },
  { etape: "Agent Exécution lance la campagne LinkedIn (max 30/jour)", agent: "Exécution", validation: false, risque: false },
  { etape: "Agent Qualification trie les réponses et détecte les opportunités", agent: "Qualification", validation: false, risque: false },
  { etape: "Agent Contrôle surveille les volumes et bloque si anomalie", agent: "Contrôle", validation: false, risque: true },
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
      <span className={`w-1.5 h-1.5 rounded-full ${statut === "actif" ? "animate-pulse" : ""}`} style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

function OutilNiveau({ niveau }: { niveau: "lecture" | "preparation" | "execution" | "bloque" }) {
  const map = {
    lecture: { label: "Peut consulter", color: "hsl(218 72% 30%)", bg: "hsl(218 72% 30% / 0.08)" },
    preparation: { label: "Peut préparer", color: "hsl(250 60% 40%)", bg: "hsl(250 60% 40% / 0.08)" },
    execution: { label: "Peut lancer", color: "hsl(142 50% 28%)", bg: "hsl(142 50% 35% / 0.08)" },
    bloque: { label: "Bloqué", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
  };
  const n = map[niveau];
  return (
    <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ color: n.color, background: n.bg }}>
      {n.label}
    </span>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function Agents() {
  const [activeTab, setActiveTab] = useState<TabId>("agents");
  const [autonomie, setAutonomie] = useState<AutonomiLevel>("assiste");
  const [openclawActif, setOpenclawActif] = useState(true);
  const [agentsPaused, setAgentsPaused] = useState<Set<string>>(new Set(["execution"]));
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  const toggleAgent = (id: string) => {
    setAgentsPaused((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const agentsActifs = AGENTS.filter((a) => !agentsPaused.has(a.id) && a.id !== "controle").length;
  const actionsTotal = AGENTS.reduce((s, a) => s + (a.actionsAujourd || 0), 0);

  const startSimulation = () => {
    setSimulationRunning(true);
    setSimulationStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setSimulationStep(step);
      if (step >= SIMULATION_STEPS.length) {
        clearInterval(interval);
        setSimulationRunning(false);
      }
    }, 800);
  };

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "agents", label: "Mes agents", icon: Cpu },
    { id: "memoire", label: "Ce qu'ils savent", icon: Database },
    { id: "plans", label: "Plans d'action", icon: BookOpen },
    { id: "apprentissage", label: "Ce qu'ils ont appris", icon: Lightbulb },
    { id: "simulation", label: "Simuler", icon: FlaskConical },
  ];

  return (
    <UserLayout jarvisContext="agents">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Brain size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="font-display text-2xl font-bold text-foreground">Agent OS</h1>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
                >
                  OpenClaw Core
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                Vos agents travaillent pour vous. Vous gardez le contrôle total.
              </p>
            </div>
          </div>

          <button
            onClick={() => setOpenclawActif((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shrink-0"
            style={{
              background: openclawActif ? "hsl(0 60% 40% / 0.1)" : "hsl(142 50% 35% / 0.1)",
              color: openclawActif ? "hsl(0 60% 32%)" : "hsl(142 50% 28%)",
              border: `1px solid ${openclawActif ? "hsl(0 60% 40% / 0.2)" : "hsl(142 50% 35% / 0.2)"}`,
            }}
          >
            {openclawActif ? <><Pause size={14} /> Tout stopper</> : <><Play size={14} /> Reprendre</>}
          </button>
        </div>

        {/* ── Statut global ────────────────────────────────────────────────── */}
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
              <span className={`w-1.5 h-1.5 rounded-full ${openclawActif ? "animate-pulse" : ""}`}
                style={{ background: openclawActif ? "hsl(142 50% 35%)" : "hsl(var(--muted-foreground))" }} />
              {openclawActif ? "En ligne" : "Pausé"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Agents actifs", value: openclawActif ? `${agentsActifs}/5` : "0/5", icon: Radio },
              { label: "Actions aujourd'hui", value: openclawActif ? actionsTotal : 0, icon: Activity },
              { label: "En attente de vous", value: openclawActif ? 2 : 0, icon: Clock },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="card-surface p-3 rounded-xl text-center">
                <Icon size={16} className="text-primary mx-auto mb-1.5" />
                <p className="font-bold text-foreground text-lg leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Architecture en 3 niveaux */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3 font-medium">Comment ça fonctionne</p>
            <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
              {[
                { label: "JARVIS", desc: "Votre assistant", color: "hsl(24 100% 45%)" },
                { label: "OpenClaw", desc: "Le cerveau", color: "hsl(var(--primary))" },
                { label: "Agents", desc: "L'exécution", color: "hsl(250 60% 40%)" },
                { label: "Validations", desc: "Votre contrôle", color: "hsl(142 50% 35%)" },
              ].map((item, i) => (
                <div key={item.label} className="flex items-center gap-2 shrink-0">
                  <div className="text-center">
                    <div className="px-2.5 py-1 rounded-lg font-semibold" style={{ background: `${item.color}18`, color: item.color }}>
                      {item.label}
                    </div>
                    <p className="text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  {i < 3 && <ArrowRight size={12} className="text-muted-foreground shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Niveau d'autonomie ───────────────────────────────────────────── */}
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
                  className="text-left p-3 rounded-xl border text-xs transition-all"
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
            Mode actuel : <strong className="text-foreground">{AUTONOMIE_LEVELS.find((l) => l.id === autonomie)?.label}</strong>
            {" — "}{AUTONOMIE_LEVELS.find((l) => l.id === autonomie)?.description}
          </p>
        </div>

        {/* ── Alerte validations ───────────────────────────────────────────── */}
        {openclawActif && (
          <Link
            to="/validations"
            className="flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-sm group"
            style={{ borderColor: "hsl(24 100% 45% / 0.3)", background: "hsl(24 100% 45% / 0.04)" }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(24 100% 45% / 0.1)" }}>
              <AlertTriangle size={16} style={{ color: "hsl(24 100% 45%)" }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">2 actions attendent votre décision</p>
              <p className="text-xs text-muted-foreground">Vos agents ne peuvent pas continuer sans vous.</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold shrink-0" style={{ color: "hsl(24 100% 45%)" }}>
              Voir <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div>
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0"
                  style={{
                    background: isActive ? "hsl(var(--primary))" : "hsl(var(--muted))",
                    color: isActive ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── Tab : Mes agents ──────────────────────────────────────────── */}
          {activeTab === "agents" && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AGENTS.map((agent) => {
                const Icon = agent.icon;
                const isPaused = agentsPaused.has(agent.id) || !openclawActif;
                const effectiveStatut: AgentStatus = isPaused ? "pause" : agent.statut;
                const isExpanded = expandedAgent === agent.id;
                return (
                  <div
                    key={agent.id}
                    className={`card-surface rounded-xl transition-all ${isPaused ? "opacity-60" : ""}`}
                  >
                    {/* Header agent */}
                    <div className="p-4">
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
                        <div className="flex items-center gap-1.5">
                          <StatutBadge statut={effectiveStatut} />
                          {agent.id !== "controle" && (
                            <button
                              onClick={() => toggleAgent(agent.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              {isPaused ? <Play size={12} /> : <Pause size={12} />}
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{agent.description}</p>

                      {agent.actionEnCours && !isPaused && (
                        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: `hsl(${agent.couleur})` }} />
                          <span className="text-muted-foreground truncate">{agent.actionEnCours}</span>
                        </div>
                      )}

                      {agent.actionsAujourd !== undefined && (
                        <p className="text-xs text-muted-foreground mt-2">
                          <strong className="text-foreground">{agent.actionsAujourd}</strong> action{agent.actionsAujourd !== 1 ? "s" : ""} aujourd'hui
                        </p>
                      )}
                    </div>

                    {/* Expandable outils */}
                    <button
                      onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                      className="w-full px-4 py-2.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-b-xl"
                    >
                      <span className="font-medium">Ce que cet agent peut utiliser</span>
                      <ChevronDown size={13} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 grid grid-cols-2 gap-2 border-t border-border">
                        {agent.outils.map((outil) => (
                          <div key={outil.label} className="flex items-center justify-between gap-2">
                            <span className="text-xs text-foreground truncate">{outil.label}</span>
                            <OutilNiveau niveau={outil.niveau} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Tab : Ce qu'ils savent (Mémoire) ─────────────────────────── */}
          {activeTab === "memoire" && (
            <div className="mt-4 space-y-4">
              <div
                className="p-4 rounded-2xl"
                style={{ background: "linear-gradient(135deg, hsl(var(--secondary)), hsl(218 72% 18% / 0.04))" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Database size={15} className="text-primary" />
                  <p className="font-semibold text-foreground text-sm">La mémoire de vos agents</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tout ce que vos agents savent sur votre entreprise, vos cibles et vos contraintes.
                  Plus cette mémoire est complète, plus vos agents travaillent efficacement.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MEMOIRE_SECTIONS.map(({ label, valeur, icon: Icon }) => (
                  <div key={label} className="card-surface p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon size={13} className="text-primary shrink-0" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                    </div>
                    <p className="text-sm font-medium text-foreground">{valeur}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Signaux détectés", value: "14", desc: "cette semaine" },
                  { label: "Apprentissages actifs", value: "4", desc: "en mémoire" },
                  { label: "Dossier complété", value: "78%", desc: "encore 2 sections" },
                ].map(({ label, value, desc }) => (
                  <div key={label} className="card-surface p-4 rounded-xl text-center">
                    <p className="font-bold text-2xl text-foreground">{value}</p>
                    <p className="text-xs font-semibold text-foreground mt-0.5">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>

              <Link
                to="/dossier"
                className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(var(--secondary))" }}>
                  <FileText size={16} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">Compléter le dossier entreprise</p>
                  <p className="text-xs text-muted-foreground">Aidez vos agents à mieux vous connaître</p>
                </div>
                <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </div>
          )}

          {/* ── Tab : Plans d'action (Playbooks) ─────────────────────────── */}
          {activeTab === "plans" && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
                <BookOpen size={14} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Les plans d'action définissent comment vos agents collaborent pour atteindre un objectif.
                  OpenClaw choisit automatiquement le meilleur plan selon la situation.
                </p>
              </div>

              {PLAYBOOKS.map((pb) => (
                <div key={pb.id} className="card-surface p-5 rounded-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground text-sm">{pb.nom}</p>
                        {pb.actif && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: "hsl(142 50% 35% / 0.12)", color: "hsl(142 50% 28%)" }}>
                            Actif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{pb.description}</p>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0 ml-4">{pb.duree}</div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {pb.agents.map((a) => (
                      <span key={a} className="text-xs px-2 py-0.5 rounded-lg"
                        style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>
                        {a}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    {pb.etapes.map((etape, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]"
                          style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
                        >
                          {i + 1}
                        </div>
                        <span className="text-muted-foreground">{etape}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    className="mt-4 w-full py-2 rounded-xl text-xs font-semibold border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {pb.actif ? "Modifier ce plan" : "Activer ce plan"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Tab : Ce qu'ils ont appris ────────────────────────────────── */}
          {activeTab === "apprentissage" && (
            <div className="mt-4 space-y-4">
              <div
                className="p-4 rounded-2xl"
                style={{ background: "linear-gradient(135deg, hsl(var(--secondary)), hsl(218 72% 18% / 0.04))" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb size={15} className="text-primary" />
                  <p className="font-semibold text-foreground text-sm">Vos agents ont appris ceci</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  À chaque action, vos agents enregistrent ce qui marche et ce qui ne marche pas.
                  Ces insights améliorent automatiquement vos prochaines campagnes.
                </p>
              </div>

              <div className="space-y-3">
                {APPRENTISSAGES.map((a) => {
                  const typeColors: Record<string, { color: string; bg: string }> = {
                    message: { color: "hsl(24 100% 45%)", bg: "hsl(24 100% 45% / 0.08)" },
                    cible: { color: "hsl(218 72% 30%)", bg: "hsl(218 72% 30% / 0.08)" },
                    canal: { color: "hsl(250 60% 40%)", bg: "hsl(250 60% 40% / 0.08)" },
                    mission: { color: "hsl(142 50% 28%)", bg: "hsl(142 50% 35% / 0.08)" },
                  };
                  const tc = typeColors[a.type];
                  return (
                    <div key={a.id} className="card-surface p-4 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: tc.bg }}>
                          <TrendingUp size={14} style={{ color: tc.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground text-sm">{a.insight}</p>
                            <span className="text-xs px-2 py-0.5 rounded-lg capitalize" style={{ background: tc.bg, color: tc.color }}>
                              {a.type}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{a.detail}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          <ThumbsUp size={12} /> Utile
                        </button>
                        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          <ThumbsDown size={12} /> Pas convaincu
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="card-surface p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <RotateCcw size={13} className="text-primary" />
                  <p className="font-semibold text-foreground text-sm">Boucle d'amélioration continue</p>
                </div>
                <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
                  {["Action", "Résultat", "Apprentissage", "Ajustement", "Meilleure action"].map((step, i, arr) => (
                    <div key={step} className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-1 rounded-lg font-medium"
                        style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>
                        {step}
                      </span>
                      {i < arr.length - 1 && <ArrowRight size={11} className="text-muted-foreground" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab : Mode simulation ─────────────────────────────────────── */}
          {activeTab === "simulation" && (
            <div className="mt-4 space-y-4">
              <div
                className="p-4 rounded-2xl"
                style={{ background: "linear-gradient(135deg, hsl(var(--secondary)), hsl(218 72% 18% / 0.04))" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FlaskConical size={15} className="text-primary" />
                  <p className="font-semibold text-foreground text-sm">Voir avant d'agir</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Avant de lancer une campagne, visualisez exactement ce que vos agents vont faire, étape par étape.
                  Aucune action réelle ne sera effectuée pendant la simulation.
                </p>
              </div>

              <div className="card-surface p-5 rounded-xl">
                <p className="font-semibold text-foreground text-sm mb-1">Campagne prospection Finance · Île-de-France</p>
                <p className="text-xs text-muted-foreground mb-4">47 contacts cibles · LinkedIn + Email · 30 envois/jour max</p>

                <div className="space-y-3">
                  {SIMULATION_STEPS.map((step, i) => {
                    const isVisible = simulationStep > i || !simulationRunning;
                    const isDone = simulationStep > i;
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 transition-all"
                        style={{ opacity: isVisible ? 1 : 0.3 }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-all"
                          style={{
                            background: isDone ? "hsl(142 50% 35% / 0.15)" : "hsl(var(--muted))",
                            color: isDone ? "hsl(142 50% 28%)" : "hsl(var(--muted-foreground))",
                          }}
                        >
                          {isDone ? <CheckCircle2 size={12} /> : i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{step.etape}</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-muted-foreground">Par {step.agent}</span>
                            {step.validation && (
                              <span className="text-xs px-2 py-0.5 rounded-lg font-medium"
                                style={{ background: "hsl(24 100% 45% / 0.1)", color: "hsl(24 80% 36%)" }}>
                                ⚡ Votre accord requis
                              </span>
                            )}
                            {step.risque && (
                              <span className="text-xs px-2 py-0.5 rounded-lg font-medium"
                                style={{ background: "hsl(142 50% 35% / 0.1)", color: "hsl(142 50% 28%)" }}>
                                🛡 Garde-fou actif
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 mt-5">
                  {!simulationRunning ? (
                    <button
                      onClick={startSimulation}
                      className="btn-cta flex-1 py-2.5 text-sm flex items-center justify-center gap-2"
                    >
                      <FlaskConical size={14} />
                      {simulationStep > 0 ? "Relancer la simulation" : "Lancer la simulation"}
                    </button>
                  ) : (
                    <div
                      className="flex-1 py-2.5 text-sm rounded-xl flex items-center justify-center gap-2 font-semibold"
                      style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
                    >
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "hsl(var(--primary))" }} />
                      Simulation en cours…
                    </div>
                  )}
                  {simulationStep === SIMULATION_STEPS.length && (
                    <button
                      className="btn-cta flex-1 py-2.5 text-sm"
                      onClick={() => setSimulationStep(0)}
                    >
                      Lancer pour de vrai
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── JARVIS & liens rapides ───────────────────────────────────────── */}
        <div
          className="p-5 rounded-2xl border"
          style={{
            background: "linear-gradient(135deg, hsl(var(--secondary)), hsl(218 72% 18% / 0.04))",
            borderColor: "hsl(218 72% 18% / 0.15)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground text-sm">Ce que JARVIS recommande</h2>
          </div>
          <div className="space-y-3">
            {[
              { texte: "2 actions attendent votre accord. Vos agents sont bloqués.", href: "/validations", cta: "Valider" },
              { texte: "Votre dossier entreprise est incomplet. OpenClaw travaille moins bien sans cibles précises.", href: "/dossier", cta: "Compléter" },
              { texte: "2 opportunités détectées hier n'ont pas encore été traitées.", href: "/opportunites", cta: "Voir" },
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "hsl(var(--primary) / 0.1)" }}>
                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed flex-1">{r.texte}</p>
                <Link to={r.href} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0">
                  {r.cta} <ChevronRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Liens rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Validations", desc: "2 en attente", icon: AlertTriangle, href: "/validations", urgent: true },
            { label: "Dossier entreprise", desc: "Base d'OpenClaw", icon: FileText, href: "/dossier" },
            { label: "Règles de sécurité", desc: "Vos garde-fous", icon: Shield, href: "/regles" },
            { label: "Rapport du matin", desc: "Brief quotidien", icon: TrendingUp, href: "/pilotage" },
          ].map(({ label, desc, icon: Icon, href, urgent }) => (
            <Link
              key={label}
              to={href}
              className="card-surface p-4 rounded-xl flex flex-col gap-2 hover:border-primary/30 transition-all"
              style={urgent ? { borderColor: "hsl(24 100% 45% / 0.3)" } : undefined}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: urgent ? "hsl(24 100% 45% / 0.1)" : "hsl(var(--secondary))" }}>
                <Icon size={15} style={{ color: urgent ? "hsl(24 100% 45%)" : "hsl(var(--primary))" }} />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </UserLayout>
  );
}

