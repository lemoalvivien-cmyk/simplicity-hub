import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const objections = [
  {
    q: "Je ne suis pas technique.",
    a: "Wiinup Max est conçu pour des professionnels non techniques. Si vous savez utiliser un smartphone, vous êtes qualifié. JARVIS vous guide à chaque étape, en langage clair.",
  },
  {
    q: "Je ne veux pas d'un outil de plus dans ma pile.",
    a: "C'est précisément l'inverse. Wiinup Max est fait pour remplacer votre CRM approximatif, votre tableur de suivi, vos notes de relance et vos messages LinkedIn non tracés. Un seul outil, pas un de plus.",
  },
  {
    q: "Mon réseau est informel, je ne pense pas que ça me concerne.",
    a: "C'est exactement le cas d'usage numéro 1. Les facilitateurs les plus performants sur Wiinup Max sont ceux qui faisaient déjà des mises en relation informelles. La plateforme structure ce qui existe déjà.",
  },
  {
    q: "Est-ce que c'est du MLM déguisé ?",
    a: "Non. Il n'y a pas de recrutement, pas de niveaux, pas de pyramide. C'est de l'apport d'affaires direct et traçable — une pratique commerciale classique, simplement outillée proprement. Chaque facilitateur est payé sur ses propres introductions.",
  },
  {
    q: "Comment je sais ce qui m'appartient ?",
    a: "Chaque introduction est horodatée dès l'envoi. L'attribution est enregistrée automatiquement. Si un deal se concrétise dans 6 mois, la trace est là. Vous ne perdez rien.",
  },
  {
    q: "Je ne veux pas payer pour du vent.",
    a: "Vous ne payez pas pour un outil vide. Vous activez un système complet : prospection IA + réseau structuré + cockpit de suivi. L'offre lancement est à 99 € pour la première année. Si vous ne générez pas plus en introductions qualifiées, annulez.",
  },
  {
    q: "Est-ce sérieux pour un complément de revenus ?",
    a: "Les gains sont réels, traçables et basés sur des validations vérifiables. Ce n'est pas du travail dissimulé ni du flou juridique. C'est de l'apport d'affaires — la même pratique que font les courtiers, agents et consultants, disponible à tout le monde.",
  },
];

export default function AntiBullshitSection() {
  return (
    <section className="py-20 bg-muted">
      <div className="container max-w-3xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">Objections</p>
          <h2 className="font-display text-3xl font-bold text-foreground mb-3">
            Les vraies questions. Les vraies réponses.
          </h2>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Pas de vague. Pas d'esquive. Voici ce que vous vous demandez vraiment.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {objections.map(({ q, a }, i) => (
            <AccordionItem
              key={i}
              value={`obj-${i}`}
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
