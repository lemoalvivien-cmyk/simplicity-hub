import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { track } from "@/lib/landingTracking";

const objections = [
  {
    q: "Je ne suis pas du tout technique.",
    a: "Wiinup Max est conçu pour des commerciaux et dirigeants non techniques. JARVIS vous guide à chaque étape en langage clair. Si vous savez envoyer un email, vous êtes qualifié.",
  },
  {
    q: "Je ne veux pas d'un outil de plus dans ma pile.",
    a: "C'est précisément l'inverse. Wiinup Max remplace votre CRM approximatif, votre tableur de suivi, vos notes de relance et vos messages non tracés. Un seul outil — pas un de plus.",
  },
  {
    q: "Mon réseau est informel et pas très structuré.",
    a: "C'est le cas d'usage numéro 1. Les facilitateurs les plus performants faisaient déjà des mises en relation informelles. La plateforme structure ce qui existe déjà — sans le changer.",
  },
  {
    q: "Comment fonctionne le modèle d'apport d'affaires ?",
    a: "C'est un modèle transparent : un facilitateur présente un contact qualifié à une entreprise. Si l'introduction aboutit, le facilitateur reçoit un gain tracé et garanti. Chaque étape est prouvée dans le système.",
  },
  {
    q: "Comment je prouve ce qui m'appartient ?",
    a: "Chaque introduction est horodatée à la seconde dès l'envoi. L'attribution est enregistrée automatiquement. Si un deal se concrétise dans 6 mois, la trace est là — défendable et incontestable.",
  },
  {
    q: "Je ne veux pas payer pour du vent.",
    a: "Vous activez un système complet : prospection IA + réseau structuré + cockpit de suivi. L'offre de lancement est à 99 € pour la première année. Si vous n'obtenez pas plus d'introductions qualifiées qu'en faisant tout à la main, annulez.",
  },
  {
    q: "Est-ce sérieux pour un complément de revenus ?",
    a: "Les gains sont réels, traçables et basés sur des validations vérifiables. C'est de l'apport d'affaires — exactement ce que font les courtiers et apporteurs d'affaires professionnels. Disponible à tout le monde, pour la première fois avec des outils dignes de ce nom.",
  },
];

export default function AntiBullshitSection() {
  return (
    <section className="py-20 md:py-24 bg-muted">
      <div className="container max-w-2xl">
        <div className="text-center mb-10">
          <p className="pill-tag mb-4 mx-auto w-fit">Objections</p>
          <h2 className="font-display text-3xl font-bold text-foreground mb-3">
            Les vraies questions. Les vraies réponses.
          </h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Pas de vague. Pas d'esquive. Pas de promesses en l'air.
          </p>
        </div>

        <Accordion
          type="single"
          collapsible
          className="space-y-2"
          onValueChange={(val) => {
            if (val) track("objection_open", { label: val });
          }}
        >
          {objections.map(({ q, a }, i) => (
            <AccordionItem
              key={i}
              value={`obj-${i}`}
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
