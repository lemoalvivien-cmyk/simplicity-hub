const items = [
  {
    icon: "🔒",
    title: "Vos données sont protégées",
    desc: "Hébergement sécurisé. Connexion chiffrée. Vos informations restent privées.",
  },
  {
    icon: "🧭",
    title: "Vous êtes guidé à chaque étape",
    desc: "Onboarding pas à pas, aide contextuelle, support disponible à tout moment.",
  },
  {
    icon: "📞",
    title: "Une vraie aide disponible",
    desc: "Si vous avez un doute, vous pouvez nous contacter. Vous obtiendrez une vraie réponse.",
  },
  {
    icon: "💡",
    title: "Rien de caché, tout est clair",
    desc: "Pas de frais surprise. Pas de clause piège. Tout est visible avant que vous vous engagiez.",
  },
];

export default function ReassuranceSection() {
  return (
    <section className="py-20 bg-muted">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Vous pouvez nous faire confiance
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Ce que vous êtes en droit d'attendre.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {items.map(({ icon, title, desc }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-6 flex gap-4">
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
