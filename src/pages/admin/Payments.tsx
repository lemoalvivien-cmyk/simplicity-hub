import AdminLayout from "@/components/layout/AdminLayout";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

const payments = [
  { id: "pay_001", user: "Julien Martin", email: "julien@exemple.fr", amount: "59,00 €", status: "réussi", date: "12 mars 2024", method: "Visa •••• 4242" },
  { id: "pay_002", user: "Camille Petit", email: "camille@exemple.fr", amount: "59,00 €", status: "réussi", date: "20 mars 2024", method: "Mastercard •••• 1234" },
  { id: "pay_003", user: "Thomas Bernard", email: "thomas@exemple.fr", amount: "59,00 €", status: "échoué", date: "10 mars 2024", method: "Visa •••• 9999" },
  { id: "pay_004", user: "Lucas Moreau", email: "lucas@exemple.fr", amount: "59,00 €", status: "remboursé", date: "5 mars 2024", method: "Amex •••• 3737" },
];

const STATUS_CONFIG: Record<string, { badge: string; icon: typeof CheckCircle2 }> = {
  réussi: { badge: "badge-success", icon: CheckCircle2 },
  échoué: { badge: "bg-destructive/10 text-destructive inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold", icon: XCircle },
  remboursé: { badge: "badge-muted", icon: Clock },
};

export default function AdminPayments() {
  const total = payments.filter((p) => p.status === "réussi").reduce(() => 118, 0);

  return (
    <AdminLayout title="Paiements" subtitle="Historique des transactions Stripe.">
      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <p className="font-display text-2xl font-bold text-success">236,00 €</p>
          <p className="text-xs text-muted-foreground mt-0.5">Revenus ce mois</p>
        </div>
        <div className="stat-card">
          <p className="font-display text-2xl font-bold text-foreground">2 / 4</p>
          <p className="text-xs text-muted-foreground mt-0.5">Paiements réussis</p>
        </div>
        <div className="stat-card">
          <p className="font-display text-2xl font-bold text-destructive">1</p>
          <p className="text-xs text-muted-foreground mt-0.5">Paiement échoué</p>
        </div>
      </div>

      {/* Table */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Utilisateur</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Montant</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Statut</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Méthode</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const config = STATUS_CONFIG[p.status] || STATUS_CONFIG.remboursé;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-foreground">{p.user}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-foreground">{p.amount}</td>
                    <td className="px-5 py-3.5">
                      <span className={config.badge}>{p.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{p.method}</td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs">{p.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Les paiements sont gérés par Stripe. Connectez votre compte Stripe pour voir les données en temps réel.
      </p>
    </AdminLayout>
  );
}
