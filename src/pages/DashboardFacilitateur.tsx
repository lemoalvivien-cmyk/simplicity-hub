import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import { Briefcase, Send, TrendingUp, CheckCircle2, ArrowRight, MessageCircle, Users, Zap, Search, Sparkles, Loader2, Brain, Moon, Bot, ShieldAlert, Flag } from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import VoiceWelcome from "@/components/ai/VoiceWelcome";

interface Mission { id: string; titre: string; recompense: string; entreprise_id: string; }
interface Introduction { id: string; contact_nom: string; mission_id: string; statut: string; created_at: string; }
interface Gain { id: string; montant: number; statut: string; }

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
  const [loading, setLoading] = useState(true);
  const [contactsCount, setContactsCount] = useState(0);
  const [agentsActifs, setAgentsActifs] = useState(0);
  const [recommendationsCount, setRecommendationsCount] = useState(0);

  const prenom = profile?.prenom || "vous";

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [missionsRes, introsRes, gainsRes, contactsRes, agentsRes, recoRes] = await Promise.all([
        db.from("missions").select("id, titre, recompense, entreprise_id").eq("statut", "active").limit(3),
        db.from("introductions").select("id, contact_nom, mission_id, statut, created_at").eq("facilitateur_id", user.id).order("created_at", { ascending: false }).limit(3),
        db.from("gains").select("id, montant, statut").eq("facilitateur_id", user.id),
        db.from("contacts").select("id", { count: "exact", head: true }).eq("owner_user_id", user.id),
        db.from("openclaw_agents").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("statut", "actif"),
        db.from("openclaw_recommendations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "pending"),
      ]);
      setMissions(missionsRes.data || []);
      setIntroductions(introsRes.data || []);
      setGains(gainsRes.data || []);
      setContactsCount(contactsRes.count || 0);
      setAgentsActifs(agentsRes.count || 0);
      setRecommendationsCount(recoRes.count || 0);
      setLoading(false);
    };
    load();
  }, [user]);

  const totalValide = gains.filter(g => g.statut === "valide").reduce((s, g) => s + g.montant, 0);
  const totalAttendu = gains.filter(g => g.statut === "en_attente").reduce((s, g) => s + g.montant, 0);
  const nextIntro = introductions.find(i => i.statut === "en_attente");

  return (
    <UserLayout role="facilitateur" jarvisContext="dashboard">
      <VoiceWelcome context="dashboard-facilitateur" userName={prenom} />
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── BLOC 0 — STATUT IA ──────────────────────────────────── */}
        <div
          className="rounded-2xl p-5 border"
          style={{
            background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))",
            border: "1px solid hsl(218 40% 25% / 0.5)",
          }}
        >
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
            <Link
              to="/agents"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/70 transition-colors hover:text-white"
              style={{ background: "hsl(218 40% 20% / 0.6)", border: "1px solid hsl(218 40% 30% / 0.4)" }}
            >
              <Bot size={12} />
              Agents
            </Link>
          </div>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "hsl(218 40% 25% / 0.4)" }}>
            <p className="text-white/35 text-xs italic flex items-center gap-2">
              <Moon size={11} />
              « Va te coucher, je prospecte pendant que tu dors. »
            </p>
          </div>
        </div>

        {/* ── BLOC 1 — BIENVENUE ─────────────────────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                Bonjour {prenom} 👋
              </h1>
              <p className="text-muted-foreground text-sm">
                {recommendationsCount > 0
                  ? `OpenClaw a préparé ${recommendationsCount} recommandation${recommendationsCount > 1 ? "s" : ""} pour vous.`
                  : "Missions, introductions, prospection — tout est ici."}
              </p>
            </div>
            <span className="badge-success shrink-0"><CheckCircle2 size={12} /> Compte actif</span>
          </div>
        </div>

        {/* ── BLOC 2 — ACTION PRIORITAIRE ────────────────────────── */}
        <div
          className="rounded-xl border-2 p-5"
          style={{ borderColor: "hsl(var(--accent))", background: "hsl(var(--accent-light))" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} style={{ color: "hsl(var(--accent))" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(38 80% 30%)" }}>
              À faire maintenant
            </p>
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
                {missions.length} mission{missions.length !== 1 ? "s" : ""} disponible{missions.length !== 1 ? "s" : ""} pour vous
              </h2>
              <p className="text-sm text-muted-foreground mb-4">Connaissez-vous quelqu'un ? Faites une introduction.</p>
              <Link to="/missions" className="btn-cta text-sm py-2.5 px-5 inline-flex">Voir les missions <ArrowRight size={14} /></Link>
            </>
          )}
        </div>

        {/* ── BLOC 3 — CHIFFRES ──────────────────────────────────── */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Contacts", value: contactsCount, to: "/contacts" },
              { label: "Introductions", value: introductions.length, to: "/introductions" },
              { label: "Gains validés", value: `${totalValide} €`, to: "/gains" },
              { label: "Recommandations IA", value: recommendationsCount, to: "/pilotage" },
            ].map(({ label, value, to }) => (
              <Link key={label} to={to} className="card-surface p-4 text-center hover:shadow-md transition-shadow">
                <p className="font-display text-xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
              </Link>
            ))}
          </div>
        )}

        {/* ── BLOC 4 — MISSIONS ──────────────────────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Briefcase size={16} className="text-primary" />
              Missions pour vous
            </h2>
            <Link to="/missions" className="text-xs text-primary font-medium hover:underline">Tout voir</Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-6"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : missions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune mission disponible.</p>
          ) : (
            <div className="space-y-2">
              {missions.slice(0, 2).map((m) => (
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

        {/* ── BLOC 5 — INTRODUCTIONS + GAINS ────────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Send size={16} className="text-primary" />
              Mes introductions
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
                {introductions.map((intro) => {
                  const cfg = statusConfig[intro.statut] || statusConfig.en_cours;
                  return (
                    <Link key={intro.id} to={`/introductions/${intro.id}`}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                          style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
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

        {/* ── BLOC 6 — PROSPECTION ───────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Search size={16} className="text-primary" />
              Ma prospection
            </h2>
            <Link to="/contacts" className="text-xs text-primary font-medium hover:underline">Voir les contacts</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Contacts", value: contactsCount, color: "hsl(var(--foreground))", bg: "hsl(var(--muted))" },
              { label: "Introductions", value: introductions.length, color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Link to="/contacts/import" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors">
              <Users size={12} /> Importer
            </Link>
            <Link to="/campagnes" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-primary text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
              Campagnes
            </Link>
          </div>
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
          <div className="flex gap-2">
            <Link to="/assistant" className="btn-primary text-sm py-2.5 px-4 flex-1 justify-center">
              <MessageCircle size={14} /> Ouvrir JARVIS
            </Link>
            <Link to="/agents" className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <Brain size={14} /> Agents IA
            </Link>
          </div>
        </div>

      </div>
    </UserLayout>
  );
}
