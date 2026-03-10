/**
 * Pilotage — Centre de pilotage
 * Données réelles depuis la base de données (plus de mocks).
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Zap, Play, Target, TrendingUp, Sparkles, ArrowRight,
  CheckCircle2, Phone, Mail, Clock, MessageCircle,
  BarChart2, Users, ChevronRight, Activity, Radar, Brain,
  AlertTriangle, Loader2, WifiOff,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

/* ─── TYPES ────────────────────────────────────────────────── */
type ActionType = "email" | "phone" | string;
type OrigineType = "introduction" | "prospection" | "campagne" | "mission";

const origineConfig: Record<string, { label: string; color: string; bg: string }> = {
  introduction: { label: "Introduction", color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
  prospection:  { label: "Prospection",  color: "hsl(220 80% 45%)", bg: "hsl(220 80% 95%)" },
  campagne:     { label: "Campagne",     color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
  mission:      { label: "Mission",      color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
  radar:        { label: "Radar",        color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
};

const statusOpportunite: Record<string, { label: string; color: string; bg: string }> = {
  nouvelle:   { label: "Nouvelle",   color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
  en_attente: { label: "En attente", color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
  en_cours:   { label: "En cours",   color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
  a_traiter:  { label: "À traiter",  color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
  valide:     { label: "Validée",    color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
};

const actionTypeIcon: Record<string, JSX.Element> = {
  email:    <Mail size={13} />,
  phone:    <Phone size={13} />,
  message:  <MessageCircle size={13} />,
  relance:  <Zap size={13} />,
};

/* ─── MODES D'ACTION ───────────────────────────────────────── */
const modes = [
  { id: "manuel",   icon: <CheckCircle2 size={16} />, label: "Manuel",    desc: "Vous pilotez tout vous-même.", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
  { id: "assiste",  icon: <Sparkles size={16} />,     label: "Assisté",   desc: "JARVIS vous guide. Vous gardez la main.", color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", active: true },
  { id: "semi_auto",icon: <Activity size={16} />,     label: "Semi-auto", desc: "Campagnes auto. Vous validez les étapes clés.", color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
];

/* ─── COMPOSANT PRINCIPAL ──────────────────────────────────── */
export default function Pilotage() {
  const { user } = useAuth();
  const [modeActif, setModeActif] = useState("assiste");
  const [loading, setLoading] = useState(true);

  // Real data
  const [actions, setActions] = useState<{
    id: string; titre: string; type_action: string; canal: string | null; statut: string | null;
    due_at: string | null; campagne_id: string | null;
  }[]>([]);
  const [campagnes, setCampagnes] = useState<{
    id: string; nom: string; statut: string | null; mode_action: string | null;
  }[]>([]);
  const [opportunites, setOpportunites] = useState<{
    id: string; company_name: string; summary: string; status: string; origin: string; intent_score: number;
  }[]>([]);
  const [gains, setGains] = useState({ en_attente: 0, valide: 0, recu: 0 });
  const [validationsPending, setValidationsPending] = useState(0);
  const [openClawConnected, setOpenClawConnected] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [actionsRes, campRes, oppsRes, gainsRes, validRes, configRes] = await Promise.all([
        supabase.from("actions")
          .select("id, titre, type_action, canal, statut, due_at, campagne_id")
          .eq("owner_user_id", user.id)
          .eq("statut", "a_faire")
          .order("due_at", { ascending: true, nullsFirst: false })
          .limit(5),
        supabase.from("campagnes")
          .select("id, nom, statut, mode_action")
          .eq("owner_user_id", user.id)
          .eq("statut", "active")
          .limit(3),
        db.from("opportunities")
          .select("id, company_name, summary, status, origin, intent_score")
          .eq("user_id", user.id)
          .order("intent_score", { ascending: false })
          .limit(5),
        supabase.from("gains")
          .select("montant, statut")
          .eq("facilitateur_id", user.id),
        db.from("openclaw_validations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("statut", "en_attente"),
        db.from("openclaw_config")
          .select("is_connected, kill_switch_global")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      setActions(actionsRes.data ?? []);
      setCampagnes(campRes.data ?? []);
      setOpportunites((oppsRes.data ?? []) as typeof opportunites);

      // Gains aggregation
      const gainsData = gainsRes.data ?? [];
      const agg = { en_attente: 0, valide: 0, recu: 0 };
      gainsData.forEach((g: { montant: number | null; statut: string | null }) => {
        const m = g.montant ?? 0;
        if (g.statut === "en_attente") agg.en_attente += m;
        else if (g.statut === "valide") agg.valide += m;
        else if (g.statut === "recu") agg.recu += m;
      });
      setGains(agg);

      setValidationsPending(validRes.count ?? 0);
      const cfg = configRes.data as { is_connected: boolean; kill_switch_global: boolean } | null;
      setOpenClawConnected((cfg?.is_connected ?? false) && !(cfg?.kill_switch_global ?? false));
      setLoading(false);
    };
    load();
  }, [user]);

  const fmtMontant = (n: number) => n > 0 ? `${n.toLocaleString("fr-FR")} €` : "—";

  if (loading) {
    return (
      <UserLayout jarvisContext="dashboard">
        <div className="flex items-center justify-center h-48">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout jarvisContext="dashboard">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
              <Activity size={22} className="text-primary" />
              Centre de pilotage
            </h1>
            <p className="text-sm text-muted-foreground">
              Voici ce qui mérite votre attention aujourd'hui.
            </p>
          </div>
          {validationsPending > 0 && (
            <Link to="/validations"
              className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
              style={{ background: "hsl(38 80% 90%)", color: "hsl(38 80% 30%)", border: "1px solid hsl(38 80% 70%)" }}>
              <AlertTriangle size={11} />
              {validationsPending} validation{validationsPending > 1 ? "s" : ""} en attente
            </Link>
          )}
        </div>

        {/* ── OPENCLAW STATUS BANNER ──────────────────────────────── */}
        {!openClawConnected && (
          <div
            className="rounded-xl p-3 flex items-center justify-between gap-3"
            style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center gap-2.5">
              <WifiOff size={14} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">OpenClaw non connecté</p>
                <p className="text-xs text-muted-foreground">
                  Les agents ne sont pas actifs. Connectez votre gateway pour activer le cerveau IA.
                </p>
              </div>
            </div>
            <Link to="/agents"
              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
              Connecter
            </Link>
          </div>
        )}

        {/* ── BRIEF OPENCLAW ─────────────────────────────────────── */}
        <MorningBrief compact />

        {/* ── DEAL RADAR CALLOUT ─────────────────────────────────── */}
        <Link
          to="/radar"
          className="rounded-xl p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-all"
          style={{ background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))", border: "1px solid hsl(218 40% 25% / 0.5)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
              <Radar size={14} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Deal Radar actif</p>
              <p className="text-white/50 text-xs">OpenClaw surveille les signaux business pour vous</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}>
              Voir les opportunités
            </span>
            <ChevronRight size={14} className="text-white/40" />
          </div>
        </Link>

        {/* ── MODES D'ACTION ─────────────────────────────────────── */}
        <div className="card-surface p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Comment travaillez-vous aujourd'hui ?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setModeActif(mode.id)}
                className="flex flex-col items-start gap-1.5 p-3 rounded-xl border transition-all text-left"
                style={{
                  borderColor: modeActif === mode.id ? mode.color : "hsl(var(--border))",
                  background: modeActif === mode.id ? mode.bg : "transparent",
                }}
              >
                <span style={{ color: mode.color }}>{mode.icon}</span>
                <p className="text-xs font-bold text-foreground leading-tight">{mode.label}</p>
                <p className="text-xs text-muted-foreground leading-snug hidden sm:block">{mode.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── ACTIONS EN COURS ───────────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              Actions à traiter
            </h2>
            <Link to="/actions" className="text-xs text-primary font-medium hover:underline">
              Tout voir
            </Link>
          </div>

          {actions.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle2 size={24} className="mx-auto mb-2" style={{ color: "hsl(var(--success))" }} />
              <p className="text-sm font-medium text-foreground">Toutes vos actions sont traitées !</p>
            </div>
          ) : (
            <div className="space-y-2">
              {actions.map((a) => {
                const icon = actionTypeIcon[a.canal ?? a.type_action] ?? actionTypeIcon.email;
                const overdue = a.due_at && new Date(a.due_at) < new Date();
                return (
                  <div key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-xl"
                    style={{ background: overdue ? "hsl(0 65% 98%)" : "hsl(var(--muted))" }}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-muted-foreground shrink-0">{icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{a.titre}</p>
                        {a.due_at && (
                          <p className="text-xs" style={{ color: overdue ? "hsl(0 65% 40%)" : "hsl(var(--muted-foreground))" }}>
                            {overdue ? "En retard — " : ""}
                            {new Date(a.due_at).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link to="/actions"
                      className="shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-card hover:text-foreground transition-colors">
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          <Link
            to="/actions"
            className="mt-3 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-dashed border-border text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            Voir toutes les actions <ArrowRight size={12} />
          </Link>
        </div>

        {/* ── CAMPAGNES ACTIVES ──────────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Play size={16} className="text-primary" />
              Campagnes en cours
            </h2>
            <Link to="/campagnes" className="text-xs text-primary font-medium hover:underline">
              Tout voir
            </Link>
          </div>

          {campagnes.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">Aucune campagne active.</p>
              <Link to="/campagnes" className="text-xs font-semibold px-4 py-2 rounded-xl inline-flex items-center gap-1.5"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                Créer une campagne
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {campagnes.map((c) => (
                <Link key={c.id} to={`/campagnes/${c.id}`}
                  className="block p-4 rounded-xl bg-muted hover:bg-secondary transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground leading-snug">{c.nom}</p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ color: "hsl(var(--primary))", background: "hsl(var(--secondary))" }}>
                      Active
                    </span>
                  </div>
                  {c.mode_action && (
                    <p className="text-xs text-muted-foreground mt-1">Mode : {c.mode_action}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── OPPORTUNITÉS ──────────────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Target size={16} className="text-primary" />
              Opportunités en mouvement
            </h2>
            <Link to="/radar" className="text-xs text-primary font-medium hover:underline">
              Voir le Radar
            </Link>
          </div>

          {opportunites.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Aucune opportunité détectée.</p>
              <Link to="/radar" className="text-xs font-medium hover:underline" style={{ color: "hsl(var(--primary))" }}>
                Ouvrir le Deal Radar →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {opportunites.map((o) => {
                const orig = origineConfig[o.origin] ?? origineConfig.radar;
                const st = statusOpportunite[o.status] ?? statusOpportunite.nouvelle;
                return (
                  <div key={o.id} className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5"
                        style={{ background: orig.bg, color: orig.color }}>
                        {o.company_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{o.company_name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-xs text-muted-foreground truncate">{o.summary.slice(0, 50)}{o.summary.length > 50 ? "…" : ""}</span>
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                            style={{ color: orig.color, background: orig.bg }}>
                            {orig.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ color: st.color, background: st.bg }}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── GAINS ──────────────────────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Gains & commissions
            </h2>
            <Link to="/gains" className="text-xs text-primary font-medium hover:underline">
              Tout voir
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "En attente", value: fmtMontant(gains.en_attente), color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
              { label: "Validés",    value: fmtMontant(gains.valide),     color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
              { label: "Reçus",      value: fmtMontant(gains.recu),       color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
            ].map((g) => (
              <div key={g.label} className="p-3 rounded-xl text-center" style={{ background: g.bg }}>
                <p className="text-lg font-bold" style={{ color: g.color }}>{g.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{g.label}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </UserLayout>
  );
}
