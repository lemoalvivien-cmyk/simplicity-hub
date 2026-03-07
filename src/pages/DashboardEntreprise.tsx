import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Target, Users, CheckCircle2, ArrowRight, MessageCircle,
  Zap, TrendingUp, Sparkles, Loader2, Brain, ShieldAlert,
  Moon, Bot, Radar, Flag, Star, Send
} from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import VoiceWelcome from "@/components/ai/VoiceWelcome";

interface Mission { id: string; titre: string; statut: string; }
interface Introduction { id: string; contact_nom: string; mission_id: string; statut: string; }
interface SuggestedFacilitator { user_id: string; prenom: string; secteur: string | null; zone: string | null; score: number; }

export default function DashboardEntreprise() {
  const { user, profile } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [introductions, setIntroductions] = useState<Introduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactsCount, setContactsCount] = useState(0);
  const [campagnesCount, setCampagnesCount] = useState(0);
  const [validationsCount, setValidationsCount] = useState(0);
  const [recommendationsCount, setRecommendationsCount] = useState(0);
  const [agentsActifs, setAgentsActifs] = useState(0);
  const [hotOpps, setHotOpps] = useState(0);
  const [newSignals, setNewSignals] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [suggestedFacilitators, setSuggestedFacilitators] = useState<SuggestedFacilitator[]>([]);

  const prenom = profile?.prenom || "vous";

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const missionIds = (await db.from("missions").select("id").eq("entreprise_id", user.id)).data?.map((m: { id: string }) => m.id) || [];
      const [missionsRes, introsRes, contactsRes, campagnesRes, validRes, recoRes, agentsRes, hotOppsRes, sigRes, reqRes, facsRes, profilesRes, introsAllRes] = await Promise.all([
        db.from("missions").select("id, titre, statut").eq("entreprise_id", user.id).limit(3),
        missionIds.length > 0
          ? db.from("introductions").select("id, contact_nom, mission_id, statut").in("mission_id", missionIds).limit(3)
          : Promise.resolve({ data: [] }),
        db.from("contacts").select("id", { count: "exact", head: true }).eq("owner_user_id", user.id),
        db.from("campagnes").select("id", { count: "exact", head: true }).eq("owner_user_id", user.id).eq("statut", "en_cours"),
        db.from("openclaw_validations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("statut", "en_attente"),
        db.from("openclaw_recommendations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "pending"),
        db.from("openclaw_agents").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("statut", "actif"),
        db.from("opportunities").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("intent_label", "eleve").neq("status", "archivee"),
        db.from("signals").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "nouveau"),
        db.from("facilitator_requests").select("id", { count: "exact", head: true }).eq("company_user_id", user.id).eq("status", "envoyee"),
        db.from("facilitateur_profiles").select("*").eq("statut", "actif").limit(20),
        db.from("profiles").select("id, prenom"),
        db.from("introductions").select("facilitateur_id, statut"),
      ]);

      setMissions(missionsRes.data || []);
      setIntroductions(introsRes.data || []);
      setContactsCount(contactsRes.count || 0);
      setCampagnesCount(campagnesRes.count || 0);
      setValidationsCount(validRes.count || 0);
      setRecommendationsCount(recoRes.count || 0);
      setAgentsActifs(agentsRes.count || 0);
      setHotOpps(hotOppsRes.count || 0);
      setNewSignals(sigRes.count || 0);
      setPendingRequests(reqRes.count || 0);

      // Compute top facilitators
      const facs = facsRes.data || [];
      const profiles_ = profilesRes.data || [];
      const introsAll = introsAllRes.data || [];
      const facStats = facs.map((f: { user_id: string; secteur: string | null; zone: string | null }) => {
        const myIntros = introsAll.filter((i: { facilitateur_id: string; statut: string }) => i.facilitateur_id === f.user_id);
        const validees = myIntros.filter((i: { statut: string }) => i.statut === "validee").length;
        const total = myIntros.length;
        const tauxConv = total > 0 ? Math.round((validees / total) * 100) : 0;
        const score = Math.min(100, tauxConv + Math.min(30, total * 2) + (total >= 5 ? 20 : 0));
        const p = profiles_.find((pp: { id: string; prenom: string }) => pp.id === f.user_id);
        return { user_id: f.user_id, prenom: p?.prenom || "Facilitateur", secteur: f.secteur, zone: f.zone, score };
      }).sort((a: { score: number }, b: { score: number }) => b.score - a.score).slice(0, 3);
      setSuggestedFacilitators(facStats);

      setLoading(false);
    };
    load();
  }, [user]);

  const nextAction = introductions.find((i) => i.statut === "en_attente");

  return (
    <UserLayout role="entreprise" jarvisContext="dashboard-entreprise">
      <VoiceWelcome context="dashboard-entreprise" userName={prenom} />
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── BLOC 0 — STATUT IA ──────────────────────────────────── */}
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
                    ? `${agentsActifs} agent${agentsActifs > 1 ? "s" : ""} en activité · Vos agents travaillent déjà.`
                    : "Configurez vos agents pour démarrer"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {validationsCount > 0 && (
                <Link to="/validations" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: "hsl(38 90% 55% / 0.2)", border: "1px solid hsl(38 90% 55% / 0.3)", color: "hsl(38 90% 65%)" }}>
                  <ShieldAlert size={12} /> {validationsCount} validation{validationsCount > 1 ? "s" : ""}
                </Link>
              )}
              <Link to="/agents" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white" style={{ background: "hsl(218 40% 20% / 0.6)", border: "1px solid hsl(218 40% 30% / 0.4)" }}>
                <Bot size={12} /> Agents
              </Link>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "hsl(218 40% 25% / 0.4)" }}>
            <p className="text-white/35 text-xs italic flex items-center gap-2">
              <Moon size={11} /> « Va te coucher, je prospecte pendant que tu dors. »
            </p>
          </div>
        </div>

        {/* ── BLOC 1 — BIENVENUE ─────────────────────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-1">Bonjour {prenom} 👋</h1>
              <p className="text-muted-foreground text-sm">
                {recommendationsCount > 0
                  ? `OpenClaw a préparé ${recommendationsCount} recommandation${recommendationsCount > 1 ? "s" : ""} pour vous.`
                  : "Votre espace est prêt. Vos agents peuvent commencer à travailler."}
              </p>
            </div>
            <span className="badge-success shrink-0"><CheckCircle2 size={12} /> Compte actif</span>
          </div>
          {recommendationsCount > 0 && (
            <div className="mt-4 flex gap-2">
              <Link to="/pilotage" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold" style={{ background: "hsl(24 100% 52% / 0.1)", border: "1px solid hsl(24 100% 52% / 0.25)", color: "hsl(24 100% 52%)" }}>
                <Sparkles size={12} /> Voir les recommandations
              </Link>
              <Link to="/validations" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold" style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}>
                <ShieldAlert size={12} /> Mes validations
              </Link>
            </div>
          )}
        </div>

        {/* ── BLOC 2 — ACTION PRIORITAIRE ────────────────────────── */}
        {nextAction && (
          <div className="rounded-xl border-2 p-5" style={{ borderColor: "hsl(var(--accent))", background: "hsl(var(--accent-light))" }}>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} style={{ color: "hsl(var(--accent))" }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(38 80% 30%)" }}>Action prioritaire</p>
            </div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">Une introduction attend votre validation</h2>
            <p className="text-sm text-muted-foreground mb-4"><strong>{nextAction.contact_nom}</strong> a été présenté pour une de vos missions.</p>
            <Link to="/entreprise/introductions" className="btn-cta text-sm py-2.5 px-5 inline-flex">Voir l'introduction <ArrowRight size={14} /></Link>
          </div>
        )}

        {/* ── BLOC 3 — CHIFFRES CLÉS ─────────────────────────────── */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Contacts", value: contactsCount, icon: Users, to: "/contacts" },
              { label: "Campagnes actives", value: campagnesCount, icon: Zap, to: "/campagnes" },
              { label: "Validations", value: validationsCount, icon: ShieldAlert, to: "/validations" },
              { label: "Recommandations IA", value: recommendationsCount, icon: Sparkles, to: "/pilotage" },
            ].map(({ label, value, icon: Icon, to }) => (
              <Link key={label} to={to} className="card-surface p-4 text-center hover:shadow-md transition-shadow">
                <Icon size={16} className="mx-auto mb-1.5 text-muted-foreground" />
                <p className="font-display text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
              </Link>
            ))}
          </div>
        )}

        {/* ── BLOC 3b — DEAL RADAR ───────────────────────────────── */}
        {!loading && (hotOpps > 0 || newSignals > 0) && (
          <Link to="/radar" className="rounded-xl p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-all" style={{ background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))", border: "1px solid hsl(218 40% 25% / 0.5)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                <Radar size={16} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Deal Radar</p>
                <p className="text-white/50 text-xs">
                  {hotOpps > 0
                    ? `${hotOpps} opportunité${hotOpps > 1 ? "s" : ""} à fort potentiel détectée${hotOpps > 1 ? "s" : ""}`
                    : `${newSignals} signal${newSignals > 1 ? "s" : ""} récent${newSignals > 1 ? "s" : ""} à explorer`}
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="text-white/50 shrink-0" />
          </Link>
        )}

        {/* ── BLOC 4 — FACILITATEURS RECOMMANDÉS ─────────────────── */}
        {!loading && suggestedFacilitators.length > 0 && (
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Star size={15} className="text-muted-foreground" />
                Facilitateurs recommandés
                {pendingRequests > 0 && (
                  <span className="text-xs text-muted-foreground font-normal">· {pendingRequests} demande{pendingRequests > 1 ? "s" : ""} en attente</span>
                )}
              </h2>
              <Link to="/facilitateurs" className="text-xs text-primary font-medium hover:underline">Voir tous</Link>
            </div>
            <div className="space-y-2 mb-3">
              {suggestedFacilitators.map((f, idx) => (
                <div key={f.user_id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted hover:bg-secondary transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
                      style={{ background: idx === 0 ? "var(--gradient-accent)" : "var(--gradient-primary)" }}>
                      {f.prenom.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{f.prenom}</p>
                      <p className="text-xs text-muted-foreground truncate">{f.secteur || f.zone || "Facilitateur actif"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold" style={{ color: f.score >= 70 ? "hsl(152 62% 35%)" : f.score >= 50 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
                      {f.score}/100
                    </span>
                    <Link to={`/facilitateurs/${f.user_id}?action=request`} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white" style={{ background: "var(--gradient-primary)" }}>
                      Contacter
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles size={11} /> OpenClaw sélectionne ces profils selon votre secteur et vos missions.
            </p>
          </div>
        )}

        {/* ── BLOC 5 — MISSIONS & INTRODUCTIONS ──────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Target size={16} className="text-primary" /> Apport d'affaires
            </h2>
            <Link to="/entreprise/introductions" className="text-xs text-primary font-medium hover:underline">Voir tout</Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-6"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : missions.length === 0 ? (
            <div className="text-center py-6">
              <Target size={28} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Aucune mission créée.</p>
              <Link to="/missions" className="btn-cta text-sm py-2 px-4 inline-flex">Créer une mission</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {missions.map(m => (
                <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "hsl(var(--success))" }} />
                    <p className="text-sm font-medium text-foreground">{m.titre}</p>
                  </div>
                  <Link to={`/missions/${m.id}`} className="text-xs text-primary font-medium hover:underline shrink-0">Voir</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── BLOC 6 — RÉSULTATS ─────────────────────────────────── */}
        <div className="card-surface p-5">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" /> Résultats
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Introductions reçues", value: introductions.length, color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
              { label: "Validées", value: introductions.filter(i => i.statut === "validee").length, color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
              { label: "Missions actives", value: missions.filter(m => m.statut === "active").length, color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
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
          <div className="grid grid-cols-2 gap-2">
            <Link to="/assistant" className="btn-primary text-sm py-2.5 px-4 flex items-center justify-center gap-1.5">
              <MessageCircle size={14} /> JARVIS
            </Link>
            <Link to="/radar" className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <Radar size={14} /> Deal Radar
            </Link>
            <Link to="/facilitateurs" className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <Users size={14} /> Facilitateurs
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
