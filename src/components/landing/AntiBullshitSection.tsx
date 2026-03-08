import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const objections = [
  {
    q: "Je ne suis pas technique.",
    a: "Wiinup Max est conçu pour des professionnels non techniques. JARVIS vous guide à chaque étape, en langage clair. Si vous savez utiliser un smartphone, vous êtes qualifié.",
  },
  {
    q: "Je ne veux pas d'un outil de plus dans ma pile.",
    a: "C'est précisément l'inverse. Wiinup Max remplace votre CRM approximatif, votre tableur de suivi, vos notes de relance et vos messages non tracés. Un seul outil — pas un de plus.",
  },
  {
    q: "Mon réseau est informel.",
    a: "C'est le cas d'usage numéro 1. Les facilitateurs les plus performants faisaient déjà des mises en relation informelles. La plateforme structure ce qui existe déjà.",
  },
  {
    q: "Est-ce du MLM déguisé ?",
    a: "Non. Il n'y a pas de recrutement, pas de niveaux, pas de pyramide. C'est de l'apport d'affaires direct et traçable — une pratique commerciale classique, simplement bien outillée.",
  },
  {
    q: "Comment je sais ce qui m'appartient ?",
    a: "Chaque introduction est horodatée dès l'envoi. L'attribution est enregistrée automatiquement. Si un deal se concrétise dans 6 mois, la trace est là.",
  },
  {
    q: "Je ne veux pas payer pour du vent.",
    a: "Vous activez un système complet : prospection IA + réseau structuré + cockpit de suivi. L'offre lancement est à 99 € pour la première année. Si vous ne générez pas plus en introductions qualifiées, annulez.",
  },
  {
    q: "Est-ce sérieux pour un complément de revenus ?",
    a: "Les gains sont réels, traçables et basés sur des validations vérifiables. C'est de l'apport d'affaires — la même pratique que font les courtiers et consultants, disponible à tout le monde.",
  },
];

export default function AntiBullshitSection() {
  return (
    <section className="py-20 md:py-24 bg-muted">
      <div className="container max-w-2xl">
        <div className="text-center mb-10">
          <p className="pill-tag mb-4 mx-auto w-fit">Vos questions</p>
          <h2 className="font-display text-3xl font-bold text-foreground mb-3">
            Les vraies questions. Les vraies réponses.
          </h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Pas de vague. Pas d'esquive.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {objections.map(({ q, a }, i) => (
            <AccordionItem
              key={i}
              value={`obj-${i}`}
              className="bg-card border border-border rounded-2xl px-5 data-[state=open]:border-primary/30 data-[state=open]:shadow-sm transition-all duration-200"
            >
              <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline py-4 gap-3">
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4 pt-0">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
