import { useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Play, Plus, Users, ChevronRight, CheckCircle2,
  Clock, PauseCircle, BarChart2, Search
} from "lucide-react";

type CampagneStatus = "brouillon" | "en_cours" | "terminee" | "en_pause";

interface Campagne {
  id: number;
  nom: string;
  objectif: string;
  liste: string;
  contacts: number;
  contactsTraites: number;
  status: CampagneStatus;
  date_creation: string;
  etapes: number;
  reponses: number;
}

const campagnes: Campagne[] = [
  {
    id: 1, nom: "Campagne Octobre — Tech PME", objectif: "Prospecter des PME tech en Île-de-France",
    liste: "Campagne Octobre", contacts: 45, contactsTraites: 23, status: "en_cours",
    date_creation: "Il y a 4 jours", etapes: 3, reponses: 4,
  },
  {
    id: 2, nom: "Prospects RH — Novembre", objectif: "Présenter la solution aux RH",
    liste: "Prospects RH", contacts: 12, contactsTraites: 0, status: "brouillon",
    date_creation: "Il y a 1 jour", etapes: 2, reponses: 0,
  },
  {
    id: 3, nom: "Relance été 2024", objectif: "Relancer les contacts non-répondants",
    liste: "Anciens prospects", contacts: 30, contactsTraites: 30, status: "terminee",
    date_creation: "Il y a 2 mois", etapes: 2, reponses: 7,
  },
];

const statusConfig: Record<CampagneStatus, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  brouillon: { label: "Brouillon", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))", icon: <Clock size={12} /> },
  en_cours: { label: "En cours", color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", icon: <Play size={12} /> },
  terminee: { label: "Terminée", color: "hsl(var(--success))", bg: "hsl(var(--success-light))", icon: <CheckCircle2 size={12} /> },
  en_pause: { label: "En pause", color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", icon: <PauseCircle size={12} /> },
};

export default function Campagnes() {
  const [search, setSearch] = useState("");

  const filtered = campagnes.filter((c) =>
    c.nom.toLowerCase().includes(search.toLowerCase())
  );

  const enCours = campagnes.filter((c) => c.status === "en_cours").length;

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              Mes campagnes
            </h1>
            <p className="text-sm text-muted-foreground">
              {enCours > 0
                ? `${enCours} campagne${enCours > 1 ? "s" : ""} en cours.`
                : "Aucune campagne en cours."}
              {" "}Une campagne vous permet de contacter une liste de personnes en plusieurs étapes.
            </p>
          </div>
          <Link to="/campagnes/nouvelle" className="btn-cta text-sm py-2.5 px-4 shrink-0">
            <Plus size={14} /> Nouvelle campagne
          </Link>
        </div>

        {/* Résumé */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "En cours", value: campagnes.filter((c) => c.status === "en_cours").length, color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
            { label: "Terminées", value: campagnes.filter((c) => c.status === "terminee").length, color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
            { label: "Brouillons", value: campagnes.filter((c) => c.status === "brouillon").length, color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
              <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Explication simple */}
        <div className="p-4 rounded-xl bg-muted mb-5 text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Comment ça marche ?</strong>
          {" "}Choisissez une liste de contacts, définissez quelques étapes simples (email, relance, etc.),
          et lancez. Vous suivez ensuite qui a répondu, qui n'a pas ouvert, et quoi faire ensuite.
        </div>

        {/* Recherche */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une campagne…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <Play size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">Aucune campagne</p>
            <p className="text-sm text-muted-foreground mb-4">
              Créez votre première campagne pour contacter votre liste de prospects.
            </p>
            <Link to="/campagnes/nouvelle" className="btn-cta text-sm py-2.5 px-5 inline-flex">
              <Plus size={14} /> Créer une campagne
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((c) => {
              const cfg = statusConfig[c.status];
              const progressPct = c.contacts > 0 ? Math.round((c.contactsTraites / c.contacts) * 100) : 0;
              return (
                <Link
                  key={c.id}
                  to={`/campagnes/${c.id}`}
                  className="card-surface p-5 block hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{c.nom}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.objectif}</p>
                    </div>
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                      style={{ color: cfg.color, background: cfg.bg }}
                    >
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>

                  {/* Barre de progression */}
                  {c.status === "en_cours" && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>{c.contactsTraites} traités sur {c.contacts}</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progressPct}%`, background: "hsl(var(--primary))" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Métriques */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {c.contacts} contacts
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart2 size={11} /> {c.etapes} étapes
                    </span>
                    {c.reponses > 0 && (
                      <span className="flex items-center gap-1 font-medium" style={{ color: "hsl(var(--success))" }}>
                        <CheckCircle2 size={11} /> {c.reponses} réponse{c.reponses > 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="ml-auto">{c.date_creation}</span>
                  </div>

                  {/* Liste associée */}
                  <div className="mt-2 text-xs text-muted-foreground">
                    Liste : <span className="text-foreground font-medium">{c.liste}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
