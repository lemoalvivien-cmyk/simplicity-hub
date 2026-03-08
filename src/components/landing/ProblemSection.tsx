const problems = [
  {
    emoji: "🔀",
    title: "Votre prospection est dispersée.",
    desc: "LinkedIn par-là, emails de relance par-ci, tableur pour suivre. Résultat : rien n'avance, tout se perd.",
  },
  {
    emoji: "🤝",
    title: "Votre réseau dort.",
    desc: "Vous avez des contacts qui pourraient vous ouvrir des portes. Mais c'est informel, flou, et vous ne savez pas comment activer ça proprement.",
  },
  {
    emoji: "💸",
    title: "Les intros passent à travers les mailles.",
    desc: "Quelqu'un vous a présenté un contact prometteur il y a 3 semaines. Vous n'avez jamais relancé. Le deal dort.",
  },
  {
    emoji: "📊",
    title: "Vous ne savez pas ce qui fonctionne.",
    desc: "Quel canal rapporte ? Quel apporteur est efficace ? Combien avez-vous généré via votre réseau ? Impossible à dire.",
  },
  {
    emoji: "🛠️",
    title: "Vous jongleriez avec 4 outils.",
    desc: "CRM ici, outil d'emailing là, suivi des commissions dans un tableur, messages à la main. C'est épuisant.",
  },
  {
    emoji: "🌫️",
    title: "Les gains restent opaques.",
    desc: "Vous avez fait une mise en relation. Est-ce que ça a abouti ? Est-ce que vous serez payé ? Comment le prouver ?",
  },
];

export default function ProblemSection() {
  return (
    <section className="py-20 bg-muted">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">Ce qui fuit</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Votre acquisition perd du temps et de l'argent.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Pas parce que vous travaillez mal. Mais parce que vos outils ne sont pas faits pour ça.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {problems.map(({ emoji, title, desc }) => (
            <div
              key={title}
              className="bg-card border border-border rounded-2xl p-5 flex gap-3 items-start"
            >
              <span className="text-2xl mt-0.5 shrink-0">{emoji}</span>
              <div>
                <p className="font-semibold text-foreground text-sm mb-1.5">{title}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-foreground text-base font-medium">
            Wiinup Max règle tout ça.{" "}
            <span className="text-muted-foreground font-normal">
              Dans un seul système. Sans vous former pendant 3 semaines.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
