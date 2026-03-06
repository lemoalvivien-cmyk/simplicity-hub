import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Target, Users, CheckCircle2, Circle, ArrowRight,
  MessageCircle, HelpCircle, Zap, Clock, TrendingUp
} from "lucide-react";

// Données simulées
const entrepriseName = "Marie";
const subscriptionLabel = "Accès actif";

const missions = [
  { id: 1, title: "Clients TPE en Île-de-France", status: "active", introductions: 3, label: "3 introductions reçues" },
  { id: 2, title: "Partenaires revendeurs SaaS", status: "active", introductions: 0, label: "En attente d'introductions" },
];

const introductions = [
  { id: 1, contact: "Jean-Pierre Duval", mission: "Clients TPE", status: "en_attente", date: "Hier", badge: "À valider" },
  { id: 2, contact: "Sophie Martin", mission: "Clients TPE", status: "validee", date: "Il y a 3 jours", badge: "Validée" },
  { id: 3, contact: "Marc Lefebvre", mission: "Clients TPE", status: "en_cours", date: "Il y a 5 jours", badge: "En cours" },
];

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
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── BLOC 1 — BIENVENUE ─────────────────────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                Bonjour {entrepriseName} 👋
              </h1>
              <p className="text-muted-foreground text-sm">
                Voici l'état de vos missions et des introductions reçues.
              </p>
            </div>
            <div className="shrink-0">
              <span className="badge-success">
                <CheckCircle2 size={12} />
                {subscriptionLabel}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Compte entreprise
              </p>
            </div>
          </div>
        </div>

        {/* ── BLOC 2 — ACTION PRINCIPALE ─────────────────────────── */}
        {nextAction && (
          <div
            className="rounded-xl border-2 p-6"
            style={{ borderColor: "hsl(var(--accent))", background: "hsl(var(--accent-light))" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(38 80% 30%)" }}>
              À faire maintenant
            </p>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">
              Une introduction attend votre réponse
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>{nextAction.contact}</strong> a été présenté pour votre mission "{nextAction.mission}".
              Indiquez si ce contact correspond à ce que vous cherchez.
            </p>
            <Link
              to="/introductions"
              className="btn-cta text-sm py-2.5 px-5 inline-flex"
            >
              Voir l'introduction <ArrowRight size={15} />
            </Link>
          </div>
        )}

        {/* ── BLOC 3 — MES MISSIONS ACTIVES ──────────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Target size={17} className="text-primary" />
              Mes missions actives
            </h2>
            <Link to="/missions" className="text-xs text-primary font-medium hover:underline">
              Tout voir
            </Link>
          </div>

          {missions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm mb-3">Vous n'avez pas encore de mission active.</p>
              <Link to="/missions/nouvelle" className="btn-primary text-sm py-2.5 px-5 inline-flex">
                Créer ma première mission
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {missions.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-success shrink-0" style={{ background: "hsl(var(--success))" }} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                    </div>
                  </div>
                  <Link
                    to={`/missions/${m.id}`}
                    className="text-xs text-primary font-medium hover:underline shrink-0"
                  >
                    Voir
                  </Link>
                </div>
              ))}
              <Link
                to="/missions/nouvelle"
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                + Ajouter une mission
              </Link>
            </div>
          )}
        </div>

        {/* ── BLOC 4 — INTRODUCTIONS REÇUES ──────────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Users size={17} className="text-primary" />
              Introductions reçues
            </h2>
            <Link to="/introductions" className="text-xs text-primary font-medium hover:underline">
              Tout voir
            </Link>
          </div>

          {introductions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucune introduction pour l'instant. Cela devrait arriver rapidement si votre mission est active.
            </p>
          ) : (
            <div className="space-y-3">
              {introductions.slice(0, 3).map((intro) => {
                const cfg = statusConfig[intro.status] || statusConfig.en_cours;
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
                        <p className="text-xs text-muted-foreground">{intro.date}</p>
                      </div>
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                      style={{ color: cfg.color, background: cfg.bg }}
                    >
                      {intro.badge}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
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
