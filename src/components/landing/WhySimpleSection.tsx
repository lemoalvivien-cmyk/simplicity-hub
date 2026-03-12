const points = [
  {
    icon: "🙅",
    title: "Zéro compétence technique nécessaire",
    desc: "Si vous savez utiliser votre e-mail, vous savez utiliser Wiinup Max.",
  },
  {
    icon: "🧑‍🏫",
    title: "Un assistant vous guide à chaque étape",
    desc: "À chaque doute, une aide simple et claire est disponible en un clic.",
  },
  {
    icon: "📱",
    title: "Ça fonctionne sur votre téléphone",
    desc: "Application pensée pour être utilisée depuis n'importe quel appareil.",
  },
  {
    icon: "💬",
    title: "Des réponses en langage simple",
    desc: "Nos réponses ne contiennent jamais de jargon. Vous comprenez toujours ce qu'on vous dit.",
  },
];

export default function WhySimpleSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Pensé pour vous
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Pourquoi c'est vraiment simple ?
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Planify est conçu pour des personnes comme vous — pas pour des développeurs.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {points.map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-4 bg-card border border-border rounded-xl p-5">
              <span className="text-3xl shrink-0">{icon}</span>
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
