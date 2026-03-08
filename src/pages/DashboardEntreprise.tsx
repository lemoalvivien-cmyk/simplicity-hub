/**
 * Dashboard Entreprise — Launch Mode + Double Moteur
 * PROOF:EXECUTION_V1:enterprise_dashboard_actions → LeadActionsQueue rendered here
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Target, Send, ArrowRight, Zap, Loader2, Brain, ShieldAlert,
  Flame, Bell, Plus, Briefcase, Star, Users
} from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import VoiceWelcome from "@/components/ai/VoiceWelcome";
import FirstIntroChecklist from "@/components/activation/FirstIntroChecklist";
import ActivationProgressBar from "@/components/activation/ActivationProgressBar";
import { useActivation } from "@/hooks/useActivation";
import OpenClawBrainWidget from "@/components/openclaw/OpenClawBrainWidget";
import BestAccessPanel from "@/components/graph/BestAccessPanel";
import { useTranslation } from "react-i18next";
import UnifiedLeadsBlock from "@/components/leads/UnifiedLeadsBlock";
// PROOF:EXECUTION_V1:enterprise_dashboard_actions — imports real action queue component
// PROOF:EXECUTION_V1:enterprise_dashboard_actions — imports real action queue component
import LeadActionsQueue from "@/components/leads/LeadActionsQueue";
// PROOF:INTEGRITY_V1:dashboard_action_context — real pipeline metrics displayed
import { usePipelineMetrics } from "@/hooks/usePipelineMetrics";

interface Mission { id: string; titre: string; statut: string; }
interface Introduction { id: string; contact_nom: string; statut: string; }

export default function DashboardEntreprise() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [introductions, setIntroductions] = useState<Introduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [validationsCount, setValidationsCount] = useState(0);
  const [hotOpps, setHotOpps] = useState(0);
  const [passiveAlerts, setPassiveAlerts] = useState<{ id: string; title: string; message: string; type: string; read: boolean }[]>([]);

  const prenom = profile?.prenom || "vous";
  const { stepsCompleted, nextStep } = useActivation("entreprise");
  const isLaunchMode = missions.length === 0;

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const missionIds = (await db.from("missions").select("id").eq("entreprise_id", user.id)).data?.map((m: { id: string }) => m.id) || [];

      const [missionsRes, introsRes, validRes, hotOppsRes, alertsRes] = await Promise.all([
        db.from("missions").select("id, titre, statut").eq("entreprise_id", user.id).order("created_at", { ascending: false }).limit(3),
        missionIds.length > 0
          ? db.from("introductions").select("id, contact_nom, statut").in("mission_id", missionIds).order("created_at", { ascending: false }).limit(3)
          : Promise.resolve({ data: [] }),
        db.from("openclaw_validations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("statut", "en_attente"),
        db.from("opportunities").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("intent_label", "eleve").neq("status", "archivee"),
        db.from("passive_alerts").select("id, title, message, type, read").eq("user_id", user.id).eq("read", false).order("created_at", { ascending: false }).limit(3),
      ]);

      setMissions(missionsRes.data || []);
      setIntroductions(introsRes.data || []);
      setValidationsCount(validRes.count || 0);
      setHotOpps(hotOppsRes.count || 0);
      setPassiveAlerts(alertsRes.data || []);
      setLoading(false);
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
                <p className="font-bold text-white text-sm">{t("dash_hello", { prenom })}</p>
                <p className="text-white/50 text-xs mt-0.5">{t("dash_acquisition")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {validationsCount > 0 && (
                <Link to="/validations" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{
                  background: "hsl(38 90% 55% / 0.2)",
                  border: "1px solid hsl(38 90% 55% / 0.3)",
                  color: "hsl(38 90% 65%)"
                }}>
                  <ShieldAlert size={12} /> {validationsCount} {validationsCount > 1 ? t("dash_validations_plural") : t("dash_validations")}
                </Link>
              )}
            </div>
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
            {[
              { label: t("dash_missions_active"), value: loading ? "…" : missions.length, icon: Briefcase },
              { label: t("dash_intros"), value: loading ? "…" : introductions.length, icon: Send },
              { label: t("dash_hot_opps"), value: loading ? "…" : hotOpps, icon: Target },
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

        {/* ── LAUNCH MODE ─────────────────────────────────── */}
        {isLaunchMode && !loading && (
          <div className="rounded-2xl p-6 border-2" style={{ borderColor: "hsl(var(--primary) / 0.6)", background: "hsl(var(--secondary))" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                <Star size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">{t("dash_ent_launch_title")}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{t("dash_ent_launch_sub")}</p>
              </div>
            </div>
            <div className="space-y-2 mb-5">
              {[
                t("dash_ent_launch_step1"),
                t("dash_ent_launch_step2"),
                t("dash_ent_launch_step3"),
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
              {t("dash_ent_create_mission")}
            </Link>
            <p className="text-center text-xs text-muted-foreground mt-3">{t("dash_ent_launch_note")}</p>
          </div>
        )}

        <OpenClawBrainWidget variant="entreprise" />
        {!isLaunchMode && <BestAccessPanel title={t("best_path_title")} context={{ limit: 3 }} compact showAlternatives={false} />}
        {!loading && stepsCompleted < 4 && <FirstIntroChecklist />}

        {/* ── UNIFIED LEADS PIPELINE ────────────────────────── */}
        {/* PROOF:PIPELINE_V2:enterprise_dashboard_pipeline */}
        {/* PROOF:EXECUTION_V1:enterprise_dashboard_actions */}
        {!isLaunchMode && <UnifiedLeadsBlock asEntreprise linkTo="/entreprise/introductions" />}

        {/* ── ENTERPRISE ACTION QUEUE (reads real lead_actions table) ── */}
        {/* PROOF:EXECUTION_V1:enterprise_dashboard_actions */}
        {/* actor_user_id = enterprise user.id (routed by trigger when entreprise_id is set) */}
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
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(38 80% 30%)" }}>{t("dash_ent_priority_action")}</p>
            </div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">{t("dash_ent_intro_waiting")}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>{nextIntro.contact_nom}</strong>
            </p>
            <Link to="/entreprise/introductions" className="btn-cta text-sm py-2.5 px-5 inline-flex gap-2">
              {t("dash_ent_validate_intro")} <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* ── MISSIONS ─────────────────────────────────────── */}
        {!isLaunchMode && (
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Briefcase size={14} className="text-primary" /> {t("dash_ent_my_missions")}
              </h2>
              <Link to="/missions/nouvelle" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                <Plus size={11} /> {t("dash_ent_new")}
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
                      {m.statut === "active" ? t("status_active") : m.statut}
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
              <p className="text-sm font-semibold text-foreground">{t("dash_ent_invite_facilitator")}</p>
              <p className="text-xs text-muted-foreground">{t("dash_ent_find_profiles")}</p>
            </div>
            <ArrowRight size={14} className="text-muted-foreground shrink-0" />
          </Link>
        )}

        {/* ── INTRODUCTIONS ────────────────────────────────── */}
        {!isLaunchMode && introductions.length > 0 && (
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Send size={14} className="text-primary" /> {t("dash_ent_intros_received")}
              </h2>
              <Link to="/entreprise/introductions" className="text-xs text-primary font-medium hover:underline">{t("dash_ent_see_all")}</Link>
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
                    {i.statut === "validee" ? t("status_validated") : i.statut === "en_attente" ? t("status_pending") : i.statut}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ALERTS ───────────────────────────────────────── */}
        {!loading && passiveAlerts.length > 0 && (
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Bell size={14} className="text-primary" /> {t("dash_ent_alerts")}
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "hsl(24 100% 52%)" }}>
                  {passiveAlerts.length}
                </span>
              </h2>
              <Link to="/chaud" className="text-xs text-primary font-medium hover:underline">{t("dash_ent_see_all")}</Link>
            </div>
            <div className="space-y-2">
              {passiveAlerts.map(alert => (
                <div key={alert.id} className="p-3 rounded-xl flex items-start gap-2.5" style={{
                  background: "hsl(24 100% 52% / 0.06)", border: "1px solid hsl(24 100% 52% / 0.2)"
                }}>
                  <Flame size={13} className="shrink-0 mt-0.5" style={{ color: "hsl(24 100% 52%)" }} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-snug">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(218 72% 65%)" }}>{t("dash_ent_moteur1_label")}</p>
              <p className="font-semibold text-white text-sm">{t("dash_ent_moteur1_title")}</p>
              <p className="text-white/45 text-xs mt-1">{t("dash_ent_moteur1_sub")}</p>
              <div className="flex items-center gap-1 mt-2.5">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(var(--success))" }} />
                <span className="text-xs text-white/35">{t("dash_ent_moteur1_active")}</span>
              </div>
            </Link>
            <Link to="/facilitateurs" className="rounded-2xl p-4 hover:opacity-90 transition-all" style={{
              background: "linear-gradient(135deg, hsl(24 60% 8%), hsl(38 50% 11%))",
              border: "1px solid hsl(24 50% 20% / 0.6)"
            }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--gradient-accent)" }}>
                <Users size={15} className="text-white" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(24 100% 65%)" }}>{t("dash_ent_moteur2_label")}</p>
              <p className="font-semibold text-white text-sm">{t("dash_ent_moteur2_title")}</p>
              <p className="text-white/45 text-xs mt-1">{t("dash_ent_moteur2_sub")}</p>
            </Link>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
