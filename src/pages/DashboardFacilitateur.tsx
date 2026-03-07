import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Briefcase, Send, TrendingUp, CheckCircle2, ArrowRight,
  MessageCircle, Users, Zap, Search, Sparkles, Loader2,
  Brain, Moon, Bot, Flag, Star, Bell, ThumbsUp
} from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import VoiceWelcome from "@/components/ai/VoiceWelcome";

interface Mission { id: string; titre: string; recompense: string; secteur: string | null; zone: string | null; }
interface Introduction { id: string; contact_nom: string; mission_id: string; statut: string; created_at: string; }
interface Gain { id: string; montant: number; statut: string; }
interface Request { id: string; company_user_id: string; request_context: string | null; status: string; created_at: string; mission_id: string | null; openclaw_note: string | null; }

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  en_attente: { color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", label: "Envoyée" },
  validee: { color: "hsl(var(--success))", bg: "hsl(var(--success-light))", label: "Validée ✓" },
  en_cours: { color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", label: "En cours" },
  refusee: { color: "hsl(var(--destructive))", bg: "hsl(0 72% 95%)", label: "Refusée" },
};

export default function DashboardFacilitateur() {
  const { user, profile } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [introductions, setIntroductions] = useState<Introduction[]>([]);
  const [gains, setGains] = useState<Gain[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactsCount, setContactsCount] = useState(0);
  const [agentsActifs, setAgentsActifs] = useState(0);
  const [recommendationsCount, setRecommendationsCount] = useState(0);
  const [myScore, setMyScore] = useState(0);

  const prenom = profile?.prenom || "vous";

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [missionsRes, introsRes, gainsRes, contactsRes, agentsRes, recoRes, requestsRes] = await Promise.all([
        db.from("missions").select("id, titre, recompense, secteur, zone").eq("statut", "active").limit(3),
        db.from("introductions").select("id, contact_nom, mission_id, statut, created_at").eq("facilitateur_id", user.id).order("created_at", { ascending: false }).limit(5),
        db.from("gains").select("id, montant, statut").eq("facilitateur_id", user.id),
        db.from("contacts").select("id", { count: "exact", head: true }).eq("owner_user_id", user.id),
        db.from("openclaw_agents").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("statut", "actif"),
        db.from("openclaw_recommendations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "pending"),
        db.from("facilitator_requests").select("id, company_user_id, request_context, status, created_at, mission_id, openclaw_note").eq("facilitator_user_id", user.id).in("status", ["envoyee", "vue"]).order("created_at", { ascending: false }).limit(3),
      ]);
      setMissions(missionsRes.data || []);
      setIntroductions(introsRes.data || []);
      setGains(gainsRes.data || []);
      setContactsCount(contactsRes.count || 0);
      setAgentsActifs(agentsRes.count || 0);
      setRecommendationsCount(recoRes.count || 0);
      setRequests(requestsRes.data || []);

      const intros = introsRes.data || [];
      const validees = intros.filter((i: Introduction) => i.statut === "validee").length;
      const total = intros.length;
      const tauxConv = total > 0 ? Math.round((validees / total) * 100) : 0;
      const sc = Math.min(100, tauxConv + Math.min(30, total * 2) + (total >= 5 ? 20 : 0));
      setMyScore(sc);

      setLoading(false);
    };
    load();
  }, [user]);

  const acceptRequest = async (reqId: string) => {
    await db.from("facilitator_requests").update({ status: "acceptee" }).eq("id", reqId);
    setRequests(prev => prev.filter(r => r.id !== reqId));
  };

  const declineRequest = async (reqId: string) => {
    await db.from("facilitator_requests").update({ status: "refusee" }).eq("id", reqId);
    setRequests(prev => prev.filter(r => r.id !== reqId));
  };

  const totalValide = gains.filter(g => g.statut === "valide").reduce((s, g) => s + (g.montant || 0), 0);
  const totalAttendu = gains.filter(g => g.statut === "en_attente").reduce((s, g) => s + (g.montant || 0), 0);
  const nextIntro = introductions.find(i => i.statut === "en_attente");

  return (
    <UserLayout role="facilitateur" jarvisContext="dashboard">
      <VoiceWelcome context="dashboard-facilitateur" userName={prenom} />
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── BLOC 0 — MODE PASSIF ────────────────────────────── */}
        <Link to="/passive" className="rounded-2xl p-5 border flex items-center justify-between gap-4 hover:opacity-90 transition-all" style={{ background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))", border: "1px solid hsl(218 40% 25% / 0.5)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
              <Moon size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Mode passif — Réseau passif</p>
              <p className="text-white/50 text-xs">Importez votre réseau · Partagez des offres · Liens traqués · Gagnez</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-white/50 shrink-0" />
        </Link>

        {/* ── BLOC 1 — STATUT IA ──────────────────────────────────── */}
        <div className="rounded-2xl p-5 border" style={{ background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))", border: "1px solid hsl(218 40% 25% / 0.5)" }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                <Brain size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">OpenClaw — Cerveau actif</p>
                <p className="text-white/50 text-xs">
                  {agentsActifs > 0
                    ? `${agentsActifs} agent${agentsActifs > 1 ? "s" : ""} en activité · Votre prospection avance.`
                    : "Activez vos agents pour démarrer la prospection autonome"}
                </p>
              </div>
            </div>
            <Link to="/agents" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white" style={{ background: "hsl(218 40% 20% / 0.6)", border: "1px solid hsl(218 40% 30% / 0.4)" }}>
              <Bot size={12} /> Agents
            </Link>
          </div>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "hsl(218 40% 25% / 0.4)" }}>
            <p className="text-white/35 text-xs italic flex items-center gap-2">
              <Moon size={11} /> « Va te coucher, je prospecte pendant que tu dors. »
            </p>
          </div>
        </div>

        {/* ── BLOC 1 — BIENVENUE + SCORE ─────────────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold text-foreground mb-1">Bonjour {prenom} 👋</h1>
              <p className="text-muted-foreground text-sm">
                {requests.length > 0
                  ? `${requests.length} entreprise${requests.length > 1 ? "s" : ""} vous ont demandé une introduction.`
                  : recommendationsCount > 0
                    ? `OpenClaw a préparé ${recommendationsCount} recommandation${recommendationsCount > 1 ? "s" : ""} pour vous.`
                    : "Missions, introductions, gains — tout est ici."}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="badge-success"><CheckCircle2 size={12} /> Compte actif</span>
              {myScore > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: myScore >= 70 ? "hsl(152 62% 35%)" : "hsl(var(--muted-foreground))" }}>
                  <Star size={11} /> Score {myScore}/100
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── BLOC 2 — DEMANDES D'INTRODUCTION ───────────────────── */}
        {requests.length > 0 && (
          <div className="rounded-xl border-2 p-5" style={{ borderColor: "hsl(var(--primary))", background: "hsl(var(--secondary))" }}>
            <div className="flex items-center gap-2 mb-3">
              <Bell size={15} className="text-primary" />
              <p className="text-sm font-semibold text-foreground">Demandes d'introduction reçues</p>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "hsl(var(--primary))" }}>{requests.length}</span>
            </div>
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.id} className="bg-background rounded-xl p-4 space-y-3 border border-border">
                  <p className="text-sm font-medium text-foreground">Une entreprise demande votre aide</p>
                  {req.openclaw_note && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "hsl(218 65% 10%)" }}>
                      <Sparkles size={12} className="text-white/60 shrink-0 mt-0.5" />
                      <p className="text-xs text-white/60">{req.openclaw_note}</p>
                    </div>
                  )}
                  {req.request_context && <p className="text-xs text-muted-foreground italic">"{req.request_context}"</p>}
                  <div className="flex gap-2">
                    <button onClick={() => acceptRequest(req.id)} className="flex-1 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: "var(--gradient-primary)" }}>
                      ✓ Accepter
                    </button>
                    <button onClick={() => declineRequest(req.id)} className="flex-1 py-2 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:bg-muted transition-colors">
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BLOC 3 — ACTION PRIORITAIRE ────────────────────────── */}
        {!requests.length && (
          <div className="rounded-xl border-2 p-5" style={{ borderColor: "hsl(var(--accent))", background: "hsl(var(--accent-light))" }}>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} style={{ color: "hsl(var(--accent))" }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(38 80% 30%)" }}>À faire maintenant</p>
            </div>
            {nextIntro ? (
              <>
                <h2 className="font-display text-lg font-bold text-foreground mb-1">Une introduction attend une réponse</h2>
                <p className="text-sm text-muted-foreground mb-4">Votre contact <strong>{nextIntro.contact_nom}</strong> attend.</p>
                <Link to="/introductions" className="btn-cta text-sm py-2.5 px-5 inline-flex">Suivre mes introductions <ArrowRight size={14} /></Link>
              </>
            ) : (
              <>
                <h2 className="font-display text-lg font-bold text-foreground mb-1">
                  {missions.length} mission{missions.length !== 1 ? "s" : ""} disponible{missions.length !== 1 ? "s" : ""}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">Connaissez-vous quelqu'un ? Faites une introduction.</p>
                <Link to="/missions" className="btn-cta text-sm py-2.5 px-5 inline-flex">Voir les missions <ArrowRight size={14} /></Link>
              </>
            )}
          </div>
        )}

        {/* ── BLOC 4 — CHIFFRES ──────────────────────────────────── */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Contacts", value: contactsCount, to: "/contacts" },
              { label: "Introductions", value: introductions.length, to: "/introductions" },
              { label: "Gains validés", value: `${totalValide} €`, to: "/gains" },
              { label: "Score qualité", value: `${myScore}/100`, to: "/profil/facilitateur" },
            ].map(({ label, value, to }) => (
              <Link key={label} to={to} className="card-surface p-4 text-center hover:shadow-md transition-shadow">
                <p className="font-display text-xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
              </Link>
            ))}
          </div>
        )}

        {/* ── BLOC 5 — MISSIONS ──────────────────────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Briefcase size={16} className="text-primary" /> Missions pour vous
            </h2>
            <Link to="/missions" className="text-xs text-primary font-medium hover:underline">Tout voir</Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-6"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : missions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune mission disponible.</p>
          ) : (
            <div className="space-y-2">
              {missions.slice(0, 2).map(m => (
                <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted hover:bg-secondary transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.titre}</p>
                    {m.recompense && <p className="text-xs font-medium mt-0.5" style={{ color: "hsl(var(--success))" }}>{m.recompense}</p>}
                  </div>
                  <Link to={`/missions/${m.id}`} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors shrink-0">Voir</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── BLOC 6 — INTRODUCTIONS + GAINS ────────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Send size={16} className="text-primary" /> Mes introductions
            </h2>
            <Link to="/introductions" className="text-xs text-primary font-medium hover:underline">Tout voir</Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-6"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : introductions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">Aucune introduction.</p>
              <Link to="/missions" className="btn-cta text-sm py-2 px-4 inline-flex">Voir les missions</Link>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {introductions.slice(0, 3).map(intro => {
                  const cfg = statusConfig[intro.statut] || statusConfig.en_cours;
                  return (
                    <Link key={intro.id} to={`/introductions/${intro.id}`} className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
                          {intro.contact_nom.charAt(0)}
                        </div>
                        <p className="text-sm font-medium text-foreground truncate">{intro.contact_nom}</p>
                      </div>
                      <span className="block text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "hsl(var(--success-light))" }}>
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} style={{ color: "hsl(var(--success))" }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "hsl(var(--success))" }}>{totalValide} € validés · {totalAttendu} € en attente</p>
                    <p className="text-xs text-muted-foreground">Votre total de gains</p>
                  </div>
                </div>
                <Link to="/gains" className="text-xs text-primary font-medium hover:underline">Détail</Link>
              </div>
            </>
          )}
        </div>

        {/* ── BLOC 7 — AIDE ──────────────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">Besoin d'aide ?</h2>
              <p className="text-xs text-muted-foreground">JARVIS répond en quelques secondes.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/assistant" className="btn-primary text-sm py-2.5 px-4 flex items-center justify-center gap-1.5">
              <MessageCircle size={14} /> JARVIS
            </Link>
            <Link to="/agents" className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <Brain size={14} /> Agents IA
            </Link>
            <Link to="/profil/facilitateur" className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <Star size={14} /> Mon profil
            </Link>
            <Link to="/signalement" className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
              <Flag size={14} /> Signaler
            </Link>
          </div>
        </div>

      </div>
    </UserLayout>
  );
}
