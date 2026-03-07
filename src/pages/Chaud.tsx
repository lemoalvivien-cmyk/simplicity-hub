/**
 * Chaud — Inbox des leads chauds et signaux passifs
 * "Ce qui chauffe. Ce qui rapporte. Ce qu'il faut faire maintenant."
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Flame, TrendingUp, ArrowRight, Sparkles, Loader2,
  Link2, Target, CheckCircle2, Clock, Zap, Brain,
  Copy, ChevronRight, AlertCircle, BarChart3
} from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface HotLink {
  id: string;
  tracking_code: string;
  clicks_count: number;
  unique_clicks_count: number;
  qualified_interest_count: number;
  opportunity_count: number;
  converted: boolean;
  last_click_at: string | null;
  offer_id: string | null;
  heat_score: number;
}

interface QualifiedInterest {
  id: string;
  share_link_id: string;
  click_count: number;
  status: string;
  created_at: string;
  offer_id: string | null;
}

interface PassiveAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  read: boolean;
  priority: string;
  created_at: string;
}

interface Opportunity {
  id: string;
  company_name: string;
  summary: string;
  origin: string;
  status: string;
  intent_label: string;
  created_at: string;
}

const SIGNAL_STAGES = [
  { key: "vu", label: "Vu", color: "hsl(var(--muted-foreground))", desc: "Lien partagé" },
  { key: "clique", label: "Cliqué", color: "hsl(218 72% 55%)", desc: "Au moins 1 clic" },
  { key: "signal", label: "Signal détecté", color: "hsl(38 80% 40%)", desc: "3+ clics uniques" },
  { key: "interet", label: "Intérêt qualifié", color: "hsl(24 100% 52%)", desc: "Intérêt réel" },
  { key: "opportunite", label: "Opportunité", color: "hsl(152 62% 35%)", desc: "Créée" },
  { key: "gain", label: "Gain possible", color: "hsl(152 62% 30%)", desc: "À convertir" },
];

function HeatBar({ score }: { score: number }) {
  const color = score >= 70 ? "hsl(24 100% 52%)" : score >= 40 ? "hsl(38 80% 40%)" : "hsl(218 72% 55%)";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>{score}°</span>
    </div>
  );
}

function AlertCard({ alert, onRead }: { alert: PassiveAlert; onRead: (id: string) => void }) {
  const icons: Record<string, JSX.Element> = {
    offer_heating: <Flame size={14} style={{ color: "hsl(24 100% 52%)" }} />,
    link_performing: <BarChart3 size={14} style={{ color: "hsl(218 72% 55%)" }} />,
    interest_detected: <Zap size={14} style={{ color: "hsl(38 80% 40%)" }} />,
    opportunity_born: <Target size={14} style={{ color: "hsl(152 62% 35%)" }} />,
    validation_urgent: <AlertCircle size={14} style={{ color: "hsl(var(--destructive))" }} />,
  };
  const icon = icons[alert.type] || <Sparkles size={14} className="text-primary" />;
  const bgColor = alert.priority === "haute" ? "hsl(24 100% 52% / 0.08)" : "hsl(var(--muted) / 0.4)";
  const borderColor = alert.priority === "haute" ? "hsl(24 100% 52% / 0.3)" : "hsl(var(--border))";

  return (
    <div
      className={`p-3 rounded-xl border cursor-pointer transition-all ${!alert.read ? "opacity-100" : "opacity-60"}`}
      style={{ background: bgColor, borderColor }}
      onClick={() => !alert.read && onRead(alert.id)}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug">{alert.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
        </div>
        {!alert.read && (
          <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: "hsl(24 100% 52%)" }} />
        )}
      </div>
    </div>
  );
}

export default function Chaud() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hotLinks, setHotLinks] = useState<HotLink[]>([]);
  const [interests, setInterests] = useState<QualifiedInterest[]>([]);
  const [alerts, setAlerts] = useState<PassiveAlert[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"alertes" | "liens" | "interets" | "opps">("alertes");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [linksRes, interestsRes, alertsRes, oppsRes] = await Promise.all([
        db.from("offer_share_links")
          .select("id, tracking_code, clicks_count, unique_clicks_count, qualified_interest_count, opportunity_count, converted, last_click_at, offer_id")
          .eq("facilitator_id", user.id)
          .order("clicks_count", { ascending: false })
          .limit(20),
        db.from("qualified_interests")
          .select("id, share_link_id, click_count, status, created_at, offer_id")
          .eq("facilitator_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        db.from("passive_alerts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        db.from("opportunities")
          .select("id, company_name, summary, origin, status, intent_label, created_at")
          .eq("user_id", user.id)
          .in("origin", ["diffusion_passive", "lien_traque"])
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      // Compute heat scores
      const links: HotLink[] = (linksRes.data || []).map((l: {
        id: string; tracking_code: string; clicks_count: number;
        unique_clicks_count: number; qualified_interest_count: number;
        opportunity_count: number; converted: boolean; last_click_at: string | null; offer_id: string | null;
      }) => {
        const recency = l.last_click_at
          ? Math.max(0, 100 - Math.floor((Date.now() - new Date(l.last_click_at).getTime()) / (1000 * 60 * 60 * 24)) * 5)
          : 0;
        const heat_score = Math.min(100, Math.round(
          (l.clicks_count || 0) * 3 +
          (l.unique_clicks_count || 0) * 5 +
          (l.qualified_interest_count || 0) * 15 +
          (l.opportunity_count || 0) * 20 +
          (l.converted ? 30 : 0) +
          recency * 0.3
        ));
        return { ...l, heat_score };
      }).sort((a, b) => b.heat_score - a.heat_score);

      setHotLinks(links);
      setInterests(interestsRes.data || []);
      setAlerts(alertsRes.data || []);
      setOpportunities(oppsRes.data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const markAlertRead = async (id: string) => {
    await db.from("passive_alerts").update({ read: true }).eq("id", id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/r/${code}`);
    toast({ title: "Lien copié ✓" });
  };

  const unreadAlerts = alerts.filter(a => !a.read).length;
  const hotLinksAboveThreshold = hotLinks.filter(l => l.heat_score >= 20).length;
  const totalInterests = hotLinks.reduce((s, l) => s + (l.qualified_interest_count || 0), 0);

  return (
    <UserLayout role="facilitateur" jarvisContext="chaud">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── HERO ─────────────────────────────────────────── */}
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{
          background: "linear-gradient(135deg, hsl(24 80% 8%), hsl(38 70% 11%))",
          border: "1px solid hsl(38 80% 30% / 0.4)"
        }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse 80% 60% at 15% 50%, hsl(24 100% 52% / 0.10) 0%, transparent 60%)"
          }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, hsl(24 100% 52%), hsl(38 80% 45%))" }}>
                <Flame size={20} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(38 80% 65%)" }}>Ce qui chauffe</span>
                  {unreadAlerts > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white"
                      style={{ background: "hsl(24 100% 52%)" }}>
                      {unreadAlerts} nouveau{unreadAlerts > 1 ? "x" : ""}
                    </span>
                  )}
                </div>
                <h1 className="font-display text-xl font-bold text-white">Voici ce qui rapporte vraiment.</h1>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Liens actifs", value: hotLinksAboveThreshold, color: "hsl(218 72% 60%)" },
                { label: "Intérêts qualifiés", value: totalInterests, color: "hsl(24 100% 62%)" },
                { label: "Opportunités", value: opportunities.length, color: "hsl(152 62% 55%)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center py-2.5 rounded-xl" style={{ background: "hsl(24 30% 14% / 0.7)" }}>
                  <p className="font-bold text-white text-xl leading-none">{value}</p>
                  <p className="text-xs mt-0.5" style={{ color }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── PIPELINE VISUEL ──────────────────────────────── */}
        <div className="card-surface p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Progression du signal</p>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {SIGNAL_STAGES.map((stage, i) => (
              <div key={stage.key} className="flex items-center gap-1 shrink-0">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
                  <p className="text-xs font-medium whitespace-nowrap" style={{ color: stage.color, fontSize: "10px" }}>
                    {stage.label}
                  </p>
                </div>
                {i < SIGNAL_STAGES.length - 1 && (
                  <div className="w-4 h-px mx-1 shrink-0" style={{ background: "hsl(var(--border))" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── ONGLETS ──────────────────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted">
          {([
            { key: "alertes", label: `Alertes${unreadAlerts > 0 ? ` (${unreadAlerts})` : ""}` },
            { key: "liens", label: `Liens chauds (${hotLinks.filter(l => l.heat_score >= 20).length})` },
            { key: "interets", label: `Intérêts (${totalInterests})` },
            { key: "opps", label: `Opportunités (${opportunities.length})` },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key as typeof tab)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${tab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* ── ALERTES ────────────────────────────────────── */}
            {tab === "alertes" && (
              <div className="space-y-2">
                {alerts.length === 0 ? (
                  <div className="card-surface p-10 text-center">
                    <Flame size={28} className="mx-auto text-muted-foreground mb-3" />
                    <p className="font-semibold text-foreground mb-1">Pas encore d'alertes</p>
                    <p className="text-sm text-muted-foreground mb-4">Diffusez des offres et partagez des liens. Les signaux arriveront ici.</p>
                    <Link to="/offres" className="text-sm text-primary font-semibold hover:underline">Voir les offres →</Link>
                  </div>
                ) : (
                  <>
                    {unreadAlerts > 0 && (
                      <div className="flex items-center justify-between px-1">
                        <p className="text-xs font-semibold text-foreground">{unreadAlerts} alerte{unreadAlerts > 1 ? "s" : ""} non lue{unreadAlerts > 1 ? "s" : ""}</p>
                        <button
                          onClick={() => alerts.filter(a => !a.read).forEach(a => markAlertRead(a.id))}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          Tout marquer comme lu
                        </button>
                      </div>
                    )}
                    {alerts.map(alert => (
                      <AlertCard key={alert.id} alert={alert} onRead={markAlertRead} />
                    ))}
                  </>
                )}
              </div>
            )}

            {/* ── LIENS CHAUDS ───────────────────────────────── */}
            {tab === "liens" && (
              <div className="space-y-3">
                {hotLinks.length === 0 ? (
                  <div className="card-surface p-10 text-center">
                    <Link2 size={28} className="mx-auto text-muted-foreground mb-3" />
                    <p className="font-semibold text-foreground mb-1">Aucun lien traqué</p>
                    <p className="text-sm text-muted-foreground mb-4">Créez un lien traqué depuis une offre pour commencer le suivi.</p>
                    <Link to="/offres" className="text-sm text-primary font-semibold hover:underline">Voir les offres →</Link>
                  </div>
                ) : hotLinks.map(link => (
                  <div key={link.id} className="card-surface p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-muted-foreground truncate">/r/{link.tracking_code}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">{link.clicks_count} clics</span>
                          <span className="text-xs text-muted-foreground">{link.unique_clicks_count} uniques</span>
                          {(link.qualified_interest_count || 0) > 0 && (
                            <span className="text-xs font-bold" style={{ color: "hsl(24 100% 52%)" }}>
                              🔥 {link.qualified_interest_count} intérêt{(link.qualified_interest_count || 0) > 1 ? "s" : ""}
                            </span>
                          )}
                          {link.converted && (
                            <span className="text-xs font-bold flex items-center gap-1" style={{ color: "hsl(152 62% 35%)" }}>
                              <CheckCircle2 size={10} /> Converti
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => copyLink(link.tracking_code)}
                        className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors shrink-0">
                        <Copy size={12} className="text-muted-foreground" />
                      </button>
                    </div>
                    <HeatBar score={link.heat_score} />
                    {link.heat_score >= 50 && (
                      <div className="mt-3 p-2.5 rounded-xl" style={{ background: "hsl(24 100% 52% / 0.08)", border: "1px solid hsl(24 100% 52% / 0.2)" }}>
                        <div className="flex items-start gap-2">
                          <Brain size={11} className="mt-0.5 shrink-0" style={{ color: "hsl(24 100% 52%)" }} />
                          <p className="text-xs" style={{ color: "hsl(24 100% 45%)" }}>
                            {link.heat_score >= 80
                              ? "Ce lien est très chaud. Relancez votre diffusion pour maximiser les chances."
                              : link.heat_score >= 50
                              ? "Ce lien commence à performer. Continuez à le partager."
                              : "Signal détecté. Un intérêt a été identifié."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── INTÉRÊTS QUALIFIÉS ──────────────────────────── */}
            {tab === "interets" && (
              <div className="space-y-3">
                {interests.length === 0 && totalInterests === 0 ? (
                  <div className="card-surface p-10 text-center">
                    <Zap size={28} className="mx-auto text-muted-foreground mb-3" />
                    <p className="font-semibold text-foreground mb-1">Pas encore d'intérêt qualifié</p>
                    <p className="text-sm text-muted-foreground mb-3">Un intérêt qualifié = plusieurs clics uniques depuis le même visiteur.</p>
                    <p className="text-xs text-muted-foreground">Partagez vos liens. Le système détecte automatiquement les signaux forts.</p>
                  </div>
                ) : interests.length > 0 ? (
                  interests.map(interest => {
                    const stageMap: Record<string, { label: string; color: string }> = {
                      detected: { label: "Intérêt détecté", color: "hsl(24 100% 52%)" },
                      opportunity_created: { label: "Opportunité créée", color: "hsl(152 62% 35%)" },
                      intro_done: { label: "Introduction faite", color: "hsl(218 72% 55%)" },
                      converted: { label: "Converti ✓", color: "hsl(152 62% 30%)" },
                    };
                    const stage = stageMap[interest.status] || stageMap.detected;
                    return (
                      <div key={interest.id} className="card-surface p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: "hsl(24 100% 52% / 0.12)" }}>
                              <Zap size={14} style={{ color: "hsl(24 100% 52%)" }} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">Un intérêt réel a été détecté.</p>
                              <p className="text-xs text-muted-foreground">{interest.click_count} clics répétés · {new Date(interest.created_at).toLocaleDateString("fr-FR")}</p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                            style={{ background: `${stage.color}18`, color: stage.color }}>
                            {stage.label}
                          </span>
                        </div>
                        {interest.status === "detected" && (
                          <div className="flex gap-2 mt-2">
                            <Link to="/introductions" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                              style={{ background: "var(--gradient-primary)" }}>
                              <Target size={10} /> Créer une intro
                            </Link>
                            <Link to={`/radar`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-border hover:bg-secondary transition-colors">
                              Voir les opportunités
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="card-surface p-6 text-center">
                    <p className="text-sm text-muted-foreground">Intérêts détectés depuis les compteurs de vos liens.</p>
                    <Link to="/offres" className="text-sm text-primary font-semibold hover:underline mt-2 inline-block">
                      Voir mes liens →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ── OPPORTUNITÉS ───────────────────────────────── */}
            {tab === "opps" && (
              <div className="space-y-3">
                {opportunities.length === 0 ? (
                  <div className="card-surface p-10 text-center">
                    <Target size={28} className="mx-auto text-muted-foreground mb-3" />
                    <p className="font-semibold text-foreground mb-1">Pas encore d'opportunité passive</p>
                    <p className="text-sm text-muted-foreground mb-3">Quand une diffusion génère un intérêt fort, une opportunité est créée automatiquement ici.</p>
                    <Link to="/radar" className="text-sm text-primary font-semibold hover:underline">Voir le Deal Radar →</Link>
                  </div>
                ) : opportunities.map(opp => (
                  <Link key={opp.id} to="/radar"
                    className="card-surface p-4 flex items-start gap-3 hover:shadow-md transition-shadow group">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "hsl(152 62% 35% / 0.12)" }}>
                      <Target size={15} style={{ color: "hsl(152 62% 35%)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground truncate">{opp.company_name}</p>
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium shrink-0"
                          style={{ background: "hsl(152 62% 35% / 0.1)", color: "hsl(152 62% 35%)" }}>
                          Passif
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{opp.summary}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-muted-foreground">
                          {new Date(opp.created_at).toLocaleDateString("fr-FR")}
                        </span>
                        <span className="text-xs font-medium" style={{ color: opp.intent_label === "eleve" ? "hsl(24 100% 52%)" : "hsl(var(--muted-foreground))" }}>
                          · Intérêt {opp.intent_label}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── CTA BAS ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/offres" className="btn-cta py-3 text-sm flex items-center justify-center gap-2">
            <Link2 size={14} /> Mes liens traqués
          </Link>
          <Link to="/radar" className="py-3 text-sm rounded-xl font-semibold border border-primary text-primary flex items-center justify-center gap-2 hover:bg-secondary transition-colors">
            <TrendingUp size={14} /> Deal Radar
          </Link>
        </div>

      </div>
    </UserLayout>
  );
}
