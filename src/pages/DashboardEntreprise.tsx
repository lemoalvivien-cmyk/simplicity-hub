/**
 * Dashboard Entreprise — Pilotage de la force passive distribuée
 * "Pilotez une force commerciale passive et distribuée."
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Target, Users, CheckCircle2, ArrowRight, Zap, TrendingUp,
  Sparkles, Loader2, Brain, ShieldAlert, Moon, Bot, Radar,
  Star, Send, Link2, Share2, BarChart3, Plus, Flame, Bell
} from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import VoiceWelcome from "@/components/ai/VoiceWelcome";

interface Mission { id: string; titre: string; statut: string; }
interface Introduction { id: string; contact_nom: string; statut: string; }
interface SuggestedFacilitator { user_id: string; prenom: string; secteur: string | null; zone: string | null; score: number; languages: string[]; }

export default function DashboardEntreprise() {
  const { user, profile } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [introductions, setIntroductions] = useState<Introduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [validationsCount, setValidationsCount] = useState(0);
  const [recommendationsCount, setRecommendationsCount] = useState(0);
  const [agentsActifs, setAgentsActifs] = useState(0);
  const [hotOpps, setHotOpps] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [suggestedFacilitators, setSuggestedFacilitators] = useState<SuggestedFacilitator[]>([]);
  const [sharedOffersCount, setSharedOffersCount] = useState(0);
  const [totalShareClicks, setTotalShareClicks] = useState(0);
  const [activeFacilitatorsCount, setActiveFacilitatorsCount] = useState(0);
  const [passiveAlerts, setPassiveAlerts] = useState<{ id: string; title: string; message: string; type: string; read: boolean }[]>([]);

  const prenom = profile?.prenom || "vous";

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const missionIds = (await db.from("missions").select("id").eq("entreprise_id", user.id)).data?.map((m: { id: string }) => m.id) || [];

      const [missionsRes, introsRes, validRes, recoRes, agentsRes, hotOppsRes, reqRes,
        facsRes, profilesRes, introsAllRes, offersRes, shareLinksRes, alertsRes] = await Promise.all([
        db.from("missions").select("id, titre, statut").eq("entreprise_id", user.id).limit(3),
        missionIds.length > 0
          ? db.from("introductions").select("id, contact_nom, statut").in("mission_id", missionIds).limit(3)
          : Promise.resolve({ data: [] }),
        db.from("openclaw_validations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("statut", "en_attente"),
        db.from("openclaw_recommendations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "pending"),
        db.from("openclaw_agents").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("statut", "actif"),
        db.from("opportunities").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("intent_label", "eleve").neq("status", "archivee"),
        db.from("facilitator_requests").select("id", { count: "exact", head: true }).eq("company_user_id", user.id).eq("status", "envoyee"),
        db.from("facilitateur_profiles").select("user_id, secteur, zone, languages, average_rating, total_reviews").eq("statut", "actif").limit(20),
        db.from("profiles").select("id, prenom"),
        db.from("introductions").select("facilitateur_id, statut"),
        db.from("shared_offers").select("id", { count: "exact", head: true }).eq("company_user_id", user.id),
        db.from("offer_share_links").select("clicks_count, facilitator_id").eq("company_id", user.id),
        db.from("passive_alerts").select("id, title, message, type, read").eq("user_id", user.id).eq("read", false).order("created_at", { ascending: false }).limit(3),
      ]);

      setMissions(missionsRes.data || []);
      setIntroductions(introsRes.data || []);
      setValidationsCount(validRes.count || 0);
      setRecommendationsCount(recoRes.count || 0);
      setAgentsActifs(agentsRes.count || 0);
      setHotOpps(hotOppsRes.count || 0);
      setPendingRequests(reqRes.count || 0);
      setSharedOffersCount(offersRes.count || 0);

      const shareLinks = shareLinksRes.data || [];
      setTotalShareClicks(shareLinks.reduce((s: number, l: { clicks_count: number }) => s + (l.clicks_count || 0), 0));
      const uniqueFacilitators = new Set(shareLinks.map((l: { facilitator_id: string }) => l.facilitator_id));
      setActiveFacilitatorsCount(uniqueFacilitators.size);
      setPassiveAlerts(alertsRes.data || []);

      // Compute top facilitators
      const facs = facsRes.data || [];
      const profiles_ = profilesRes.data || [];
      const introsAll = introsAllRes.data || [];
      const facStats = facs.map((f: { user_id: string; secteur: string | null; zone: string | null; languages: string[]; average_rating: number | null; total_reviews: number | null }) => {
        const myIntros = introsAll.filter((i: { facilitateur_id: string; statut: string }) => i.facilitateur_id === f.user_id);
        const validees = myIntros.filter((i: { statut: string }) => i.statut === "validee").length;
        const total = myIntros.length;
        const tauxConv = total > 0 ? Math.round((validees / total) * 100) : 0;
        const score = Math.min(100, tauxConv + Math.min(30, total * 2) + (total >= 5 ? 20 : 0));
        const p = profiles_.find((pp: { id: string; prenom: string }) => pp.id === f.user_id);
        return { user_id: f.user_id, prenom: p?.prenom || "Facilitateur", secteur: f.secteur, zone: f.zone, score, languages: f.languages || [] };
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
      <div className="max-w-2xl mx-auto space-y-4">

        {/* ── OPENCLAW STATUS ──────────────────────────────── */}
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
                <p className="font-bold text-white text-sm">Bonjour {prenom} 👋</p>
                <p className="text-white/50 text-xs mt-0.5">
                  {agentsActifs > 0
                    ? `${agentsActifs} agent${agentsActifs > 1 ? "s" : ""} actif${agentsActifs > 1 ? "s" : ""} · Votre force passive travaille.`
                    : "Activez vos agents pour démarrer"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {validationsCount > 0 && (
                <Link to="/validations" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{
                  background: "hsl(38 90% 55% / 0.2)",
                  border: "1px solid hsl(38 90% 55% / 0.3)",
                  color: "hsl(38 90% 65%)"
                }}>
                  <ShieldAlert size={12} /> {validationsCount} validation{validationsCount > 1 ? "s" : ""}
                </Link>
              )}
              <Link to="/agents" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white" style={{
                background: "hsl(218 40% 20% / 0.6)",
                border: "1px solid hsl(218 40% 30% / 0.4)"
              }}>
                <Bot size={12} /> Agents
              </Link>
            </div>
          </div>
          <div className="relative z-10 mt-4 pt-3 border-t" style={{ borderColor: "hsl(218 40% 22% / 0.4)" }}>
            <p className="text-white/35 text-xs italic flex items-center gap-2">
              <Moon size={11} /> « Va te coucher, je prospecte pendant que tu dors. »
            </p>
          </div>
        </div>

        {/* ── FORCE PASSIVE — PILOTAGE ─────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Share2 size={14} className="text-primary" /> Force passive distribuée
            </h2>
            <Link to="/offres" className="text-xs text-primary font-medium hover:underline">Gérer</Link>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {loading ? (
              <div className="col-span-3 flex items-center justify-center py-4"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
            ) : [
              { label: "Offres publiées", value: sharedOffersCount, icon: Share2, color: "hsl(var(--primary))" },
              { label: "Facilitateurs actifs", value: activeFacilitatorsCount, icon: Users, color: "hsl(152 62% 35%)" },
              { label: "Clics générés", value: totalShareClicks, icon: Link2, color: "hsl(38 80% 35%)" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="text-center py-3 rounded-xl bg-muted">
                <Icon size={14} className="mx-auto mb-1.5" style={{ color }} />
                <p className="font-bold text-xl text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>
          <Link
            to="/offres"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plus size={13} /> Publier une nouvelle offre
          </Link>
        </div>

        {/* ── ACTION PRIORITAIRE ───────────────────────────── */}
        {nextAction && (
          <div className="rounded-xl border-2 p-5" style={{ borderColor: "hsl(var(--accent))", background: "hsl(var(--accent-light))" }}>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} style={{ color: "hsl(var(--accent))" }} />
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(38 80% 30%)" }}>Action prioritaire</p>
            </div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">Une introduction attend votre validation</h2>
            <p className="text-sm text-muted-foreground mb-4"><strong>{nextAction.contact_nom}</strong> a été présenté pour une de vos missions.</p>
            <Link to="/entreprise/introductions" className="btn-cta text-sm py-2.5 px-5 inline-flex">
              Valider l'introduction <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* ── CHIFFRES CLÉS ────────────────────────────────── */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Opportunités chaudes", value: hotOpps, icon: Radar, to: "/radar", color: "hsl(var(--primary))" },
              { label: "Validations", value: validationsCount, icon: ShieldAlert, to: "/validations", color: "hsl(38 80% 35%)" },
              { label: "Recommandations IA", value: recommendationsCount, icon: Sparkles, to: "/pilotage", color: "hsl(24 100% 52%)" },
              { label: "Demandes envoyées", value: pendingRequests, icon: Send, to: "/facilitateurs", color: "hsl(152 62% 35%)" },
            ].map(({ label, value, icon: Icon, to, color }) => (
              <Link key={label} to={to} className="card-surface p-4 text-center hover:shadow-md transition-shadow">
                <Icon size={16} className="mx-auto mb-1.5" style={{ color }} />
                <p className="font-display text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
              </Link>
            ))}
          </div>
        )}

        {/* ── ALERTES PASSIVES ─────────────────────────────── */}
        {!loading && passiveAlerts.length > 0 && (
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Bell size={14} className="text-primary" /> Alertes passives
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "hsl(24 100% 52%)" }}>
                  {passiveAlerts.length}
                </span>
              </h2>
              <Link to="/chaud" className="text-xs text-primary font-medium hover:underline">Tout voir</Link>
            </div>
            <div className="space-y-2">
              {passiveAlerts.map(alert => (
                <div key={alert.id} className="p-3 rounded-xl flex items-start gap-2.5" style={{
                  background: "hsl(24 100% 52% / 0.06)",
                  border: "1px solid hsl(24 100% 52% / 0.2)"
                }}>
                  <Flame size={13} className="shrink-0 mt-0.5" style={{ color: "hsl(24 100% 52%)" }} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-snug">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CE QUI CHAUFFE — CTA ─────────────────────────── */}
        {!loading && (
          <Link to="/chaud" className="rounded-xl p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-all" style={{
            background: "linear-gradient(135deg, hsl(24 80% 8%), hsl(38 70% 11%))",
            border: "1px solid hsl(24 100% 52% / 0.3)"
          }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, hsl(24 100% 52%), hsl(38 80% 45%))" }}>
                <Flame size={16} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Ce qui chauffe</p>
                <p className="text-white/50 text-xs">Leads chauds · Intérêts passifs · Opportunités</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-white/50 shrink-0" />
          </Link>
        )}

        {/* ── DEAL RADAR ───────────────────────────────────── */}
        {!loading && hotOpps > 0 && (
          <Link to="/radar" className="rounded-xl p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-all" style={{
            background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))",
            border: "1px solid hsl(218 40% 25% / 0.5)"
          }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                <Radar size={16} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Deal Radar</p>
                <p className="text-white/50 text-xs">{hotOpps} opportunité{hotOpps > 1 ? "s" : ""} à fort potentiel détectée{hotOpps > 1 ? "s" : ""}</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-white/50 shrink-0" />
          </Link>
        )}

        {/* ── FACILITATEURS RECOMMANDÉS ────────────────────── */}
        {!loading && suggestedFacilitators.length > 0 && (
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Star size={14} className="text-muted-foreground" /> Facilitateurs recommandés
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {f.secteur && <span className="text-xs text-muted-foreground truncate">{f.secteur}</span>}
                        {f.languages.slice(0, 2).map(lang => (
                          <span key={lang} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{lang.toUpperCase()}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold" style={{ color: f.score >= 70 ? "hsl(152 62% 35%)" : f.score >= 50 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
                      {f.score}/100
                    </span>
                    <Link to={`/facilitateurs/${f.user_id}?action=request`}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white"
                      style={{ background: "var(--gradient-primary)" }}>
                      Contacter
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles size={11} /> OpenClaw sélectionne ces profils selon votre secteur, langue et corridors.
            </p>
          </div>
        )}

        {/* ── MISSIONS & INTRODUCTIONS ─────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Target size={14} className="text-primary" /> Apport d'affaires
            </h2>
            <Link to="/entreprise/introductions" className="text-xs text-primary font-medium hover:underline">Voir tout</Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-5"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
          ) : missions.length === 0 ? (
            <div className="text-center py-6">
              <Target size={26} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Aucune mission créée.</p>
              <Link to="/missions" className="btn-cta text-sm py-2 px-4 inline-flex">Créer une mission</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {missions.map(m => (
                <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "hsl(var(--success))" }} />
                    <p className="text-sm font-medium text-foreground truncate">{m.titre}</p>
                  </div>
                  <Link to={`/missions/${m.id}`} className="text-xs text-primary font-medium hover:underline shrink-0">Voir</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RÉSULTATS ─────────────────────────────────────── */}
        <div className="card-surface p-5">
          <h2 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" /> Résultats introductions
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-4"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Reçues", value: introductions.length, color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
                { label: "Validées", value: introductions.filter(i => i.statut === "validee").length, color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
                { label: "Missions actives", value: missions.filter(m => m.statut === "active").length, color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className="text-center py-3 rounded-xl" style={{ background: bg }}>
                  <p className="text-xl font-bold" style={{ color }}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </UserLayout>
  );
}
