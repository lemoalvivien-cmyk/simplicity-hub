import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import { Target, Users, CheckCircle2, ArrowRight, MessageCircle, HelpCircle, Zap, Play, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Mission {
  id: string;
  titre: string;
  statut: string;
}

interface Introduction {
  id: string;
  contact_nom: string;
  mission_id: string;
  statut: string;
}

export default function DashboardEntreprise() {
  const { user, profile } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [introductions, setIntroductions] = useState<Introduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactsCount, setContactsCount] = useState(0);
  const [campagnesCount, setCampagnesCount] = useState(0);

  const prenom = profile?.prenom || "vous";

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [missionsRes, introsRes, contactsRes, campagnesRes] = await Promise.all([
        db.from("missions").select("id, titre, statut").eq("entreprise_id", user.id).limit(3),
        db.from("introductions").select("id, contact_nom, mission_id, statut")
          .in("mission_id", (await db.from("missions").select("id").eq("entreprise_id", user.id)).data?.map((m: Mission) => m.id) || [])
          .limit(3),
        db.from("contacts").select("id", { count: "exact", head: true }).eq("owner_user_id", user.id),
        db.from("campagnes").select("id", { count: "exact", head: true }).eq("owner_user_id", user.id).eq("statut", "en_cours"),
      ]);
      setMissions(missionsRes.data || []);
      setIntroductions(introsRes.data || []);
      setContactsCount(contactsRes.count || 0);
      setCampagnesCount(campagnesRes.count || 0);
      setLoading(false);
    };
    load();
  }, [user]);

  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    en_attente: { color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", label: "À valider" },
    validee: { color: "hsl(var(--success))", bg: "hsl(var(--success-light))", label: "Validée" },
    en_cours: { color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", label: "En cours" },
    refusee: { color: "hsl(var(--destructive))", bg: "hsl(0 72% 95%)", label: "Refusée" },
  };

  const nextAction = introductions.find((i) => i.statut === "en_attente");

  return (
    <UserLayout role="entreprise">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── BLOC 1 — BIENVENUE ─────────────────────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                Bonjour {prenom} 👋
              </h1>
              <p className="text-muted-foreground text-sm">
                Voici votre tableau de bord. Prospection et apport d'affaires en un seul endroit.
              </p>
            </div>
            <span className="badge-success shrink-0">
              <CheckCircle2 size={12} />
              Compte actif
            </span>
          </div>
        </div>

        {/* ── BLOC 2 — ACTION PRIORITAIRE ────────────────────────── */}
        {nextAction && (
          <div
            className="rounded-xl border-2 p-5"
            style={{ borderColor: "hsl(var(--accent))", background: "hsl(var(--accent-light))" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} style={{ color: "hsl(var(--accent))" }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(38 80% 30%)" }}>
                Action prioritaire
              </p>
            </div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">
              Une introduction attend votre validation
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>{nextAction.contact_nom}</strong> a été présenté pour une de vos missions.
              Validez ou refusez ce contact en moins d'une minute.
            </p>
            <Link to="/entreprise/introductions" className="btn-cta text-sm py-2.5 px-5 inline-flex">
              Voir l'introduction <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* ── BLOC 3 — PROSPECTION EN COURS ──────────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Zap size={16} className="text-primary" />
              Ma prospection
            </h2>
            <Link to="/contacts" className="text-xs text-primary font-medium hover:underline">
              Voir les contacts
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Contacts", value: contactsCount, color: "hsl(var(--foreground))", bg: "hsl(var(--muted))" },
                  { label: "Campagnes actives", value: campagnesCount, color: "hsl(220 80% 45%)", bg: "hsl(220 80% 95%)" },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                    <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Link to="/campagnes" className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Play size={12} /> Campagnes
                </Link>
                <Link to="/actions" className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-border text-foreground hover:bg-muted transition-colors">
                  <Zap size={12} /> À faire
                </Link>
                <Link to="/listes" className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-border text-foreground hover:bg-muted transition-colors">
                  <Users size={12} /> Listes
                </Link>
              </div>
            </>
          )}
        </div>

        {/* ── BLOC 4 — MISSIONS & INTRODUCTIONS ──────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Target size={16} className="text-primary" />
              Apport d'affaires
            </h2>
            <Link to="/entreprise/introductions" className="text-xs text-primary font-medium hover:underline">
              Voir tout
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : missions.length === 0 ? (
            <div className="text-center py-6">
              <Target size={28} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Aucune mission créée pour l'instant.</p>
              <Link to="/missions" className="btn-cta text-sm py-2 px-4 inline-flex">
                Créer une mission
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {missions.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "hsl(var(--success))" }} />
                      <p className="text-sm font-medium text-foreground">{m.titre}</p>
                    </div>
                    <Link to={`/missions/${m.id}`} className="text-xs text-primary font-medium hover:underline shrink-0">
                      Voir
                    </Link>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {introductions.map((intro) => {
                  const cfg = statusConfig[intro.statut] || statusConfig.en_cours;
                  return (
                    <Link key={intro.id} to="/entreprise/introductions"
                      className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                          style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
                          {intro.contact_nom.charAt(0)}
                        </div>
                        <p className="text-sm text-foreground truncate">{intro.contact_nom}</p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{ color: cfg.color, background: cfg.bg }}>
                        {cfg.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── BLOC 5 — RÉSULTATS ─────────────────────────────────── */}
        <div className="card-surface p-5">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            Résultats
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

        {/* ── BLOC 6 — AIDE ──────────────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles size={16} style={{ color: "hsl(var(--primary-foreground))" }} />
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
            <Link to="/help" className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <HelpCircle size={14} /> Aide
            </Link>
          </div>
        </div>

      </div>
    </UserLayout>
  );
}
