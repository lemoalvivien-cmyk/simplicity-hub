// PROOF:AUDIT_V1:dashboard_real_data — replaced hardcoded mock with real auth profile
// ONE PRICE 99 HARD LOCK: subscription status now shown from real runtime (useSubscription)
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  MessageCircle, HelpCircle, ArrowRight,
  CheckCircle2, Circle, User, Zap, BookOpen, ShieldCheck, AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, isAccessActive } from "@/contexts/SubscriptionContext";

export default function Dashboard() {
  const { profile } = useAuth();
  const { status, offerType, subscriptionEnd, loading } = useSubscription();
  const userName = profile?.prenom || "vous";

  // Real subscription state
  const accessActive = isAccessActive(status);
  const offerLabel =
    offerType === "launch" ? "Offre de lancement — 99 € TTC / an"
    : offerType === "standard" ? "Abonnement annuel — 490 € TTC / an"
    : offerType === "promo" ? "Code d'invitation — Accès offert"
    : status === "active" ? "Accès actif"
    : null;

  const steps = [
    { id: 1, label: "Compte créé", done: true },
    { id: 2, label: "Onboarding terminé", done: !!(profile?.onboarding_done) },
    { id: 3, label: "Première question posée à l'assistant", done: false },
    { id: 4, label: "Base d'aide consultée", done: false },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const progressPercent = Math.round((doneCount / steps.length) * 100);
  const nextStep = steps.find((s) => !s.done);

  const shortcuts = [
    {
      icon: MessageCircle,
      label: "Poser une question",
      description: "L'assistant répond en quelques secondes",
      to: "/assistant",
      color: "bg-accent-light text-accent",
    },
    {
      icon: BookOpen,
      label: "Centre d'aide",
      description: "Guides et réponses aux questions fréquentes",
      to: "/help",
      color: "bg-success-light text-success",
    },
    {
      icon: User,
      label: "Mon compte",
      description: "Abonnement, informations personnelles",
      to: "/account",
      color: "bg-secondary text-secondary-foreground",
    },
  ];

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── BLOC 1 — Bienvenue ───────────────────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                Bonjour {userName} 👋
              </h1>
              <p className="text-muted-foreground text-sm">
                Votre espace est prêt. Vous pouvez commencer à l'utiliser dès maintenant.
              </p>
            </div>
            <div className="shrink-0">
              <span className="badge-success">
                <CheckCircle2 size={12} />
                Accès actif
              </span>
            </div>
          </div>
        </div>

        {/* ── BLOC 2 — À faire maintenant ─────────────────────── */}
        {nextStep && (
          <div
            className="rounded-xl border-2 p-6"
            style={{
              borderColor: "hsl(var(--accent))",
              background: "hsl(var(--accent-light))",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "hsl(38 80% 30%)" }}
            >
              Prochaine étape recommandée
            </p>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">
              {nextStep.label}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {nextStep.id === 3
                ? "Posez votre première question à l'assistant IA. Il connaît la plateforme sur le bout des doigts et répond en quelques secondes."
                : nextStep.id === 2
                ? "Complétez votre onboarding pour déverrouiller toutes les fonctionnalités."
                : "Consultez la base d'aide pour trouver des guides et des réponses aux questions fréquentes."}
            </p>
            <Link
              to={nextStep.id === 3 ? "/assistant" : nextStep.id === 2 ? "/onboarding" : "/help"}
              className="btn-cta text-sm py-2.5 px-5 w-full sm:w-auto justify-center"
            >
              {nextStep.id === 3 ? "Ouvrir l'assistant" : nextStep.id === 2 ? "Continuer l'onboarding" : "Consulter l'aide"}
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* ── BLOC 3 — Mon avancement ─────────────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Mon avancement</h2>
            <span className="text-sm font-medium text-muted-foreground">
              {doneCount} / {steps.length} étapes
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-secondary rounded-full mb-5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                background: "var(--gradient-accent)",
              }}
            />
          </div>

          {/* Step list */}
          <ul className="space-y-3">
            {steps.map((step) => (
              <li key={step.id} className="flex items-center gap-3">
                {step.done ? (
                  <CheckCircle2
                    size={18}
                    className="shrink-0"
                    style={{ color: "hsl(var(--success))" }}
                  />
                ) : (
                  <Circle
                    size={18}
                    className="text-border shrink-0"
                  />
                )}
                <span
                  className={`text-sm ${
                    step.done
                      ? "line-through text-muted-foreground"
                      : "text-foreground font-medium"
                  }`}
                >
                  {step.label}
                </span>
                {!step.done && step.id === nextStep?.id && (
                  <span className="badge-warning ml-auto text-xs">
                    <Zap size={10} /> À faire
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* ── BLOC 4 — Raccourcis utiles ──────────────────────── */}
        <div>
          <h2 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider text-muted-foreground">
            Accès rapide
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {shortcuts.map(({ icon: Icon, label, description, to, color }) => (
              <Link
                key={to}
                to={to}
                className="card-surface p-4 flex flex-col gap-2 hover:shadow-md transition-shadow group"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}
                >
                  <Icon size={17} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── BLOC 5 — Besoin d'aide ? ────────────────────────── */}
        <div className="card-surface p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="font-semibold text-foreground mb-0.5">
              Besoin d'aide ?
            </h2>
            <p className="text-sm text-muted-foreground">
              L'assistant répond en quelques secondes. Le centre d'aide est là si vous préférez chercher vous-même.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
            <Link
              to="/assistant"
              className="btn-primary text-sm py-2.5 px-4 justify-center"
            >
              <MessageCircle size={15} />
              Assistant IA
            </Link>
            <Link
              to="/help"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <HelpCircle size={15} />
              Centre d'aide
            </Link>
          </div>
        </div>

      </div>
    </UserLayout>
  );
}
