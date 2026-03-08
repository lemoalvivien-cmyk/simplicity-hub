/**
 * Dashboard Facilitateur — Passive-First OS + Double Moteur
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Moon, Share2, CheckCircle2, ArrowRight, Zap, Sparkles,
  Loader2, Brain, Bell, Link2, Star, Trophy, Briefcase,
  Send, HelpCircle, Flame
} from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import VoiceWelcome from "@/components/ai/VoiceWelcome";
import FirstIntroChecklist from "@/components/activation/FirstIntroChecklist";
import ActivationProgressBar from "@/components/activation/ActivationProgressBar";
import { useActivation } from "@/hooks/useActivation";
import OpenClawBrainWidget from "@/components/openclaw/OpenClawBrainWidget";
import BestAccessPanel from "@/components/graph/BestAccessPanel";
import BestOfferToPush from "@/components/passive/BestOfferToPush";
import NetworkValueMap from "@/components/passive/NetworkValueMap";
import PassiveCoachBanner from "@/components/passive/PassiveCoachBanner";
import UnifiedLeadsBlock from "@/components/leads/UnifiedLeadsBlock";
import { useTranslation } from "react-i18next";
import { formatNumber } from "@/lib/formatLocale";
import i18n from "@/lib/i18n";

interface ShareLink {
  id: string; tracking_code: string; clicks_count: number;
  unique_clicks_count: number; converted: boolean; last_click_at: string | null;
}
interface Request {
  id: string; request_context: string | null; status: string; openclaw_note: string | null;
}
interface Gain { id: string; montant: number | null; statut: string; }

export default function DashboardFacilitateur() {
  const { t } = useTranslation();
  const lang = i18n.language || "fr";
  const { user, profile } = useAuth();
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [gains, setGains] = useState<Gain[]>([]);
  const [introsCount, setIntrosCount] = useState(0);
  const [missionsCount, setMissionsCount] = useState(0);
  const [topMission, setTopMission] = useState<{ id: string; titre: string; recompense: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const prenom = profile?.prenom || "vous";
  const { stepsCompleted, nextStep } = useActivation("facilitateur");
  const isLaunchMode = introsCount === 0 && shareLinks.length === 0;

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [linksRes, reqRes, gainsRes, introsRes, missionsRes, topMissionRes] = await Promise.all([
        db.from("offer_share_links").select("id, tracking_code, clicks_count, unique_clicks_count, converted, last_click_at")
          .eq("facilitator_id", user.id).order("created_at", { ascending: false }).limit(5),
        db.from("facilitator_requests").select("id, request_context, status, openclaw_note")
          .eq("facilitator_user_id", user.id).in("status", ["envoyee", "vue"]).order("created_at", { ascending: false }).limit(3),
        db.from("gains").select("id, montant, statut").eq("facilitateur_id", user.id),
        db.from("introductions").select("id", { count: "exact", head: true }).eq("facilitateur_id", user.id),
        db.from("missions").select("id", { count: "exact", head: true }).eq("statut", "active"),
        db.from("missions").select("id, titre, recompense").eq("statut", "active").order("created_at", { ascending: false }).limit(1),
      ]);
      setShareLinks(linksRes.data || []);
      setRequests(reqRes.data || []);
      setGains(gainsRes.data || []);
      setIntrosCount(introsRes.count || 0);
      setMissionsCount(missionsRes.count || 0);
      setTopMission(topMissionRes.data?.[0] ?? null);
      setLoading(false);
    };
    load();
  }, [user]);

  const acceptRequest = async (reqId: string) => {
    setAcceptingId(reqId);
    await db.from("facilitator_requests").update({ status: "acceptee" }).eq("id", reqId);
    setRequests(prev => prev.filter(r => r.id !== reqId));
    setAcceptingId(null);
  };
  const declineRequest = async (reqId: string) => {
    await db.from("facilitator_requests").update({ status: "refusee" }).eq("id", reqId);
    setRequests(prev => prev.filter(r => r.id !== reqId));
  };
  const copyLink = (code: string) => { navigator.clipboard.writeText(`${window.location.origin}/r/${code}`); };

  const totalClicks = shareLinks.reduce((s, l) => s + (l.clicks_count || 0), 0);
  const totalValide = gains.filter(g => g.statut === "valide").reduce((s, g) => s + (g.montant || 0), 0);
  const totalAttendu = gains.filter(g => g.statut === "en_attente").reduce((s, g) => s + (g.montant || 0), 0);

  return (
    <UserLayout role="facilitateur" jarvisContext="dashboard-facilitateur">
      <VoiceWelcome context="dashboard-facilitateur" userName={prenom} />
      <div className="max-w-2xl mx-auto space-y-4">

        {/* ── HERO ─────────────────────────────────────────── */}
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{
          background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))",
          border: "1px solid hsl(218 40% 25% / 0.5)"
        }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse 70% 80% at 20% 50%, hsl(24 100% 52% / 0.06) 0%, transparent 70%)"
          }} />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                <Moon size={20} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">{t("dash_hello", { prenom })}</p>
                <p className="text-white/50 text-xs mt-0.5">{t("dash_network_works")}</p>
              </div>
            </div>
            {requests.length > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full shrink-0" style={{ background: "hsl(24 100% 52% / 0.2)", color: "hsl(24 100% 65%)" }}>
                <Bell size={10} /> {requests.length} {t("dash_fac_pending")}
              </span>
            )}
          </div>
          <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
            {[
              { label: t("dash_available_missions"), value: loading ? "…" : formatNumber(missionsCount, lang), icon: Briefcase },
              { label: t("dash_clicks"), value: loading ? "…" : formatNumber(totalClicks, lang), icon: Link2 },
              { label: t("dash_intros"), value: loading ? "…" : formatNumber(introsCount, lang), icon: Send },
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
          <div className="rounded-2xl p-6 border-2" style={{ borderColor: "hsl(var(--accent) / 0.6)", background: "linear-gradient(135deg, hsl(24 60% 8%), hsl(38 50% 10%))" }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-accent)" }}>
                <Star size={15} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">{t("dash_fac_launch_title")}</p>
                <p className="text-white/50 text-xs mt-0.5">{t("dash_fac_launch_sub")}</p>
              </div>
            </div>
            {topMission && (
              <div className="p-3 rounded-xl mb-4" style={{ background: "hsl(218 40% 14% / 0.8)" }}>
                <p className="text-xs text-white/50 mb-1">{t("dash_fac_recommended_mission")}</p>
                <p className="text-sm font-semibold text-white">{topMission.titre}</p>
                {topMission.recompense && (
                  <p className="text-xs font-bold mt-1" style={{ color: "hsl(var(--accent))" }}>{topMission.recompense}</p>
                )}
              </div>
            )}
            <div className="space-y-2 mb-4">
              {[t("dash_fac_launch_step1"), t("dash_fac_launch_step2"), t("dash_fac_launch_step3")].map((text, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white" style={{ background: "hsl(var(--accent) / 0.6)" }}>
                    {i + 1}
                  </div>
                  <p className="text-white/70 text-xs">{text}</p>
                </div>
              ))}
            </div>
            <Link to="/missions" className="btn-cta w-full text-center block py-3 text-sm">
              {t("dash_fac_see_missions")} <ArrowRight size={14} className="inline ml-1" />
            </Link>
          </div>
        )}

        <PassiveCoachBanner />
        <OpenClawBrainWidget variant="facilitateur" />
        {!isLaunchMode && <BestOfferToPush compact />}
        {!isLaunchMode && <BestAccessPanel title={t("best_path_title")} context={{ limit: 3 }} compact showAlternatives={false} />}
        {!isLaunchMode && <NetworkValueMap />}
        {!loading && stepsCompleted < 4 && <FirstIntroChecklist />}

        {/* ── VALIDATION REQUESTS ───────────────────────────── */}
        {requests.length > 0 && (
          <div className="rounded-xl border-2 p-5" style={{ borderColor: "hsl(var(--primary))", background: "hsl(var(--secondary))" }}>
            <div className="flex items-center gap-2 mb-3">
              <Bell size={14} className="text-primary" />
              <p className="text-sm font-semibold text-foreground">{t("dash_fac_validation_title")}</p>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "hsl(var(--primary))" }}>
                {requests.length}
              </span>
            </div>
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.id} className="bg-background rounded-xl p-4 space-y-3 border border-border">
                  <p className="text-sm font-medium text-foreground">{t("dash_fac_company_requests")}</p>
                  {req.openclaw_note && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "hsl(218 65% 10%)" }}>
                      <Sparkles size={11} className="text-white/60 shrink-0 mt-0.5" />
                      <p className="text-xs text-white/60">{req.openclaw_note}</p>
                    </div>
                  )}
                  {req.request_context && <p className="text-xs text-muted-foreground italic">"{req.request_context}"</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptRequest(req.id)}
                      disabled={acceptingId === req.id}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-60"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      {acceptingId === req.id ? "…" : t("dash_fac_accept")}
                    </button>
                    <button
                      onClick={() => declineRequest(req.id)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:bg-muted transition-colors"
                    >
                      {t("dash_fac_decline")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DOUBLE ENGINE ────────────────────────────────── */}
        {!isLaunchMode && (
          <div className="grid grid-cols-2 gap-3">
            <Link to="/introductions" className="rounded-2xl p-4 hover:opacity-90 transition-all" style={{
              background: "linear-gradient(135deg, hsl(24 60% 8%), hsl(38 50% 11%))",
              border: "1px solid hsl(24 50% 20% / 0.6)"
            }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--gradient-accent)" }}>
                <Send size={15} className="text-white" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(24 100% 65%)" }}>{t("dash_fac_network_label")}</p>
              <p className="font-semibold text-white text-sm">{t("dash_fac_network_title")}</p>
              <p className="text-white/45 text-xs mt-1">{t("dash_fac_network_sub")}</p>
            </Link>
            <Link to="/agents" className="rounded-2xl p-4 hover:opacity-90 transition-all" style={{
              background: "linear-gradient(135deg, hsl(218 65% 9%), hsl(218 55% 12%))",
              border: "1px solid hsl(218 40% 22% / 0.6)"
            }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--gradient-primary)" }}>
                <Brain size={15} className="text-white" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(218 72% 65%)" }}>{t("dash_fac_ia_label")}</p>
              <p className="font-semibold text-white text-sm">{t("dash_fac_ia_title")}</p>
              <p className="text-white/45 text-xs mt-1">{t("dash_fac_ia_sub")}</p>
            </Link>
          </div>
        )}

        {/* ── HEATING ──────────────────────────────────────── */}
        <Link to="/chaud" className="rounded-xl border-2 p-5 flex items-center justify-between gap-4 hover:opacity-90 transition-all" style={{
          borderColor: "hsl(24 100% 52% / 0.4)",
          background: "linear-gradient(135deg, hsl(24 80% 8%), hsl(38 70% 11%))"
        }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, hsl(24 100% 52%), hsl(38 80% 45%))" }}>
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">{t("dash_fac_heating_title")}</p>
              <p className="text-white/50 text-xs mt-0.5">{t("dash_fac_heating_sub")}</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-white/50 shrink-0" />
        </Link>

        {/* ── ACTIVE LINKS ─────────────────────────────────── */}
        {!isLaunchMode && shareLinks.length > 0 && (
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <Link2 size={14} className="text-primary" /> {t("dash_fac_links_title")}
              </h2>
              <Link to="/offres" className="text-xs text-primary font-medium hover:underline">{t("dash_fac_manage")}</Link>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: t("dash_fac_active_links"), value: shareLinks.length },
                { label: t("dash_fac_total_clicks"), value: formatNumber(totalClicks, lang) },
                { label: t("dash_fac_converted"), value: shareLinks.filter(l => l.converted).length },
              ].map(({ label, value }) => (
                <div key={label} className="text-center py-2.5 rounded-xl bg-muted">
                  <p className="font-bold text-lg text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {shareLinks.slice(0, 3).map((link) => (
                <div key={link.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-secondary transition-colors">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{
                    background: link.converted ? "hsl(var(--success-light))" : "hsl(var(--secondary))"
                  }}>
                    {link.converted
                      ? <CheckCircle2 size={13} style={{ color: "hsl(var(--success))" }} />
                      : <Link2 size={13} className="text-primary" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-muted-foreground truncate">/r/{link.tracking_code}</p>
                    <p className="text-xs text-foreground mt-0.5">{formatNumber(link.clicks_count, lang)} clics</p>
                  </div>
                  {link.converted && (
                    <span className="text-xs font-semibold shrink-0" style={{ color: "hsl(var(--success))" }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── GAINS ────────────────────────────────────────── */}
        {(totalValide > 0 || totalAttendu > 0) && (
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Trophy size={14} className="text-primary" /> {t("dash_fac_gains_title")}
              </h2>
              <Link to="/gains" className="text-xs text-primary font-medium hover:underline">{t("dash_fac_see_all_gains")}</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {totalValide > 0 && (
                <div className="p-3 rounded-xl text-center" style={{ background: "hsl(152 62% 10%)", border: "1px solid hsl(152 62% 25% / 0.3)" }}>
                  <p className="font-bold text-lg" style={{ color: "hsl(152 62% 55%)" }}>{formatNumber(totalValide, lang)} €</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("dash_fac_gains_confirmed")}</p>
                </div>
              )}
              {totalAttendu > 0 && (
                <div className="p-3 rounded-xl text-center bg-muted">
                  <p className="font-bold text-lg text-foreground">{formatNumber(totalAttendu, lang)} €</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("dash_fac_gains_pending_label")}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
