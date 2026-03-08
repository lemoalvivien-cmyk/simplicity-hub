import { Shield, Eye, TrendingUp, CheckCircle2, Lock, BarChart3 } from "lucide-react";

const proofs = [
  {
    icon: Shield,
    title: "Chaque intro est protégée",
    desc: "L'attribution est enregistrée dès l'envoi. Si ça aboutit 6 mois plus tard, la trace est là.",
    color: "hsl(218 72% 55%)",
  },
  {
    icon: CheckCircle2,
    title: "Validation avant tout paiement",
    desc: "Aucune commission sans validation. L'entreprise confirme. Le facilitateur est payé. Clair pour les deux.",
    color: "hsl(152 62% 45%)",
  },
  {
    icon: Eye,
    title: "Visibilité totale des gains",
    desc: "Les apporteurs voient leurs gains en temps réel — montant, statut, date. Plus de flou.",
    color: "hsl(24 100% 55%)",
  },
  {
    icon: Lock,
    title: "Introductions horodatées",
    desc: "Chaque mise en relation est enregistrée avec date, heure et contexte. Preuve en cas de litige.",
    color: "hsl(38 95% 52%)",
  },
  {
    icon: BarChart3,
    title: "Cockpit de pilotage réel",
    desc: "Pas d'estimations. Données issues du runtime réel. Ce que vous voyez, c'est ce qui se passe.",
    color: "hsl(262 72% 58%)",
  },
  {
    icon: TrendingUp,
    title: "Score de confiance factuel",
    desc: "Chaque facilitateur a un score basé sur son historique réel — validations, qualité, réactivité.",
    color: "hsl(218 80% 62%)",
  },
];

export default function ProofSection() {
  return (
    <section className="py-20 md:py-24 bg-background">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">Sérieux &amp; traçabilité</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Rien ne disparaît. Tout est prouvable.
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Chaque action laisse une trace défendable — pour les entreprises comme pour les facilitateurs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {proofs.map(({ icon: Icon, title, desc, color }) => {
            const bg = color.replace(")", " / 0.08)");
            return (
              <div
                key={title}
                className="bg-card rounded-2xl p-5 border border-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: bg }}
                >
                  <Icon size={17} style={{ color }} aria-hidden="true" />
                </div>
                <p className="font-semibold text-foreground text-sm mb-2 leading-snug">{title}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
