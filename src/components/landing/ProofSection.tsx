import { Shield, Eye, TrendingUp, CheckCircle2, Lock, BarChart3 } from "lucide-react";

const proofs = [
  {
    icon: Shield,
    title: "Chaque intro est protégée",
    desc: "L'attribution est enregistrée dès l'envoi. Si ça aboutit 6 mois plus tard, la trace est là. Vous ne perdez jamais ce qui vous appartient.",
    color: "hsl(218 72% 55%)",
  },
  {
    icon: CheckCircle2,
    title: "Validation avant tout paiement",
    desc: "Aucune commission n'est générée sans validation. L'entreprise confirme. Le facilitateur est payé. Le processus est clair pour les deux parties.",
    color: "hsl(152 62% 45%)",
  },
  {
    icon: Eye,
    title: "Visibilité totale des gains",
    desc: "Les apporteurs voient leurs gains en temps réel — montant, statut, date. Plus d'attente dans le flou.",
    color: "hsl(24 100% 55%)",
  },
  {
    icon: Lock,
    title: "Introductions horodatées",
    desc: "Chaque mise en relation est enregistrée avec date, heure et contexte. En cas de litige, vous avez une preuve.",
    color: "hsl(38 95% 52%)",
  },
  {
    icon: BarChart3,
    title: "Cockpit de pilotage réel",
    desc: "Pas d'estimations. Vos données sont issues du runtime réel. Ce que vous voyez, c'est ce qui se passe vraiment.",
    color: "hsl(262 72% 58%)",
  },
  {
    icon: TrendingUp,
    title: "Score de confiance factuel",
    desc: "Chaque facilitateur a un score basé sur son historique réel — taux de validation, qualité des intros, réactivité.",
    color: "hsl(218 80% 62%)",
  },
];

export default function ProofSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">Sérieux &amp; traçabilité</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Rien ne disparaît. Tout est prouvable.
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Wiinup Max est construit pour que chaque action laisse une trace défendable.
            Pour les entreprises comme pour les facilitateurs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {proofs.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-card rounded-2xl p-5 border border-border">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${color.replace(")", " / 0.12)")}` }}
              >
                <Icon size={18} style={{ color }} aria-hidden="true" />
              </div>
              <p className="font-semibold text-foreground text-sm mb-2">{title}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
