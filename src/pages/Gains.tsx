import UserLayout from "@/components/layout/UserLayout";
import { CheckCircle2, Clock, ArrowDownCircle, TrendingUp, Euro, Info } from "lucide-react";

const gainsSummary = {
  total_valide: 300,
  en_attente: 800,
  total_recu: 300,
};

const gainDetails = [
  {
    id: 1,
    contact: "Isabelle Petit",
    entreprise: "Acme SaaS",
    mission: "Clients TPE en commerce",
    montant: 300,
    status: "valide",
    date_validation: "Il y a 2 jours",
    date_paiement: "Dans 28 jours",
  },
  {
    id: 2,
    contact: "Gérard Morin",
    entreprise: "FinEdge",
    mission: "PME cherchant financement",
    montant: 500,
    status: "en_attente",
    date_validation: "En cours de validation",
    date_paiement: "—",
  },
  {
    id: 3,
    contact: "Jean-Pierre Duval",
    entreprise: "Acme SaaS",
    mission: "Clients TPE en commerce",
    montant: 300,
    status: "en_attente",
    date_validation: "En attente de réponse",
    date_paiement: "—",
  },
];

const statusConfig = {
  valide: { label: "Validé ✓", color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
  en_attente: { label: "En attente", color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
  paye: { label: "Reçu", color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
};

export default function Gains() {
  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">
            Mes gains
          </h1>
          <p className="text-muted-foreground text-sm">
            Suivez ce que vous avez gagné grâce à vos introductions.
          </p>
        </div>

        {/* Résumé principal */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {
              label: "Validés",
              value: `${gainsSummary.total_valide} €`,
              sub: "Confirmés par l'entreprise",
              color: "hsl(var(--success))",
              bg: "hsl(var(--success-light))",
              icon: <CheckCircle2 size={18} />,
            },
            {
              label: "En attente",
              value: `${gainsSummary.en_attente} €`,
              sub: "Validation en cours",
              color: "hsl(38 80% 30%)",
              bg: "hsl(var(--accent-light))",
              icon: <Clock size={18} />,
            },
            {
              label: "Reçus",
              value: `${gainsSummary.total_recu} €`,
              sub: "Déjà versés",
              color: "hsl(var(--primary))",
              bg: "hsl(var(--secondary))",
              icon: <ArrowDownCircle size={18} />,
            },
          ].map(({ label, value, sub, color, bg, icon }) => (
            <div key={label} className="rounded-xl p-4 flex flex-col gap-1" style={{ background: bg }}>
              <div style={{ color }}>{icon}</div>
              <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs font-semibold" style={{ color }}>{label}</p>
              <p className="text-xs text-muted-foreground leading-tight">{sub}</p>
            </div>
          ))}
        </div>

        {/* Info paiement */}
        <div className="p-4 rounded-xl border border-border bg-muted flex gap-3 mb-6">
          <Info size={16} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Comment fonctionne le paiement ?</strong><br />
            Une fois votre introduction validée par l'entreprise, votre gain est confirmé. Le versement est effectué dans les 30 jours suivant la validation.
          </p>
        </div>

        {/* Détail des gains */}
        <div className="card-surface p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp size={17} className="text-primary" />
            Détail de mes gains
          </h2>

          {gainDetails.length === 0 ? (
            <div className="text-center py-10">
              <Euro size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-foreground font-medium mb-1">Aucun gain pour l'instant</p>
              <p className="text-sm text-muted-foreground">
                Faites votre première introduction pour commencer à gagner.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {gainDetails.map((g) => {
                const cfg = statusConfig[g.status as keyof typeof statusConfig] || statusConfig.en_attente;
                return (
                  <div key={g.id} className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-secondary-foreground">
                        {g.contact.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{g.contact}</p>
                          <p className="text-xs text-muted-foreground">
                            {g.entreprise} · {g.mission}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-display text-base font-bold text-foreground">{g.montant} €</p>
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ color: cfg.color, background: cfg.bg }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>Validation : {g.date_validation}</span>
                        <span>Paiement : {g.date_paiement}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
