import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import PageTitle from "@/components/ui/PageTitle";
import { Play, Plus, Users, ChevronRight, CheckCircle2, Clock, PauseCircle, BarChart2, Search, Loader2 } from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type CampagneStatus = "brouillon" | "en_cours" | "terminee" | "en_pause";

interface Campagne {
  id: string;
  nom: string;
  objectif: string;
  mode_action: string;
  canal_principal: string;
  statut: CampagneStatus;
  liste_id: string | null;
  created_at: string;
}

const statusConfig: Record<CampagneStatus, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  brouillon: { label: "Brouillon", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))", icon: <Clock size={12} /> },
  en_cours: { label: "En cours", color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", icon: <Play size={12} /> },
  terminee: { label: "Terminée", color: "hsl(var(--success))", bg: "hsl(var(--success-light))", icon: <CheckCircle2 size={12} /> },
  en_pause: { label: "En pause", color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", icon: <PauseCircle size={12} /> },
};

const canalLabel: Record<string, string> = {
  email: "Email", telephone: "Téléphone", import: "Import",
  introduction: "Introduction", campagne: "Campagne", autre: "Autre",
};

const modeLabel: Record<string, string> = {
  manuel: "Manuel", assiste: "Assisté", semi_auto: "Semi-auto",
};

export default function Campagnes() {
  const { user } = useAuth();
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await db
      .from("campagnes")
      .select("*")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false });
    setCampagnes(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = campagnes.filter(c => c.nom.toLowerCase().includes(search.toLowerCase()));
  const enCours = campagnes.filter(c => c.statut === "en_cours").length;
  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">Mes campagnes</h1>
            <p className="text-sm text-muted-foreground">
              {enCours > 0 ? `${enCours} campagne${enCours > 1 ? "s" : ""} en cours.` : "Aucune campagne en cours."}
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
            { label: "En cours", value: campagnes.filter(c => c.statut === "en_cours").length, color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
            { label: "Terminées", value: campagnes.filter(c => c.statut === "terminee").length, color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
            { label: "Brouillons", value: campagnes.filter(c => c.statut === "brouillon").length, color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
              <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Explication */}
        <div className="p-4 rounded-xl bg-muted mb-5 text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Comment ça marche ?</strong>
          {" "}Choisissez une liste de contacts, définissez quelques étapes simples, et lancez. Vous suivez ensuite qui a répondu et quoi faire ensuite.
        </div>

        {/* Recherche */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Rechercher une campagne…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <Play size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">Aucune campagne</p>
            <p className="text-sm text-muted-foreground mb-4">Créez votre première campagne pour contacter votre liste de prospects.</p>
            <Link to="/campagnes/nouvelle" className="btn-cta text-sm py-2.5 px-5 inline-flex">
              <Plus size={14} /> Créer une campagne
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((c) => {
              const cfg = statusConfig[c.statut];
              return (
                <Link key={c.id} to={`/campagnes/${c.id}`}
                  className="card-surface p-5 block hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{c.nom}</p>
                      {c.objectif && <p className="text-xs text-muted-foreground mt-0.5">{c.objectif}</p>}
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                      style={{ color: cfg.color, background: cfg.bg }}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {c.canal_principal && (
                      <span className="flex items-center gap-1">
                        <BarChart2 size={11} /> Canal : {canalLabel[c.canal_principal] || c.canal_principal}
                      </span>
                    )}
                    {c.mode_action && (
                      <span className="flex items-center gap-1">
                        <Users size={11} /> {modeLabel[c.mode_action] || c.mode_action}
                      </span>
                    )}
                    <span className="ml-auto">{formatDate(c.created_at)}</span>
                    <ChevronRight size={13} />
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
