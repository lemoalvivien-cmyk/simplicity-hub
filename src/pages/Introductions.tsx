import { useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import { Send, CheckCircle2, Clock, XCircle, ChevronRight, Plus, Euro } from "lucide-react";

type Status = "en_attente" | "en_cours" | "validee" | "refusee";

interface Introduction {
  id: number;
  contact: string;
  entreprise: string;
  mission: string;
  missionId: number;
  date: string;
  status: Status;
  prochaine_action: string;
  qui_agit: "vous" | "entreprise" | "personne";
  gain?: number;
}

const introductions: Introduction[] = [
  {
    id: 1,
    contact: "Jean-Pierre Duval",
    entreprise: "Acme SaaS",
    mission: "Clients TPE en commerce et artisanat",
    missionId: 1,
    date: "Aujourd'hui",
    status: "en_attente",
    prochaine_action: "Acme SaaS doit valider si ce contact correspond à leurs critères.",
    qui_agit: "entreprise",
  },
  {
    id: 2,
    contact: "Isabelle Petit",
    entreprise: "Acme SaaS",
    mission: "Clients TPE en commerce et artisanat",
    missionId: 1,
    date: "Il y a 2 jours",
    status: "validee",
    gain: 300,
    prochaine_action: "Votre gain de 300 € est confirmé. Versement sous 30 jours.",
    qui_agit: "personne",
  },
  {
    id: 3,
    contact: "Gérard Morin",
    entreprise: "FinEdge",
    mission: "PME cherchant un financement",
    missionId: 2,
    date: "Hier",
    status: "en_cours",
    prochaine_action: "FinEdge est en train d'échanger avec Gérard Morin. Rien à faire de votre côté.",
    qui_agit: "entreprise",
  },
  {
    id: 4,
    contact: "Céline Rousseau",
    entreprise: "FormaPro",
    mission: "Responsables formation en entreprise",
    missionId: 3,
    date: "Il y a 5 jours",
    status: "refusee",
    prochaine_action: "Ce contact ne correspondait pas aux critères. Vous pouvez essayer avec quelqu'un d'autre.",
    qui_agit: "vous",
  },
];

type Tab = Status | "toutes";

const tabs: { id: Tab; label: string }[] = [
  { id: "toutes", label: "Toutes" },
  { id: "en_attente", label: "En attente" },
  { id: "en_cours", label: "En cours" },
  { id: "validee", label: "Validées" },
  { id: "refusee", label: "Refusées" },
];

const statusConfig: Record<Status, {
  icon: JSX.Element;
  color: string;
  bg: string;
  label: string;
  explication: string;
}> = {
  en_attente: {
    icon: <Clock size={13} />,
    color: "hsl(38 80% 30%)",
    bg: "hsl(var(--accent-light))",
    label: "En attente",
    explication: "L'entreprise n'a pas encore répondu.",
  },
  en_cours: {
    icon: <ChevronRight size={13} />,
    color: "hsl(var(--primary))",
    bg: "hsl(var(--secondary))",
    label: "En cours",
    explication: "L'entreprise échange avec votre contact.",
  },
  validee: {
    icon: <CheckCircle2 size={13} />,
    color: "hsl(var(--success))",
    bg: "hsl(var(--success-light))",
    label: "Validée ✓",
    explication: "L'entreprise a confirmé votre contact. Votre gain est assuré.",
  },
  refusee: {
    icon: <XCircle size={13} />,
    color: "hsl(var(--destructive))",
    bg: "hsl(0 72% 95%)",
    label: "Refusée",
    explication: "Ce contact ne correspondait pas aux critères.",
  },
};

const quiAgitColor: Record<Introduction["qui_agit"], string> = {
  vous: "hsl(var(--primary))",
  entreprise: "hsl(38 80% 30%)",
  personne: "hsl(var(--muted-foreground))",
};

const quiAgitLabel: Record<Introduction["qui_agit"], string> = {
  vous: "Action requise de votre part",
  entreprise: "En attente de l'entreprise",
  personne: "Rien à faire pour l'instant",
};

export default function Introductions() {
  const [activeTab, setActiveTab] = useState<Tab>("toutes");

  const filtered =
    activeTab === "toutes"
      ? introductions
      : introductions.filter((i) => i.status === activeTab);

  const counts = {
    en_attente: introductions.filter((i) => i.status === "en_attente").length,
    validee: introductions.filter((i) => i.status === "validee").length,
    refusee: introductions.filter((i) => i.status === "refusee").length,
  };

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              Mes introductions
            </h1>
            <p className="text-sm text-muted-foreground">
              Voici l'état de chaque contact que vous avez présenté à une entreprise.
            </p>
          </div>
          <Link
            to="/missions"
            className="btn-cta text-sm py-2.5 px-4 shrink-0 hidden sm:inline-flex"
          >
            <Plus size={14} /> Nouvelle introduction
          </Link>
        </div>

        {/* Résumé */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {
              label: "En attente",
              value: counts.en_attente,
              color: "hsl(38 80% 30%)",
              bg: "hsl(var(--accent-light))",
              sub: "Réponse attendue",
            },
            {
              label: "Validées",
              value: counts.validee,
              color: "hsl(var(--success))",
              bg: "hsl(var(--success-light))",
              sub: "Gain confirmé",
            },
            {
              label: "Refusées",
              value: counts.refusee,
              color: "hsl(var(--destructive))",
              bg: "hsl(0 72% 95%)",
              sub: "Ne correspondait pas",
            },
          ].map(({ label, value, color, bg, sub }) => (
            <div key={label} className="rounded-xl p-3 flex flex-col gap-0.5" style={{ background: bg }}>
              <p className="font-display text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs font-semibold" style={{ color }}>{label}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>

        {/* Onglets */}
        <div className="flex gap-2 flex-wrap mb-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <Send size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">Aucune introduction ici</p>
            <p className="text-sm text-muted-foreground mb-4">
              Parcourez les missions disponibles pour faire votre première introduction.
            </p>
            <Link to="/missions" className="btn-cta text-sm py-2.5 px-5">
              Voir les missions
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((intro) => {
              const cfg = statusConfig[intro.status];
              return (
                <Link
                  key={intro.id}
                  to={`/introductions/${intro.id}`}
                  className="card-surface p-5 block hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                        style={{
                          background: "hsl(var(--secondary))",
                          color: "hsl(var(--primary))",
                        }}
                      >
                        {intro.contact.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{intro.contact}</p>
                        <p className="text-xs text-muted-foreground">
                          {intro.entreprise} · {intro.date}
                        </p>
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                      style={{ color: cfg.color, background: cfg.bg }}
                    >
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2 ml-13">
                    Mission :{" "}
                    <span className="text-foreground font-medium">{intro.mission}</span>
                  </p>

                  {/* Prochaine action */}
                  <div
                    className="mt-3 p-3 rounded-xl text-xs leading-relaxed flex items-start gap-2"
                    style={{ background: "hsl(var(--muted))" }}
                  >
                    <span
                      className="shrink-0 font-semibold mt-0.5"
                      style={{ color: quiAgitColor[intro.qui_agit] }}
                    >
                      {quiAgitLabel[intro.qui_agit]} —
                    </span>
                    <span className="text-foreground">{intro.prochaine_action}</span>
                  </div>

                  {/* Gain si validée */}
                  {intro.gain && intro.status === "validee" && (
                    <div
                      className="mt-2 flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl"
                      style={{
                        background: "hsl(var(--success-light))",
                        color: "hsl(var(--success))",
                      }}
                    >
                      <Euro size={12} /> Gain confirmé : {intro.gain} €
                    </div>
                  )}

                  {/* Lien refusée → réessayer */}
                  {intro.status === "refusee" && (
                    <div
                      className="mt-2 flex items-center gap-1.5 text-xs font-medium"
                      style={{ color: "hsl(var(--primary))" }}
                    >
                      <ChevronRight size={12} /> Essayer avec un autre contact
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Mobile CTA */}
        <div className="mt-6 sm:hidden">
          <Link to="/missions" className="btn-cta w-full py-3 justify-center">
            <Plus size={14} /> Faire une nouvelle introduction
          </Link>
        </div>
      </div>
    </UserLayout>
  );
}
