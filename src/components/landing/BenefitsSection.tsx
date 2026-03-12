
const benefits = [
  {
    emoji: "🧭",
    title: "Tout est au même endroit.",
    desc: "Vos dossiers, vos tâches, vos messages. Centralisés dans un seul cockpit. Vous gardez le contrôle à chaque étape.",
  },
  {
    emoji: "⚡",
    title: "Vous démarrez en 3 minutes.",
    desc: "Pas de configuration. Pas de formation. Un assistant vous guide pas à pas dès votre première connexion.",
  },
  {
    emoji: "🤝",
    title: "Vous n'êtes jamais seul.",
    desc: "Une aide intégrée répond à vos questions à tout moment. En langage simple. Pas en jargon.",
  },
];

export default function BenefitsSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Ce que ça change
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Avec Wiinup Max, travailler devient simple.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map(({ emoji, title, desc }) => (
            <div key={title} className="card-surface p-6">
              <div className="text-4xl mb-4">{emoji}</div>
              <h3 className="font-semibold text-foreground text-base mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
