import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Est-ce que je dois être téchnique pour utiliser Planify ?",
    a: "Non. Planify est conçu pour des personnes qui n'ont aucune compétence technique. Si vous savez utiliser un téléphone ou un e-mail, vous pouvez utiliser Planify.",
  },
  {
    q: "Combien de temps faut-il pour démarrer ?",
    a: "Moins de 5 minutes. Vous créez votre compte, vous répondez à 3 questions simples, et votre espace est prêt. Pas de configuration, pas de formation.",
  },
  {
    q: "Est-ce que je peux annuler à tout moment ?",
    a: "Oui. Vous pouvez arrêter votre abonnement quand vous voulez, depuis votre espace compte, en un seul clic. Aucune condition, aucune pénalité.",
  },
  {
    q: "Qu'est-ce qu'un code d'invitation ?",
    a: "Un code d'invitation est un code que certaines personnes reçoivent pour accéder à 12 mois gratuits. Ce n'est pas un mot de passe. Vous l'entrez une seule fois à l'inscription. Il n'est valable qu'une seule fois.",
  },
  {
    q: "Est-ce que mes données sont en sécurité ?",
    a: "Oui. Vos données sont hébergées sur des serveurs sécurisés. La connexion est chiffrée. Elles ne sont jamais revendues ni partagées.",
  },
  {
    q: "Y a-t-il de l'aide si je suis bloqué ?",
    a: "Oui. Un assistant est disponible directement dans votre espace. Vous pouvez aussi nous contacter par e-mail. Vous obtiendrez une réponse claire et rapide.",
  },
];

export default function FAQSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container max-w-2xl">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Questions fréquentes
          </p>
          <h2 className="font-display text-3xl font-bold text-foreground">
            Vous avez des questions ?
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map(({ q, a }, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="bg-card border border-border rounded-xl px-5 data-[state=open]:border-primary/40"
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
