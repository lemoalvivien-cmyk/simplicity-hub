import { useState } from "react";
import UserLayout from "@/components/layout/UserLayout";
import { Send, CheckCircle2, Clock, XCircle, ChevronRight, Plus } from "lucide-react";

type Status = "en_attente" | "en_cours" | "validee" | "refusee";

interface Introduction {
  id: number;
  contact: string;
  entreprise: string;
  mission: string;
  date: string;
  status: Status;
  prochaine_action?: string;
  gain?: string;
}

const introductions: Introduction[] = [
  {
    id: 1,
    contact: "Jean-Pierre Duval",
    entreprise: "Acme SaaS",
    mission: "Clients TPE en commerce",
    date: "Aujourd'hui",
    status: "en_attente",
    prochaine_action: "L'entreprise doit valider si ce contact correspond à ses critères.",
  },
  {
    id: 2,
    contact: "Isabelle Petit",
    entreprise: "Acme SaaS",
    mission: "Clients TPE en commerce",
    date: "Il y a 2 jours",
    status: "validee",
    gain: "300 €",
    prochaine_action: "Gain confirmé. Votre récompense sera versée sous 30 jours.",
  },
  {
    id: 3,
    contact: "Gérard Morin",
    entreprise: "FinEdge",
    mission: "PME cherchant financement",
    date: "Hier",
    status: "en_cours",
    prochaine_action: "Un premier échange est en cours entre FinEdge et Gérard Morin.",
  },
  {
    id: 4,
    contact: "Céline Rousseau",
    entreprise: "FormaPro",
    mission: "Responsables formation",
    date: "Il y a 5 jours",
    status: "refusee",
    prochaine_action: "Ce contact ne correspondait pas aux critères. Vous pouvez en tenter un autre.",
  },
];

const tabs: { id: Status | "toutes"; label: string }[] = [
  { id: "toutes", label: "Toutes" },
  { id: "en_attente", label: "En attente" },
  { id: "en_cours", label: "En cours" },
  { id: "validee", label: "Validées" },
  { id: "refusee", label: "Refusées" },
];

const statusConfig: Record<Status, { icon: JSX.Element; color: string; bg: string; label: string }> = {
  en_attente: {
    icon: <Clock size={14} />,
    color: "hsl(38 80% 30%)",
    bg: "hsl(var(--accent-light))",
    label: "En attente",
  },
  en_cours: {
    icon: <ChevronRight size={14} />,
    color: "hsl(var(--primary))",
    bg: "hsl(var(--secondary))",
    label: "En cours",
  },
  validee: {
    icon: <CheckCircle2 size={14} />,
    color: "hsl(var(--success))",
    bg: "hsl(var(--success-light))",
    label: "Validée",
  },
  refusee: {
    icon: <XCircle size={14} />,
    color: "hsl(var(--destructive))",
    bg: "hsl(0 72% 95%)",
    label: "Refusée",
  },
};

export default function Introductions() {
  const [activeTab, setActiveTab] = useState<Status | "toutes">("toutes");

  const filtered =
    activeTab === "toutes"
      ? introductions
      : introductions.filter((i) => i.status === activeTab);

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              Mes introductions
            </h1>
            <p className="text-muted-foreground text-sm">
              Suivez l'état de chaque contact que vous avez présenté.
            </p>
          </div>
          <button className="btn-cta text-sm py-2.5 px-4 shrink-0 hidden sm:inline-flex">
            <Plus size={15} /> Nouvelle introduction
          </button>
        </div>

        {/* Résumé chiffres */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", value: introductions.length, color: "text-foreground" },
            { label: "En attente", value: introductions.filter((i) => i.status === "en_attente").length, color: "text-warning" },
            { label: "Validées", value: introductions.filter((i) => i.status === "validee").length, color: "text-success" },
            { label: "Refusées", value: introductions.filter((i) => i.status === "refusee").length, color: "text-destructive" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card-surface p-3 text-center">
              <p className={`font-display text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
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
          <div className="text-center py-16 card-surface">
            <Send size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">Aucune introduction ici</p>
            <p className="text-sm text-muted-foreground">
              Parcourez les missions pour faire votre première introduction.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((intro) => {
              const cfg = statusConfig[intro.status];
              return (
                <div key={intro.id} className="card-surface p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-secondary-foreground">
                          {intro.contact.charAt(0)}
                        </span>
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

                  <p className="text-xs text-muted-foreground mb-2 pl-0">
                    Mission : <span className="text-foreground font-medium">{intro.mission}</span>
                  </p>

                  {intro.prochaine_action && (
                    <div className="mt-3 p-3 rounded-lg bg-muted text-xs text-foreground leading-relaxed">
                      <strong>Ce qui se passe maintenant :</strong> {intro.prochaine_action}
                    </div>
                  )}

                  {intro.gain && intro.status === "validee" && (
                    <div className="mt-2 flex items-center gap-2 text-xs font-semibold" style={{ color: "hsl(var(--success))" }}>
                      <CheckCircle2 size={13} /> Gain confirmé : {intro.gain}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile CTA */}
        <div className="mt-6 sm:hidden">
          <button className="btn-cta w-full py-3 justify-center">
            <Plus size={15} /> Nouvelle introduction
          </button>
        </div>
      </div>
    </UserLayout>
  );
}
