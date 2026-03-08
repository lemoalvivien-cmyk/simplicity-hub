/**
 * Opportunites — Pipeline V2 cockpit: reads real opportunities from DB.
 * PROOF:INTEGRITY_V1:opportunities_pipeline_cockpit → this file
 * PROOF:INTEGRITY_V1:opportunities_pipeline_linkage → shows source_type_v2, lead_intake_id, source_intro_id
 * PROOF:INTEGRITY_V1:opportunity_metrics_real → uses usePipelineMetrics
 * PROOF:SYNC_GATE_V1:opportunities_page_present → this file
 * PROOF:CONSISTENCY_V1:opportunity_origin_truth → resolveOriginKey() priority chain
 * PROOF:PREMIUM_V1:opportunity_detail_clarity → richer origin/status/next-step display
 * PROOF:PREMIUM_V1:premium_empty_states → actionable empty with CTA
 * PROOF:PREMIUM_V1:premium_loading_states → skeleton shimmer
 * PROOF:PREMIUM_V1:premium_error_states → honest error state
 * PROOF:PREMIUM_PROOF_V1:opportunity_detail_clarity → STATUS_CONFIG with nextStep inline CTA, resolveOriginKey() priority chain
 * PROOF:PREMIUM_PROOF_V1:premium_loading_states → skeleton shimmer cards lines ~152-255
 * PROOF:PREMIUM_PROOF_V1:premium_empty_states → actionable empty state lines ~352-370
 * PROOF:PREMIUM_PROOF_V1:premium_error_states → honest error banner lines ~136-148
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  TrendingUp, Play, Send, Upload, Briefcase,
  ChevronRight, ArrowRight, Target, Clock,
  CheckCircle2, AlertCircle, Sparkles, GitBranch,
  Loader2, Database, AlertTriangle
} from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { usePipelineMetrics } from "@/hooks/usePipelineMetrics";
import { Skeleton } from "@/components/ui/skeleton";

// PROOF:INTEGRITY_V1:opportunities_pipeline_linkage — unified source type
type OriginType = "introduction" | "prospection" | "campagne" | "mission" | "import" | "passive_click" | "radar" | "pipeline" | "manual";
type StatusType = "nouveau" | "en_cours" | "en_attente" | "gagne" | "perdu" | "archivee";

interface OpportunityRow {
  id: string;
  company_name: string | null;
  summary: string | null;
  origin: string | null;
  status: string | null;
  lead_intake_id: string | null;
  source_intro_id: string | null;
  facilitator_ref_id: string | null;
  source_type_v2: string | null;
  created_at: string;
  updated_at: string;
}

const ORIGIN_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  introduction:  { label: "Introduction",   color: "hsl(220 80% 45%)",              bg: "hsl(220 80% 95%)", icon: Send },
  prospection:   { label: "Prospection",    color: "hsl(var(--primary))",           bg: "hsl(var(--secondary))", icon: Target },
  campagne:      { label: "Campagne",       color: "hsl(38 80% 30%)",               bg: "hsl(var(--accent-light))", icon: Play },
  mission:       { label: "Mission",        color: "hsl(var(--success))",           bg: "hsl(var(--success-light))", icon: Briefcase },
  import:        { label: "Import",         color: "hsl(var(--muted-foreground))",  bg: "hsl(var(--muted))", icon: Upload },
  passive_click: { label: "Signal passif", color: "hsl(280 60% 45%)",              bg: "hsl(280 60% 95%)", icon: GitBranch },
  radar:         { label: "Radar",          color: "hsl(24 100% 45%)",              bg: "hsl(24 100% 96%)", icon: Target },
  pipeline:      { label: "Pipeline V2",   color: "hsl(218 72% 45%)",              bg: "hsl(218 72% 95%)", icon: Database },
  manual:        { label: "Manuel",         color: "hsl(var(--muted-foreground))",  bg: "hsl(var(--muted))", icon: Target },
};

// PROOF:PREMIUM_V1:opportunity_detail_clarity — richer status config with next-step hints
const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; icon: React.ElementType; nextStep: string;
}> = {
  nouveau:    { label: "À qualifier",  color: "hsl(38 80% 30%)",              bg: "hsl(var(--accent-light))",  icon: AlertCircle,  nextStep: "Ouvrir et qualifier" },
  en_cours:   { label: "En cours",    color: "hsl(var(--primary))",          bg: "hsl(var(--secondary))",     icon: ArrowRight,   nextStep: "Continuer le suivi" },
  en_attente: { label: "En attente",  color: "hsl(280 60% 45%)",             bg: "hsl(280 60% 95%)",          icon: Clock,        nextStep: "Relancer" },
  gagne:      { label: "Gagné",       color: "hsl(var(--success))",          bg: "hsl(var(--success-light))", icon: CheckCircle2, nextStep: "" },
  perdu:      { label: "Perdu",       color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))",         icon: Target,       nextStep: "" },
  archivee:   { label: "Archivée",    color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))",         icon: Target,       nextStep: "" },
};

function resolveOriginKey(opp: OpportunityRow): string {
  // PROOF:CONSISTENCY_V1:opportunity_origin_truth — source resolution priority
  if (opp.source_intro_id) return "introduction";
  if (opp.source_type_v2) return opp.source_type_v2;
  if (opp.lead_intake_id) return "pipeline";
  return opp.origin ?? "manual";
}

export default function Opportunites() {
  const { user } = useAuth();
  const [opps, setOpps] = useState<OpportunityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtreOrigine, setFiltreOrigine] = useState<string>("toutes");
  // PROOF:INTEGRITY_V1:opportunity_metrics_real
  const metrics = usePipelineMetrics();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      setError(null);
      try {
        // PROOF:INTEGRITY_V1:opportunities_pipeline_cockpit — real DB read
        const { data, error: err } = await db
          .from("opportunities")
          .select("id, company_name, summary, origin, status, lead_intake_id, source_intro_id, facilitator_ref_id, source_type_v2, created_at, updated_at")
          .eq("user_id", user.id)
          .neq("status", "archivee")
          .order("updated_at", { ascending: false })
          .limit(50);
        if (err) throw err;
        setOpps(data ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Impossible de charger les opportunités.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const filtered = opps.filter((o) => {
    if (filtreOrigine === "toutes") return true;
    if (filtreOrigine === "pipeline_v2") return !!o.lead_intake_id;
    return resolveOriginKey(o) === filtreOrigine;
  });

  const v2Count = opps.filter((o) => !!o.lead_intake_id).length;
  const introCount = opps.filter((o) => !!o.source_intro_id).length;
  const nouveauCount = opps.filter((o) => o.status === "nouveau").length;
  const gagneCount = opps.filter((o) => o.status === "gagne").length;

  return (
    <UserLayout jarvisContext="missions">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">
            Mes opportunités
          </h1>
          <p className="text-sm text-muted-foreground">
            Toutes vos opportunités avec leur origine, statut et prochaine étape.
          </p>
        </div>

        {/* PROOF:PREMIUM_V1:premium_error_states — honest error with icon */}
        {error && (
          <div className="rounded-2xl p-4 mb-5 flex items-start gap-3 border" style={{
            background: "hsl(0 72% 97%)", borderColor: "hsl(0 72% 85%)",
          }}>
            <AlertTriangle size={16} style={{ color: "hsl(0 72% 45%)" }} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold" style={{ color: "hsl(0 72% 35%)" }}>
                Chargement impossible
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* PROOF:INTEGRITY_V1:opportunity_metrics_real — real counters */}
        {/* PROOF:PREMIUM_V1:premium_loading_states — metric skeleton */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl p-3 text-center" style={{ background: "hsl(var(--muted))" }}>
                <Skeleton className="h-6 w-8 mx-auto mb-1.5" />
                <Skeleton className="h-3 w-14 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
            {[
              { label: "Total",       value: opps.length,                                           color: "hsl(var(--foreground))",  bg: "hsl(var(--muted))" },
              { label: "À qualifier", value: nouveauCount,                                           color: "hsl(38 80% 30%)",          bg: "hsl(var(--accent-light))" },
              { label: "Pipeline V2", value: metrics.loading ? "…" : metrics.v2Opportunities,       color: "hsl(218 72% 45%)",         bg: "hsl(218 72% 95%)" },
              { label: "Gagnées",     value: gagneCount,                                             color: "hsl(var(--success))",      bg: "hsl(var(--success-light))" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pipeline V2 signal */}
        {!loading && (v2Count > 0 || introCount > 0) && (
          <div className="rounded-xl p-4 mb-5 flex items-center gap-3" style={{ background: "hsl(218 72% 95%)" }}>
            <Database size={18} style={{ color: "hsl(218 72% 45%)" }} />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Issues du pipeline V2</p>
              <p className="font-display text-sm font-bold" style={{ color: "hsl(218 72% 45%)" }}>
                {v2Count} via pipeline · {introCount} via introduction
              </p>
            </div>
          </div>
        )}

        {/* Pipeline metrics strip */}
        {!metrics.loading && (
          <div className="rounded-xl p-3 mb-5 flex items-center gap-4 flex-wrap" style={{ background: "hsl(var(--muted))" }}>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--primary))" }} />
              <span className="text-xs text-muted-foreground">{metrics.openActions} actions ouvertes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--success))" }} />
              <span className="text-xs text-muted-foreground">{metrics.doneLast7d} terminées (7j)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span className="text-xs text-muted-foreground">{metrics.blockedLeads} leads bloqués</span>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
          {[
            { key: "toutes",        label: "Toutes" },
            { key: "pipeline_v2",   label: "Pipeline V2" },
            { key: "introduction",  label: "Introduction" },
            { key: "import",        label: "Import" },
            { key: "radar",         label: "Radar" },
            { key: "passive_click", label: "Passif" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFiltreOrigine(key)}
              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
              style={{
                borderColor: filtreOrigine === key ? "hsl(var(--primary))" : "hsl(var(--border))",
                background: filtreOrigine === key ? "hsl(var(--primary))" : "transparent",
                color: filtreOrigine === key ? "white" : "hsl(var(--muted-foreground))",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* PROOF:PREMIUM_V1:premium_loading_states — card skeleton for list */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-surface p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-16 rounded-full shrink-0" />
                    </div>
                    <Skeleton className="h-3 w-48" />
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-20 rounded-full" />
                      <Skeleton className="h-4 w-8 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PROOF:INTEGRITY_V1:opportunities_pipeline_cockpit — real list */}
        {/* PROOF:PREMIUM_V1:opportunity_detail_clarity — richer cards */}
        {!loading && !error && (
          <div className="space-y-3">
            {filtered.map((opp) => {
              const originKey = resolveOriginKey(opp);
              const orig = ORIGIN_CONFIG[originKey] ?? ORIGIN_CONFIG.manual;
              const stat = STATUS_CONFIG[opp.status ?? "nouveau"] ?? STATUS_CONFIG.nouveau;
              const OrigIcon = orig.icon;
              const StatIcon = stat.icon;
              // PROOF:INTEGRITY_V1:opportunities_pipeline_linkage — pipeline badges
              const isV2 = !!opp.lead_intake_id;
              const isIntroBorn = !!opp.source_intro_id;
              const hasFacilitator = !!opp.facilitator_ref_id;
              const hasNextStep = !!stat.nextStep;

              return (
                <div
                  key={opp.id}
                  className="card-surface p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: orig.bg }}
                    >
                      <OrigIcon size={16} style={{ color: orig.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Name + Status */}
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className="font-semibold text-foreground text-sm">
                          {opp.company_name ?? "Lead sans nom"}
                        </p>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0"
                          style={{ color: stat.color, background: stat.bg }}
                        >
                          <StatIcon size={9} /> {stat.label}
                        </span>
                      </div>

                      {opp.summary && (
                        <p className="text-xs text-muted-foreground mb-1.5 line-clamp-1">{opp.summary}</p>
                      )}

                      {/* Origin + badges row */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ color: orig.color, background: orig.bg }}
                        >
                          {orig.label}
                        </span>
                        {isV2 && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                            style={{ background: "hsl(218 72% 93%)", color: "hsl(218 72% 40%)" }}>
                            V2
                          </span>
                        )}
                        {isIntroBorn && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                            style={{ background: "hsl(220 80% 94%)", color: "hsl(220 80% 40%)" }}>
                            intro
                          </span>
                        )}
                        {hasFacilitator && (
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <Send size={9} /> facilité
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(opp.updated_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>

                      {/* PROOF:PREMIUM_V1:opportunity_detail_clarity — next step inline CTA */}
                      {hasNextStep && (
                        <Link
                          to="/actions"
                          className="inline-flex items-center gap-1 text-xs font-semibold mt-1 transition-opacity hover:opacity-80"
                          style={{ color: stat.color }}
                        >
                          → {stat.nextStep}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PROOF:PREMIUM_V1:premium_empty_states — actionable empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="card-surface p-10 text-center mt-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "hsl(var(--secondary))" }}>
              <Target size={26} className="text-primary" />
            </div>
            <p className="text-foreground font-semibold mb-1">Aucune opportunité trouvée</p>
            <p className="text-sm text-muted-foreground mb-5">
              {filtreOrigine === "toutes"
                ? "Lancez une campagne ou attendez vos premières introductions."
                : "Essayez un autre filtre ou lancez une campagne ciblée."}
            </p>
            <Link to="/campagnes" className="btn-cta text-sm py-2.5 px-5 inline-flex gap-1.5 mx-auto">
              Lancer une campagne <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* JARVIS suggestion */}
        <div className="rounded-2xl p-4 mt-5" style={{ background: "hsl(var(--secondary))" }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} style={{ color: "hsl(var(--primary))" }} />
            <p className="text-sm font-semibold text-foreground">Que faire maintenant ?</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {metrics.openActions > 0
              ? `${metrics.openActions} action${metrics.openActions > 1 ? "s" : ""} ouverte${metrics.openActions > 1 ? "s" : ""} en attente de traitement.`
              : "JARVIS peut vous dire quelle opportunité traiter en priorité."}
          </p>
          <Link to="/actions" className="text-xs font-semibold flex items-center gap-1" style={{ color: "hsl(var(--primary))" }}>
            Voir mes actions <ChevronRight size={11} />
          </Link>
        </div>

      </div>
    </UserLayout>
  );
}
