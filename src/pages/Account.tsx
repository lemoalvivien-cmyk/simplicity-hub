import UserLayout from "@/components/layout/UserLayout";
import { User, CreditCard, Bell, Shield, ChevronRight, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

const sections = [
  {
    title: "Mon profil",
    icon: User,
    items: [
      { label: "Prénom", value: "Marie" },
      { label: "E-mail", value: "marie@exemple.fr" },
    ],
    action: "Modifier",
  },
  {
    title: "Abonnement",
    icon: CreditCard,
    items: [
      { label: "Statut", value: "✓ Actif" },
      { label: "Expiration", value: "5 mars 2025" },
      { label: "Tarif", value: "59 € / mois" },
    ],
    action: "Gérer",
    danger: "Annuler l'abonnement",
  },
  {
    title: "Mot de passe",
    icon: Shield,
    items: [
      { label: "Dernière modification", value: "Aujourd'hui" },
    ],
    action: "Modifier le mot de passe",
  },
];

export default function Account() {
  return (
    <UserLayout>
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">Mon compte</h1>
          <p className="text-muted-foreground text-sm">Gérez vos informations et votre abonnement.</p>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4 card-surface p-5 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xl">
            M
          </div>
          <div>
            <p className="font-semibold text-foreground">Marie Dupont</p>
            <p className="text-sm text-muted-foreground">marie@exemple.fr</p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map(({ title, icon: Icon, items, action, danger }) => (
            <div key={title} className="card-surface p-5">
              <div className="flex items-center gap-2 mb-4">
                <Icon size={17} className="text-primary" />
                <h2 className="font-semibold text-foreground">{title}</h2>
              </div>

              <div className="space-y-2 mb-4">
                {items.map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <button className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  {action}
                  <ChevronRight size={15} className="text-muted-foreground" />
                </button>
                {danger && (
                  <button className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors">
                    {danger}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="mt-5 border-t border-border pt-5">
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut size={15} />
            Se déconnecter
          </Link>
        </div>
      </div>
    </UserLayout>
  );
}
