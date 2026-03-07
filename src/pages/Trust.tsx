/**
 * Trust Engine — Infrastructure de confiance WIINUP MAX
 * "Cette relation est tracée. Cette introduction est protégée."
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  ShieldCheck, TrendingUp, AlertTriangle, CheckCircle2, Clock,
  Zap, Loader2, Star, ArrowRight, Flag, MessageSquare, Lock,
  ChevronRight, Shield, Eye, Activity
} from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import TrustBadge, { getTrustLevel, TrustScoreBar, ProtectedIntroBadge } from "@/components/trust/TrustBadge";

interface TrustScore {
  global_score: number;
  quality_score: number;
  reliability_score: number;
  responsiveness_score: number;
  compliance_score: number;
  total_intros: number;
  intros_validees: number;
  badges: string[];
}

interface TrustEvent {
  id: string;
  event_type: string;
  impact_score: number;
  summary: string;
  created_at: string;
}

interface EscrowEntry {
  id: string;
  status: string;
  protected: boolean;
  converted: boolean;
  created_at: string;
  introduction_id: string;
}

interface Dispute {
  id: string;
  dispute_type: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

const EVENT_ICONS: Record<string, { icon: JSX.Element; color: string }> = {
  introduction_acceptee: { icon: <CheckCircle2 size={13} />, color: "hsl(142 62% 35%)" },
  introduction_refusee: { icon: <AlertTriangle size={13} />, color: "hsl(0 72% 45%)" },
  gain_confirme: { icon: <TrendingUp size={13} />, color: "hsl(142 62% 35%)" },
  avis_positif: { icon: <Star size={13} />, color: "hsl(38 90% 45%)" },
  avis_negatif: { icon: <AlertTriangle size={13} />, color: "hsl(0 72% 45%)" },
  signalement: { icon: <Flag size={13} />, color: "hsl(0 72% 45%)" },
  comportement_suspect: { icon: <Eye size={13} />, color: "hsl(38 80% 40%)" },
  temps_reponse_excellent: { icon: <Zap size={13} />, color: "hsl(218 72% 50%)" },
  contournement_probable: { icon: <AlertTriangle size={13} />, color: "hsl(0 72% 45%)" },
};

const DISPUTE_TYPES = [
  { value: "contournement", label: "Contournement de plateforme" },
  { value: "mauvaise_foi", label: "Mauvaise foi" },
  { value: "intro_disputee", label: "Introduction contestée" },
  { value: "abus", label: "Abus ou comportement abusif" },
  { value: "autre", label: "Autre" },
];

export default function Trust() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [events, setEvents] = useState<TrustEvent[]>([]);
  const [escrows, setEscrows] = useState<EscrowEntry[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"score" | "introductions" | "historique" | "litiges">("score");

  // Dispute form
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeType, setDisputeType] = useState(DISPUTE_TYPES[0].value);
  const [disputeTitle, setDisputeTitle] = useState("");
  const [disputeDesc, setDisputeDesc] = useState("");
  const [disputeLoading, setDisputeLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [scoreRes, eventsRes, escrowRes, disputesRes] = await Promise.all([
        db.from("trust_scores").select("*").eq("user_id", user.id).maybeSingle(),
        db.from("trust_events").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(15),
        db.from("intro_escrow").select("*").eq("facilitator_id", user.id).order("created_at", { ascending: false }).limit(10),
        db.from("disputes").select("*").eq("reporter_user_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);

      if (scoreRes.data) {
        setTrustScore(scoreRes.data);
      } else {
        // Score par défaut si pas encore créé
        setTrustScore({ global_score: 50, quality_score: 50, reliability_score: 50, responsiveness_score: 50, compliance_score: 50, total_intros: 0, intros_validees: 0, badges: [] });
      }

      setEvents(eventsRes.data || []);
      setEscrows(escrowRes.data || []);
      setDisputes(disputesRes.data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const submitDispute = async () => {
    if (!user || !disputeTitle.trim() || !disputeDesc.trim()) return;
    setDisputeLoading(true);
    const { error } = await db.from("disputes").insert({
      reporter_user_id: user.id,
      dispute_type: disputeType,
      title: disputeTitle.trim(),
      description: disputeDesc.trim(),
      status: "ouvert",
      priority: "normale",
    });
    setDisputeLoading(false);
    if (!error) {
      toast({ title: "Signalement envoyé", description: "Nous allons examiner votre cas." });
      setShowDisputeForm(false);
      setDisputeTitle("");
      setDisputeDesc("");
      setDisputes(prev => [{ id: "new", dispute_type: disputeType, title: disputeTitle, status: "ouvert", priority: "normale", created_at: new Date().toISOString() }, ...prev]);
    }
  };

  const trust = trustScore ? getTrustLevel(trustScore.global_score) : getTrustLevel(50);
  const protectedEscrows = escrows.filter(e => e.protected).length;
  const convertedEscrows = escrows.filter(e => e.converted).length;

  return (
    <UserLayout jarvisContext="dashboard">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* ── HERO TRUST ───────────────────────────────────────── */}
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{
          background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))",
          border: "1px solid hsl(218 40% 25% / 0.5)"
        }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse 60% 80% at 80% 50%, hsl(142 62% 40% / 0.08) 0%, transparent 70%)"
          }} />
          <div className="relative z-10 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{
              background: `linear-gradient(135deg, ${trust.color}, ${trust.color}99)`,
              boxShadow: `0 0 20px ${trust.color}40`
            }}>
              <ShieldCheck size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-0.5">Trust Engine</p>
              <h1 className="font-display text-2xl font-bold text-white leading-tight">{trust.label}</h1>
              <p className="text-white/50 text-xs mt-1">Score global {loading ? "…" : `${trustScore?.global_score}/100`} · La plateforme protège votre réputation.</p>
            </div>
          </div>

          {!loading && trustScore && (
            <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "Introductions", value: trustScore.total_intros },
                { label: "Validées", value: trustScore.intros_validees },
                { label: "Protégées", value: protectedEscrows },
              ].map(({ label, value }) => (
                <div key={label} className="text-center py-2.5 rounded-xl" style={{ background: "hsl(218 40% 16% / 0.6)" }}>
                  <p className="font-bold text-white text-xl leading-none">{value}</p>
                  <p className="text-white/40 text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ONGLETS ──────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted">
          {([
            { key: "score", label: "Mon score" },
            { key: "introductions", label: "Introductions protégées" },
            { key: "historique", label: "Historique" },
            { key: "litiges", label: "Litiges" },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${tab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* ── SCORE ────────────────────────────────────────── */}
            {tab === "score" && trustScore && (
              <div className="space-y-4">
                {/* Score bars */}
                <div className="card-surface p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={15} className="text-primary" />
                    <h2 className="font-semibold text-foreground text-sm">Détail de votre confiance</h2>
                  </div>
                  <div className="space-y-3">
                    <TrustScoreBar label="Qualité" score={trustScore.quality_score} color="hsl(142 62% 35%)" />
                    <TrustScoreBar label="Fiabilité" score={trustScore.reliability_score} color="hsl(218 72% 45%)" />
                    <TrustScoreBar label="Réactivité" score={trustScore.responsiveness_score} color="hsl(38 80% 40%)" />
                    <TrustScoreBar label="Conformité" score={trustScore.compliance_score} color="hsl(24 100% 45%)" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
                    Votre score est alimenté par les preuves réelles : introductions validées, gains confirmés, avis reçus.
                  </p>
                </div>

                {/* Badges */}
                <div className="card-surface p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={15} className="text-primary" />
                    <h2 className="font-semibold text-foreground text-sm">Vos badges de confiance</h2>
                  </div>
                  {trustScore.global_score >= 70 ? (
                    <div className="flex flex-wrap gap-2">
                      {trustScore.global_score >= 85 && (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "hsl(38 90% 96%)", color: "hsl(38 90% 35%)" }}>⭐ Facilitateur Expert</span>
                      )}
                      {trustScore.intros_validees >= 3 && (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "hsl(142 62% 96%)", color: "hsl(142 62% 30%)" }}>✅ Introductions prouvées</span>
                      )}
                      {trustScore.responsiveness_score >= 70 && (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "hsl(218 72% 96%)", color: "hsl(218 72% 35%)" }}>⚡ Très réactif</span>
                      )}
                      {trustScore.compliance_score >= 80 && (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "hsl(218 60% 97%)", color: "hsl(218 60% 40%)" }}>🛡️ Conforme</span>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <Shield size={28} className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Vos badges arrivent avec le temps.</p>
                      <p className="text-xs text-muted-foreground mt-1">Envoyez des introductions de qualité pour faire progresser votre réputation.</p>
                    </div>
                  )}
                </div>

                {/* Comment progresser */}
                <div className="card-surface p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={15} className="text-primary" />
                    <h2 className="font-semibold text-foreground text-sm">Comment progresser ?</h2>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { action: "Envoyez une introduction de qualité", impact: "+5 à +15 points", icon: <CheckCircle2 size={13} />, color: "hsl(142 62% 35%)" },
                      { action: "Répondez rapidement aux demandes", impact: "+5 points", icon: <Zap size={13} />, color: "hsl(218 72% 45%)" },
                      { action: "Recevez un avis positif", impact: "+10 points", icon: <Star size={13} />, color: "hsl(38 90% 45%)" },
                      { action: "Complétez votre profil", impact: "+5 points", icon: <Activity size={13} />, color: "hsl(24 100% 45%)" },
                    ].map(({ action, impact, icon, color }) => (
                      <div key={action} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18`, color }}>
                          {icon}
                        </div>
                        <p className="text-xs text-foreground flex-1">{action}</p>
                        <span className="text-xs font-semibold shrink-0" style={{ color }}>{impact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── INTRODUCTIONS PROTÉGÉES ────────────────────── */}
            {tab === "introductions" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl" style={{
                  background: "linear-gradient(135deg, hsl(142 62% 97%), hsl(218 72% 97%))",
                  border: "1px solid hsl(142 62% 80%)"
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Lock size={14} style={{ color: "hsl(142 62% 35%)" }} />
                    <p className="text-sm font-bold" style={{ color: "hsl(142 62% 30%)" }}>Introduction protégée</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    La plateforme certifie chaque étape de vos introductions. Chaque preuve est horodatée et incontestable.
                    Cette traçabilité protège votre attribution et vos gains.
                  </p>
                </div>

                {escrows.length === 0 ? (
                  <div className="card-surface p-10 text-center">
                    <ShieldCheck size={32} className="mx-auto text-muted-foreground mb-3" />
                    <p className="font-semibold text-foreground mb-1">Aucune introduction escrow</p>
                    <p className="text-sm text-muted-foreground mb-4">Vos prochaines introductions apparaîtront ici avec leur statut de protection.</p>
                    <Link to="/missions" className="text-sm text-primary font-semibold hover:underline">Voir les missions →</Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {escrows.map(escrow => (
                      <div key={escrow.id} className="card-surface p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{
                            background: escrow.protected ? "hsl(142 62% 96%)" : "hsl(var(--muted))"
                          }}>
                            {escrow.protected
                              ? <Lock size={14} style={{ color: "hsl(142 62% 35%)" }} />
                              : <Clock size={14} className="text-muted-foreground" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-mono text-muted-foreground truncate">{escrow.introduction_id.slice(0, 8)}…</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(escrow.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <ProtectedIntroBadge status={escrow.status} />
                          {escrow.converted && (
                            <span className="text-xs font-semibold" style={{ color: "hsl(142 62% 35%)" }}>Gain possible</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {convertedEscrows > 0 && (
                  <div className="p-3 rounded-xl flex items-center gap-2" style={{
                    background: "hsl(142 62% 96%)",
                    border: "1px solid hsl(142 62% 80%)"
                  }}>
                    <CheckCircle2 size={14} style={{ color: "hsl(142 62% 35%)" }} />
                    <p className="text-xs font-semibold" style={{ color: "hsl(142 62% 30%)" }}>
                      {convertedEscrows} introduction{convertedEscrows > 1 ? "s converties" : " convertie"} — Attribution tracée et prouvée.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── HISTORIQUE TRUST ────────────────────────────── */}
            {tab === "historique" && (
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="card-surface p-10 text-center">
                    <Activity size={28} className="mx-auto text-muted-foreground mb-3" />
                    <p className="font-semibold text-foreground mb-1">Aucun événement de confiance</p>
                    <p className="text-sm text-muted-foreground">Votre historique de confiance se construit à chaque interaction sur la plateforme.</p>
                  </div>
                ) : events.map(evt => {
                  const cfg = EVENT_ICONS[evt.event_type] || { icon: <Activity size={13} />, color: "hsl(var(--primary))" };
                  return (
                    <div key={evt.id} className="card-surface p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{
                        background: `${cfg.color}15`, color: cfg.color
                      }}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-snug">{evt.summary}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(evt.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      {evt.impact_score !== 0 && (
                        <span className="text-xs font-bold shrink-0" style={{
                          color: evt.impact_score > 0 ? "hsl(142 62% 35%)" : "hsl(0 72% 45%)"
                        }}>
                          {evt.impact_score > 0 ? "+" : ""}{evt.impact_score}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── LITIGES ──────────────────────────────────────── */}
            {tab === "litiges" && (
              <div className="space-y-4">
                {/* Créer un litige */}
                {!showDisputeForm ? (
                  <button
                    onClick={() => setShowDisputeForm(true)}
                    className="w-full p-4 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <Flag size={14} /> Signaler un problème ou ouvrir un litige
                  </button>
                ) : (
                  <div className="card-surface p-5 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Flag size={14} className="text-primary" />
                      <h3 className="font-semibold text-foreground text-sm">Signalement</h3>
                    </div>
                    <select
                      value={disputeType}
                      onChange={e => setDisputeType(e.target.value)}
                      className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {DISPUTE_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <input
                      value={disputeTitle}
                      onChange={e => setDisputeTitle(e.target.value)}
                      placeholder="Titre court du problème"
                      className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <textarea
                      value={disputeDesc}
                      onChange={e => setDisputeDesc(e.target.value)}
                      placeholder="Décrivez ce qui s'est passé. Soyez précis et factuel."
                      rows={4}
                      className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={submitDispute}
                        disabled={disputeLoading || !disputeTitle.trim() || !disputeDesc.trim()}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        {disputeLoading ? "Envoi…" : "Envoyer le signalement"}
                      </button>
                      <button
                        onClick={() => setShowDisputeForm(false)}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {disputes.length === 0 ? (
                  <div className="card-surface p-8 text-center">
                    <MessageSquare size={28} className="mx-auto text-muted-foreground mb-3" />
                    <p className="font-semibold text-foreground mb-1">Aucun litige ouvert</p>
                    <p className="text-sm text-muted-foreground">Si quelque chose vous semble anormal, signalez-le ici.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {disputes.map(d => {
                      const statusColors: Record<string, { color: string; bg: string }> = {
                        ouvert: { color: "hsl(38 80% 35%)", bg: "hsl(38 80% 96%)" },
                        en_revue: { color: "hsl(218 72% 40%)", bg: "hsl(218 72% 96%)" },
                        resolu: { color: "hsl(142 62% 35%)", bg: "hsl(142 62% 96%)" },
                        classe: { color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
                      };
                      const sc = statusColors[d.status] || statusColors.ouvert;
                      return (
                        <div key={d.id} className="card-surface p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">{d.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {DISPUTE_TYPES.find(t => t.value === d.dispute_type)?.label || d.dispute_type}
                                {" · "}{new Date(d.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                              </p>
                            </div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ color: sc.color, background: sc.bg }}>
                              {d.status === "ouvert" ? "Ouvert" : d.status === "en_revue" ? "En revue" : d.status === "resolu" ? "Résolu" : "Classé"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  );
}
