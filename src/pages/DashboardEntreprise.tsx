/**
 * Dashboard Entreprise — Hero + 3 stats + raccourcis + détails accordéon
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Target, Send, ArrowRight, Zap, Loader2, Brain, ShieldAlert,
  Plus, Briefcase, Users, Sparkles, Check, Phone, Mail, RefreshCw,
  CheckCircle, AlertCircle, FileText, TrendingUp, ChevronRight,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { db } from "@/lib/supabase";
import GlossaryTooltip from "@/components/ui/GlossaryTooltip";
import { useAuth } from "@/contexts/AuthContext";
import FirstIntroChecklist from "@/components/activation/FirstIntroChecklist";
import ActivationProgressBar from "@/components/activation/ActivationProgressBar";
import { useActivation } from "@/hooks/useActivation";
import OpenClawBrainWidget from "@/components/openclaw/OpenClawBrainWidget";
import { usePipelineMetrics } from "@/hooks/usePipelineMetrics";
import { useUserActions, useMarkActionDone, type UserAction } from "@/hooks/useUserActions";
import { toast } from "sonner";

interface Mission { id: string; titre: string; statut: string; }
interface Introduction { id: string; contact_nom: string; statut: string; }
interface OpenClawBrief { id: string; summary: string; created_at: string; }

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
  const prio = PRIORITY_STYLES[action.priority] ?? PRIORITY_STYLES.normale;
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
  const [missions, setMissions]           = useState<Mission[]>([]);
  const [introductions, setIntroductions] = useState<Introduction[]>([]);
  const [latestBrief, setLatestBrief]     = useState<OpenClawBrief | null>(null);
  const [aiRecoCount, setAiRecoCount]     = useState(0);
  const [gainsCount, setGainsCount]       = useState(0);
  const [leadsCount, setLeadsCount]       = useState(0);
  const [totalGains, setTotalGains]       = useState(0);
  const [loading, setLoading]             = useState(true);
  const [detailsOpen, setDetailsOpen]     = useState(false);
  const [openclawReady, setOpenclawReady] = useState(false);

  const prenom = profile?.prenom || "vous";
  const { stepsCompleted, nextStep } = useActivation("entreprise");
  const metrics = usePipelineMetrics();
  const actionsQuery = useUserActions(["a_faire"]);
  const topActions = (actionsQuery.data ?? []).slice(0, 5);
  const markDone = useMarkActionDone();

  const handleMarkDone = (id: string) => {
    markDone.mutate(id, {
      onSuccess: () => toast.success("Action marquée comme terminée ✓"),
      onError:   () => toast.error("Erreur lors de la mise à jour"),
    });
  };

  const pendingIntrosCount = introductions.filter(i => i.statut === "en_attente").length;
  const activeMissionsCount = missions.filter(m => m.statut === "active").length;

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const missionIds =
          (await db.from("missions").select("id").eq("entreprise_id", user.id)).data?.map((m: { id: string }) => m.id) || [];

        const [missionsRes, introsRes, briefRes, aiRecoRes, gainsRes, gainsValRes, leadsRes, configRes] = await Promise.all([
          db.from("missions").select("id, titre, statut").eq("entreprise_id", user.id).order("created_at", { ascending: false }).limit(3),
          missionIds.length > 0
            ? db.from("introductions").select("id, contact_nom, statut").in("mission_id", missionIds).order("created_at", { ascending: false }).limit(3)
            : Promise.resolve({ data: [] }),
          db.from("openclaw_briefs" as never).select("id, summary, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
          db.from("openclaw_recommendations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "nouvelle").eq("ai_generated", true),
          db.from("gains").select("id", { count: "exact", head: true }).eq("facilitateur_id", user.id).in("statut", ["valide", "recu"]),
          db.from("gains").select("montant").eq("facilitateur_id", user.id).in("statut", ["valide", "recu"]),
          db.from("lead_intakes").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("dedup_status", "confirmed_duplicate").in("qualification_status", ["pending_review", "ready_for_action"]),
          db.from("openclaw_config").select("gateway_url, is_connected").eq("user_id", user.id).maybeSingle(),
        ]);

        setMissions(missionsRes.data || []);
        setIntroductions(introsRes.data || []);
        setLatestBrief((briefRes.data as OpenClawBrief[] | null)?.[0] ?? null);
        setAiRecoCount(aiRecoRes.count ?? 0);
        setGainsCount(gainsRes.count ?? 0);
        setTotalGains(((gainsValRes.data || []) as { montant: number | null }[]).reduce((s, g) => s + (g.montant || 0), 0));
        setLeadsCount(leadsRes.count ?? 0);
        const cfg = configRes.data as { gateway_url: string | null; is_connected: boolean } | null;
        setOpenclawReady(!!cfg?.gateway_url && cfg.is_connected === true);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const isLaunchMode = !loading && missions.length === 0;

  /* ─── Hero subtitle ──────────────────────────────── */
  const heroSubtitle = aiRecoCount > 0
    ? `KITT IA recommande : ${aiRecoCount} action${aiRecoCount > 1 ? "s" : ""} prioritaire${aiRecoCount > 1 ? "s" : ""}`
    : pendingIntrosCount > 0
    ? `${pendingIntrosCount} introduction${pendingIntrosCount > 1 ? "s" : ""} en attente de validation`
    : "Tout est à jour. Créez une nouvelle mission pour activer le moteur.";

  const heroHasAction = aiRecoCount > 0 || pendingIntrosCount > 0;
  const heroActionTo  = aiRecoCount > 0 ? "/pilotage" : "/entreprise/introductions";

  return (
    <UserLayout role="entreprise" jarvisContext="dashboard-entreprise">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ═══ HERO ═══════════════════════════════════════════ */}
        <div className="rounded-2xl p-5 border-2"
          style={{
            borderColor: "hsl(var(--accent) / 0.6)",
            background: "hsl(24 80% 52% / 0.06)",
          }}>
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

        {/* ═══ RACCOURCIS ═════════════════════════════════════ */}
        <div className="flex flex-wrap gap-2">
          <Link to="/missions/nouvelle"
            className="btn-cta flex items-center gap-1.5 px-5 py-2.5 text-sm">
            <Plus size={14} /> Créer une mission
          </Link>
          <Link to="/entreprise/introductions"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors">
            <Send size={14} /> Mes introductions
          </Link>
          <Link to="/pilotage"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors">
            <Sparkles size={14} /> Parler à KITT IA
          </Link>
        </div>

        {/* ═══ LAUNCH MODE ════════════════════════════════════ */}
        {isLaunchMode && (
          <div className="rounded-2xl p-5 border-2" style={{ borderColor: "hsl(var(--primary) / 0.5)", background: "hsl(var(--secondary))" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Publiez votre première mission</p>
                <p className="text-muted-foreground text-xs">En 3 minutes, des facilitateurs peuvent vous apporter des clients</p>
              </div>
            </div>
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
              <GlossaryTooltip term="Cockpit">Détails du cockpit</GlossaryTooltip>
            </span>
            {detailsOpen ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
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
                  <div className="flex items-center justify-center py-6"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
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
                {openclawReady ? (
                  <div className="rounded-2xl overflow-hidden" style={{
                    background: "linear-gradient(135deg, hsl(218 65% 9%), hsl(218 55% 12%))",
                    border: "1px solid hsl(218 40% 22% / 0.5)"
                  }}>
                    <div className="p-4">
                      <OpenClawBrainWidget variant="entreprise" />
                    </div>
                    {aiRecoCount > 0 && (
                      <Link to="/pilotage" className="flex items-center justify-between px-4 py-2.5 border-t border-white/5 hover:bg-white/5 transition-colors">
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
                    style={{
                      background: "hsl(var(--secondary))",
                      border: "1px solid hsl(var(--border))",
                    }}>
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
                  <Link to="/missions/nouvelle" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline px-2 py-1 rounded-lg bg-primary/8 border border-primary/20">
                    <Plus size={11} /> Nouvelle
                  </Link>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-4"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
                ) : missions.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">Aucune mission pour l'instant.</p>
                    <Link to="/missions/nouvelle" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1">
                      <Plus size={12} /> Créer ma première mission
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {missions.map(m => (
                      <Link key={m.id} to={`/missions/${m.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-secondary transition-colors">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                          <Briefcase size={12} className="text-white" />
                        </div>
                        <p className="text-sm font-medium text-foreground flex-1 truncate">{m.titre}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                          m.statut === "active" ? "bg-success/10 text-success" : "bg-muted-foreground/10 text-muted-foreground"
                        }`}>
                          {m.statut === "active" ? "Active" : m.statut}
                        </span>
                      </Link>
                    ))}
                    <Link to="/missions" className="flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
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
                    <Link to="/entreprise/introductions" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
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
                          i.statut === "validee"     ? "bg-success/10 text-success"
                          : i.statut === "en_attente" ? "bg-primary/10 text-primary"
                          : "bg-muted-foreground/10 text-muted-foreground"
                        }`}>
                          {i.statut === "validee" ? "Validée" : i.statut === "en_attente" ? "En attente" : i.statut}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invite facilitateurs */}
              {!loading && introductions.length === 0 && !isLaunchMode && (
                <div className="p-5">
                  <Link to="/facilitateurs" className="flex items-center gap-3 p-4 rounded-xl bg-muted hover:bg-secondary transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
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

      </div>
    </UserLayout>
  );
}
