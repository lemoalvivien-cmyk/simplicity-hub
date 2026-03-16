/**
 * Dashboard Entreprise — World-class B2B SaaS UX
 * AUDIT 16/03/2026 – Suppression refs AI/OpenClaw/IA hype
 * Design: Lemlist/Apollo 2026 — mobile-first, zéro écran vide
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import UserLayout from "@/components/layout/UserLayout";
import {
  ArrowRight, Plus, Send, ChevronRight,
  CheckCircle2, Briefcase, Users, TrendingUp,
  Clock, Zap, Loader2, Flame, ChevronDown, ChevronUp,
  Check, Phone, Mail, RefreshCw, AlertCircle,
} from "lucide-react";
import GlossaryTooltip from "@/components/ui/GlossaryTooltip";
import { useAuth } from "@/contexts/AuthContext";
import FirstIntroChecklist from "@/components/activation/FirstIntroChecklist";
import ActivationProgressBar from "@/components/activation/ActivationProgressBar";
import { useActivation } from "@/hooks/useActivation";
import { usePipelineMetrics } from "@/hooks/usePipelineMetrics";
import { useUserActions, useMarkActionDone, type UserAction } from "@/hooks/useUserActions";
import { useDashboardEntrepriseData } from "@/hooks/useDashboardEntrepriseData";
import { useSubscription, getOfferLabel } from "@/contexts/SubscriptionContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const ACTION_ICONS: Record<string, React.ElementType> = {
  appeler: Phone, envoyer: Mail, relancer: RefreshCw,
  valider: CheckCircle2, verifier: AlertCircle, analyser: TrendingUp,
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
      <button onClick={() => onDone(action.id)}
        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all opacity-0 group-hover:opacity-100"
        title="Marquer comme fait"><Check size={12} /></button>
    </div>
  );
}

// ── Metric Card ────────────────────────────────────────────────────────────────
function MetricCard({ label, value, to, urgent, loading }: {
  label: React.ReactNode; value: string | number; to: string; urgent?: boolean; loading: boolean;
}) {
  return (
    <Link to={to}
      className="flex-1 rounded-2xl p-4 border-2 transition-all hover:shadow-md min-w-0"
      style={{
        background: urgent ? "hsl(38 90% 52% / 0.08)" : "hsl(var(--card))",
        borderColor: urgent ? "hsl(38 90% 52% / 0.5)" : "hsl(var(--border))",
      }}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 truncate">{label}</p>
      <p className="font-display font-bold text-2xl text-foreground leading-none">
        {loading ? <span className="inline-block w-10 h-6 rounded bg-muted animate-pulse" /> : value}
      </p>
      {urgent && typeof value === "number" && value > 0 && !loading && (
        <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: "hsl(38 90% 52% / 0.15)", color: "hsl(38 90% 60%)" }}>
          <AlertCircle size={9} /> À valider
        </span>
      )}
    </Link>
  );
}

// ── Mission Card ───────────────────────────────────────────────────────────────
interface Mission { id: string; titre: string; statut: string | null; secteur?: string | null; }

function MissionCard({ m }: { m: Mission }) {
  return (
    <Link to={`/missions/${m.id}`}
      className="flex items-center gap-3 p-3.5 rounded-xl border border-border hover:border-primary/40 bg-muted hover:bg-secondary transition-all group">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "var(--gradient-primary)" }}>
        <Briefcase size={14} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{m.titre}</p>
        {m.secteur && <p className="text-xs text-muted-foreground mt-0.5">{m.secteur}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
          m.statut === "active" ? "bg-green-500/10 text-green-500" : "bg-muted-foreground/10 text-muted-foreground"
        }`}>
          {m.statut === "active" ? "Active" : (m.statut ?? "—")}
        </span>
        <ArrowRight size={13} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}

// ── Intro Row ──────────────────────────────────────────────────────────────────
interface Intro { id: string; contact_nom: string; statut: string | null; }

function IntroRow({ i }: { i: Intro }) {
  const statusStyle = i.statut === "validee"
    ? "bg-green-500/10 text-green-500"
    : i.statut === "en_attente"
    ? "bg-amber-500/10 text-amber-500"
    : "bg-muted-foreground/10 text-muted-foreground";
  const statusLabel = i.statut === "validee" ? "Validée"
    : i.statut === "en_attente" ? "En attente"
    : (i.statut ?? "—");
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted border border-transparent hover:border-border transition-colors">
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs"
        style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))" }}>
        {i.contact_nom.charAt(0).toUpperCase()}
      </div>
      <p className="text-sm font-medium text-foreground flex-1 truncate">{i.contact_nom}</p>
      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${statusStyle}`}>{statusLabel}</span>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function DashboardEntreprise() {
  const { user, profile } = useAuth();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const queryClient = useQueryClient();

  const prenom = profile?.prenom ?? "vous";
  const { stepsCompleted, nextStep } = useActivation("entreprise");
  const actionsQuery = useUserActions(["a_faire"]);
  const topActions = (actionsQuery.data ?? []).slice(0, 3);
  const markDone = useMarkActionDone();

  const { data, isLoading: loading } = useDashboardEntrepriseData(user?.id);

  const missions      = data?.missions      ?? [];
  const introductions = data?.introductions ?? [];

  const handleMarkDone = (id: string) => {
    markDone.mutate(id, {
      onSuccess: () => toast.success("Action marquée comme terminée ✓"),
      onError:   () => toast.error("Erreur lors de la mise à jour"),
    });
  };

  const { subscribed, offerType, accessType } = useSubscription();

  const pendingIntrosCount  = introductions.filter(i => i.statut === "en_attente").length;
  const activeMissionsCount = missions.filter(m => m.statut === "active").length;
  const isEmpty             = !loading && missions.length === 0;

  // Hero subtitle contextuel
  const heroSubtitle = pendingIntrosCount > 0
    ? `${pendingIntrosCount} introduction${pendingIntrosCount > 1 ? "s" : ""} en attente de validation`
    : activeMissionsCount > 0
    ? `${activeMissionsCount} mission${activeMissionsCount > 1 ? "s" : ""} active${activeMissionsCount > 1 ? "s" : ""} — votre réseau travaille pour vous`
    : "Créez votre première mission pour activer le réseau.";

  return (
    <UserLayout role="entreprise" jarvisContext="dashboard-entreprise">
      <div className="max-w-2xl mx-auto space-y-4 pb-8">

        {/* ══════════════════════════════════════════════════
            COCKPIT HERO
        ══════════════════════════════════════════════════ */}
        <div className="rounded-2xl p-5 border-2"
          style={{ borderColor: "hsl(var(--accent) / 0.6)", background: "hsl(24 80% 52% / 0.06)" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-bold text-foreground text-xl leading-tight mb-1">
                Bonjour {prenom} 👋
              </h1>
              <p className={`text-sm leading-snug ${pendingIntrosCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {loading
                  ? <span className="inline-block w-52 h-4 rounded bg-muted animate-pulse" />
                  : heroSubtitle}
              </p>
            </div>
            {pendingIntrosCount > 0 && !loading && (
              <Link to="/entreprise/introductions"
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--gradient-accent)" }}>
                Valider <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {/* Abonnement badge */}
          {subscribed && (
            <div className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg border w-fit"
              style={{ background: "hsl(152 62% 38% / 0.1)", borderColor: "hsl(152 62% 38% / 0.3)" }}>
              <CheckCircle2 size={12} style={{ color: "hsl(152 62% 50%)" }} />
              <p className="text-xs font-semibold" style={{ color: "hsl(152 62% 55%)" }}>
                {getOfferLabel(offerType, accessType)} — actif
              </p>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════
            MÉTRIQUES 3 CARDS
        ══════════════════════════════════════════════════ */}
        <div className="flex gap-3">
          <MetricCard
            label={<GlossaryTooltip term="Mission">Missions actives</GlossaryTooltip>}
            value={activeMissionsCount}
            to="/missions"
            loading={loading}
          />
          <MetricCard
            label={<GlossaryTooltip term="Introduction">Intros reçues</GlossaryTooltip>}
            value={pendingIntrosCount}
            to="/entreprise/introductions"
            urgent={pendingIntrosCount > 0}
            loading={loading}
          />
          <MetricCard
            label="Facilitateurs"
            value="Explorer →"
            to="/facilitateurs"
            loading={loading}
          />
        </div>

        {/* ══════════════════════════════════════════════════
            UPSELL (non-subscribed uniquement)
        ══════════════════════════════════════════════════ */}
        {!subscribed && !loading && (
          <div className="rounded-2xl p-5 border-2 flex flex-col gap-4"
            style={{
              background: "linear-gradient(135deg, hsl(38 100% 52% / 0.06), hsl(24 100% 40% / 0.08))",
              borderColor: "hsl(38 100% 52% / 0.35)",
            }}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, hsl(38 100% 52%), hsl(24 100% 48%))" }}>
                <Flame size={17} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-sm leading-tight mb-1">
                  Founder Pass — 99 €/an · 100 places max
                </p>
                <p className="text-sm text-muted-foreground">
                  Accès complet : missions illimitées, introductions traçées, gains automatiques.{" "}
                  <strong className="text-foreground">Vous ne payez que si ça marche.</strong>
                </p>
              </div>
            </div>
            <Link to="/checkout"
              className="btn-cta w-full text-center flex items-center justify-center gap-2 py-3.5 text-sm font-bold"
              onClick={() => import("@/lib/landingTracking").then(({ track }) => track("cta_dashboard_activate"))}>
              <Zap size={14} />
              Activer maintenant — 99 € TTC/an
              <ArrowRight size={14} />
            </Link>
            <p className="text-center text-xs text-muted-foreground -mt-2">
              Annulation libre · Accès immédiat · Aucun frais caché
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            RACCOURCIS RAPIDES
        ══════════════════════════════════════════════════ */}
        <div className="flex flex-wrap gap-2">
          <Link to="/missions/nouvelle" className="btn-cta flex items-center gap-1.5 px-5 py-2.5 text-sm">
            <Plus size={14} /> Créer une mission
          </Link>
          <Link to="/entreprise/introductions"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors">
            <Send size={14} /> Mes introductions
          </Link>
          <Link to="/facilitateurs"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors">
            <Users size={14} /> Facilitateurs
          </Link>
        </div>

        {/* ══════════════════════════════════════════════════
            MES MISSIONS — toujours visible (seed = jamais vide)
        ══════════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Briefcase size={14} className="text-primary" /> Mes missions
            </h2>
            <Link to="/missions/nouvelle"
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.2)" }}>
              <Plus size={11} /> Nouvelle
            </Link>
          </div>
          <div className="p-4 space-y-2">
            {loading ? (
              [0, 1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)
            ) : isEmpty ? (
              <div className="text-center py-8">
                <Briefcase size={28} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">Aucune mission pour l'instant</p>
                <p className="text-xs text-muted-foreground mb-4">Créez votre première mission pour que les facilitateurs vous contactent.</p>
                <Link to="/missions/nouvelle"
                  className="btn-cta inline-flex items-center gap-2 px-6 py-2.5 text-sm">
                  <Plus size={13} /> Créer ma première mission
                </Link>
              </div>
            ) : (
              <>
                {missions.slice(0, 3).map(m => <MissionCard key={m.id} m={m} />)}
                {missions.length > 3 && (
                  <Link to="/missions"
                    className="flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Voir toutes les missions ({missions.length}) <ChevronRight size={11} />
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            INTRODUCTIONS RÉCENTES
        ══════════════════════════════════════════════════ */}
        {(introductions.length > 0 || !isEmpty) && (
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
              <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Send size={14} className="text-primary" /> Introductions reçues
                {pendingIntrosCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                    style={{ background: "hsl(38 95% 52%)" }}>
                    {pendingIntrosCount}
                  </span>
                )}
              </h2>
              <Link to="/entreprise/introductions"
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                Toutes <ChevronRight size={11} />
              </Link>
            </div>
            <div className="p-4 space-y-2">
              {loading ? (
                [0, 1].map(i => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)
              ) : introductions.length === 0 ? (
                <div className="text-center py-6">
                  <Send size={22} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune introduction reçue pour l'instant.</p>
                  <p className="text-xs text-muted-foreground mt-1">Les facilitateurs vous contacteront dès qu'une opportunité correspond à vos missions.</p>
                </div>
              ) : (
                introductions.slice(0, 4).map(i => <IntroRow key={i.id} i={i} />)
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            ACCORDÉON DÉTAILS (actions + activation)
        ══════════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-border overflow-hidden">
          <button onClick={() => setDetailsOpen(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
            <span className="flex items-center gap-2">
              <TrendingUp size={15} className="text-primary" />
              Pilotage & suivi
            </span>
            {detailsOpen
              ? <ChevronUp size={15} className="text-muted-foreground" />
              : <ChevronDown size={15} className="text-muted-foreground" />}
          </button>

          {detailsOpen && (
            <div className="border-t border-border divide-y divide-border">

              {/* Actions prioritaires */}
              {topActions.length > 0 && (
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      <Zap size={14} className="text-primary" /> Actions à faire
                    </h3>
                    <Link to="/actions" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                      Tout voir <ChevronRight size={11} />
                    </Link>
                  </div>
                  {actionsQuery.isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 size={18} className="animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {topActions.map(a => <ActionCard key={a.id} action={a} onDone={handleMarkDone} />)}
                    </div>
                  )}
                </div>
              )}

              {/* Activation pipeline */}
              <div className="p-5">
                <ActivationProgressBar stepsCompleted={stepsCompleted} nextStep={nextStep} />
              </div>

              {/* Checklist première intro */}
              {!loading && stepsCompleted < 4 && (
                <div className="p-5">
                  <FirstIntroChecklist />
                </div>
              )}

              {/* Inviter facilitateurs */}
              <div className="p-5">
                <Link to="/facilitateurs"
                  className="flex items-center gap-3 p-4 rounded-xl bg-muted hover:bg-secondary transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--gradient-primary)" }}>
                    <Users size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Explorer les Facilitateurs</p>
                    <p className="text-xs text-muted-foreground">Parcourir les profils disponibles dans votre secteur</p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </UserLayout>
  );
}
