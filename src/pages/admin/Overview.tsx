import AdminLayout from "@/components/layout/AdminLayout";
import { Users, Tag, CreditCard, TrendingUp, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { label: "Utilisateurs actifs", value: "142", change: "+12 ce mois", icon: Users, to: "/admin/users", color: "text-primary bg-primary/10" },
  { label: "Codes activés", value: "89", change: "sur 120 créés", icon: Tag, to: "/admin/promo-codes", color: "text-accent bg-accent-light" },
  { label: "Revenus ce mois", value: "3 127 €", change: "+8% vs mois dernier", icon: CreditCard, to: "/admin/payments", color: "text-success bg-success-light" },
  { label: "Taux de rétention", value: "91%", change: "Excellent", icon: TrendingUp, to: "/admin/analytics", color: "text-primary bg-primary/10" },
];

const recentUsers = [
  { name: "Marie D.", email: "marie@exemple.fr", status: "actif", date: "Il y a 5 min", source: "Code promo" },
  { name: "Julien M.", email: "julien@exemple.fr", status: "actif", date: "Il y a 2h", source: "Paiement" },
  { name: "Sophie L.", email: "sophie@exemple.fr", status: "actif", date: "Hier", source: "Code promo" },
  { name: "Thomas B.", email: "thomas@exemple.fr", status: "expiré", date: "Il y a 3 jours", source: "Paiement" },
];

export default function AdminOverview() {
  return (
    <AdminLayout title="Vue d'ensemble" subtitle="Toute votre activité en un coup d'œil.">
      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, change, icon: Icon, to, color }) => (
          <Link key={label} to={to} className="stat-card group">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={18} />
              </div>
              <ArrowUpRight size={15} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="font-display text-2xl font-bold text-foreground mb-0.5">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xs text-success font-medium mt-1">{change}</p>
          </Link>
        ))}
      </div>

      {/* Recent users */}
      <div className="card-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Dernières inscriptions</h2>
          <Link to="/admin/users" className="text-xs text-primary hover:underline">
            Voir tous →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Nom</th>
                <th className="text-left py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Source</th>
                <th className="text-left py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Statut</th>
                <th className="text-left py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map(({ name, email, status, date, source }) => (
                <tr key={email} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="py-3">
                    <p className="font-medium text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{email}</p>
                  </td>
                  <td className="py-3">
                    <span className={`badge-${source === "Code promo" ? "warning" : "muted"}`}>
                      {source}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`badge-${status === "actif" ? "success" : "muted"}`}>
                      {status}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground text-xs">{date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
