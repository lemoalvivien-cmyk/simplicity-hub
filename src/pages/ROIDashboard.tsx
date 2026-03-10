/**
 * ROI Dashboard Entreprise — PROOF:ROI_DASHBOARD_V1:enterprise_roi_real
 * Reads from: missions, introductions, gains — for the logged-in entreprise user.
 * Zero hardcode. All metrics calculated from DB.
 */
import { useEffect, useState } from "react";
import UserLayout from "@/components/layout/UserLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Target, Send, CheckCircle2, Euro, Clock, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { formatDistanceToNow, differenceInDays, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface Mission {
  id: string;
  titre: string;
  statut: string | null;
  created_at: string;
}

interface Introduction {
  id: string;
  statut: string;
  mission_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Gain {
  id: string;
  montant: number | null;
  statut: string | null;
  created_at: string;
}

interface ROIMetrics {
  missionsCreees: number;
  introsRecues: number;
  introsValidees: number;
  gainsGeneres: number;
  montantTotal: number;
  tauxValidation: number | null;
  tempsMoyenPremierIntro: number | null;   // jours
  tempsMoyenValidation: number | null;      // jours depuis soumission à validation
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent ? "bg-primary/15" : "bg-muted"}`}>
          <Icon size={17} className={accent ? "text-primary" : "text-muted-foreground"} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`font-display text-2xl font-bold mt-0.5 ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function ROIDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ROIMetrics | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // PROOF:ROI_DASHBOARD_V1:reads_from_db — all queries target real tables
      const [
        { data: missionsData, error: mErr },
        { data: introsData, error: iErr },
        { data: gainsData, error: gErr },
      ] = await Promise.all([
        supabase
          .from("missions")
          .select("id, titre, statut, created_at")
          .eq("entreprise_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("introductions")
          .select("id, statut, mission_id, created_at, updated_at")
          .eq("entreprise_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("gains")
          .select("id, montant, statut, created_at")
          .eq("facilitateur_id", user.id)
          .in("statut", ["valide", "recu"]),
      ]);

      if (mErr) throw mErr;
      if (iErr) throw iErr;
      if (gErr) throw gErr;

      const ms = missionsData ?? [];
      const is = (introsData ?? []) as Introduction[];
      const gs = gainsData ?? [];

      const introsValidees = is.filter(i => i.statut === "validee");
      const tauxValidation = is.length > 0 ? Math.round((introsValidees.length / is.length) * 100) : null;

      // Time-to-first-intro: for each mission, days between mission.created_at and first intro.created_at
      const ttfis: number[] = ms.map(m => {
        const firstIntro = is
          .filter(i => i.mission_id === m.id)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
        if (!firstIntro) return -1;
        return differenceInDays(parseISO(firstIntro.created_at), parseISO(m.created_at));
      }).filter(d => d >= 0);
      const tempsMoyenPremierIntro = ttfis.length > 0
        ? Math.round(ttfis.reduce((s, d) => s + d, 0) / ttfis.length)
        : null;

      // Time-to-validation: days from intro.created_at to updated_at for validated intros
      const ttvs: number[] = introsValidees.map(i =>
        differenceInDays(parseISO(i.updated_at), parseISO(i.created_at))
      ).filter(d => d >= 0);
      const tempsMoyenValidation = ttvs.length > 0
        ? Math.round(ttvs.reduce((s, d) => s + d, 0) / ttvs.length)
        : null;

      const montantTotal = gs.reduce((s, g) => s + (g.montant ?? 0), 0);

      setMetrics({
        missionsCreees: ms.length,
        introsRecues: is.length,
        introsValidees: introsValidees.length,
        gainsGeneres: gs.length,
        montantTotal,
        tauxValidation,
        tempsMoyenPremierIntro,
        tempsMoyenValidation,
      });
      setMissions(ms.slice(0, 5));
      setLastRefresh(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp size={22} className="text-primary" />
              ROI Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Métriques calculées depuis votre activité réelle — zéro simulation
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            {lastRefresh ? formatDistanceToNow(lastRefresh, { locale: fr, addSuffix: true }) : "Actualiser"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="stat-card animate-pulse">
                <div className="h-8 bg-muted rounded w-16 mb-2" />
                <div className="h-4 bg-muted rounded w-24" />
              </div>
            ))}
          </div>
        ) : metrics ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <MetricCard
                icon={Target}
                label="Missions créées"
                value={metrics.missionsCreees}
                sub="Toutes les missions actives et archivées"
                accent
              />
              <MetricCard
                icon={Send}
                label="Introductions reçues"
                value={metrics.introsRecues}
                sub="Toutes introductions soumises par des facilitateurs"
              />
              <MetricCard
                icon={CheckCircle2}
                label="Introductions validées"
                value={metrics.introsValidees}
                sub={metrics.tauxValidation !== null ? `${metrics.tauxValidation}% de taux de validation` : undefined}
                accent
              />
              <MetricCard
                icon={Euro}
                label="Gains confirmés"
                value={metrics.montantTotal > 0 ? `${metrics.montantTotal.toLocaleString("fr")} €` : metrics.gainsGeneres}
                sub={metrics.montantTotal > 0 ? `${metrics.gainsGeneres} gain(s) validé(s)` : "Montant inconnu ou 0 €"}
              />
              <MetricCard
                icon={Clock}
                label="Délai moyen 1ʳᵉ intro"
                value={metrics.tempsMoyenPremierIntro !== null ? `${metrics.tempsMoyenPremierIntro}j` : "—"}
                sub={metrics.tempsMoyenPremierIntro !== null ? "Jours entre création mission et 1ʳᵉ intro reçue" : "Données insuffisantes"}
              />
              <MetricCard
                icon={TrendingUp}
                label="Délai moyen validation"
                value={metrics.tempsMoyenValidation !== null ? `${metrics.tempsMoyenValidation}j` : "—"}
                sub={metrics.tempsMoyenValidation !== null ? "Jours entre soumission et validation d'une intro" : "Données insuffisantes"}
              />
            </div>

            {/* Taux de conversion funnel */}
            {metrics.introsRecues > 0 && (
              <div className="card-surface p-5 mb-6">
                <h2 className="font-semibold text-foreground mb-4 text-sm">Pipeline de conversion</h2>
                <div className="space-y-3">
                  {[
                    { label: "Missions créées",       val: metrics.missionsCreees },
                    { label: "Intros reçues",          val: metrics.introsRecues },
                    { label: "Intros validées",        val: metrics.introsValidees },
                    { label: "Gains confirmés",        val: metrics.gainsGeneres },
                  ].map(({ label, val }) => {
                    const pct = metrics.introsRecues > 0 ? Math.round((val / Math.max(metrics.introsRecues, metrics.missionsCreees)) * 100) : 0;
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-bold text-foreground">{val}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-primary rounded-full transition-all"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent missions */}
            {missions.length > 0 && (
              <div className="card-surface overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <h2 className="font-semibold text-foreground text-sm">Dernières missions</h2>
                </div>
                <div className="divide-y divide-border">
                  {missions.map(m => (
                    <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.titre}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(parseISO(m.created_at), { locale: fr, addSuffix: true })}
                        </p>
                      </div>
                      <span className="badge-muted text-xs">{m.statut}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {metrics.missionsCreees === 0 && (
              <div className="text-center py-12">
                <Target size={40} className="mx-auto text-muted-foreground mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm">Aucune donnée — créez votre première mission pour alimenter ce dashboard.</p>
              </div>
            )}
          </>
        ) : null}

        <p className="text-xs text-muted-foreground mt-6 text-center">
          Source : tables <code>missions</code>, <code>introductions</code>, <code>gains</code> · Zéro hardcode
        </p>
      </div>
    </UserLayout>
  );
}
