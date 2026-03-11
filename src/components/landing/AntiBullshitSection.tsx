import { forwardRef } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { track } from "@/lib/landingTracking";

const allQAs = [
  // Objections
  {
    q: "Je ne suis pas du tout technique.",
    a: "Wiinup Max est conçu pour des commerciaux et dirigeants non techniques. KITT IA vous guide à chaque étape en langage clair. Si vous savez envoyer un email, vous êtes qualifié.",
    tag: "obj",
  },
  {
    q: "Je ne veux pas d'un outil de plus dans ma pile.",
    a: "C'est précisément l'inverse. Wiinup Max remplace votre CRM approximatif, votre tableur de suivi, vos notes de relance et vos messages non tracés. Un seul outil — pas un de plus.",
    tag: "obj",
  },
  {
    q: "Mon réseau est informel et pas très structuré.",
    a: "C'est le cas d'usage numéro 1. Les facilitateurs les plus performants faisaient déjà des mises en relation informelles. La plateforme structure ce qui existe déjà — sans le changer.",
    tag: "obj",
  },
  {
    q: "Comment fonctionne le modèle d'apport d'affaires ?",
    a: "C'est un modèle transparent : un facilitateur présente un contact qualifié à une entreprise. Si l'introduction aboutit, le facilitateur reçoit un gain tracé et garanti. Chaque étape est prouvée dans le système.",
    tag: "obj",
  },
  {
    q: "Comment je prouve ce qui m'appartient ?",
    a: "Chaque introduction est horodatée à la seconde dès l'envoi. L'attribution est enregistrée automatiquement. Si un deal se concrétise dans 6 mois, la trace est là — défendable et incontestable.",
    tag: "obj",
  },
  {
    q: "Je ne veux pas payer pour du vent.",
    a: "Vous activez un système complet : prospection IA + réseau structuré + cockpit de suivi. L'offre de lancement est à 99 € pour la première année. Si vous n'obtenez pas plus d'introductions qualifiées qu'en faisant tout à la main, annulez.",
    tag: "obj",
  },
  {
    q: "Est-ce sérieux pour un complément de revenus ?",
    a: "Les gains sont réels, traçables et basés sur des validations vérifiables. C'est de l'apport d'affaires — exactement ce que font les courtiers et apporteurs d'affaires professionnels. Disponible à tout le monde, pour la première fois avec des outils dignes de ce nom.",
    tag: "obj",
  },
  // FAQ
  {
    q: "C'est quoi exactement Wiinup Max ?",
    a: "Un cockpit d'acquisition qui combine prospection automatisée par IA (OpenClaw) et réseau d'apport d'affaires structuré (facilitateurs). Les deux remontent dans un seul tableau de bord — sans jongler entre plusieurs outils.",
    tag: "faq",
  },
  {
    q: "À qui s'adresse Wiinup Max ?",
    a: "Aux entreprises qui veulent trouver plus de clients sans jongler avec 5 outils différents. Et aux apporteurs d'affaires qui veulent monétiser leurs mises en relation proprement, avec traçabilité et visibilité.",
    tag: "faq",
  },
  {
    q: "Quelle est la vraie différence avec un CRM ?",
    a: "Un CRM stocke des contacts. Wiinup Max génère des opportunités. Il prospecte, structure les introductions, les valide et mesure les résultats. Ce n'est pas le même niveau d'outil.",
    tag: "faq",
  },
  {
    q: "Combien ça coûte pour une entreprise ?",
    a: "WiinupMax est proposé au tarif unique de 99 € TTC par an. Annulation libre à tout moment.",
    tag: "faq",
  },
  {
    q: "L'accès facilitateur est vraiment gratuit ?",
    a: "Oui. Pour toujours. Sans carte bancaire. Sans frais cachés. Les facilitateurs gagnent des commissions directement sur les introductions validées — la plateforme ne prélève rien.",
    tag: "faq",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui. Sans condition. Votre accès reste actif jusqu'à la fin de la période payée. Aucune pénalité, aucun engagement de durée.",
    tag: "faq",
  },
  {
    q: "Faut-il des compétences techniques ?",
    a: "Aucune. KITT IA vous guide à chaque étape. Si vous savez envoyer un email, vous pouvez utiliser Wiinup Max.",
    tag: "faq",
  },
  {
    q: "Combien de temps pour être opérationnel ?",
    a: "Votre première mission peut être publiée en moins de 5 minutes après inscription. Pas de formation, pas d'onboarding long, pas de frais de setup.",
    tag: "faq",
  },
];

const AntiBullshitSection = forwardRef<HTMLElement>(function AntiBullshitSection(_, ref) {
  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-20 md:py-24 bg-muted">
      <div className="container max-w-2xl">
        <div className="text-center mb-10">
          <p className="pill-tag mb-4 mx-auto w-fit">Questions & Réponses</p>
          <h2 className="font-display text-3xl font-bold text-foreground mb-3">
            Vos questions. Nos réponses.
          </h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Pas de vague. Pas d'esquive.{" "}
            <a href="mailto:contact@wiinupmax.com" className="text-primary hover:underline font-medium">
              Une autre question ? Écrivez-nous.
            </a>
          </p>
        </div>

        <Accordion
          type="single"
          collapsible
          className="space-y-2"
          onValueChange={(val) => {
            if (val) track("qa_open", { label: val });
          }}
        >
          {allQAs.map(({ q, a }, i) => (
            <AccordionItem
              key={i}
              value={`qa-${i}`}
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
});

AntiBullshitSection.displayName = "AntiBullshitSection";

export default AntiBullshitSection;
