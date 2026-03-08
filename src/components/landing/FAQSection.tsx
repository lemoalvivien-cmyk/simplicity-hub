import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "C'est quoi exactement Wiinup Max ?",
    a: "Wiinup Max est un cockpit d'acquisition qui combine deux moteurs : la prospection automatisée par IA (OpenClaw) et le réseau d'apport d'affaires structuré (facilitateurs). Tout remonte dans un seul tableau de bord.",
  },
  {
    q: "À qui s'adresse Wiinup Max ?",
    a: "Aux entreprises qui veulent trouver plus de clients via leur réseau ET via l'IA — sans jongler avec 5 outils différents. Et aux apporteurs d'affaires qui veulent monétiser leurs mises en relation proprement.",
  },
  {
    q: "Quelle est la différence avec un CRM ?",
    a: "Un CRM stocke des contacts. Wiinup Max génère des opportunités. Il prospecte, structure les introductions, les valide et mesure les résultats. Ce n'est pas le même niveau.",
  },
  {
    q: "Combien ça coûte pour une entreprise ?",
    a: "L'offre de lancement est à 99 € TTC pour la première année (au lieu de 490 €). Réservée aux 100 premières entreprises. Après la période de lancement, le tarif standard est de 490 € / an.",
  },
  {
    q: "L'accès facilitateur est vraiment gratuit ?",
    a: "Oui. Pour toujours. Sans carte bancaire. Sans frais cachés. Les facilitateurs ne paient rien. Ils gagnent des commissions sur les introductions validées.",
  },
  {
    q: "Est-ce que je peux annuler à tout moment ?",
    a: "Oui. Sans condition et sans justification. Votre accès reste actif jusqu'à la fin de la période payée. Il n'y a pas de pénalité d'annulation.",
  },
  {
    q: "Faut-il être technique pour utiliser la plateforme ?",
    a: "Aucune compétence technique requise. JARVIS vous guide à chaque étape. Si vous savez envoyer un email, vous pouvez utiliser Wiinup Max.",
  },
  {
    q: "Combien de temps pour être opérationnel ?",
    a: "Votre première mission peut être publiée en moins de 5 minutes après votre inscription. Pas de formation, pas d'onboarding long.",
  },
];

export default function FAQSection() {
  return (
    <section className="py-20 bg-muted border-t border-border">
      <div className="container max-w-2xl">
        <div className="text-center mb-10">
          <p className="pill-tag mb-4 mx-auto w-fit">FAQ</p>
          <h2 className="font-display text-3xl font-bold text-foreground mb-3">
            Tout ce qu'il faut savoir.
          </h2>
          <p className="text-muted-foreground text-sm">
            Si votre question n'est pas là, contactez-nous à{" "}
            <a href="mailto:contact@vlmconsulting.fr" className="text-primary hover:underline">
              contact@vlmconsulting.fr
            </a>
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map(({ q, a }, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="bg-card border border-border rounded-2xl px-5 data-[state=open]:border-primary/40"
            >
              <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline py-4">
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
