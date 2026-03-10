/**
 * CampagneDetail — réel depuis Supabase.
 * Affiche la progression de la séquence de prospection.
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  ArrowLeft, Play, PauseCircle, CheckCircle2, Users,
  Mail, Clock, BarChart2, ChevronRight,
  Loader2, AlertCircle, Sparkles, MessageCircle, XCircle,
  Zap, ListChecks,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type CampagneStatus = "brouillon" | "en_cours" | "terminee" | "en_pause";

interface Campagne {
  id: string;
  nom: string;
  objectif: string | null;
  mode_action: string | null;
  canal_principal: string | null;
  statut: CampagneStatus;
  liste_id: string | null;
  created_at: string;
  owner_user_id: string;
}

interface ProspectionSequence {
  id: string;
  name: string;
  status: string;
  steps: SequenceStep[];
  created_at: string;
}

interface SequenceStep {
  step: number;
  type: string;
  delay_days: number;
  subject?: string;
  body?: string;
  rationale?: string;
}

interface ExecutionStats {
  total: number;
  en_cours: number;
  termine: number;
  repondu: number;
  annule: number;
  by_step: Record<number, number>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const statusConfig: Record<CampagneStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  brouillon: { label: "Brouillon",  color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))",       icon: <Clock size={13} /> },
  en_cours:  { label: "En cours",   color: "hsl(var(--primary))",          bg: "hsl(var(--secondary))",   icon: <Play size={13} /> },
  terminee:  { label: "Terminée",   color: "hsl(142 72% 29%)",             bg: "hsl(142 72% 95%)",        icon: <CheckCircle2 size={13} /> },
  en_pause:  { label: "En pause",   color: "hsl(38 80% 30%)",              bg: "hsl(var(--accent-light))",icon: <PauseCircle size={13} /> },
};

const seqStatusConfig: Record<string, { label: string; color: string }> = {
  brouillon: { label: "Brouillon", color: "hsl(var(--muted-foreground))" },
  active:    { label: "Active",    color: "hsl(var(--success))" },
  en_pause:  { label: "En pause",  color: "hsl(38 80% 40%)" },
  terminee:  { label: "Terminée",  color: "hsl(var(--muted-foreground))" },
};

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  email:    { label: "Email",    color: "hsl(218 72% 50%)" },
  linkedin: { label: "LinkedIn", color: "hsl(210 100% 40%)" },
  appel:    { label: "Appel",    color: "hsl(142 72% 35%)" },
};

export default function CampagneDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campagne, setCampagne] = useState<Campagne | null>(null);
  const [sequence, setSequence] = useState<ProspectionSequence | null>(null);
  const [execStats, setExecStats] = useState<ExecutionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [seqUpdating, setSeqUpdating] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    if (!UUID_RE.test(id)) { setLoadError("Identifiant invalide."); setLoading(false); return; }

    const load = async () => {
      setLoading(true);
      setLoadError(null);

      const [campRes, seqRes] = await Promise.all([
        supabase.from("campagnes").select("*").eq("id", id).eq("owner_user_id", user.id).maybeSingle(),
        supabase.from("prospection_sequences").select("*").eq("campaign_id", id).eq("user_id", user.id).maybeSingle(),
      ]);

      if (campRes.error) { setLoadError("Erreur de chargement."); setLoading(false); return; }
      if (!campRes.data) { setLoadError("Campagne introuvable ou accès refusé."); setLoading(false); return; }

      setCampagne(campRes.data as Campagne);

      if (seqRes.data) {
        const seq = seqRes.data as ProspectionSequence;
        setSequence(seq);

        // Load execution stats
        const { data: execs } = await supabase
          .from("prospection_executions")
          .select("status, current_step")
          .eq("sequence_id", seq.id);

        if (execs && execs.length > 0) {
          const stats: ExecutionStats = { total: execs.length, en_cours: 0, termine: 0, repondu: 0, annule: 0, by_step: {} };
          for (const ex of execs as { status: string; current_step: number }[]) {
            if (ex.status === "en_cours") stats.en_cours++;
            else if (ex.status === "termine") stats.termine++;
            else if (ex.status === "repondu") stats.repondu++;
            else if (ex.status === "annule") stats.annule++;
            stats.by_step[ex.current_step] = (stats.by_step[ex.current_step] ?? 0) + 1;
          }
          setExecStats(stats);
        }
      }

      setLoading(false);
    };
    load();
  }, [id, user]);

  const handleStatusChange = async (newStatus: CampagneStatus) => {
    if (!campagne) return;
    setUpdating(true);
    const { error } = await supabase.from("campagnes").update({ statut: newStatus }).eq("id", campagne.id);
    if (error) { toast.error("Impossible de mettre à jour le statut."); }
    else {
      setCampagne(prev => prev ? { ...prev, statut: newStatus } : prev);
      toast.success(newStatus === "en_cours" ? "Campagne lancée." : newStatus === "en_pause" ? "Campagne mise en pause." : "Statut mis à jour.");
    }
    setUpdating(false);
  };

  const handleSequenceStatus = async (newStatus: string) => {
    if (!sequence) return;
    setSeqUpdating(true);
    const { error } = await supabase.from("prospection_sequences").update({ status: newStatus }).eq("id", sequence.id);
    if (error) { toast.error("Impossible de mettre à jour la séquence."); }
    else {
      setSequence(prev => prev ? { ...prev, status: newStatus } : prev);
      toast.success(newStatus === "active" ? "Séquence activée." : newStatus === "en_pause" ? "Séquence en pause." : "Séquence terminée.");
    }
    setSeqUpdating(false);
  };

  if (loading) {
    return <UserLayout><div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div></UserLayout>;
  }

  if (loadError || !campagne) {
    return (
      <UserLayout>
        <div className="max-w-md mx-auto pt-8">
          <div className="card-surface p-8 text-center">
            <XCircle size={32} className="mx-auto mb-4" style={{ color: "hsl(0 60% 50%)" }} />
            <h2 className="font-display text-lg font-bold text-foreground mb-2">Campagne introuvable</h2>
            <p className="text-sm text-muted-foreground mb-6">{loadError ?? "Cette campagne n'existe pas."}</p>
            <button onClick={() => navigate("/campagnes")} className="btn-cta text-sm py-2.5 px-6 inline-flex items-center gap-2">
              <ArrowLeft size={14} /> Retour
            </button>
          </div>
        </div>
      </UserLayout>
    );
  }

  const cfg = statusConfig[campagne.statut] ?? statusConfig.brouillon;
  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const steps = sequence?.steps as SequenceStep[] ?? [];
  const reponseRate = execStats && execStats.total > 0 ? Math.round((execStats.repondu / execStats.total) * 100) : null;

  return (
    <UserLayout jarvisContext="campagne">
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={15} /> Retour aux campagnes
        </button>

        {/* ── HEADER ── */}
        <div className="card-surface p-6 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-bold text-foreground leading-snug mb-1">{campagne.nom}</h1>
              {campagne.objectif && <p className="text-sm text-muted-foreground">{campagne.objectif}</p>}
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ color: cfg.color, background: cfg.bg }}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-3">
            {campagne.canal_principal && <span className="flex items-center gap-1"><Mail size={11} /> {campagne.canal_principal}</span>}
            {campagne.mode_action && <span className="flex items-center gap-1"><Users size={11} /> {campagne.mode_action}</span>}
            <span className="flex items-center gap-1"><Clock size={11} /> Créée le {formatDate(campagne.created_at)}</span>
          </div>
        </div>

        {/* ── SÉQUENCE ── */}
        {sequence ? (
          <div className="card-surface p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-primary" />
                <h2 className="font-semibold text-foreground">Séquence automatisée</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: (seqStatusConfig[sequence.status] ?? seqStatusConfig.brouillon).color, background: `${(seqStatusConfig[sequence.status] ?? seqStatusConfig.brouillon).color}18` }}>
                  {(seqStatusConfig[sequence.status] ?? seqStatusConfig.brouillon).label}
                </span>
              </div>
              <div className="flex gap-2">
                {sequence.status !== "active" && sequence.status !== "terminee" && (
                  <button onClick={() => handleSequenceStatus("active")} disabled={seqUpdating}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    style={{ background: "hsl(var(--primary))", color: "white" }}>
                    <Play size={10} /> Activer
                  </button>
                )}
                {sequence.status === "active" && (
                  <button onClick={() => handleSequenceStatus("en_pause")} disabled={seqUpdating}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    style={{ background: "hsl(var(--accent-light))", color: "hsl(38 80% 30%)" }}>
                    <PauseCircle size={10} /> Pause
                  </button>
                )}
                {sequence.status === "en_pause" && (
                  <button onClick={() => handleSequenceStatus("active")} disabled={seqUpdating}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    style={{ background: "hsl(var(--primary))", color: "white" }}>
                    <Play size={10} /> Reprendre
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            {execStats && execStats.total > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: "Total",    value: execStats.total,    color: "hsl(var(--foreground))" },
                  { label: "En cours", value: execStats.en_cours, color: "hsl(218 72% 55%)" },
                  { label: "Répondus", value: execStats.repondu,  color: "hsl(var(--success))" },
                  { label: "Taux",     value: reponseRate !== null ? `${reponseRate}%` : "—", color: "hsl(var(--success))" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: "hsl(var(--muted))" }}>
                    <p className="text-sm font-bold" style={{ color }}>{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Steps progression */}
            {steps.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Progression par étape</p>
                {steps.map((step) => {
                  const badge = TYPE_BADGE[step.type] ?? TYPE_BADGE.email;
                  const atStep = execStats?.by_step[step.step] ?? 0;
                  const pct = execStats && execStats.total > 0 ? (atStep / execStats.total) * 100 : 0;
                  return (
                    <div key={step.step} className="rounded-xl p-3" style={{ background: "hsl(var(--muted))" }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: "hsl(var(--primary))", color: "white" }}>
                          {step.step}
                        </div>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${badge.color}22`, color: badge.color }}>
                          {badge.label}
                        </span>
                        <span className="text-xs text-muted-foreground">J+{step.delay_days}</span>
                        {step.subject && <p className="text-xs text-foreground truncate flex-1">{step.subject}</p>}
                        <span className="text-xs font-semibold shrink-0" style={{ color: "hsl(var(--primary))" }}>{atStep} contact{atStep > 1 ? "s" : ""}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: badge.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {execStats === null && (
              <div className="text-center py-4">
                <ListChecks size={20} className="mx-auto text-muted-foreground mb-1.5" />
                <p className="text-xs text-muted-foreground">Aucun contact enrôlé dans cette séquence.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="card-surface p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 size={16} className="text-primary" />
              <h2 className="font-semibold text-foreground">Séquence automatisée</h2>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted">
              <AlertCircle size={14} className="text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground mb-0.5">Aucune séquence</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cette campagne n'a pas de séquence automatisée. Vous gérez les actions manuellement.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── AIDE COPILOT ── */}
        <div className="card-surface p-5 mb-4">
          <button onClick={() => setShowCopilot(!showCopilot)} className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
                <Sparkles size={14} style={{ color: "hsl(var(--primary-foreground))" }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Améliorer cette campagne</p>
                <p className="text-xs text-muted-foreground">JARVIS peut suggérer des améliorations.</p>
              </div>
            </div>
            <ChevronRight size={15} className={`text-muted-foreground transition-transform ${showCopilot ? "rotate-90" : ""}`} />
          </button>
          {showCopilot && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex flex-wrap gap-2 mb-3">
                {["Rendre l'objectif plus clair", "Améliorer le premier message", "Que dois-je faire ensuite ?"].map(q => (
                  <Link key={q} to="/assistant" className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted text-muted-foreground hover:border-primary hover:text-foreground transition-colors">{q}</Link>
                ))}
              </div>
              <Link to="/assistant" className="btn-cta text-sm py-2.5 px-4 w-full justify-center">
                <MessageCircle size={13} /> Parler à JARVIS
              </Link>
            </div>
          )}
        </div>

        {/* ── ACTIONS CAMPAGNE ── */}
        <div className="flex gap-3 flex-wrap">
          {campagne.statut === "brouillon" && (
            <button onClick={() => handleStatusChange("en_cours")} disabled={updating} className="btn-cta text-sm py-3 flex-1 min-w-[140px]">
              {updating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Lancer la campagne
            </button>
          )}
          {campagne.statut === "en_cours" && (
            <>
              <button onClick={() => handleStatusChange("en_pause")} disabled={updating}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-colors min-w-[140px]"
                style={{ borderColor: "hsl(38 95% 52% / 0.4)", color: "hsl(38 80% 30%)", background: "hsl(var(--accent-light))" }}>
                <PauseCircle size={14} /> Mettre en pause
              </button>
              <button onClick={() => handleStatusChange("terminee")} disabled={updating}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors min-w-[140px]">
                <CheckCircle2 size={14} /> Terminer
              </button>
            </>
          )}
          {campagne.statut === "en_pause" && (
            <>
              <button onClick={() => handleStatusChange("en_cours")} disabled={updating} className="btn-cta text-sm py-3 flex-1 min-w-[140px]">
                <Play size={14} /> Reprendre
              </button>
              <button onClick={() => handleStatusChange("terminee")} disabled={updating}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                <CheckCircle2 size={14} /> Terminer
              </button>
            </>
          )}
          {campagne.statut === "terminee" && (
            <Link to="/campagnes" className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
              Retour aux campagnes
            </Link>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
