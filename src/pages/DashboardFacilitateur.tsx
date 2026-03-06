import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Briefcase, Send, TrendingUp, CheckCircle2, ArrowRight,
  MessageCircle, HelpCircle, Clock, Euro
} from "lucide-react";

// Données simulées
const facilitateurName = "Thomas";

const missionsDisponibles = [
  { id: 1, entreprise: "Acme SaaS", besoin: "TPE en commerce / artisanat", gain: "300 € par client validé", secteur: "SaaS" },
  { id: 2, entreprise: "FinEdge", besoin: "PME cherchant financement", gain: "500 € par mise en relation réussie", secteur: "Finance" },
  { id: 3, entreprise: "FormaPro", besoin: "Responsables formation", gain: "200 € par inscription", secteur: "Formation" },
];

const introductions = [
  { id: 1, contact: "Isabelle Petit", mission: "Acme SaaS", status: "validee", gain: "300 €", date: "Il y a 2 jours" },
  { id: 2, contact: "Gérard Morin", mission: "FinEdge", status: "en_cours", gain: "En attente", date: "Hier" },
  { id: 3, contact: "Aurélie Dubois", mission: "Acme SaaS", status: "en_attente", gain: "En attente", date: "Aujourd'hui" },
];

const gains = {
  total_valide: "300 €",
  en_attente: "800 €",
  total_recu: "300 €",
};

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  en_attente: { color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", label: "Envoyée" },
  validee: { color: "hsl(var(--success))", bg: "hsl(var(--success-light))", label: "Validée ✓" },
  en_cours: { color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", label: "En cours" },
  refusee: { color: "hsl(var(--destructive))", bg: "hsl(0 72% 95%)", label: "Refusée" },
};

export default function DashboardFacilitateur() {
  const nextAction = introductions.find((i) => i.status === "en_attente");

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── BLOC 1 — BIENVENUE ─────────────────────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                Bonjour {facilitateurName} 👋
              </h1>
              <p className="text-muted-foreground text-sm">
                Voici les missions disponibles et l'état de vos introductions.
              </p>
            </div>
            <div className="shrink-0">
              <span className="badge-success">
                <CheckCircle2 size={12} />
                Accès actif
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Compte apporteur
              </p>
            </div>
          </div>
        </div>

        {/* ── BLOC 2 — ACTION PRINCIPALE ─────────────────────────── */}
        {missionsDisponibles.length > 0 && (
          <div
            className="rounded-xl border-2 p-6"
            style={{ borderColor: "hsl(var(--accent))", background: "hsl(var(--accent-light))" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(38 80% 30%)" }}>
              À faire maintenant
            </p>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">
              Vous avez {missionsDisponibles.length} missions à regarder
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Parcourez les missions disponibles. Si vous connaissez quelqu'un qui correspond, faites une introduction en quelques clics.
            </p>
            <Link to="/missions" className="btn-cta text-sm py-2.5 px-5 inline-flex">
              Voir les missions <ArrowRight size={15} />
            </Link>
          </div>
        )}

        {/* ── BLOC 3 — MISSIONS RECOMMANDÉES ─────────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Briefcase size={17} className="text-primary" />
              Missions pour vous
            </h2>
            <Link to="/missions" className="text-xs text-primary font-medium hover:underline">
              Tout voir
            </Link>
          </div>

          <div className="space-y-3">
            {missionsDisponibles.slice(0, 3).map((m) => (
              <div key={m.id} className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{m.entreprise}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{m.besoin}</p>
                    <p className="text-xs font-medium mt-1.5" style={{ color: "hsl(var(--success))" }}>
                      💰 {m.gain}
                    </p>
                  </div>
                  <Link
                    to={`/missions/${m.id}`}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors shrink-0"
                  >
                    Voir
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── BLOC 4 — MES INTRODUCTIONS EN COURS ────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Send size={17} className="text-primary" />
              Mes introductions
            </h2>
            <Link to="/introductions" className="text-xs text-primary font-medium hover:underline">
              Tout voir
            </Link>
          </div>

          {introductions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Vous n'avez encore fait aucune introduction. Parcourez les missions pour commencer.
            </p>
          ) : (
            <div className="space-y-3">
              {introductions.map((intro) => {
                const cfg = statusConfig[intro.status];
                return (
                  <div key={intro.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-secondary-foreground">
                          {intro.contact.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{intro.contact}</p>
                        <p className="text-xs text-muted-foreground">{intro.mission} · {intro.date}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className="block text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ color: cfg.color, background: cfg.bg }}
                      >
                        {cfg.label}
                      </span>
                      <span className="block text-xs text-muted-foreground mt-1">{intro.gain}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── BLOC 4b — MES GAINS ────────────────────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp size={17} className="text-primary" />
              Mes gains
            </h2>
            <Link to="/gains" className="text-xs text-primary font-medium hover:underline">
              Détail
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Validés", value: gains.total_valide, color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
              { label: "En attente", value: gains.en_attente, color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
              { label: "Reçus", value: gains.total_recu, color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                <p className="text-lg font-bold" style={{ color }}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── BLOC 5 — AIDE ──────────────────────────────────────── */}
        <div className="card-surface p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="font-semibold text-foreground mb-0.5">Une question ?</h2>
            <p className="text-sm text-muted-foreground">
              L'assistant répond immédiatement. Le centre d'aide aussi.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
            <Link to="/assistant" className="btn-primary text-sm py-2.5 px-4 justify-center">
              <MessageCircle size={15} /> Assistant
            </Link>
            <Link
              to="/help"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <HelpCircle size={15} /> Aide
            </Link>
          </div>
        </div>

      </div>
    </UserLayout>
  );
}
