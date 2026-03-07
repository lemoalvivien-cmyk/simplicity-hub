import { useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Zap, Play, Target, TrendingUp, Sparkles, ArrowRight,
  CheckCircle2, Phone, Mail, Clock,
  BarChart2, Users, ChevronRight, Activity, Radar
} from "lucide-react";
import { MorningBrief } from "@/components/openclaw/MorningBrief";

/* ─── DONNÉES MOCK ─────────────────────────────────────────── */

const priorites = [
  { id: 1, label: "Valider une introduction", detail: "Jean-Pierre Duval attend votre réponse.", lien: "/entreprise/introductions", urgent: true, type: "introduction" },
  { id: 2, label: "Relancer Antoine Leblanc", detail: "A ouvert votre email il y a 2 jours — c'est le bon moment.", lien: "/actions", urgent: true, type: "campagne" },
  { id: 3, label: "Vérifier la campagne Tech PME", detail: "22 contacts traités, 4 ont répondu.", lien: "/campagnes/1", urgent: false, type: "campagne" },
];

const actionsActives = [
  { id: 1, label: "Relancer Sophie Martin", type: "email" as const, source: "Campagne Octobre", echeance: "Aujourd'hui" },
  { id: 2, label: "Appeler Malik Diouf", type: "phone" as const, source: "Import Excel", echeance: "Aujourd'hui" },
  { id: 3, label: "Envoyer le premier message à RH Conseil", type: "email" as const, source: "Prospects RH", echeance: "Cette semaine" },
];

const campagnesActives = [
  { id: 1, nom: "Campagne Octobre — Tech PME", contacts: 45, traites: 23, reponses: 4, status: "en_cours" },
];

const opportunites = [
  { id: 1, label: "Jean-Pierre Duval", detail: "Mission TPE Île-de-France", origine: "introduction", status: "en_attente", lien: "/entreprise/introductions" },
  { id: 2, label: "Antoine Leblanc", detail: "Campagne Tech PME", origine: "prospection", status: "en_cours", lien: "/contacts/5" },
  { id: 3, label: "FinEdge — Mission financement", detail: "Mise en relation à soumettre", origine: "mission", status: "a_traiter", lien: "/missions/2" },
];

const gains = { en_attente: "800 €", valide: "300 €", recu: "150 €", potentiel: "1 250 €" };

const jarvisQuestions = [
  "Que dois-je faire maintenant ?",
  "Résume ma situation",
  "Montre-moi mes priorités",
];

/* ─── TYPES ────────────────────────────────────────────────── */
type ActionType = "email" | "phone";
type OrigineType = "introduction" | "prospection" | "campagne" | "mission";

const origineConfig: Record<OrigineType, { label: string; color: string; bg: string }> = {
  introduction: { label: "Introduction", color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
  prospection: { label: "Prospection", color: "hsl(220 80% 45%)", bg: "hsl(220 80% 95%)" },
  campagne: { label: "Campagne", color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
  mission: { label: "Mission", color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
};

const actionTypeIcon: Record<ActionType, JSX.Element> = {
  email: <Mail size={13} />,
  phone: <Phone size={13} />,
};

const statusOpportunite: Record<string, { label: string; color: string; bg: string }> = {
  en_attente: { label: "En attente", color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
  en_cours: { label: "En cours", color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
  a_traiter: { label: "À traiter", color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
  valide: { label: "Validée", color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
};

/* ─── MODES D'ACTION ───────────────────────────────────────── */
const modes = [
  {
    id: "manuel",
    icon: <CheckCircle2 size={16} />,
    label: "Manuel",
    desc: "Vous pilotez tout vous-même, contact par contact.",
    color: "hsl(var(--muted-foreground))",
    bg: "hsl(var(--muted))",
  },
  {
    id: "assiste",
    icon: <Sparkles size={16} />,
    label: "Assisté",
    desc: "JARVIS vous guide, suggère, résume. Vous gardez la main.",
    color: "hsl(var(--primary))",
    bg: "hsl(var(--secondary))",
    active: true,
  },
  {
    id: "semi_auto",
    icon: <Activity size={16} />,
    label: "Semi-auto",
    desc: "Campagnes et séquences préparées. Vous validez les étapes clés.",
    color: "hsl(38 80% 30%)",
    bg: "hsl(var(--accent-light))",
  },
];

/* ─── COMPOSANT PRINCIPAL ──────────────────────────────────── */
export default function Pilotage() {
  const [modeActif, setModeActif] = useState("assiste");
  const [actionsFaites, setActionsFaites] = useState<number[]>([]);

  const actionsRestantes = actionsActives.filter((a) => !actionsFaites.includes(a.id));
  const urgentes = priorites.filter((p) => p.urgent);

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
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}
          >
            {urgentes.length} élément{urgentes.length > 1 ? "s" : ""} urgent{urgentes.length > 1 ? "s" : ""}
          </span>
        </div>

        {/* ── BRIEF OPENCLAW ─────────────────────────────────────── */}
        <MorningBrief compact />

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

        {/* ── BLOC 1 — PRIORITÉS DU JOUR ─────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} style={{ color: "hsl(var(--accent))" }} />
            <h2 className="font-semibold text-foreground">Priorités du jour</h2>
          </div>
          <div className="space-y-3">
            {priorites.map((p) => {
              const orig = origineConfig[p.type as OrigineType];
              return (
                <div
                  key={p.id}
                  className="flex items-start justify-between gap-3 p-4 rounded-xl"
                  style={{
                    background: p.urgent ? "hsl(var(--accent-light))" : "hsl(var(--muted))",
                    borderLeft: p.urgent ? `3px solid hsl(var(--accent))` : undefined,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{p.label}</p>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ color: orig.color, background: orig.bg }}
                      >
                        {orig.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.detail}</p>
                  </div>
                  <Link
                    to={p.lien}
                    className="shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                  >
                    Agir <ChevronRight size={12} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── BLOC 2 — ACTIONS EN COURS ──────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              Actions en cours
            </h2>
            <Link to="/actions" className="text-xs text-primary font-medium hover:underline">
              Tout voir
            </Link>
          </div>

          {actionsRestantes.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle2 size={24} className="mx-auto mb-2" style={{ color: "hsl(var(--success))" }} />
              <p className="text-sm font-medium text-foreground">Toutes vos actions sont traitées !</p>
            </div>
          ) : (
            <div className="space-y-2">
              {actionsRestantes.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-muted-foreground shrink-0">{actionTypeIcon[a.type]}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{a.label}</p>
                      <p className="text-xs text-muted-foreground">{a.source} · {a.echeance}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActionsFaites((prev) => [...prev, a.id])}
                    className="shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
                  >
                    <CheckCircle2 size={12} /> Fait
                  </button>
                </div>
              ))}
            </div>
          )}

          <Link
            to="/actions"
            className="mt-3 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-dashed border-border text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            Voir toutes les actions <ArrowRight size={12} />
          </Link>
        </div>

        {/* ── BLOC 3 — CAMPAGNES ACTIVES ─────────────────────────── */}
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

          {campagnesActives.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">Aucune campagne en cours.</p>
              <Link to="/campagnes" className="btn-cta text-sm py-2 px-4 inline-flex">
                Créer une campagne
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {campagnesActives.map((c) => {
                const pct = Math.round((c.traites / c.contacts) * 100);
                return (
                  <Link key={c.id} to={`/campagnes/${c.id}`} className="block p-4 rounded-xl bg-muted hover:bg-secondary transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-foreground leading-snug">{c.nom}</p>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{ color: "hsl(var(--primary))", background: "hsl(var(--secondary))" }}
                      >
                        En cours
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1"><Users size={11} /> {c.contacts} contacts</span>
                      <span className="flex items-center gap-1"><BarChart2 size={11} /> {c.traites} traités</span>
                      <span className="flex items-center gap-1" style={{ color: "hsl(var(--success))" }}>
                        <CheckCircle2 size={11} /> {c.reponses} réponses
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: "hsl(var(--primary))" }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{pct}% traités</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── BLOC 4 — OPPORTUNITÉS ──────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Target size={16} className="text-primary" />
              Opportunités en mouvement
            </h2>
          </div>
          <div className="space-y-2">
            {opportunites.map((o) => {
              const orig = origineConfig[o.origine as OrigineType];
              const st = statusOpportunite[o.status] || statusOpportunite.en_cours;
              return (
                <Link
                  key={o.id}
                  to={o.lien}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5"
                      style={{ background: orig.bg, color: orig.color }}
                    >
                      {o.label.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{o.label}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{o.detail}</span>
                        <span
                          className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                          style={{ color: orig.color, background: orig.bg }}
                        >
                          {orig.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                    style={{ color: st.color, background: st.bg }}
                  >
                    {st.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── BLOC 5 — GAINS / IMPACT ────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Gains &amp; résultats
            </h2>
            <Link to="/gains" className="text-xs text-primary font-medium hover:underline">
              Voir le détail
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "En attente", value: gains.en_attente, color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
              { label: "Validés", value: gains.valide, color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
              { label: "Reçus", value: gains.recu, color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
              { label: "Potentiel", value: gains.potentiel, color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                <p className="font-display text-lg font-bold leading-tight" style={{ color }}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── BLOC 6 — JARVIS ────────────────────────────────────── */}
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: "hsl(var(--primary) / 0.3)", background: "hsl(var(--secondary))" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Sparkles size={18} style={{ color: "hsl(var(--primary-foreground))" }} />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">JARVIS — votre assistant</h2>
              <p className="text-xs text-muted-foreground">Il connaît votre situation et peut vous guider.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {jarvisQuestions.map((q) => (
              <Link
                key={q}
                to="/assistant"
                className="text-xs px-3 py-1.5 rounded-full border bg-background text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
                style={{ borderColor: "hsl(var(--border))" }}
              >
                {q}
              </Link>
            ))}
          </div>
          <div className="flex gap-2">
            <Link to="/assistant" className="btn-cta text-sm py-2.5 px-4 flex-1 justify-center">
              <MessageCircle size={14} /> Parler à JARVIS
            </Link>
            <Link
              to="/actions"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            >
              <Zap size={14} /> À faire
            </Link>
          </div>
        </div>

      </div>
    </UserLayout>
  );
}
