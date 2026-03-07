/**
 * MorningBrief — Bloc "Brief du jour" alimenté par OpenClaw
 * Affiché en haut du Pilotage et en onglet Plans dans Agents
 */
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, ChevronRight, RefreshCw, Clock,
  AlertCircle, CheckCircle2, Target, Zap, ArrowRight,
  Brain, TrendingUp, MessageSquare, Filter,
} from "lucide-react";

interface BriefItem {
  label: string;
  type: string;
  link: string;
  urgent?: boolean;
}

interface SuggestedAction {
  label: string;
  link: string;
  priority: string;
}

interface Brief {
  id: string;
  title: string;
  summary: string;
  priority_items: BriefItem[];
  suggested_actions: SuggestedAction[];
  stats: { score_sante?: number; prochaine_etape?: string };
  created_at: string;
}

interface Recommendation {
  id: string;
  agent_name: string;
  type: string;
  title: string;
  summary: string;
  priority: string;
  status: string;
  recommended_action: string | null;
  created_at: string;
}

const typeIcon: Record<string, React.ElementType> = {
  validation: AlertCircle,
  campagne: Zap,
  action: CheckCircle2,
  opportunite: Target,
  dossier: Brain,
  message: MessageSquare,
  relance: RefreshCw,
};

const priorityStyle: Record<string, { color: string; bg: string; label: string }> = {
  urgente: { color: "hsl(0 65% 40%)",        bg: "hsl(0 65% 95%)",         label: "Urgent" },
  haute:   { color: "hsl(38 80% 30%)",        bg: "hsl(var(--accent-light))", label: "Important" },
  normale: { color: "hsl(var(--primary))",    bg: "hsl(var(--secondary))",    label: "Normal" },
  basse:   { color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))", label: "Info" },
};

async function callEdgeFunction(name: string, body: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Non authentifié");
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const res = await fetch(`https://${projectId}.supabase.co/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
      "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${name} (${res.status})`);
  return res.json();
}

export function MorningBrief({ compact = false }: { compact?: boolean }) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBriefAndRecs = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Brief du jour
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [briefRes, recsRes] = await Promise.all([
      supabase.from("openclaw_briefs" as "openclaw_briefs")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("openclaw_recommendations" as "openclaw_recommendations")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "nouvelle")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setBrief(briefRes.data as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setRecommendations((recsRes.data ?? []) as any);
    setLoading(false);
  }, []);

  useEffect(() => { loadBriefAndRecs(); }, [loadBriefAndRecs]);

  const handleGenerate = async (force = false) => {
    setGenerating(true);
    setError(null);
    try {
      await callEdgeFunction("openclaw-generate", { force });
      await loadBriefAndRecs();
    } catch (err) {
      setError("Le cerveau n'a pas pu générer le brief. Réessayez dans quelques instants.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDismissRec = async (id: string) => {
    await supabase.from("openclaw_recommendations" as "openclaw_recommendations")
      .update({ status: "vue" } as Record<string, unknown>)
      .eq("id", id);
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAcceptRec = async (id: string) => {
    await supabase.from("openclaw_recommendations" as "openclaw_recommendations")
      .update({ status: "acceptee" } as Record<string, unknown>)
      .eq("id", id);
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) {
    return (
      <div className="card-surface p-5 flex items-center gap-3">
        <Brain size={16} className="animate-pulse" style={{ color: "hsl(var(--primary))" }} />
        <span className="text-sm text-muted-foreground">OpenClaw analyse votre situation…</span>
      </div>
    );
  }

  // Pas de brief → CTA pour en générer un
  if (!brief) {
    return (
      <div className="card-surface p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "hsl(var(--secondary))" }}>
            <Brain size={16} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Brief du jour</p>
            <p className="text-xs text-muted-foreground">OpenClaw n'a pas encore analysé votre journée.</p>
          </div>
        </div>
        {error && (
          <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: "hsl(0 65% 95%)", color: "hsl(0 65% 40%)" }}>
            {error}
          </p>
        )}
        <button
          onClick={() => handleGenerate(false)}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          {generating
            ? <><RefreshCw size={14} className="animate-spin" /> Analyse en cours…</>
            : <><Sparkles size={14} /> Générer le brief du jour</>}
        </button>
      </div>
    );
  }

  // Brief présent : affichage compact ou complet
  if (compact) {
    return (
      <div className="card-surface p-4" style={{ borderLeft: "3px solid hsl(var(--primary))" }}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Brain size={14} style={{ color: "hsl(var(--primary))" }} />
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">{brief.title}</p>
          </div>
          <button
            onClick={() => handleGenerate(true)}
            disabled={generating}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="Regénérer le brief"
          >
            <RefreshCw size={12} className={generating ? "animate-spin" : ""} />
          </button>
        </div>
        <p className="text-sm text-foreground font-medium mb-3">{brief.summary}</p>

        {/* Priorités */}
        {(brief.priority_items ?? []).slice(0, 3).map((item, i) => {
          const Icon = typeIcon[item.type] ?? ChevronRight;
          return (
            <Link key={i} to={item.link}
              className="flex items-center gap-2 py-1.5 text-xs text-foreground hover:opacity-80 transition-opacity">
              <Icon size={12} style={{ color: item.urgent ? "hsl(0 65% 40%)" : "hsl(var(--primary))" }} />
              <span className="flex-1">{item.label}</span>
              <ChevronRight size={10} className="text-muted-foreground" />
            </Link>
          );
        })}

        {recommendations.length > 0 && (
          <div className="mt-2 pt-2 border-t flex items-center justify-between" style={{ borderColor: "hsl(var(--border))" }}>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles size={11} style={{ color: "hsl(var(--primary))" }} />
              {recommendations.length} recommandation{recommendations.length > 1 ? "s" : ""}
            </span>
            <Link to="/agents" className="text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>
              Voir tout <ChevronRight size={10} className="inline" />
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Affichage complet
  return (
    <div className="space-y-4">
      {/* Brief */}
      <div className="card-surface p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(var(--secondary))" }}>
              <Brain size={15} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{brief.title}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={10} />
                {new Date(brief.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleGenerate(true)}
            disabled={generating}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw size={11} className={generating ? "animate-spin" : ""} />
            {generating ? "Analyse…" : "Actualiser"}
          </button>
        </div>

        <p className="text-sm text-foreground mb-4 font-medium">{brief.summary}</p>

        {/* Score santé */}
        {brief.stats?.score_sante !== undefined && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
            <TrendingUp size={14} style={{ color: "hsl(var(--primary))" }} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Score de préparation</span>
                <span className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>{brief.stats.score_sante}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${brief.stats.score_sante}%`, background: "hsl(var(--primary))" }} />
              </div>
            </div>
          </div>
        )}

        {/* Priorités */}
        {(brief.priority_items ?? []).length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">À traiter maintenant</p>
            {(brief.priority_items ?? []).map((item, i) => {
              const Icon = typeIcon[item.type] ?? ChevronRight;
              return (
                <Link key={i} to={item.link}
                  className="flex items-center gap-2.5 p-3 rounded-xl hover:opacity-90 transition-opacity"
                  style={{
                    background: item.urgent ? "hsl(0 65% 95%)" : "hsl(var(--muted))",
                    borderLeft: item.urgent ? "2px solid hsl(0 65% 40%)" : undefined,
                  }}>
                  <Icon size={13} style={{ color: item.urgent ? "hsl(0 65% 40%)" : "hsl(var(--primary))" }} />
                  <span className="text-sm text-foreground flex-1">{item.label}</span>
                  <ChevronRight size={12} className="text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        )}

        {/* Actions suggérées */}
        {(brief.suggested_actions ?? []).length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Prochaines actions</p>
            <div className="flex flex-wrap gap-2">
              {(brief.suggested_actions ?? []).map((action, i) => {
                const pStyle = priorityStyle[action.priority] ?? priorityStyle.normale;
                return (
                  <Link key={i} to={action.link}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all hover:opacity-80"
                    style={{ color: pStyle.color, background: pStyle.bg }}>
                    <ArrowRight size={10} /> {action.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {brief.stats?.prochaine_etape && (
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t flex items-start gap-1.5"
            style={{ borderColor: "hsl(var(--border))" }}>
            <Sparkles size={11} className="mt-0.5 shrink-0" style={{ color: "hsl(var(--primary))" }} />
            {brief.stats.prochaine_etape}
          </p>
        )}
      </div>

      {/* Recommandations */}
      {recommendations.length > 0 && (
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter size={14} style={{ color: "hsl(var(--primary))" }} />
              <h2 className="text-sm font-semibold text-foreground">
                OpenClaw a préparé ceci pour vous
              </h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
              {recommendations.length}
            </span>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec) => {
              const pStyle = priorityStyle[rec.priority] ?? priorityStyle.normale;
              const Icon = typeIcon[rec.type] ?? ChevronRight;
              return (
                <div key={rec.id} className="p-4 rounded-xl border"
                  style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted)/0.4)" }}>
                  <div className="flex items-start gap-2.5 mb-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: pStyle.bg }}>
                      <Icon size={13} style={{ color: pStyle.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{rec.title}</p>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ color: pStyle.color, background: pStyle.bg }}>
                          {pStyle.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{rec.summary}</p>
                    </div>
                  </div>
                  {rec.recommended_action && (
                    <p className="text-xs font-medium mb-3 pl-9.5" style={{ color: "hsl(var(--primary))" }}>
                      → {rec.recommended_action}
                    </p>
                  )}
                  <div className="flex gap-2 pl-9">
                    <button
                      onClick={() => handleAcceptRec(rec.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                      <CheckCircle2 size={11} /> Compris
                    </button>
                    <button
                      onClick={() => handleDismissRec(rec.id)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-muted"
                      style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                      Ignorer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
