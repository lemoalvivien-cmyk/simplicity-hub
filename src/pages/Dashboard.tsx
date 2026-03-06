import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Zap, MessageCircle, HelpCircle, ArrowRight,
  CheckCircle2, Clock, TrendingUp
} from "lucide-react";

const quickActions = [
  { icon: Zap, label: "Commencer une tâche", to: "/dashboard", color: "bg-primary/10 text-primary" },
  { icon: MessageCircle, label: "Poser une question à l'IA", to: "/assistant", color: "bg-accent-light text-accent" },
  { icon: HelpCircle, label: "Consulter l'aide", to: "/help", color: "bg-success-light text-success" },
];

const recentActivity = [
  { icon: CheckCircle2, text: "Onboarding terminé", time: "Il y a 2 min", color: "text-success" },
  { icon: TrendingUp, text: "Premier accès au tableau de bord", time: "Il y a 2 min", color: "text-primary" },
];

export default function Dashboard() {
  return (
    <UserLayout>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">
          Bonjour Marie 👋
        </h1>
        <p className="text-muted-foreground">
          Votre espace est prêt. Voici ce que vous pouvez faire maintenant.
        </p>
      </div>

      {/* Status card */}
      <div className="bg-gradient-primary rounded-xl p-6 mb-6 text-primary-foreground">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary-foreground/70 mb-1">Votre abonnement</p>
            <p className="font-display text-xl font-bold">Accès Premium actif</p>
            <p className="text-sm text-primary-foreground/70 mt-1">Expire le 5 mars 2025</p>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-1.5">
            <span className="text-xs font-semibold">✓ Actif</span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider text-muted-foreground">
          Que souhaitez-vous faire ?
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {quickActions.map(({ icon: Icon, label, to, color }) => (
            <Link
              key={to + label}
              to={to}
              className="card-surface p-4 flex items-center gap-3 hover:shadow-md transition-shadow group"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={18} />
              </div>
              <span className="text-sm font-medium text-foreground">{label}</span>
              <ArrowRight size={15} className="text-muted-foreground ml-auto group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Activity */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Activité récente</h2>
          </div>
          <div className="space-y-3">
            {recentActivity.map(({ icon: Icon, text, time, color }) => (
              <div key={text} className="flex items-start gap-3">
                <Icon size={16} className={`${color} shrink-0 mt-0.5`} />
                <div>
                  <p className="text-sm text-foreground">{text}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock size={11} /> {time}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3 py-6 text-center justify-center">
              <p className="text-sm text-muted-foreground">
                Commencez à utiliser Planify pour voir votre activité ici.
              </p>
            </div>
          </div>
        </div>

        {/* Assistant CTA */}
        <div className="card-surface p-5 flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center">
              <MessageCircle size={18} className="text-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Assistant IA</h2>
              <p className="text-xs text-muted-foreground">Disponible 24h/24</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4 flex-1">
            Posez n'importe quelle question. L'assistant connaît Planify sur le bout des doigts et répond en quelques secondes.
          </p>
          <Link to="/assistant" className="btn-cta text-sm text-center py-3">
            Ouvrir l'assistant →
          </Link>
        </div>
      </div>

      {/* Getting started checklist */}
      <div className="card-surface p-5 mt-6">
        <h2 className="font-semibold text-foreground mb-4">Pour bien démarrer</h2>
        <div className="space-y-3">
          {[
            { done: true, text: "Créer votre compte", link: null },
            { done: true, text: "Terminer l'onboarding", link: null },
            { done: false, text: "Poser votre première question à l'assistant", link: "/assistant" },
            { done: false, text: "Consulter la base d'aide", link: "/help" },
          ].map(({ done, text, link }) => (
            <div key={text} className="flex items-center gap-3">
              <CheckCircle2
                size={18}
                className={done ? "text-success shrink-0" : "text-border shrink-0"}
              />
              {link ? (
                <Link to={link} className="text-sm text-primary hover:underline">{text}</Link>
              ) : (
                <span className={`text-sm ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {text}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </UserLayout>
  );
}
