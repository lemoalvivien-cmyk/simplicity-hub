/**
 * Dashboard Entreprise — Launch Mode + Double Moteur
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Target, Send, ArrowRight, Zap, Loader2, Brain, ShieldAlert,
  Bell, Plus, Briefcase, Star, Users, Sparkles, Rocket
} from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import VoiceWelcome from "@/components/ai/VoiceWelcome";
import FirstIntroChecklist from "@/components/activation/FirstIntroChecklist";
import ActivationProgressBar from "@/components/activation/ActivationProgressBar";
import { useActivation } from "@/hooks/useActivation";
import OpenClawBrainWidget from "@/components/openclaw/OpenClawBrainWidget";
import BestAccessPanel from "@/components/graph/BestAccessPanel";
import UnifiedLeadsBlock from "@/components/leads/UnifiedLeadsBlock";
import LeadActionsQueue from "@/components/leads/LeadActionsQueue";
import { usePipelineMetrics } from "@/hooks/usePipelineMetrics";
import ProspectionModal from "@/components/ai/ProspectionModal";
import ROIWidget from "@/components/roi/ROIWidget";

interface Mission { id: string; titre: string; statut: string; }
interface Introduction { id: string; contact_nom: string; statut: string; }

export default function DashboardEntreprise() {
  const { user, profile } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [introductions, setIntroductions] = useState<Introduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [validationsCount, setValidationsCount] = useState(0);
  const [hotOpps, setHotOpps] = useState(0);
  const [prospectionOpen, setProspectionOpen] = useState(false);

  const prenom = profile?.prenom || "vous";
  const { stepsCompleted, nextStep } = useActivation("entreprise");
  const isLaunchMode = missions.length === 0;
  const metrics = usePipelineMetrics();

  const [aiRecoCount, setAiRecoCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const missionIds = (await db.from("missions").select("id").eq("entreprise_id", user.id)).data?.map((m: { id: string }) => m.id) || [];

        const [missionsRes, introsRes, hotOppsRes, aiRecoRes] = await Promise.all([
          db.from("missions").select("id, titre, statut").eq("entreprise_id", user.id).order("created_at", { ascending: false }).limit(3),
          missionIds.length > 0
            ? db.from("introductions").select("id, contact_nom, statut").in("mission_id", missionIds).order("created_at", { ascending: false }).limit(3)
            : Promise.resolve({ data: [] }),
          db.from("lead_actions").select("id", { count: "exact", head: true }).eq("actor_user_id", user.id).eq("status", "open"),
          db.from("openclaw_recommendations")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "nouvelle")
            .eq("ai_generated", true),
        ]);

        setMissions(missionsRes.data || []);
        setIntroductions(introsRes.data || []);
        const pendingIntros = (introsRes.data || []).filter((i: { statut: string }) => i.statut === "en_attente");
        setValidationsCount(pendingIntros.length);
        setHotOpps(hotOppsRes.count || 0);
        setAiRecoCount(aiRecoRes.count || 0);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const nextIntro = introductions.find((i) => i.statut === "en_attente");

  return (
    <UserLayout role="entreprise" jarvisContext="dashboard-entreprise">
      <VoiceWelcome context="dashboard-entreprise" userName={prenom} />
      <div className="max-w-2xl mx-auto space-y-4">

        {/* ── HERO ─────────────────────────────────────────── */}
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
                <p className="text-white/50 text-xs mt-0.5">Votre acquisition client est en marche</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {aiRecoCount > 0 && (
                <Link
                  to="/agents"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold animate-pulse"
                  style={{
                    background: "hsl(270 80% 55% / 0.2)",
                    border: "1px solid hsl(270 80% 55% / 0.4)",
                    color: "hsl(270 80% 75%)",
                    animationDuration: "2.5s",
                  }}
                >
                  <Sparkles size={11} />
                  {aiRecoCount} IA
                </Link>
              )}
              {validationsCount > 0 && (
                <Link to="/entreprise/introductions" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{
                  background: "hsl(38 90% 55% / 0.2)",
                  border: "1px solid hsl(38 90% 55% / 0.3)",
                  color: "hsl(38 90% 65%)"
                }}>
                  <ShieldAlert size={12} /> {validationsCount} validation{validationsCount > 1 ? "s" : ""}
                </Link>
              )}
            </div>
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "Missions actives", value: loading ? "…" : missions.length, icon: Briefcase },
              { label: "Introductions", value: loading ? "…" : introductions.length, icon: Send },
              { label: "Actions chaudes", value: loading ? "…" : hotOpps, icon: Target },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center py-2.5 px-2 rounded-xl" style={{ background: "hsl(218 40% 16% / 0.6)" }}>
                <Icon size={12} className="mx-auto mb-1 text-white/40" />
                <p className="font-bold text-white text-lg leading-none">{value}</p>
                <p className="text-white/40 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <ActivationProgressBar stepsCompleted={stepsCompleted} nextStep={nextStep} />
        </div>

        {/* ── PROSPECTION IA ─────────────────────────────── */}
        <button
          onClick={() => setProspectionOpen(true)}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, hsl(260 80% 50%), hsl(218 80% 55%))",
            boxShadow: "0 4px 20px hsl(260 80% 50% / 0.35)",
            color: "white",
          }}
        >
          <Rocket size={16} />
          🚀 Lancer la Prospection IA
          <Sparkles size={14} className="opacity-70" />
        </button>

        {/* ── LAUNCH MODE ─────────────────────────────────── */}
        {isLaunchMode && !loading && (
          <div className="rounded-2xl p-6 border-2" style={{ borderColor: "hsl(var(--primary) / 0.6)", background: "hsl(var(--secondary))" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                <Star size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Publiez votre première mission</p>
                <p className="text-muted-foreground text-xs mt-0.5">En 3 minutes, des Facilitateurs peuvent vous apporter des clients</p>
              </div>
            </div>
            <div className="space-y-2 mb-5">
              {[
                "Décrivez le type de client que vous cherchez",
                "Définissez votre commission pour les Facilitateurs",
                "Les introductions arrivent automatiquement",
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-primary-foreground" style={{ background: "hsl(var(--primary))" }}>
                    {i + 1}
                  </div>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
            <Link to="/missions/nouvelle" className="btn-primary w-full text-center block py-3.5 text-sm">
              <Plus size={14} className="inline mr-1" />
              Créer ma première mission
            </Link>
            <p className="text-center text-xs text-muted-foreground mt-3">Prend moins de 3 minutes · Modifiable à tout moment</p>
          </div>
        )}

        <OpenClawBrainWidget variant="entreprise" />
        {!isLaunchMode && <BestAccessPanel title="Meilleur accès réseau" context={{ limit: 3 }} compact showAlternatives={false} />}
        {!loading && stepsCompleted < 4 && <FirstIntroChecklist />}

        {/* ── PIPELINE METRICS ─────────────────────────────── */}
        {!isLaunchMode && !metrics.loading && (
          <div className="rounded-xl p-3 flex items-center gap-3 flex-wrap" style={{ background: "hsl(var(--secondary))" }}>
            {metrics.openActions > 0 ? (
              <Link to="/actions" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "hsl(var(--primary))" }} />
                <span className="text-xs font-semibold text-foreground">
                  {metrics.openActions} action{metrics.openActions > 1 ? "s" : ""} à traiter
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--success))" }} />
                <span className="text-xs text-muted-foreground">Tout est traité</span>
              </div>
            )}
            {metrics.v2Opportunities > 0 && (
              <Link to="/opportunites" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <div className="w-2 h-2 rounded-full" style={{ background: "hsl(218 72% 45%)" }} />
                <span className="text-xs text-muted-foreground">{metrics.v2Opportunities} opportunités</span>
              </Link>
            )}
            {metrics.introBornOpps > 0 && (
              <div className="flex items-center gap-1.5 ml-auto">
                <div className="w-2 h-2 rounded-full" style={{ background: "hsl(220 80% 45%)" }} />
                <span className="text-xs text-muted-foreground">{metrics.introBornOpps} via intro</span>
              </div>
            )}
          </div>
        )}

        {!isLaunchMode && <UnifiedLeadsBlock asEntreprise linkTo="/entreprise/introductions" />}

        {!isLaunchMode && (
          <LeadActionsQueue
            title="Actions commerciales"
            limit={5}
            statusFilter={["open", "in_progress"]}
          />
        )}

        {/* ── PRIORITY ACTION ───────────────────────────────── */}
        {nextIntro && (
          <div className="rounded-xl border-2 p-5" style={{ borderColor: "hsl(var(--accent))", background: "hsl(var(--accent-light))" }}>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} style={{ color: "hsl(var(--accent))" }} />
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(38 80% 30%)" }}>Action prioritaire</p>
            </div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">Une introduction vous attend</h2>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>{nextIntro.contact_nom}</strong>
            </p>
            <Link to="/entreprise/introductions" className="btn-cta text-sm py-2.5 px-5 inline-flex gap-2">
              Valider l'introduction <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* ── MISSIONS ─────────────────────────────────────── */}
        {!isLaunchMode && (
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Briefcase size={14} className="text-primary" /> Mes missions
              </h2>
              <Link to="/missions/nouvelle" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                <Plus size={11} /> Nouvelle
              </Link>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-4"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="space-y-2">
                {missions.map((m) => (
                  <Link key={m.id} to={`/missions/${m.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-secondary transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                      <Briefcase size={12} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.titre}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${m.statut === "active" ? "bg-success/10 text-success" : "bg-muted-foreground/10 text-muted-foreground"}`}>
                      {m.statut === "active" ? "Active" : m.statut}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── INVITE FACILITATOR ───────────────────────────── */}
        {!isLaunchMode && introductions.length === 0 && !loading && (
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

        {/* ── INTRODUCTIONS ────────────────────────────────── */}
        {!isLaunchMode && introductions.length > 0 && (
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Send size={14} className="text-primary" /> Introductions reçues
              </h2>
              <Link to="/entreprise/introductions" className="text-xs text-primary font-medium hover:underline">Voir tout</Link>
            </div>
            <div className="space-y-2">
              {introductions.map((i) => (
                <div key={i.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-secondary text-foreground font-bold text-xs">
                    {i.contact_nom.charAt(0)}
                  </div>
                  <p className="text-sm font-medium text-foreground flex-1 truncate">{i.contact_nom}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                    i.statut === "validee" ? "bg-success/10 text-success"
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

        {/* ── ROI WIDGET ───────────────────────────────────── */}
        {!isLaunchMode && (
          <ROIWidget userId={user?.id} />
        )}

        {/* ── DOUBLE ENGINE ────────────────────────────────── */}
        {!isLaunchMode && (
          <div className="grid grid-cols-2 gap-3">
            <Link to="/agents" className="rounded-2xl p-4 hover:opacity-90 transition-all" style={{
              background: "linear-gradient(135deg, hsl(218 65% 9%), hsl(218 55% 12%))",
              border: "1px solid hsl(218 40% 22% / 0.6)"
            }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--gradient-primary)" }}>
                <Brain size={15} className="text-white" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(218 72% 65%)" }}>IA</p>
              <p className="font-semibold text-white text-sm">Agents OpenClaw</p>
              <p className="text-white/45 text-xs mt-1">Prospection automatisée</p>
              <div className="flex items-center gap-1 mt-2.5">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(var(--success))" }} />
                <span className="text-xs text-white/35">Actif</span>
              </div>
            </Link>
            <Link to="/facilitateurs" className="rounded-2xl p-4 hover:opacity-90 transition-all" style={{
              background: "linear-gradient(135deg, hsl(24 60% 8%), hsl(38 50% 11%))",
              border: "1px solid hsl(24 50% 20% / 0.6)"
            }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--gradient-accent)" }}>
                <Users size={15} className="text-white" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(24 100% 65%)" }}>Réseau</p>
              <p className="font-semibold text-white text-sm">Facilitateurs</p>
              <p className="text-white/45 text-xs mt-1">Introductions qualifiées</p>
            </Link>
          </div>
        )}
      </div>

      <ProspectionModal
        open={prospectionOpen}
        onClose={() => setProspectionOpen(false)}
        defaultCompanyName={profile?.prenom ? "" : ""}
      />
    </UserLayout>
  );
}
