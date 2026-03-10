import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { track } from "@/lib/landingTracking";

const faqs = [
  {
    q: "C'est quoi exactement Wiinup Max ?",
    a: "Un cockpit d'acquisition qui combine prospection automatisée par IA (OpenClaw) et réseau d'apport d'affaires structuré (facilitateurs). Les deux remontent dans un seul tableau de bord — sans jongler entre plusieurs outils.",
  },
  {
    q: "À qui s'adresse Wiinup Max ?",
    a: "Aux entreprises qui veulent trouver plus de clients sans jongler avec 5 outils différents. Et aux apporteurs d'affaires qui veulent monétiser leurs mises en relation proprement, avec traçabilité et visibilité.",
  },
  {
    q: "Quelle est la vraie différence avec un CRM ?",
    a: "Un CRM stocke des contacts. Wiinup Max génère des opportunités. Il prospecte, structure les introductions, les valide et mesure les résultats. Ce n'est pas le même niveau d'outil.",
  },
  {
    q: "Combien ça coûte pour une entreprise ?",
    a: "WiinupMax est proposé au tarif unique de 99 € TTC par an. Annulation libre à tout moment.",
  },
  {
    q: "L'accès facilitateur est vraiment gratuit ?",
    a: "Oui. Pour toujours. Sans carte bancaire. Sans frais cachés. Les facilitateurs gagnent des commissions directement sur les introductions validées — la plateforme ne prélève rien.",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui. Sans condition. Votre accès reste actif jusqu'à la fin de la période payée. Aucune pénalité, aucun engagement de durée.",
  },
  {
    q: "Faut-il des compétences techniques ?",
    a: "Aucune. JARVIS vous guide à chaque étape. Si vous savez envoyer un email, vous pouvez utiliser Wiinup Max.",
  },
  {
    q: "Combien de temps pour être opérationnel ?",
    a: "Votre première mission peut être publiée en moins de 5 minutes après inscription. Pas de formation, pas d'onboarding long, pas de frais de setup.",
  },
];

export default function FAQSection() {
  return (
    <section className="py-20 md:py-24 bg-background border-t border-border">
      <div className="container max-w-2xl">
        <div className="text-center mb-10">
          <p className="pill-tag mb-4 mx-auto w-fit">FAQ</p>
          <h2 className="font-display text-3xl font-bold text-foreground mb-3">
            Tout ce qu'il faut savoir.
          </h2>
          <p className="text-muted-foreground text-sm">
            Une autre question ?{" "}
            <a href="mailto:contact@vlmconsulting.fr" className="text-primary hover:underline font-medium">
              Écrivez-nous directement
            </a>
          </p>
        </div>

        <Accordion
          type="single"
          collapsible
          className="space-y-2"
          onValueChange={(val) => {
            if (val) track("faq_open", { label: val });
          }}
        >
          {faqs.map(({ q, a }, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="bg-card border border-border rounded-2xl px-5 data-[state=open]:border-primary/35 data-[state=open]:shadow-sm transition-all duration-200"
            >
              <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline py-4 gap-3">
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5 pt-0">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
