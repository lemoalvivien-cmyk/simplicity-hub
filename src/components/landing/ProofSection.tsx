import { Shield, Eye, TrendingUp, CheckCircle2, Lock, BarChart3 } from "lucide-react";

const proofs = [
  {
    icon: Shield,
    title: "Chaque intro est protégée dès l'envoi",
    desc: "L'attribution est enregistrée instantanément. Si ça aboutit dans 6 mois, la preuve est là. Incontestable.",
    color: "hsl(218 72% 55%)",
  },
  {
    icon: CheckCircle2,
    title: "Aucun paiement sans validation",
    desc: "L'entreprise confirme. Le facilitateur est payé. La logique est simple, transparente, et respectée des deux côtés.",
    color: "hsl(152 62% 45%)",
  },
  {
    icon: Eye,
    title: "Gains visibles en temps réel",
    desc: "Montant, statut, date — tout est visible à tout moment. Plus de flou. Plus de relances embarassantes.",
    color: "hsl(24 100% 55%)",
  },
  {
    icon: Lock,
    title: "Introductions horodatées",
    desc: "Date, heure, contexte — tout est enregistré. En cas de litige, la trace est là. Défendable devant n'importe qui.",
    color: "hsl(38 95% 52%)",
  },
  {
    icon: BarChart3,
    title: "Pipeline visible en temps réel",
    desc: "Chaque mission, chaque intro, chaque opportunité — actualisé instantanément. Votre cockpit reflète toujours l'état exact de votre pipeline.",
    color: "hsl(262 72% 58%)",
  },
  {
    icon: TrendingUp,
    title: "Score de confiance factuel",
    desc: "Chaque facilitateur a un score calculé sur son historique réel — validations, qualité d'intro, réactivité.",
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
          <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">
            Chaque action laisse une trace défendable —{" "}
            <strong className="text-foreground font-semibold">pour les entreprises comme pour les facilitateurs.</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {proofs.map(({ icon: Icon, title, desc, color }) => {
            const bg = color.replace(")", " / 0.08)");
            const border = color.replace(")", " / 0.14)");
            return (
              <div
                key={title}
                className="bg-card rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: border }}
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

        {/* Reinforcer */}
        <div
          className="mt-8 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
          style={{
            background: "hsl(var(--primary) / 0.06)",
            border: "1px solid hsl(var(--primary) / 0.14)",
          }}
        >
          <Lock size={22} style={{ color: "hsl(var(--primary))", flexShrink: 0 }} aria-hidden="true" />
          <p className="text-sm text-foreground leading-relaxed">
            <strong className="font-semibold">La plateforme est conçue pour être défendable.</strong>{" "}
            Chaque action, chaque intro, chaque gain — enregistré, tracé, prouvable. Pas de zones grises.
          </p>
        </div>
      </div>
    </section>
  );
}
