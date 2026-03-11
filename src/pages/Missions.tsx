import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import UserLayout from "@/components/layout/UserLayout";
import { Euro, MapPin, ChevronRight, Plus, Search, Send, Loader2, Briefcase } from "lucide-react";
import PageTitle from "@/components/ui/PageTitle";
import ListPagination from "@/components/ui/ListPagination";
import { db } from "@/lib/supabase";
import GlossaryTooltip from "@/components/ui/GlossaryTooltip";

interface Mission {
  id: string;
  titre: string;
  description: string;
  secteur: string;
  zone: string;
  recompense: string;
  statut: string;
}

const PAGE_SIZE = 20;
const secteurs = ["Tous", "SaaS / Tech", "Finance / Assurance", "Formation", "Immobilier"];

export default function Missions() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [filtre, setFiltre] = useState("Tous");

  // Reset to first page on filter/search change
  const handleSearch = (v: string) => { setSearch(v); setPage(0); };
  const handleFiltre = (v: string) => { setFiltre(v); setPage(0); };

  const { data, isLoading } = useQuery({
    queryKey: ["missions", page, search, filtre],
    queryFn: async () => {
      let q = db
        .from("missions")
        .select("*", { count: "exact" })
        .eq("statut", "active")
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filtre !== "Tous") q = q.eq("secteur", filtre);
      if (search.trim()) q = q.or(`titre.ilike.%${search}%,description.ilike.%${search}%`);

      const { data, count, error } = await q;
      if (error) throw error;
      return { missions: (data || []) as Mission[], total: count ?? 0 };
    },
    placeholderData: (prev) => prev,
  });

  const missions = data?.missions ?? [];
  const total = data?.total ?? 0;

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
              {isLoading ? "Chargement…" : `${total} mission${total !== 1 ? "s" : ""} ouverte${total !== 1 ? "s" : ""} en ce moment.`}
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
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>

        {/* Filtres secteur */}
        <div className="flex gap-2 flex-wrap mb-6">
          {secteurs.map((s) => (
            <button
              key={s}
              onClick={() => handleFiltre(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filtre === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : missions.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase size={32} className="mx-auto text-muted-foreground mb-3" />
            {total === 0 && page === 0 ? (
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
                <button onClick={() => { handleSearch(""); handleFiltre("Tous"); }} className="text-sm text-primary font-medium hover:underline">
                  Réinitialiser les filtres
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {missions.map((m) => (
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

            <ListPagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
          </>
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
