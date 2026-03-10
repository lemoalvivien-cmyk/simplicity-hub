import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import { Euro, MapPin, ChevronRight, Plus, Search, Send, Loader2, Briefcase } from "lucide-react";
import PageTitle from "@/components/ui/PageTitle";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Mission {
  id: string;
  titre: string;
  description: string;
  secteur: string;
  zone: string;
  recompense: string;
  statut: string;
}

const secteurs = ["Tous", "SaaS / Tech", "Finance / Assurance", "Formation", "Immobilier"];

export default function Missions() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtre, setFiltre] = useState("Tous");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await db
        .from("missions")
        .select("*")
        .eq("statut", "active")
        .order("created_at", { ascending: false });
      setMissions(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = missions.filter((m) => {
    const matchSearch =
      m.titre.toLowerCase().includes(search.toLowerCase()) ||
      (m.description || "").toLowerCase().includes(search.toLowerCase());
    const matchFiltre = filtre === "Tous" || m.secteur === filtre;
    return matchSearch && matchFiltre;
  });

  return (
    <UserLayout>
      <PageTitle title="Missions disponibles" />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              Missions disponibles
            </h1>
            <p className="text-muted-foreground text-sm">
              {loading ? "Chargement…" : `${filtered.length} mission${filtered.length !== 1 ? "s" : ""} ouverte${filtered.length !== 1 ? "s" : ""} en ce moment.`}
            </p>
          </div>
          <Link to="/missions/nouvelle" className="btn-primary text-sm py-2.5 px-4 shrink-0 hidden sm:inline-flex">
            <Plus size={15} /> Nouvelle mission
          </Link>
        </div>

        {/* Recherche */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une mission…"
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
                filtre === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase size={32} className="mx-auto text-muted-foreground mb-3" />
            {missions.length === 0 ? (
              <>
                <p className="text-foreground font-medium mb-1">Aucune mission pour l'instant</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Créez la première mission pour commencer à recevoir des introductions.
                </p>
                <Link to="/missions/nouvelle" className="btn-cta text-sm py-2.5 px-5 inline-flex">
                  <Plus size={14} /> Créer une mission
                </Link>
              </>
            ) : (
              <>
                <p className="text-muted-foreground text-sm mb-2">Aucune mission ne correspond.</p>
                <button onClick={() => { setSearch(""); setFiltre("Tous"); }} className="text-sm text-primary font-medium hover:underline">
                  Réinitialiser les filtres
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((m) => (
              <div key={m.id} className="card-surface p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    {m.secteur && <span className="badge-muted text-xs mb-1 inline-block">{m.secteur}</span>}
                    <h2 className="font-semibold text-foreground leading-snug">{m.titre}</h2>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5" style={{ background: "hsl(var(--success))" }} />
                </div>

                {m.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{m.description}</p>
                )}

                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  {m.zone && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin size={13} /> {m.zone}
                    </div>
                  )}
                  {m.recompense && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "hsl(var(--success))" }}>
                      <Euro size={13} /> {m.recompense}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Link to={`/missions/${m.id}`} className="btn-cta text-sm py-2.5 px-5">
                    <Send size={14} /> Faire une introduction
                  </Link>
                  <Link to={`/missions/${m.id}`} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                    En savoir plus <ChevronRight size={13} />
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
