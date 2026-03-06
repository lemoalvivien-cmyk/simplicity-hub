import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Target, Users, CheckCircle2, ArrowRight, MessageCircle,
  HelpCircle, Search, Zap, Play, TrendingUp
} from "lucide-react";

const entrepriseName = "Marie";

const missions = [
  { id: 1, title: "Clients TPE en Île-de-France", status: "active", introductions: 3, label: "3 introductions reçues" },
  { id: 2, title: "Partenaires revendeurs SaaS", status: "active", introductions: 0, label: "En attente d'introductions" },
];

const introductions = [
  { id: 1, contact: "Jean-Pierre Duval", mission: "Clients TPE", status: "en_attente", date: "Hier", badge: "À valider" },
  { id: 2, contact: "Sophie Martin", mission: "Clients TPE", status: "validee", date: "Il y a 3 jours", badge: "Validée" },
  { id: 3, contact: "Marc Lefebvre", mission: "Clients TPE", status: "en_cours", date: "Il y a 5 jours", badge: "En cours" },
];

const prospectionResume = {
  contacts: 58,
  a_traiter: 2,
  campagnes_actives: 1,
  reponses: 4,
};

const statusConfig: Record<string, { color: string; bg: string }> = {
  en_attente: { color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
  validee: { color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
  en_cours: { color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
  refusee: { color: "hsl(var(--destructive))", bg: "hsl(0 72% 95%)" },
};

export default function DashboardEntreprise() {
  const nextAction = introductions.find((i) => i.status === "en_attente");

  return (
    <UserLayout role="entreprise">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── BLOC 1 — BIENVENUE ─────────────────────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                Bonjour {entrepriseName} 👋
              </h1>
              <p className="text-muted-foreground text-sm">
                Voici votre tableau de bord. Prospection et apport d'affaires en un seul endroit.
              </p>
            </div>
            <div className="shrink-0">
              <span className="badge-success">
                <CheckCircle2 size={12} />
                Compte actif
              </span>
            </div>
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
              <strong>{nextAction.contact}</strong> a été présenté pour votre mission "{nextAction.mission}".
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
              <Search size={16} className="text-primary" />
              Ma prospection
            </h2>
            <Link to="/contacts" className="text-xs text-primary font-medium hover:underline">
              Voir les contacts
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Contacts", value: prospectionResume.contacts, color: "hsl(var(--foreground))", bg: "hsl(var(--muted))" },
              { label: "À traiter", value: prospectionResume.a_traiter, color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
              { label: "Campagne active", value: prospectionResume.campagnes_actives, color: "hsl(220 80% 45%)", bg: "hsl(220 80% 95%)" },
              { label: "Réponses", value: prospectionResume.reponses, color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Link
              to="/campagnes"
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Play size={12} /> Campagnes
            </Link>
            <Link
              to="/actions"
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
            >
              <Zap size={12} /> À faire
            </Link>
            <Link
              to="/listes"
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
            >
              <Users size={12} /> Listes
            </Link>
          </div>
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

          <div className="space-y-3 mb-4">
            {missions.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "hsl(var(--success))" }} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.title}</p>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                  </div>
                </div>
                <Link to={`/missions/${m.id}`} className="text-xs text-primary font-medium hover:underline shrink-0">
                  Voir
                </Link>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {introductions.slice(0, 2).map((intro) => {
              const cfg = statusConfig[intro.status] || statusConfig.en_cours;
              return (
                <Link
                  key={intro.id}
                  to="/entreprise/introductions"
                  className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}
                    >
                      {intro.contact.charAt(0)}
                    </div>
                    <p className="text-sm text-foreground truncate">{intro.contact}</p>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{ color: cfg.color, background: cfg.bg }}
                  >
                    {intro.badge}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── BLOC 5 — RÉSULTATS ─────────────────────────────────── */}
        <div className="card-surface p-5">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            Résultats du mois
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Introductions reçues", value: 3, color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
              { label: "Contacts validés", value: 1, color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
              { label: "Emails envoyés", value: 23, color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── BLOC 6 — AIDE ──────────────────────────────────────── */}
        <div className="card-surface p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="font-semibold text-foreground mb-0.5">Une question ?</h2>
            <p className="text-sm text-muted-foreground">L'assistant répond immédiatement.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Link to="/assistant" className="btn-primary text-sm py-2.5 px-4 flex-1 sm:flex-initial justify-center">
              <MessageCircle size={14} /> Assistant
            </Link>
            <Link to="/help" className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <HelpCircle size={14} /> Aide
            </Link>
          </div>
        </div>

      </div>
    </UserLayout>
  );
}
