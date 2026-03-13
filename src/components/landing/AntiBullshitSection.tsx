import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { track } from "@/lib/landingTracking";

const allQAs = [
  {
    q: "Je ne suis pas du tout à l'aise avec les outils numériques.",
    a: "WiinupMax est fait pour vous. Si vous savez envoyer un message sur votre téléphone, vous savez utiliser WiinupMax. Tout est guidé, expliqué en français simple, étape par étape.",
    tag: "obj",
  },
  {
    q: "J'ai déjà trop d'outils. Je ne veux pas en ajouter un de plus.",
    a: "WiinupMax ne s'ajoute pas à vos outils existants — il les remplace. Fini le tableau de suivi, les notes papier, les messages perdus. Un seul endroit calme et clair.",
    tag: "obj",
  },
  {
    q: "Mon réseau est informel. Est-ce que ça marche quand même ?",
    a: "C'est exactement pour ça que WiinupMax est fait. Vos contacts informels peuvent devenir de vraies présentations payées. La plateforme met de l'ordre dans ce qui existait déjà.",
    tag: "obj",
  },
  {
    q: "Comment est-ce qu'on gagne de l'argent en présentant des gens ?",
    a: "C'est simple : vous présentez quelqu'un à une entreprise. Si cette personne devient cliente, vous recevez une récompense. Tout est enregistré et protégé. Vous voyez votre argent arriver en direct.",
    tag: "obj",
  },
  {
    q: "Comment je prouve que c'est moi qui ai fait la présentation ?",
    a: "Chaque présentation est enregistrée avec la date et l'heure exactes dès que vous l'envoyez. Même si l'affaire se conclut 6 mois plus tard, votre rôle est prouvé. Personne ne peut le contester.",
    tag: "obj",
  },
  {
    q: "Et si ça ne marche pas pour moi ? Je perds mon argent ?",
    a: "Pour les facilitateurs, c'est entièrement gratuit — vous ne risquez rien. Pour les entreprises, l'offre de démarrage est à 99 € pour un an. Si vous n'obtenez pas de résultats, vous annulez. Simple.",
    tag: "obj",
  },
  {
    q: "Est-ce que c'est sérieux comme complément de revenus ?",
    a: "Oui. Les gains sont réels, visibles et basés sur de vraies signatures. C'est exactement ce que font les apporteurs d'affaires professionnels depuis des années — maintenant c'est accessible à tout le monde.",
    tag: "obj",
  },
  {
    q: "C'est quoi exactement WiinupMax ?",
    a: "C'est une plateforme qui aide les entreprises à trouver des clients, et qui permet à n'importe qui de gagner de l'argent en présentant des gens qu'il connaît. Tout se passe dans un seul espace simple et protégé.",
    tag: "faq",
  },
  {
    q: "À qui s'adresse WiinupMax ?",
    a: "Aux entreprises qui veulent des clients sans galère, et aux personnes qui veulent gagner de l'argent simplement en parlant de leur entourage. Aucune compétence technique requise.",
    tag: "faq",
  },
  {
    q: "Quelle est la différence avec un outil de contacts habituels ?",
    a: "Un outil de contacts stocke des noms. WiinupMax crée de vraies opportunités. Il cherche des clients pour vous, structure les présentations, et mesure les résultats. Ce n'est pas du tout la même chose.",
    tag: "faq",
  },
  {
    q: "Combien ça coûte pour une entreprise ?",
    a: "99 € pour toute une année. C'est tout. Pas de frais cachés. Vous pouvez annuler à tout moment.",
    tag: "faq",
  },
  {
    q: "L'accès facilitateur est vraiment gratuit ?",
    a: "Oui. Pour toujours. Sans carte bancaire. Vous présentez des gens, vous êtes payé. WiinupMax ne prend rien sur vos gains.",
    tag: "faq",
  },
  {
    q: "Puis-je arrêter quand je veux ?",
    a: "Oui. Sans condition. Votre accès continue jusqu'à la fin de la période payée. Aucune pénalité, aucun engagement.",
    tag: "faq",
  },
  {
    q: "Faut-il des compétences particulières ?",
    a: "Aucune. Si vous savez envoyer un message, vous pouvez utiliser WiinupMax. L'outil vous guide à chaque étape.",
    tag: "faq",
  },
  {
    q: "Combien de temps pour commencer ?",
    a: "Moins de 2 minutes pour créer votre compte. Vous pouvez recevoir vos premières présentations dès le premier jour.",
    tag: "faq",
  },
];

export default function AntiBullshitSection() {
  return (
    <section className="py-20 md:py-24 bg-muted">
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
}
