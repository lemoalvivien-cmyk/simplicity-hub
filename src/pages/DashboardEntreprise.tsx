/**
 * Dashboard Entreprise — Cockpit OpenClaw
 * Blocs : Pipeline · Actions Prioritaires · Cerveau · Missions · Introductions
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Target, Send, ArrowRight, Zap, Loader2, Brain, ShieldAlert,
  Plus, Briefcase, Users, Sparkles, Check, Phone, Mail, RefreshCw,
  CheckCircle, AlertCircle, FileText, TrendingUp, ChevronRight,
} from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import FirstIntroChecklist from "@/components/activation/FirstIntroChecklist";
import ActivationProgressBar from "@/components/activation/ActivationProgressBar";
import { useActivation } from "@/hooks/useActivation";
import OpenClawBrainWidget from "@/components/openclaw/OpenClawBrainWidget";
import { usePipelineMetrics } from "@/hooks/usePipelineMetrics";
import { useUserActions, useMarkActionDone, type UserAction } from "@/hooks/useUserActions";
import { toast } from "sonner";

// ── Type helpers ──────────────────────────────────────────
interface Mission { id: string; titre: string; statut: string; }
interface Introduction { id: string; contact_nom: string; statut: string; }
interface OpenClawBrief { id: string; summary: string; created_at: string; }

// ── Action icon map ───────────────────────────────────────
const ACTION_ICONS: Record<string, React.ElementType> = {
  appeler: Phone,
  envoyer: Mail,
  relancer: RefreshCw,
  valider: CheckCircle,
  verifier: AlertCircle,
  analyser: TrendingUp,
};

const PRIORITY_STYLES: Record<string, { label: string; style: string }> = {
  urgente:  { label: "Urgent",   style: "bg-red-500/15 text-red-400 border border-red-500/25" },
  haute:    { label: "Haute",    style: "bg-orange-500/15 text-orange-400 border border-orange-500/25" },
  normale:  { label: "Normale",  style: "bg-primary/10 text-primary border border-primary/20" },
  basse:    { label: "Basse",    style: "bg-muted-foreground/10 text-muted-foreground border border-border" },
};

// ── Subcomponents ─────────────────────────────────────────

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
          <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium shrink-0 ${prio.style}`}>
            {prio.label}
          </span>
        </div>
        {action.description && (
          <p className="text-xs text-muted-foreground truncate">{action.description}</p>
        )}
      </div>
      <button
        onClick={() => onDone(action.id)}
        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all opacity-0 group-hover:opacity-100"
        title="Marquer comme fait"
      >
        <Check size={12} />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────
export default function DashboardEntreprise() {
  const { user, profile } = useAuth();
  const [missions, setMissions]         = useState<Mission[]>([]);
  const [introductions, setIntroductions] = useState<Introduction[]>([]);
  const [latestBrief, setLatestBrief]   = useState<OpenClawBrief | null>(null);
  const [aiRecoCount, setAiRecoCount]   = useState(0);
  const [gainsCount, setGainsCount]     = useState(0);
  const [leadsCount, setLeadsCount]     = useState(0);
  const [loading, setLoading]           = useState(true);

  const prenom = profile?.prenom || "vous";
  const { stepsCompleted, nextStep } = useActivation("entreprise");
  const isLaunchMode = !loading && missions.length === 0;
  const metrics = usePipelineMetrics();

  // Actions prioritaires (5 dernières "a_faire")
  const actionsQuery = useUserActions(["a_faire"]);
  const topActions = (actionsQuery.data ?? []).slice(0, 5);
  const markDone = useMarkActionDone();

  const handleMarkDone = (id: string) => {
    markDone.mutate(id, {
      onSuccess: () => toast.success("Action marquée comme terminée ✓"),
      onError: () => toast.error("Erreur lors de la mise à jour"),
    });
  };

  // Nombre d'intros en attente de validation
  const pendingIntrosCount = introductions.filter(i => i.statut === "en_attente").length;

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const missionIds =
          (await db.from("missions").select("id").eq("entreprise_id", user.id)).data?.map(
            (m: { id: string }) => m.id
          ) || [];

        const [missionsRes, introsRes, briefRes, aiRecoRes, gainsRes, leadsRes] = await Promise.all([
          // 3 dernières missions
          db.from("missions")
            .select("id, titre, statut")
            .eq("entreprise_id", user.id)
            .order("created_at", { ascending: false })
            .limit(3),

          // 3 dernières introductions
          missionIds.length > 0
            ? db.from("introductions")
                .select("id, contact_nom, statut")
                .in("mission_id", missionIds)
                .order("created_at", { ascending: false })
                .limit(3)
            : Promise.resolve({ data: [] }),

          // Dernier brief OpenClaw
          db.from("openclaw_briefs" as never)
            .select("id, summary, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1),

          // Compteur reco IA nouvelles
          db.from("openclaw_recommendations")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "nouvelle")
            .eq("ai_generated", true),

          // Gains validés
          db.from("gains")
            .select("id", { count: "exact", head: true })
            .eq("facilitateur_id", user.id)
            .in("statut", ["valide", "recu"]),

          // Leads à traiter (lead_intakes non dupliqués, non traités)
          db.from("lead_intakes")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .neq("dedup_status", "confirmed_duplicate")
            .in("qualification_status", ["pending_review", "ready_for_action"]),
        ]);

        setMissions(missionsRes.data || []);
        setIntroductions(introsRes.data || []);
        setLatestBrief((briefRes.data as OpenClawBrief[] | null)?.[0] ?? null);
        setAiRecoCount(aiRecoRes.count ?? 0);
        setGainsCount(gainsRes.count ?? 0);
        setLeadsCount(leadsRes.count ?? 0);
      } catch {
        // silent fail — dashboard must always render
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <UserLayout role="entreprise" jarvisContext="dashboard-entreprise">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* ═══ BLOC 1 — BARRE DE PIPELINE ═══════════════════ */}
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{
          background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))",
          border: "1px solid hsl(218 40% 25% / 0.5)"
        }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse 60% 80% at 80% 50%, hsl(218 72% 40% / 0.1) 0%, transparent 70%)"
          }} />
          <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                <Brain size={20} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Bonjour, {prenom} 👋</p>
                <p className="text-white/50 text-xs mt-0.5">Votre cockpit de croissance</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {aiRecoCount > 0 && (
                <Link to="/agents" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold animate-pulse"
                  style={{ background: "hsl(270 80% 55% / 0.2)", border: "1px solid hsl(270 80% 55% / 0.4)", color: "hsl(270 80% 75%)", animationDuration: "2.5s" }}>
                  <Sparkles size={11} /> {aiRecoCount} IA
                </Link>
              )}
              {pendingIntrosCount > 0 && (
                <Link to="/entreprise/introductions" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: "hsl(38 90% 55% / 0.2)", border: "1px solid hsl(38 90% 55% / 0.3)", color: "hsl(38 90% 65%)" }}>
                  <ShieldAlert size={12} /> {pendingIntrosCount} validation{pendingIntrosCount > 1 ? "s" : ""}
                </Link>
              )}
            </div>
          </div>

          {/* Compteurs pipeline cliquables */}
          <div className="relative z-10 mt-4 grid grid-cols-4 gap-2">
            <Link to="/missions" className="text-center py-2.5 px-2 rounded-xl hover:opacity-80 transition-opacity" style={{ background: "hsl(218 40% 16% / 0.6)" }}>
              <Briefcase size={12} className="mx-auto mb-1 text-white/40" />
              <p className="font-bold text-white text-lg leading-none">{loading ? "…" : missions.length}</p>
              <p className="text-white/40 text-xs mt-0.5">Missions</p>
            </Link>
            <Link to="/entreprise/introductions" className="text-center py-2.5 px-2 rounded-xl hover:opacity-80 transition-opacity" style={{ background: "hsl(218 40% 16% / 0.6)" }}>
              <Send size={12} className="mx-auto mb-1 text-white/40" />
              <p className="font-bold text-white text-lg leading-none">{loading ? "…" : pendingIntrosCount}</p>
              <p className="text-white/40 text-xs mt-0.5">En attente</p>
            </Link>
            <Link to="/gains" className="text-center py-2.5 px-2 rounded-xl hover:opacity-80 transition-opacity" style={{ background: "hsl(218 40% 16% / 0.6)" }}>
              <Target size={12} className="mx-auto mb-1 text-white/40" />
              <p className="font-bold text-white text-lg leading-none">{loading ? "…" : gainsCount}</p>
              <p className="text-white/40 text-xs mt-0.5">Gains ✓</p>
            </Link>
            <Link to="/actions" className="text-center py-2.5 px-2 rounded-xl hover:opacity-80 transition-opacity" style={{ background: "hsl(218 40% 16% / 0.6)" }}>
              <Zap size={12} className="mx-auto mb-1 text-white/40" />
              <p className="font-bold text-white text-lg leading-none">{loading ? "…" : topActions.length}</p>
              <p className="text-white/40 text-xs mt-0.5">Actions IA</p>
            </Link>
          </div>

          <ActivationProgressBar stepsCompleted={stepsCompleted} nextStep={nextStep} />
        </div>

        {/* ═══ LAUNCH MODE ════════════════════════════════════ */}
        {isLaunchMode && (
          <div className="rounded-2xl p-6 border-2" style={{ borderColor: "hsl(var(--primary) / 0.6)", background: "hsl(var(--secondary))" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Publiez votre première mission</p>
                <p className="text-muted-foreground text-xs mt-0.5">En 3 minutes, des Facilitateurs peuvent vous apporter des clients</p>
              </div>
            </div>
            <Link to="/missions/nouvelle" className="btn-primary w-full text-center block py-3.5 text-sm">
              <Plus size={14} className="inline mr-1" />
              Créer ma première mission
            </Link>
          </div>
        )}

        {/* ═══ BLOC 2 — ACTIONS PRIORITAIRES ═════════════════ */}
        <div className="card-surface p-5">
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
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={16} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Le cerveau n'a rien détecté d'urgent.</p>
              <Link to="/missions/nouvelle" className="text-xs text-primary font-medium hover:underline mt-1 block">
                Créez votre première mission →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {topActions.map((action) => (
                <ActionCard key={action.id} action={action} onDone={handleMarkDone} />
              ))}
            </div>
          )}
        </div>

        {/* ═══ BLOC 3 — CERVEAU OPENCLAW ══════════════════════ */}
        <div className="space-y-2">
          {/* Widget existant + compteur reco + brief */}
          <div className="rounded-2xl overflow-hidden" style={{
            background: "linear-gradient(135deg, hsl(218 65% 9%), hsl(218 55% 12%))",
            border: "1px solid hsl(218 40% 22% / 0.5)"
          }}>
            <div className="p-4">
              <OpenClawBrainWidget variant="entreprise" />
            </div>

            {/* Compteur reco IA */}
            {aiRecoCount > 0 && (
              <Link to="/agents" className="flex items-center justify-between px-4 py-2.5 border-t border-white/5 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <Sparkles size={12} style={{ color: "hsl(270 80% 70%)" }} />
                  <span className="text-xs font-semibold" style={{ color: "hsl(270 80% 75%)" }}>
                    {aiRecoCount} recommandation{aiRecoCount > 1 ? "s" : ""} IA nouvelle{aiRecoCount > 1 ? "s" : ""}
                  </span>
                </div>
                <ArrowRight size={12} className="text-white/30" />
              </Link>
            )}

            {/* Dernier brief */}
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
        </div>

        {/* ═══ BLOC 4 — MISSIONS RÉCENTES + CTA ══════════════ */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Briefcase size={14} className="text-primary" /> Missions récentes
            </h2>
            <Link to="/missions/nouvelle" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline px-2 py-1 rounded-lg bg-primary/8 border border-primary/20">
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
              <Link to="/missions/nouvelle" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1">
                <Plus size={12} /> Créer ma première mission
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {missions.map((m) => (
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

        {/* ═══ BLOC 5 — INTRODUCTIONS RÉCENTES ═══════════════ */}
        {introductions.length > 0 && (
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Send size={14} className="text-primary" /> Introductions récentes
              </h2>
              <Link to="/entreprise/introductions" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                Voir tout <ChevronRight size={11} />
              </Link>
            </div>
            <div className="space-y-2">
              {introductions.map((i) => (
                <div key={i.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-secondary text-foreground font-bold text-xs">
                    {i.contact_nom.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-foreground flex-1 truncate">{i.contact_nom}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                    i.statut === "validee"    ? "bg-success/10 text-success"
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

        {/* Invite facilitateurs si aucune intro */}
        {!loading && introductions.length === 0 && !isLaunchMode && (
          <Link to="/facilitateurs" className="card-surface p-4 flex items-center gap-3 hover:bg-secondary transition-colors">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
              <Users size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Inviter des Facilitateurs</p>
              <p className="text-xs text-muted-foreground">Parcourir les profils disponibles</p>
            </div>
            <ArrowRight size={14} className="text-muted-foreground shrink-0" />
          </Link>
        )}

        {/* Checklist activation */}
        {!loading && stepsCompleted < 4 && <FirstIntroChecklist />}

      </div>
    </UserLayout>
  );
}
