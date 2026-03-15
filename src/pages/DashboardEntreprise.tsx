/**
 * Dashboard Entreprise — React Query powered
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import UserLayout from "@/components/layout/UserLayout";
import {
  Send, ArrowRight, Zap, Loader2, Brain, ShieldAlert,
  Plus, Sparkles, Check, Phone, Mail, RefreshCw,
  CheckCircle, AlertCircle, TrendingUp, ChevronRight,
  ChevronDown, ChevronUp, CheckCircle2, Flame, Bot,
  FileText, Briefcase, Users,
} from "lucide-react";
import RoyaltyFuturesTab from "@/components/dashboard/RoyaltyFuturesTab";
import GlossaryTooltip from "@/components/ui/GlossaryTooltip";
import { useAuth } from "@/contexts/AuthContext";
import FirstIntroChecklist from "@/components/activation/FirstIntroChecklist";
import ActivationProgressBar from "@/components/activation/ActivationProgressBar";
import { useActivation } from "@/hooks/useActivation";
import OpenClawBrainWidget from "@/components/openclaw/OpenClawBrainWidget";
import { usePipelineMetrics } from "@/hooks/usePipelineMetrics";
import { useUserActions, useMarkActionDone, type UserAction } from "@/hooks/useUserActions";
import { useDashboardEntrepriseData } from "@/hooks/useDashboardEntrepriseData";
import { useSubscription, getOfferLabel } from "@/contexts/SubscriptionContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import GodModePanel from "@/components/ai/GodModePanel";

const ACTION_ICONS: Record<string, React.ElementType> = {
  appeler: Phone, envoyer: Mail, relancer: RefreshCw,
  valider: CheckCircle, verifier: AlertCircle, analyser: TrendingUp,
};
const PRIORITY_STYLES: Record<string, { label: string; style: string }> = {
  urgente: { label: "Urgent",  style: "bg-red-500/15 text-red-400 border border-red-500/25" },
  haute:   { label: "Haute",   style: "bg-orange-500/15 text-orange-400 border border-orange-500/25" },
  normale: { label: "Normale", style: "bg-primary/10 text-primary border border-primary/20" },
  basse:   { label: "Basse",   style: "bg-muted-foreground/10 text-muted-foreground border border-border" },
};

function ActionCard({ action, onDone }: { action: UserAction; onDone: (id: string) => void }) {
  const Icon = ACTION_ICONS[action.type] ?? Zap;
  const prio = PRIORITY_STYLES[action.priority] ?? PRIORITY_STYLES["normale"];
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted hover:bg-secondary transition-colors group">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--gradient-primary)" }}>
        <Icon size={13} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-sm font-medium text-foreground truncate">{action.title}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium shrink-0 ${prio.style}`}>{prio.label}</span>
        </div>
        {action.description && <p className="text-xs text-muted-foreground truncate">{action.description}</p>}
      </div>
      <button
        onClick={() => onDone(action.id)}
        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all opacity-0 group-hover:opacity-100"
        title="Marquer comme fait">
        <Check size={12} />
      </button>
    </div>
  );
}

function StatCard({ label, value, to, urgent, loading }: {
  label: React.ReactNode; value: string | number; to: string;
  urgent?: boolean; loading: boolean;
}) {
  return (
    <Link to={to}
      className="flex-1 rounded-2xl p-4 border-2 transition-all hover:shadow-md"
      style={{
        background: urgent ? "hsl(38 90% 52% / 0.08)" : "hsl(var(--card))",
        borderColor: urgent ? "hsl(38 90% 52% / 0.5)" : "hsl(var(--border))",
      }}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
      <p className="font-display font-bold text-2xl text-foreground leading-none">
        {loading ? <span className="inline-block w-10 h-6 rounded bg-muted animate-pulse" /> : value}
      </p>
      {urgent && (
        <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: "hsl(38 90% 52% / 0.15)", color: "hsl(38 90% 60%)" }}>
          <ShieldAlert size={9} /> À valider
        </span>
      )}
    </Link>
  );
}

export default function DashboardEntreprise() {
  const { user, profile } = useAuth();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [generatingLead, setGeneratingLead] = useState(false);
  // RoyaltyFuturesTab hidden for launch — re-enable post-launch
  const [activeTab] = useState<"cockpit">("cockpit");
  const queryClient = useQueryClient();

  const prenom = profile?.prenom ?? "vous";
  const { stepsCompleted, nextStep } = useActivation("entreprise");
  const metrics = usePipelineMetrics();
  const actionsQuery = useUserActions(["a_faire"]);
  const topActions = (actionsQuery.data ?? []).slice(0, 5);
  const markDone = useMarkActionDone();

  // ── React Query for all dashboard data ──────────────────────────────────────
  const { data, isLoading: loading } = useDashboardEntrepriseData(user?.id);

  const missions       = data?.missions       ?? [];
  const introductions  = data?.introductions  ?? [];
  const latestBrief    = data?.latestBrief    ?? null;
  const aiRecoCount    = data?.aiRecoCount    ?? 0;
  const gainsCount     = data?.gainsCount     ?? 0;
  const totalGains     = data?.totalGains     ?? 0;
  const leadsCount     = data?.leadsCount     ?? 0;
  const openclawReady  = data?.openclawReady  ?? false;
  const openclawLeadsThisWeek = data?.openclawLeadsThisWeek ?? 0;
  const latestAILead   = data?.latestAILead   ?? null;

  const handleMarkDone = (id: string) => {
    markDone.mutate(id, {
      onSuccess: () => toast.success("Action marquée comme terminée ✓"),
      onError:   () => toast.error("Erreur lors de la mise à jour"),
    });
  };

  // ── Generate 1 OpenClaw AI lead on demand ───────────────────────────────────
  const handleGenerateLead = async () => {
    if (!user?.id) return;
    setGeneratingLead(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/openclaw-lead-generator`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.success && json.lead) {
        toast.success(
          `🎯 Lead généré : ${json.lead.person_name} @ ${json.lead.company_name} — Score ${json.lead.ai_score}/100`
        );
        queryClient.invalidateQueries({ queryKey: ["dashboard-entreprise", user.id] });
      } else if (json.skipped) {
        toast.info(json.reason ?? "Aucun lead généré pour le moment.");
      } else {
        toast.error(json.error ?? "Erreur lors de la génération.");
      }
    } catch {
      toast.error("Erreur réseau — réessayez dans un instant.");
    } finally {
      setGeneratingLead(false);
    }
  };

  const { status: subStatus, subscribed, offerType, accessType } = useSubscription();

  const pendingIntrosCount   = introductions.filter(i => i.statut === "en_attente").length;
  const activeMissionsCount  = missions.filter(m => m.statut === "active").length;
  const isLaunchMode         = !loading && missions.length === 0;

  const heroSubtitle = aiRecoCount > 0
    ? `Prospection IA : ${aiRecoCount} action${aiRecoCount > 1 ? "s" : ""} à traiter`
    : pendingIntrosCount > 0
    ? `${pendingIntrosCount} introduction${pendingIntrosCount > 1 ? "s" : ""} en attente de validation`
    : "Tout est à jour. Créez une nouvelle mission pour activer le moteur.";

  const heroHasAction = aiRecoCount > 0 || pendingIntrosCount > 0;
  const heroActionTo  = aiRecoCount > 0 ? "/pilotage" : "/entreprise/introductions";

  return (
    <UserLayout role="entreprise" jarvisContext="dashboard-entreprise">
      <div className="max-w-2xl mx-auto space-y-5">


        {/* ═══ COCKPIT TAB ═══════════════════════════════════ */}
        {activeTab === "cockpit" && (<>
        <div className="rounded-2xl p-5 border-2"
          style={{ borderColor: "hsl(var(--accent) / 0.6)", background: "hsl(24 80% 52% / 0.06)" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-bold text-foreground text-xl leading-tight mb-1">
                Bonjour {prenom} 👋
              </h1>
              <p className={`text-sm leading-snug ${heroHasAction ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {loading ? <span className="inline-block w-48 h-4 rounded bg-muted animate-pulse" /> : heroSubtitle}
              </p>
            </div>
            {heroHasAction && !loading && (
              <Link to={heroActionTo}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--gradient-accent)" }}>
                Voir <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>

        {/* ═══ 3 STAT CARDS ═══════════════════════════════════ */}
        <div className="flex gap-3">
          <StatCard label={<GlossaryTooltip term="Mission">Missions actives</GlossaryTooltip>} value={activeMissionsCount} to="/missions" loading={loading} />
          <StatCard
            label={<GlossaryTooltip term="Introduction">Intros en attente</GlossaryTooltip>}
            value={pendingIntrosCount}
            to="/entreprise/introductions"
            urgent={pendingIntrosCount > 0}
            loading={loading}
          />
          <StatCard
            label="Gains tracés"
            value={`${totalGains.toLocaleString("fr-FR")} €`}
            to="/gains"
            loading={loading}
          />
        </div>

        {/* ═══ STATUT ABONNEMENT RÉEL ═════════════════════════ */}
        {subscribed && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border"
            style={{ background: "hsl(var(--success-light))", borderColor: "hsl(var(--success) / 0.3)" }}>
            <CheckCircle2 size={14} style={{ color: "hsl(var(--success))" }} className="shrink-0" />
            <p className="text-xs font-semibold" style={{ color: "hsl(var(--success))" }}>
              Abonnement actif — {getOfferLabel(offerType, accessType)}
            </p>
          </div>
        )}

        {/* ═══ UPSELL PRICING BANNER (non-subscribed) ══════════ */}
        {!subscribed && !loading && (
          <div
            className="rounded-2xl p-5 border-2 flex flex-col gap-4"
            style={{
              background: "linear-gradient(135deg, hsl(38 100% 52% / 0.06), hsl(24 100% 40% / 0.08))",
              borderColor: "hsl(38 100% 52% / 0.35)",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, hsl(38 100% 52%), hsl(24 100% 48%))" }}>
                <Flame size={17} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-sm leading-tight mb-1">
                  Founder Pass — 99 €/an (100 places max)
                </p>
                <p className="text-sm" style={{ color: "hsl(38 100% 65%)" }}>
                   Votre assistant IA prospecte, apporte des affaires et travaille en autonomie 24h/24.{" "}
                  <strong className="text-white">Vos gains sont versés automatiquement</strong> à chaque affaire signée.
                </p>
              </div>
            </div>
            <Link
              to="/checkout"
              className="btn-cta w-full text-center flex items-center justify-center gap-2 py-3.5 text-sm font-bold"
              onClick={() => {
                import("@/lib/landingTracking").then(({ track }) => track("cta_dashboard_activate"));
              }}
            >
              <Zap size={14} />
              Activer maintenant — 99 € TTC/an
              <ArrowRight size={14} />
            </Link>
            <p className="text-center text-xs text-muted-foreground -mt-2">
              Annulation libre · Accès immédiat · Aucun frais caché
            </p>
          </div>
        )}

        {/* ═══ GOD MODE PANEL ══════════════════════════════ */}
        {subscribed && (
          <GodModePanel contextBrief={latestBrief ? JSON.stringify(latestBrief) : undefined} />
        )}

        {/* ═══ RACCOURCIS ═════════════════════════════════════ */}
        <div className="flex flex-wrap gap-2">
          <Link to="/missions/nouvelle" className="btn-cta flex items-center gap-1.5 px-5 py-2.5 text-sm">
            <Plus size={14} /> Créer une mission
          </Link>
          <Link to="/entreprise/introductions"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors">
            <Send size={14} /> Mes introductions
          </Link>
          <Link to="/pilotage"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors">
            <Sparkles size={14} /> Mon IA
          </Link>
        </div>

        {/* ═══ LAUNCH MODE (première action suggérée) ═══════════ */}
        {isLaunchMode && (
          <div className="rounded-2xl p-5 border-2"
            style={{ borderColor: "hsl(var(--primary) / 0.5)", background: "hsl(var(--secondary))" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "var(--gradient-primary)" }}>
                <Flame size={16} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Première action suggérée</p>
                <p className="text-muted-foreground text-xs">
                  {leadsCount > 0
                    ? `OpenClaw a identifié ${leadsCount} cible${leadsCount > 1 ? "s" : ""} — consultez votre pipeline`
                    : "Créez votre première mission pour activer le réseau de facilitateurs"}
                </p>
              </div>
            </div>
            {leadsCount > 0 && (
              <Link to="/pilotage" className="btn-cta w-full text-center block py-3 text-sm mb-2">
                <Sparkles size={14} className="inline mr-1" /> Voir les cibles OpenClaw
              </Link>
            )}
            <Link to="/missions/nouvelle" className="btn-cta w-full text-center block py-3.5 text-sm">
              <Plus size={14} className="inline mr-1" /> Créer ma première mission
            </Link>
          </div>
        )}

        {/* ═══ DÉTAILS — ACCORDÉON ════════════════════════════ */}
        <div className="rounded-2xl border border-border overflow-hidden">
          <button
            onClick={() => setDetailsOpen(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
              <span className="flex items-center gap-2">
              <Brain size={15} className="text-primary" />
              Détails de mon tableau de bord
            </span>
            {detailsOpen
              ? <ChevronUp size={15} className="text-muted-foreground" />
              : <ChevronDown size={15} className="text-muted-foreground" />}
          </button>

          {detailsOpen && (
            <div className="border-t border-border divide-y divide-border">

              {/* Actions prioritaires */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <Zap size={14} className="text-primary" /> Actions prioritaires
                  </h2>
                  <Link to="/actions" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                    Tout voir <ChevronRight size={11} />
                  </Link>
                </div>
                {actionsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 size={18} className="animate-spin text-muted-foreground" />
                  </div>
                ) : topActions.length === 0 ? (
                  <div className="text-center py-5 px-4">
                    <CheckCircle size={20} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucune action urgente détectée.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topActions.map(a => <ActionCard key={a.id} action={a} onDone={handleMarkDone} />)}
                  </div>
                )}
              </div>

              {/* OpenClaw */}
              <div className="p-5">
                {/* ── OpenClaw AI Lead Counter ─────────────────────────────── */}
                {subscribed && (
                  <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border"
                    style={{ background: "hsl(218 65% 9% / 0.5)", borderColor: "hsl(218 40% 22% / 0.4)" }}>
                    <div className="flex items-center gap-2.5">
                      <Bot size={14} style={{ color: "hsl(270 80% 70%)" }} className="shrink-0" />
                      <div>
                        <p className="text-xs font-bold" style={{ color: "hsl(270 80% 80%)" }}>
                          {openclawLeadsThisWeek === 0
                            ? "OpenClaw prêt à générer des leads"
                            : `OpenClaw a généré ${openclawLeadsThisWeek} lead${openclawLeadsThisWeek > 1 ? "s" : ""} cette semaine`}
                        </p>
                        {latestAILead && (
                          <p className="text-xs text-white/40 mt-0.5">
                            Dernier : {latestAILead.person_name} @ {latestAILead.company_name}
                            {" "}— Score {latestAILead.ai_score}/100 ({latestAILead.ai_label})
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateLead}
                      disabled={generatingLead}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60"
                      style={{ background: "hsl(270 70% 55%)", color: "white" }}>
                      {generatingLead
                        ? <><Loader2 size={11} className="animate-spin" /> Génération...</>
                        : <><Sparkles size={11} /> Générer</>}
                    </button>
                  </div>
                )}

                {openclawReady ? (
                  <div className="rounded-2xl overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, hsl(218 65% 9%), hsl(218 55% 12%))",
                      border: "1px solid hsl(218 40% 22% / 0.5)",
                    }}>
                    <div className="p-4">
                      <OpenClawBrainWidget variant="entreprise" />
                    </div>
                    {aiRecoCount > 0 && (
                      <Link to="/pilotage"
                        className="flex items-center justify-between px-4 py-2.5 border-t border-white/5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2">
                          <Sparkles size={12} style={{ color: "hsl(270 80% 70%)" }} />
                          <span className="text-xs font-semibold" style={{ color: "hsl(270 80% 75%)" }}>
                            {aiRecoCount} recommandation{aiRecoCount > 1 ? "s" : ""} IA nouvelle{aiRecoCount > 1 ? "s" : ""}
                          </span>
                        </div>
                        <ArrowRight size={12} className="text-white/30" />
                      </Link>
                    )}
                    {latestBrief && (
                      <div className="px-4 py-3 border-t border-white/5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <FileText size={10} className="text-white/40" />
                          <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Dernier brief</span>
                        </div>
                        <p className="text-xs text-white/65 leading-relaxed line-clamp-2">{latestBrief.summary}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl p-5 flex items-start gap-4"
                    style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-muted">
                      <Sparkles size={16} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-0.5">Prospection IA — Bientôt disponible</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Nous préparons votre moteur de prospection. Il sera actif très prochainement.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Missions récentes */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <Briefcase size={14} className="text-primary" /> Missions récentes
                  </h2>
                  <Link to="/missions/nouvelle"
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline px-2 py-1 rounded-lg bg-primary/8 border border-primary/20">
                    <Plus size={11} /> Nouvelle
                  </Link>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={18} className="animate-spin text-muted-foreground" />
                  </div>
                ) : missions.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">Aucune mission pour l'instant.</p>
                    <Link to="/missions/nouvelle"
                      className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1">
                      <Plus size={12} /> Créer ma première mission
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {missions.map(m => (
                      <Link key={m.id} to={`/missions/${m.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-secondary transition-colors">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "var(--gradient-primary)" }}>
                          <Briefcase size={12} className="text-white" />
                        </div>
                        <p className="text-sm font-medium text-foreground flex-1 truncate">{m.titre}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                          m.statut === "active"
                            ? "bg-success/10 text-success"
                            : "bg-muted-foreground/10 text-muted-foreground"
                        }`}>
                          {m.statut === "active" ? "Active" : m.statut}
                        </span>
                      </Link>
                    ))}
                    <Link to="/missions"
                      className="flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Voir toutes les missions <ChevronRight size={11} />
                    </Link>
                  </div>
                )}
              </div>

              {/* Introductions récentes */}
              {introductions.length > 0 && (
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      <Send size={14} className="text-primary" /> Introductions récentes
                    </h2>
                    <Link to="/entreprise/introductions"
                      className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                      Voir tout <ChevronRight size={11} />
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {introductions.map(i => (
                      <div key={i.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-secondary text-foreground font-bold text-xs">
                          {i.contact_nom.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-foreground flex-1 truncate">{i.contact_nom}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                          i.statut === "validee"      ? "bg-success/10 text-success"
                          : i.statut === "en_attente" ? "bg-primary/10 text-primary"
                          : "bg-muted-foreground/10 text-muted-foreground"
                        }`}>
                          {i.statut === "validee" ? "Validée"
                            : i.statut === "en_attente" ? "En attente"
                            : (i.statut ?? "—")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invite facilitateurs */}
              {!loading && introductions.length === 0 && !isLaunchMode && (
                <div className="p-5">
                  <Link to="/facilitateurs"
                    className="flex items-center gap-3 p-4 rounded-xl bg-muted hover:bg-secondary transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "var(--gradient-primary)" }}>
                      <Users size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">Inviter des Facilitateurs</p>
                      <p className="text-xs text-muted-foreground">Parcourir les profils disponibles</p>
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                  </Link>
                </div>
              )}

              {/* Activation pipeline */}
              <div className="p-5">
                <ActivationProgressBar stepsCompleted={stepsCompleted} nextStep={nextStep} />
              </div>

              {/* Checklist */}
              {!loading && stepsCompleted < 4 && (
                <div className="p-5">
                  <FirstIntroChecklist />
                </div>
              )}
            </div>
          )}
        </div>

        </>)}
      </div>
    </UserLayout>
  );
}
