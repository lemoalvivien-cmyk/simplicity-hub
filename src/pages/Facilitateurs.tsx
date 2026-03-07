import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Users, Star, MapPin, Briefcase, TrendingUp, CheckCircle2,
  Search, ArrowRight, Shield, Heart, Zap, Loader2, Sparkles,
  SlidersHorizontal, X
} from "lucide-react";
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
  average_rating: number | null;
  total_reviews: number | null;
  response_rate: number | null;
  avatar_url: string | null;
}

interface FacilitateurWithStats extends FacilitateurProfile {
  prenom: string;
  intros_count: number;
  intros_validees: number;
  score: number;
  badge: BadgeConfig;
  isFavorite: boolean;
}

interface BadgeConfig {
  min: number;
  label: string;
  color: string;
  bg: string;
  icon: string;
}

const BADGES: BadgeConfig[] = [
  { min: 90, label: "Expert", color: "hsl(38 90% 40%)", bg: "hsl(38 90% 95%)", icon: "⭐" },
  { min: 70, label: "Recommandé", color: "hsl(152 62% 30%)", bg: "hsl(152 62% 95%)", icon: "✅" },
  { min: 50, label: "Apprécié", color: "hsl(218 72% 40%)", bg: "hsl(218 72% 95%)", icon: "👍" },
  { min: 0, label: "Actif", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))", icon: "🔵" },
];

function getBadge(score: number): BadgeConfig {
  return BADGES.find(b => score >= b.min) || BADGES[BADGES.length - 1];
}

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(rating) ? "fill-current" : ""}
          style={{ color: i <= Math.round(rating) ? "hsl(38 90% 50%)" : "hsl(var(--border))" }}
        />
      ))}
    </div>
  );
}

export default function Facilitateurs() {
  const { user } = useAuth();
  const [facilitateurs, setFacilitateurs] = useState<FacilitateurWithStats[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [facRes, introsRes, profilesRes, favRes] = await Promise.all([
          db.from("facilitateur_profiles").select("*").eq("statut", "actif").limit(50),
          db.from("introductions").select("facilitateur_id, statut"),
          db.from("profiles").select("id, prenom"),
          db.from("facilitator_favorites").select("facilitator_user_id").eq("company_user_id", user.id),
        ]);

        const facs = facRes.data || [];
        const intros = introsRes.data || [];
        const profiles = profilesRes.data || [];
        const favSet = new Set<string>((favRes.data || []).map((f: { facilitator_user_id: string }) => f.facilitator_user_id));
        setFavorites(favSet);

        const facWithStats: FacilitateurWithStats[] = facs.map(f => {
          const myIntros = intros.filter((i: { facilitateur_id: string; statut: string }) => i.facilitateur_id === f.user_id);
          const validees = myIntros.filter((i: { statut: string }) => i.statut === "validee").length;
          const total = myIntros.length;
          const tauxConv = total > 0 ? Math.round((validees / total) * 100) : 0;
          const score = Math.min(100, tauxConv + Math.min(30, total * 2) + (total >= 5 ? 20 : 0));
          const profil = profiles.find((p: { id: string; prenom: string }) => p.id === f.user_id);
          const badge = getBadge(score);
          return {
            ...f,
            prenom: profil?.prenom || "Facilitateur",
            intros_count: total,
            intros_validees: validees,
            score,
            badge,
            isFavorite: favSet.has(f.user_id),
          };
        });

        setFacilitateurs(facWithStats.sort((a, b) => b.score - a.score));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const toggleFavorite = async (fac: FacilitateurWithStats, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    const newFavs = new Set(favorites);
    if (favorites.has(fac.user_id)) {
      newFavs.delete(fac.user_id);
      await db.from("facilitator_favorites").delete().eq("company_user_id", user.id).eq("facilitator_user_id", fac.user_id);
    } else {
      newFavs.add(fac.user_id);
      await db.from("facilitator_favorites").insert({ company_user_id: user.id, facilitator_user_id: fac.user_id });
    }
    setFavorites(newFavs);
    setFacilitateurs(prev => prev.map(f => f.user_id === fac.user_id ? { ...f, isFavorite: newFavs.has(f.user_id) } : f));
  };

  const sectors = [...new Set(facilitateurs.map(f => f.secteur).filter(Boolean))] as string[];
  const zones = [...new Set(facilitateurs.map(f => f.zone).filter(Boolean))] as string[];

  const filtered = facilitateurs.filter(f => {
    const matchSearch = !search ||
      f.prenom.toLowerCase().includes(search.toLowerCase()) ||
      f.secteur?.toLowerCase().includes(search.toLowerCase()) ||
      f.zone?.toLowerCase().includes(search.toLowerCase());
    const matchSector = !sectorFilter || f.secteur === sectorFilter;
    const matchZone = !zoneFilter || f.zone === zoneFilter;
    return matchSearch && matchSector && matchZone;
  });

  const hasFilters = sectorFilter || zoneFilter;
  const favorisOnly = filtered.filter(f => f.isFavorite);

  return (
    <UserLayout role="entreprise" jarvisContext="dashboard">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="card-surface p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-accent)" }}>
              <Users size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                Marketplace des facilitateurs
              </h1>
              <p className="text-muted-foreground text-sm">
                Des apporteurs d'affaires qualifiés, recommandés par OpenClaw pour vos missions.
              </p>
            </div>
          </div>

          {/* OpenClaw badge */}
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "hsl(218 65% 10%)", border: "1px solid hsl(218 40% 25% / 0.4)" }}>
            <Sparkles size={13} className="text-white/60 shrink-0" />
            <p className="text-xs text-white/60">
              OpenClaw analyse vos missions et recommande les profils les plus adaptés à votre secteur et votre zone.
            </p>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Facilitateurs actifs", value: facilitateurs.length, icon: Users },
            { label: "Introductions totales", value: facilitateurs.reduce((s, f) => s + f.intros_count, 0), icon: TrendingUp },
            { label: "Validées avec succès", value: facilitateurs.reduce((s, f) => s + f.intros_validees, 0), icon: CheckCircle2 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="card-surface p-4 text-center">
              <Icon size={15} className="mx-auto mb-1.5 text-muted-foreground" />
              <p className="font-display text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Favoris shortlist */}
        {favorisOnly.length > 0 && (
          <div className="card-surface p-4">
            <div className="flex items-center gap-2 mb-3">
              <Heart size={15} className="text-rose-500" />
              <p className="text-sm font-semibold text-foreground">Ma shortlist ({favorisOnly.length})</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {favorisOnly.map(f => (
                <Link
                  key={f.id}
                  to={`/facilitateurs/${f.user_id}`}
                  className="flex flex-col items-center gap-1.5 min-w-[72px] p-2 rounded-xl border border-border hover:border-primary/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white"
                    style={{ background: "var(--gradient-primary)" }}>
                    {f.prenom.charAt(0)}
                  </div>
                  <p className="text-xs font-medium text-foreground text-center truncate w-full">{f.prenom}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recherche & Filtres */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un facilitateur…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-sm font-medium transition-colors hover:bg-muted"
              style={hasFilters ? { borderColor: "hsl(var(--primary))", color: "hsl(var(--primary))" } : {}}
            >
              <SlidersHorizontal size={14} />
              {hasFilters ? "Filtres actifs" : "Filtres"}
            </button>
          </div>

          {showFilters && (
            <div className="card-surface p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Secteur</label>
                  <select
                    value={sectorFilter}
                    onChange={e => setSectorFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Tous</option>
                    {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Zone</label>
                  <select
                    value={zoneFilter}
                    onChange={e => setZoneFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Toutes</option>
                    {zones.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
              </div>
              {hasFilters && (
                <button onClick={() => { setSectorFilter(""); setZoneFilter(""); }} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <X size={12} /> Réinitialiser les filtres
                </button>
              )}
            </div>
          )}
        </div>

        {/* Liste */}
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
            {filtered.map((f, idx) => {
              const tauxConv = f.intros_count > 0 ? Math.round((f.intros_validees / f.intros_count) * 100) : 0;
              const rating = f.average_rating && f.average_rating > 0 ? f.average_rating : null;

              return (
                <div key={f.id} className="card-surface p-5 hover:shadow-md transition-all group">
                  <div className="flex items-start gap-4">
                    {/* Avatar + rang */}
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-xl text-white"
                        style={{ background: idx === 0 ? "var(--gradient-accent)" : "var(--gradient-primary)" }}>
                        {f.prenom.charAt(0)}
                      </div>
                      {idx === 0 && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: "hsl(38 90% 50%)" }}>
                          ⭐
                        </div>
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground text-base">{f.prenom}</h3>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: f.badge.bg, color: f.badge.color }}>
                            {f.badge.icon} {f.badge.label}
                          </span>
                        </div>

                        {/* Favorite */}
                        <button
                          onClick={e => toggleFavorite(f, e)}
                          className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors"
                          title={f.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                        >
                          <Heart
                            size={16}
                            className={f.isFavorite ? "fill-current" : ""}
                            style={{ color: f.isFavorite ? "hsl(0 72% 55%)" : "hsl(var(--muted-foreground))" }}
                          />
                        </button>
                      </div>

                      {/* Méta */}
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1 mb-2">
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

                      {/* Description */}
                      {f.description_reseau && (
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-2">
                          {f.description_reseau}
                        </p>
                      )}

                      {/* Stats row */}
                      <div className="flex items-center gap-4 flex-wrap">
                        {/* Score bar */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{
                              width: `${f.score}%`,
                              background: `linear-gradient(90deg, ${f.badge.color}, ${f.badge.color}80)`
                            }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: f.badge.color }}>{f.score}</span>
                        </div>

                        {/* Rating */}
                        {rating && rating > 0 ? (
                          <div className="flex items-center gap-1">
                            <StarRating rating={rating} size={11} />
                            <span className="text-xs text-muted-foreground">({f.total_reviews})</span>
                          </div>
                        ) : null}

                        {/* Intros */}
                        <span className="text-xs text-muted-foreground">
                          {f.intros_count} intro{f.intros_count !== 1 ? "s" : ""}
                        </span>

                        {/* Taux */}
                        {tauxConv > 0 && (
                          <span className="text-xs font-semibold" style={{ color: "hsl(152 62% 35%)" }}>
                            {tauxConv}% validées
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                    <Link
                      to={`/facilitateurs/${f.user_id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      Voir le profil
                    </Link>
                    <Link
                      to={`/facilitateurs/${f.user_id}?action=request`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{ background: "var(--gradient-primary)", color: "white" }}
                    >
                      <Zap size={12} /> Demander une intro
                    </Link>
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
                Chaque facilitateur est évalué sur son taux de conversion, ses avis reçus et la qualité de ses introductions. Les scores reflètent les performances réelles.
              </p>
            </div>
          </div>
        </div>

      </div>
    </UserLayout>
  );
}
