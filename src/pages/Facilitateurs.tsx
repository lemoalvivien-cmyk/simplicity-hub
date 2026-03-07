import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import { Users, Star, MapPin, Briefcase, TrendingUp, CheckCircle2, Search, ArrowRight, Shield, Zap, Loader2, Flag } from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface FacilitateurProfile {
  id: string;
  user_id: string;
  secteur: string | null;
  zone: string | null;
  description_reseau: string | null;
  types_contacts: string | null;
  statut: string | null;
}

interface FacilitateurWithStats extends FacilitateurProfile {
  prenom: string;
  intros_count: number;
  intros_validees: number;
  score: number;
  badge: string;
}

const BADGES = [
  { min: 90, label: "Facilitateur Expert", color: "hsl(38 90% 45%)", icon: "⭐" },
  { min: 70, label: "Très apprécié", color: "hsl(152 62% 35%)", icon: "✅" },
  { min: 50, label: "Recommandé", color: "hsl(218 72% 45%)", icon: "👍" },
  { min: 0, label: "Actif", color: "hsl(var(--muted-foreground))", icon: "🔵" },
];

function getBadge(score: number) {
  return BADGES.find(b => score >= b.min) || BADGES[BADGES.length - 1];
}

export default function Facilitateurs() {
  const { user } = useAuth();
  const [facilitateurs, setFacilitateurs] = useState<FacilitateurWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [facRes, introsRes, profilesRes] = await Promise.all([
          db.from("facilitateur_profiles").select("*").eq("statut", "actif").limit(50),
          db.from("introductions").select("facilitateur_id, statut"),
          db.from("profiles").select("id, prenom"),
        ]);

        const facs = facRes.data || [];
        const intros = introsRes.data || [];
        const profiles = profilesRes.data || [];

        const facWithStats: FacilitateurWithStats[] = facs.map(f => {
          const myIntros = intros.filter(i => i.facilitateur_id === f.user_id);
          const validees = myIntros.filter(i => i.statut === "validee").length;
          const total = myIntros.length;
          const tauxConv = total > 0 ? Math.round((validees / total) * 100) : 0;
          const score = Math.min(100, tauxConv + Math.min(30, total * 2) + (total >= 5 ? 20 : 0));
          const profil = profiles.find(p => p.id === f.user_id);
          const badge = getBadge(score);
          return {
            ...f,
            prenom: profil?.prenom || "Facilitateur",
            intros_count: total,
            intros_validees: validees,
            score,
            badge: badge.label,
          };
        });

        setFacilitateurs(facWithStats.sort((a, b) => b.score - a.score));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const sectors = [...new Set(facilitateurs.map(f => f.secteur).filter(Boolean))];

  const filtered = facilitateurs.filter(f => {
    const matchSearch = !search ||
      f.prenom.toLowerCase().includes(search.toLowerCase()) ||
      f.secteur?.toLowerCase().includes(search.toLowerCase()) ||
      f.zone?.toLowerCase().includes(search.toLowerCase());
    const matchSector = !sectorFilter || f.secteur === sectorFilter;
    return matchSearch && matchSector;
  });

  return (
    <UserLayout role="entreprise" jarvisContext="dashboard">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="card-surface p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-accent)" }}>
              <Users size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                Vitrine des facilitateurs
              </h1>
              <p className="text-muted-foreground text-sm">
                Des apporteurs d'affaires qualifiés, prêts à recommander vos missions à leur réseau.
              </p>
            </div>
          </div>
        </div>

        {/* Recherche & Filtres */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par nom, secteur, zone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={sectorFilter}
            onChange={e => setSectorFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Tous les secteurs</option>
            {sectors.map(s => <option key={s!} value={s!}>{s}</option>)}
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Facilitateurs actifs", value: facilitateurs.length, icon: Users },
            { label: "Introductions totales", value: facilitateurs.reduce((s, f) => s + f.intros_count, 0), icon: TrendingUp },
            { label: "Introductions validées", value: facilitateurs.reduce((s, f) => s + f.intros_validees, 0), icon: CheckCircle2 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="card-surface p-4 text-center">
              <Icon size={16} className="mx-auto mb-1.5 text-muted-foreground" />
              <p className="font-display text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Liste facilitateurs */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <Users size={36} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Aucun facilitateur trouvé.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((f) => {
              const badge = getBadge(f.score);
              const tauxConv = f.intros_count > 0 ? Math.round((f.intros_validees / f.intros_count) * 100) : 0;
              return (
                <div key={f.id} className="card-surface p-5 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-display font-bold text-lg text-white"
                      style={{ background: "var(--gradient-primary)" }}>
                      {f.prenom.charAt(0)}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-foreground text-base">{f.prenom}</h3>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: badge.color + "20", color: badge.color }}>
                          {badge.icon} {badge.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                        {f.secteur && (
                          <span className="flex items-center gap-1">
                            <Briefcase size={11} /> {f.secteur}
                          </span>
                        )}
                        {f.zone && (
                          <span className="flex items-center gap-1">
                            <MapPin size={11} /> {f.zone}
                          </span>
                        )}
                      </div>

                      {f.description_reseau && (
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-2">
                          {f.description_reseau}
                        </p>
                      )}

                      {/* Stats bar */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{
                              width: `${f.score}%`,
                              background: `linear-gradient(90deg, ${badge.color}, ${badge.color}80)`
                            }} />
                          </div>
                          <span className="text-xs font-semibold" style={{ color: badge.color }}>{f.score}/100</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {f.intros_count} introduction{f.intros_count !== 1 ? "s" : ""}
                        </span>
                        {tauxConv > 0 && (
                          <span className="text-xs font-medium" style={{ color: "hsl(152 62% 35%)" }}>
                            {tauxConv}% validées
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <Link
                        to="/missions"
                        className="text-xs font-semibold px-3 py-2 rounded-xl border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1.5"
                      >
                        Voir missions <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bloc confiance */}
        <div className="card-surface p-5">
          <div className="flex items-start gap-3">
            <Shield size={18} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground text-sm mb-1">Réseau vérifié et qualifié</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Chaque facilitateur est évalué sur son taux de conversion et la qualité de ses introductions. Les badges reflètent les performances réelles.
              </p>
            </div>
          </div>
        </div>

      </div>
    </UserLayout>
  );
}
