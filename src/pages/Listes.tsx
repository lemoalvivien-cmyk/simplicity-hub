import { useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import { ListOrdered, Plus, Users, ChevronRight, Search, Trash2 } from "lucide-react";

interface Liste {
  id: number;
  nom: string;
  description: string;
  contacts: number;
  source: string;
  date_creation: string;
  couleur: string;
}

const listes: Liste[] = [
  { id: 1, nom: "Mission Acme SaaS", description: "Contacts présentés pour la mission TPE commerce", contacts: 2, source: "Introduction", date_creation: "Aujourd'hui", couleur: "hsl(var(--primary))" },
  { id: 2, nom: "Mission FinEdge", description: "PME présentées à FinEdge", contacts: 1, source: "Introduction", date_creation: "Hier", couleur: "hsl(var(--primary))" },
  { id: 3, nom: "Prospects RH", description: "Responsables RH importés depuis le fichier Excel", contacts: 2, source: "Import", date_creation: "Il y a 3 jours", couleur: "hsl(38 80% 30%)" },
  { id: 4, nom: "Campagne Octobre", description: "Contacts ciblés pour la campagne de prospection octobre", contacts: 1, source: "Prospection", date_creation: "Il y a 4 jours", couleur: "hsl(220 80% 45%)" },
];

const sourceColors: Record<string, { color: string; bg: string }> = {
  Introduction: { color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
  Import: { color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
  Prospection: { color: "hsl(220 80% 45%)", bg: "hsl(220 80% 95%)" },
  Manuel: { color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
};

export default function Listes() {
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");

  const filtered = listes.filter((l) =>
    l.nom.toLowerCase().includes(search.toLowerCase())
  );

  const totalContacts = listes.reduce((s, l) => s + l.contacts, 0);

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              Mes listes
            </h1>
            <p className="text-sm text-muted-foreground">
              Organisez vos contacts en groupes pour mieux travailler.
              {" "}{totalContacts} contacts répartis dans {listes.length} listes.
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="btn-cta text-sm py-2.5 px-4 shrink-0"
          >
            <Plus size={14} /> Nouvelle liste
          </button>
        </div>

        {/* Formulaire nouvelle liste */}
        {showNew && (
          <div className="card-surface p-5 mb-5 border-2" style={{ borderColor: "hsl(var(--primary) / 0.3)" }}>
            <h2 className="font-semibold text-foreground mb-3">Créer une nouvelle liste</h2>
            <input
              type="text"
              placeholder="Donnez un nom à votre liste, ex : Prospects novembre…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition mb-3"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mb-4">
              Vous pourrez ajouter des contacts depuis votre base ou lors d'un import.
            </p>
            <div className="flex gap-3">
              <button
                disabled={newName.trim().length < 2}
                className="btn-cta text-sm py-2.5 px-5"
              >
                Créer la liste
              </button>
              <button
                onClick={() => { setShowNew(false); setNewName(""); }}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Ce qu'est une liste */}
        <div className="p-4 rounded-xl bg-muted mb-5 text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">À quoi sert une liste ?</strong>
          {" "}Une liste vous permet de regrouper des contacts selon un objectif commun :
          une mission, une campagne, un import, ou un critère que vous choisissez.
          Vous pouvez ensuite lancer une campagne sur une liste entière.
        </div>

        {/* Recherche */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une liste…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <ListOrdered size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">Aucune liste trouvée</p>
            <p className="text-sm text-muted-foreground mb-4">
              Créez votre première liste pour organiser vos contacts.
            </p>
            <button onClick={() => setShowNew(true)} className="btn-cta text-sm py-2.5 px-5 inline-flex">
              <Plus size={14} /> Créer une liste
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((liste) => {
              const srcCfg = sourceColors[liste.source] ?? sourceColors.Manuel;
              return (
                <div key={liste.id} className="card-surface p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "hsl(var(--muted))" }}
                      >
                        <ListOrdered size={18} style={{ color: liste.couleur }} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{liste.nom}</p>
                        <p className="text-xs text-muted-foreground">{liste.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ color: srcCfg.color, background: srcCfg.bg }}
                      >
                        {liste.source}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {liste.contacts} contact{liste.contacts > 1 ? "s" : ""}
                      </span>
                      <span>· Créée {liste.date_creation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to="/campagnes"
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        Lancer une campagne
                      </Link>
                      <button className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
