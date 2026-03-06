const steps = [
  {
    num: "1",
    title: "Créez votre compte",
    desc: "Votre adresse e-mail et un mot de passe. C'est tout. Aucune information de paiement requise pour commencer.",
    duration: "1 minute",
  },
  {
    num: "2",
    title: "Répondez à 3 questions",
    desc: "On vous demande juste ce que vous faites. En 2 minutes, votre espace est configuré pour vous.",
    duration: "2 minutes",
  },
  {
    num: "3",
    title: "Travaillez tranquillement",
    desc: "Votre tableau de bord est prêt. Tout est rangé, visible, clair. Et si vous avez une question, l'aide est à portée de clic.",
    duration: "Immédiatement",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-muted scroll-mt-16">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Comment ça marche
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            En 3 étapes, c'est lancé.
          </h2>
          <p className="text-muted-foreground text-lg">
            Pas de guide. Pas de tutoriel. Vous comprenez tout de suite.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connector line — desktop only */}
          <div className="hidden md:block absolute top-10 left-[calc(16.7%+1rem)] right-[calc(16.7%+1rem)] h-px bg-border" />

          {steps.map(({ num, title, desc, duration }) => (
            <div key={num} className="card-surface p-6 text-center relative">
              <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground font-display font-bold text-2xl flex items-center justify-center mx-auto mb-4 relative z-10">
                {num}
              </div>
              <span className="inline-block text-xs font-semibold text-accent bg-accent/10 rounded-full px-2.5 py-0.5 mb-3">
                {duration}
              </span>
              <h3 className="font-semibold text-foreground text-base mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
