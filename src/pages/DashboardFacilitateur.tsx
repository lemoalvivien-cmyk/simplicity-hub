/**
 * Dashboard Facilitateur — Revenue Cockpit
 * 4 blocs essentiels : Gains · Missions IA · Introductions · Trust Score
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Trophy, Clock, Send, Star, ArrowRight, Sparkles,
  Bell, MapPin, Building2, CheckCircle2, Circle, AlertCircle,
  Plus, ShieldCheck, Info
} from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import VoiceWelcome from "@/components/ai/VoiceWelcome";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/* ── Types ─────────────────────────────────────────── */
interface Gain { id: string; montant: number | null; statut: string | null; }
interface Mission {
  id: string; titre: string; secteur: string | null; zone: string | null;
  recompense: string | null; match_score?: number | null;
}
interface Intro {
  id: string; contact_nom: string; statut: string | null; created_at: string;
  mission_id: string | null;
}
interface TrustScore { global_score: number | null; }
interface Request {
  id: string; request_context: string | null; openclaw_note: string | null;
}

/* ── Statut pill ────────────────────────────────────── */
const STATUT_MAP: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  en_attente:  { label: "En attente",  color: "hsl(38 95% 50%)",  Icon: Clock },
  validee:     { label: "Validée",     color: "hsl(152 62% 38%)", Icon: CheckCircle2 },
  refusee:     { label: "Refusée",     color: "hsl(0 72% 51%)",   Icon: AlertCircle },
  en_cours:    { label: "En cours",    color: "hsl(218 72% 45%)", Icon: Circle },
};

function StatutPill({ statut }: { statut: string | null }) {
  const s = STATUT_MAP[statut || ""] ?? { label: statut || "—", color: "hsl(218 15% 50%)", Icon: Circle };
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${s.color}22`, color: s.color }}>
      <s.Icon size={10} />
      {s.label}
    </span>
  );
}

/* ── Main ───────────────────────────────────────────── */
export default function DashboardFacilitateur() {
  const { user, profile } = useAuth();
  const prenom = profile?.prenom || "vous";

  const [gains, setGains]         = useState<Gain[]>([]);
  const [intros, setIntros]       = useState<Intro[]>([]);
  const [introsCount, setIntrosCount] = useState(0);
  const [missions, setMissions]   = useState<Mission[]>([]);
  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [requests, setRequests]   = useState<Request[]>([]);
  const [loading, setLoading]     = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [gainsRes, introsRes, introsCountRes, missionsRes, trustRes, reqRes] = await Promise.all([
        db.from("gains").select("id, montant, statut").eq("facilitateur_id", user.id).limit(200),
        db.from("introductions")
          .select("id, contact_nom, statut, created_at, mission_id")
          .eq("facilitateur_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3),
        db.from("introductions").select("id", { count: "exact", head: true }).eq("facilitateur_id", user.id),
        // missions actives sans intro de ce facilitateur
        db.from("missions")
          .select("id, titre, secteur, zone, recompense")
          .eq("statut", "active")
          .order("created_at", { ascending: false })
          .limit(10),
        db.from("trust_scores").select("global_score").eq("user_id", user.id).maybeSingle(),
        db.from("facilitator_requests")
          .select("id, request_context, openclaw_note")
          .eq("facilitator_user_id", user.id)
          .in("status", ["envoyee", "vue"])
          .order("created_at", { ascending: false })
          .limit(3),
      ]);
      setGains(gainsRes.data || []);
      setIntros(introsRes.data || []);
      setIntrosCount(introsCountRes.count || 0);
      setTrustScore((trustRes.data as TrustScore | null)?.global_score ?? null);
      setRequests(reqRes.data || []);

      // filter missions where facilitator hasn't introduced yet
      const allMissions: Mission[] = missionsRes.data || [];
      if (allMissions.length > 0) {
        const myMissionIds = new Set((introsRes.data || []).map((i: Intro) => i.mission_id).filter(Boolean));
        const available = allMissions.filter(m => !myMissionIds.has(m.id));
        setMissions(available.slice(0, 3));
      }
      setLoading(false);
    })();
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

  const totalValide  = gains.filter(g => g.statut === "valide").reduce((s, g)  => s + (g.montant || 0), 0);
  const totalAttendu = gains.filter(g => g.statut === "en_attente").reduce((s, g) => s + (g.montant || 0), 0);
  const trustPct     = trustScore ?? 0;
  const trustColor   = trustPct >= 80 ? "hsl(152 62% 38%)" : trustPct >= 50 ? "hsl(218 72% 45%)" : "hsl(38 95% 50%)";

  const Skeleton = ({ w = "w-12" }: { w?: string }) => (
    <span className={`inline-block h-4 ${w} rounded bg-white/10 animate-pulse`} />
  );

  return (
    <TooltipProvider>
      <UserLayout role="facilitateur" jarvisContext="dashboard-facilitateur">
        <VoiceWelcome context="dashboard-facilitateur" userName={prenom} />
        <div className="max-w-2xl mx-auto space-y-4 pb-8">

          {/* ── HEADER ───────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <h1 className="font-bold text-foreground text-base">Bonjour, {prenom} 👋</h1>
              <p className="text-muted-foreground text-xs mt-0.5">Votre cockpit de revenus</p>
            </div>
            {requests.length > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "hsl(24 100% 52% / 0.15)", color: "hsl(24 100% 60%)" }}>
                <Bell size={11} /> {requests.length} demande{requests.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* ══════════════════════════════════════════════════
              BLOC 1 — BARRE DE GAINS
          ══════════════════════════════════════════════════ */}
          <div className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 58% 13%))",
              border: "1px solid hsl(218 40% 22% / 0.7)"
            }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 60% 80% at 10% 50%, hsl(24 100% 52% / 0.07) 0%, transparent 70%)" }} />
            <p className="relative z-10 text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">
              Revenus
            </p>
            <div className="relative z-10 grid grid-cols-2 gap-3">

              {/* Gains validés */}
              <Link to="/gains"
                className="rounded-xl p-4 hover:opacity-90 transition-opacity cursor-pointer"
                style={{ background: "hsl(152 62% 10% / 0.6)", border: "1px solid hsl(152 62% 25% / 0.4)" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Trophy size={12} style={{ color: "hsl(152 62% 50%)" }} />
                  <p className="text-xs font-medium" style={{ color: "hsl(152 62% 50%)" }}>Gains validés</p>
                </div>
                <p className="font-bold text-2xl text-white leading-none">
                  {loading ? <Skeleton w="w-16" /> : `${totalValide.toLocaleString("fr-FR")} €`}
                </p>
              </Link>

              {/* Gains en attente */}
              <Link to="/gains"
                className="rounded-xl p-4 hover:opacity-90 transition-opacity cursor-pointer"
                style={{ background: "hsl(38 95% 8% / 0.6)", border: "1px solid hsl(38 95% 25% / 0.4)" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock size={12} style={{ color: "hsl(38 95% 60%)" }} />
                  <p className="text-xs font-medium" style={{ color: "hsl(38 95% 60%)" }}>En attente</p>
                </div>
                <p className="font-bold text-2xl text-white leading-none">
                  {loading ? <Skeleton w="w-16" /> : `${totalAttendu.toLocaleString("fr-FR")} €`}
                </p>
              </Link>

              {/* Introductions envoyées */}
              <Link to="/introductions"
                className="rounded-xl p-3 hover:opacity-90 transition-opacity cursor-pointer"
                style={{ background: "hsl(218 40% 14% / 0.7)", border: "1px solid hsl(218 40% 28% / 0.4)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Send size={11} className="text-white/50" />
                  <p className="text-xs text-white/50">Introductions envoyées</p>
                </div>
                <p className="font-bold text-lg text-white leading-none">
                  {loading ? <Skeleton /> : introsCount}
                </p>
              </Link>

              {/* Score de confiance */}
              <Link to="/profil/facilitateur"
                className="rounded-xl p-3 hover:opacity-90 transition-opacity cursor-pointer"
                style={{ background: "hsl(218 40% 14% / 0.7)", border: "1px solid hsl(218 40% 28% / 0.4)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Star size={11} className="text-white/50" />
                  <p className="text-xs text-white/50">Score de confiance</p>
                </div>
                <p className="font-bold text-lg text-white leading-none">
                  {loading ? <Skeleton /> : trustScore !== null ? `${trustScore}/100` : "—"}
                </p>
              </Link>
            </div>
          </div>

          {/* ── REQUESTS (demandes entreprises) ─────────────── */}
          {requests.length > 0 && (
            <div className="rounded-xl p-4 space-y-3"
              style={{ border: "1px solid hsl(var(--primary) / 0.4)", background: "hsl(var(--secondary))" }}>
              <div className="flex items-center gap-2">
                <Bell size={13} className="text-primary" />
                <p className="text-sm font-semibold text-foreground">Demandes de mise en relation</p>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: "hsl(var(--primary))" }}>
                  {requests.length}
                </span>
              </div>
              {requests.map(req => (
                <div key={req.id} className="bg-background rounded-xl p-4 space-y-3 border border-border">
                  <p className="text-sm font-medium text-foreground">Une entreprise vous sollicite</p>
                  {req.openclaw_note && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg"
                      style={{ background: "hsl(218 65% 10%)" }}>
                      <Sparkles size={11} className="text-white/60 shrink-0 mt-0.5" />
                      <p className="text-xs text-white/60">{req.openclaw_note}</p>
                    </div>
                  )}
                  {req.request_context && (
                    <p className="text-xs text-muted-foreground italic">"{req.request_context}"</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptRequest(req.id)}
                      disabled={acceptingId === req.id}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-60"
                      style={{ background: "var(--gradient-primary)" }}>
                      {acceptingId === req.id ? "…" : "Accepter"}
                    </button>
                    <button
                      onClick={() => declineRequest(req.id)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:bg-muted transition-colors">
                      Décliner
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              BLOC 2 — MISSIONS RECOMMANDÉES PAR L'IA
          ══════════════════════════════════════════════════ */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: "hsl(218 72% 18% / 0.12)" }}>
                  <Sparkles size={13} className="text-primary" />
                </div>
                <h2 className="font-semibold text-foreground text-sm">Missions recommandées</h2>
              </div>
              <Link to="/missions" className="text-xs text-primary font-medium hover:underline">
                Toutes
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : missions.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "hsl(218 72% 18% / 0.08)" }}>
                  <Sparkles size={18} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Aucune mission disponible pour l'instant
                </p>
                <p className="text-xs text-muted-foreground">
                  Votre profil est analysé par l'IA. Revenez demain.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {missions.map((m, idx) => (
                  <div key={m.id}
                    className="rounded-xl p-3.5 border border-border hover:border-primary/40 transition-colors"
                    style={{ background: "hsl(var(--muted))" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {/* IA match badge */}
                          {m.match_score != null ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: "hsl(24 100% 52% / 0.15)", color: "hsl(24 100% 58%)" }}>
                              <Sparkles size={9} /> Match IA {m.match_score}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: "hsl(218 72% 18% / 0.12)", color: "hsl(218 72% 50%)" }}>
                              <Sparkles size={9} /> IA #{idx + 1}
                            </span>
                          )}
                          {m.recompense && (
                            <span className="text-xs font-bold"
                              style={{ color: "hsl(152 62% 42%)" }}>
                              {m.recompense}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground truncate">{m.titre}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {m.secteur && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Building2 size={10} /> {m.secteur}
                            </span>
                          )}
                          {m.zone && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin size={10} /> {m.zone}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link
                        to={`/missions/${m.id}`}
                        className="shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: "hsl(var(--primary))", color: "white" }}>
                        Voir <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════
              BLOC 3 — INTRODUCTIONS EN COURS
          ══════════════════════════════════════════════════ */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: "hsl(24 100% 52% / 0.1)" }}>
                  <Send size={13} style={{ color: "hsl(24 100% 55%)" }} />
                </div>
                <h2 className="font-semibold text-foreground text-sm">Mes introductions</h2>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/introductions" className="text-xs text-primary font-medium hover:underline">
                  Toutes
                </Link>
                <Link
                  to="/introductions/new"
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                  style={{ background: "hsl(var(--accent))", color: "white" }}>
                  <Plus size={11} /> Nouvelle
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[0, 1].map(i => (
                  <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : intros.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-sm text-muted-foreground mb-3">
                  Aucune introduction envoyée pour l'instant.
                </p>
                <Link
                  to="/missions"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl"
                  style={{ background: "var(--gradient-primary)", color: "white" }}>
                  Voir les missions disponibles <ArrowRight size={12} />
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {intros.map(intro => (
                  <div key={intro.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border hover:border-primary/30 transition-colors bg-muted">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{intro.contact_nom}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(intro.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <StatutPill statut={intro.statut} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════
              BLOC 4 — TRUST SCORE
          ══════════════════════════════════════════════════ */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: "hsl(218 72% 18% / 0.08)" }}>
                  <ShieldCheck size={13} className="text-primary" />
                </div>
                <h2 className="font-semibold text-foreground text-sm">Score de confiance</h2>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={13} className="text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    Ce score influence votre visibilité auprès des entreprises. Plus il est élevé, plus vous recevez de recommandations IA.
                  </TooltipContent>
                </Tooltip>
              </div>
              <Link to="/profil/facilitateur" className="text-xs text-primary font-medium hover:underline">
                Mon profil
              </Link>
            </div>

            {loading ? (
              <div className="h-10 bg-muted rounded-xl animate-pulse" />
            ) : (
              <>
                <div className="flex items-end justify-between mb-2">
                  <span className="font-bold text-3xl text-foreground">
                    {trustScore !== null ? trustScore : "—"}
                    {trustScore !== null && <span className="text-base font-normal text-muted-foreground">/100</span>}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: `${trustColor}18`,
                      color: trustColor
                    }}>
                    {trustPct >= 80 ? "Expert" : trustPct >= 60 ? "Confirmé" : trustPct >= 40 ? "En cours" : "Débutant"}
                  </span>
                </div>
                <div className="relative h-2.5 rounded-full overflow-hidden"
                  style={{ background: "hsl(var(--muted))" }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                    style={{ width: `${trustPct}%`, background: trustColor }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {trustScore === null
                    ? "Effectuez votre première introduction pour générer votre score."
                    : trustPct < 50
                    ? "Envoyez des introductions qualifiées pour augmenter votre score."
                    : "Continuez à envoyer des introductions validées pour progresser."}
                </p>
              </>
            )}
          </div>

        </div>
      </UserLayout>
    </TooltipProvider>
  );
}
