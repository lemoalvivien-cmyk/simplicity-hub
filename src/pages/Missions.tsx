import { useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import { Euro, MapPin, ChevronRight, Plus, Search, Send } from "lucide-react";
import { allMissions } from "./MissionDetail";

const secteurs = ["Tous", "SaaS / Tech", "Finance / Assurance", "Formation", "Immobilier"];

export default function Missions() {
  const [search, setSearch] = useState("");
  const [filtre, setFiltre] = useState("Tous");

  const filtered = allMissions.filter((m) => {
    const matchSearch =
      m.titre.toLowerCase().includes(search.toLowerCase()) ||
      m.entreprise.toLowerCase().includes(search.toLowerCase());
    const matchFiltre = filtre === "Tous" || m.secteur === filtre;
    return matchSearch && matchFiltre;
  });

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              Missions disponibles
            </h1>
            <p className="text-muted-foreground text-sm">
              {filtered.length} mission{filtered.length > 1 ? "s" : ""} ouverte{filtered.length > 1 ? "s" : ""} en ce moment.
              Chaque introduction réussie vous rapporte une récompense.
            </p>
          </div>
          <Link
            to="/missions/nouvelle"
            className="btn-primary text-sm py-2.5 px-4 shrink-0 hidden sm:inline-flex"
          >
            <Plus size={15} /> Nouvelle mission
          </Link>
        </div>

        {/* Recherche */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une mission ou une entreprise…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>

        {/* Filtres secteur */}
        <div className="flex gap-2 flex-wrap mb-6">
          {secteurs.map((s) => (
            <button
              key={s}
              onClick={() => setFiltre(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filtre === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm mb-2">Aucune mission ne correspond à votre recherche.</p>
            <button
              onClick={() => { setSearch(""); setFiltre("Tous"); }}
              className="text-sm text-primary font-medium hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((m) => (
              <div key={m.id} className="card-surface p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="badge-muted text-xs">{m.secteur}</span>
                      <span className="text-xs text-muted-foreground">{m.entreprise}</span>
                    </div>
                    <h2 className="font-semibold text-foreground leading-snug">{m.titre}</h2>
                  </div>
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
                    style={{ background: "hsl(var(--success))" }}
                    title="Mission ouverte"
                  />
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {m.description}
                </p>

                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin size={13} />
                    {m.zone}
                  </div>
                  <div
                    className="flex items-center gap-1.5 text-xs font-semibold"
                    style={{ color: "hsl(var(--success))" }}
                  >
                    <Euro size={13} />
                    {m.gain}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link
                    to={`/missions/${m.id}`}
                    className="btn-cta text-sm py-2.5 px-5"
                  >
                    Faire une introduction <ChevronRight size={15} />
                  </Link>
                  <Link
                    to={`/missions/${m.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    En savoir plus
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile CTA */}
        <div className="mt-8 sm:hidden">
          <Link to="/missions/nouvelle" className="btn-primary w-full py-3 justify-center">
            <Plus size={15} /> Publier une mission
          </Link>
        </div>
      </div>
    </UserLayout>
  );
}
