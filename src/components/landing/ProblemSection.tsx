export default function ProblemSection() {
  const frustrations = [
    "Vous passez du temps à chercher où vous en êtes dans vos dossiers.",
    "Vous avez peur de perdre une information importante.",
    "Vous utilisez 3 outils différents qui ne se parlent pas.",
  ];

  return (
    <section className="py-20 bg-muted">
      <div className="container max-w-3xl">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Le problème
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Gérer son activité ne devrait pas être aussi compliqué.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            La plupart des outils sont pensés pour des équipes techniques.
            Pas pour vous.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {frustrations.map((text) => (
            <div
              key={text}
              className="bg-card border border-border rounded-xl p-5 flex gap-3 items-start"
            >
              <span className="text-xl mt-0.5 shrink-0">😮‍💨</span>
              <p className="text-foreground text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-base">
            Planify règle ça. <strong className="text-foreground">En 3 minutes, vous êtes opérationnel.</strong>
          </p>
        </div>
      </div>
    </section>
  );
}
