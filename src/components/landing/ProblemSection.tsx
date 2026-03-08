const problems = [
  {
    emoji: "🔀",
    title: "Prospection dispersée.",
    desc: "LinkedIn par-là, relances par-ci, tableur pour suivre. Rien n'avance, tout se perd.",
  },
  {
    emoji: "🤝",
    title: "Réseau qui dort.",
    desc: "Des contacts qui pourraient ouvrir des portes — mais c'est informel, flou, et rien n'est activé.",
  },
  {
    emoji: "💸",
    title: "Intros qui disparaissent.",
    desc: "Une mise en relation prometteuse il y a 3 semaines. Jamais relancée. Le deal dort.",
  },
  {
    emoji: "📊",
    title: "Impossible de mesurer.",
    desc: "Quel canal rapporte ? Quel apporteur est efficace ? Combien via le réseau ? Impossible à dire.",
  },
  {
    emoji: "🛠️",
    title: "4 outils qui ne se parlent pas.",
    desc: "CRM ici, emailing là, commissions dans un tableur, messages à la main. C'est épuisant.",
  },
  {
    emoji: "🌫️",
    title: "Gains opaques.",
    desc: "Vous avez fait une mise en relation. Ça a abouti ? Vous serez payé ? Comment le prouver ?",
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
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Pas parce que vous travaillez mal.
            Mais parce que vos outils ne sont pas faits pour ça.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {problems.map(({ emoji, title, desc }) => (
            <div
              key={title}
              className="bg-card border border-border rounded-2xl p-5 flex gap-3.5 items-start transition-shadow duration-200 hover:shadow-md"
            >
              <span className="text-2xl shrink-0 mt-0.5" aria-hidden="true">{emoji}</span>
              <div>
                <p className="font-semibold text-foreground text-sm mb-1.5 leading-snug">{title}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-foreground text-base font-semibold">
            Wiinup Max règle tout ça.{" "}
            <span className="text-muted-foreground font-normal text-sm">
              Dans un seul système. Sans 3 semaines de formation.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
