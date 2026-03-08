const problems = [
  {
    emoji: "🔀",
    title: "Prospection dispersée.",
    desc: "LinkedIn par-là, relances par-ci, tableur pour suivre. Rien n'avance, tout se perd.",
  },
  {
    emoji: "🤝",
    title: "Réseau inexploité.",
    desc: "Des contacts qui pourraient ouvrir des portes — mais rien n'est activé, rien n'est tracé.",
  },
  {
    emoji: "💸",
    title: "Intros qui disparaissent.",
    desc: "Une mise en relation prometteuse il y a 3 semaines. Jamais relancée. Le deal est mort.",
  },
  {
    emoji: "📊",
    title: "ROI invisible.",
    desc: "Quel canal rapporte ? Quel apporteur convertit ? Combien via le réseau ? Vous ne savez pas.",
  },
  {
    emoji: "🛠️",
    title: "4 outils qui ne se parlent pas.",
    desc: "CRM ici, emailing là, commissions dans un tableur. C'est épuisant et ça coûte des deals.",
  },
  {
    emoji: "🌫️",
    title: "Gains impayés, non prouvés.",
    desc: "Vous avez fait une intro. Ça a abouti. Vous le prouver comment ? Vous serez payé quand ?",
  },
];

export default function ProblemSection() {
  return (
    <section className="py-20 md:py-24 bg-muted">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">Le vrai problème</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Votre acquisition fuit de partout.
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto">
            Pas parce que vous travaillez mal.{" "}
            <strong className="text-foreground font-semibold">Parce que vos outils ne sont pas faits pour ça.</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {problems.map(({ emoji, title, desc }) => (
            <div
              key={title}
              className="bg-card border border-border rounded-2xl p-5 flex gap-3.5 items-start transition-all duration-200 hover:border-destructive/25 hover:shadow-sm"
            >
              <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">{emoji}</span>
              <div>
                <p className="font-semibold text-foreground text-sm mb-1.5 leading-snug">{title}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-8 rounded-2xl px-6 py-4 text-center border"
          style={{
            background: "hsl(var(--primary) / 0.05)",
            borderColor: "hsl(var(--primary) / 0.15)",
          }}
        >
          <p className="text-foreground text-sm font-semibold">
            Wiinup Max règle tout ça — dans un seul système.{" "}
            <span className="text-muted-foreground font-normal">
              Sans 3 semaines de formation. Sans changer votre façon de travailler.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
