// AUDIT 16/03/2026 – BLOQUANTS LEVÉS
// Bénéfices réécrits : promesse honnête marketplace réseau B2B, pay-per-result, pas d'IA.

const benefits = [
  {
    emoji: "🤝",
    title: "Vos contacts deviennent votre meilleur canal.",
    desc: "Publiez vos missions en 2 minutes. Vos apporteurs vous présentent des prospects qualifiés qu'ils connaissent personnellement.",
  },
  {
    emoji: "✅",
    title: "Vous ne payez que si ça marche.",
    desc: "Aucun abonnement caché pour les introductions. La commission n'est versée qu'une fois l'affaire signée et validée.",
  },
  {
    emoji: "📊",
    title: "Un cockpit simple. Tout au même endroit.",
    desc: "Missions, introductions, validations et gains dans une seule interface. Vous gardez le contrôle à chaque étape, sans charge mentale.",
  },
];

export default function BenefitsSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Pourquoi ça fonctionne
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Votre réseau est votre meilleur commercial.
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm leading-relaxed">
            Wiinup Max structure ce qui existait déjà — les recommandations entre pairs — et le rend traçable, équitable et automatisé.
          </p>
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
