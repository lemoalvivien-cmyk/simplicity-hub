import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import { CheckCircle2, Tag } from "lucide-react";

const included = [
  "Accès complet à toutes les fonctionnalités",
  "Assistant IA disponible en permanence",
  "Centre d'aide et base de connaissance",
  "Mises à jour incluses",
  "Support par e-mail",
  "Annulation simple à tout moment",
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      {/* Header */}
      <section className="py-16 text-center container max-w-2xl">
        <h1 className="font-display text-4xl font-bold text-foreground mb-3">
          Un seul tarif, tout inclus.
        </h1>
        <p className="text-muted-foreground text-lg">
          Pas de surprise. Pas de frais cachés. Pas de version "light" frustrante.
        </p>
      </section>

      {/* Pricing card */}
      <div className="container max-w-md pb-16">
        <div className="bg-card border-2 border-primary rounded-2xl overflow-hidden shadow-lg">
          {/* Banner */}
          <div className="bg-gradient-primary px-6 py-4 text-center">
            <span className="text-sm font-semibold text-primary-foreground/80 uppercase tracking-wider">
              Offre de lancement
            </span>
          </div>

          <div className="p-8">
            {/* Price */}
            <div className="text-center mb-8">
              <div className="flex items-end justify-center gap-1">
                <span className="font-display text-5xl font-bold text-foreground">59 €</span>
                <span className="text-muted-foreground mb-2">/mois TTC</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Sans engagement — résiliez quand vous voulez
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {included.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{item}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link to="/checkout" className="btn-cta w-full text-center text-base py-4 block">
              Démarrer maintenant →
            </Link>

            {/* Promo code */}
            <div className="mt-4 p-3 bg-accent-light rounded-lg flex items-center gap-2">
              <Tag size={15} className="text-accent shrink-0" />
              <p className="text-xs text-foreground">
                <strong>Vous avez un code d'invitation ?</strong> Entrez-le à l'étape suivante pour activer 12 mois gratuits.
              </p>
            </div>
          </div>
        </div>

        {/* Reassurance */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Paiement sécurisé par Stripe · Aucune carte requise avec un code d'invitation · Données protégées
        </p>
      </div>

      {/* FAQ rapide */}
      <section className="border-t border-border py-16 bg-muted">
        <div className="container max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-foreground mb-8 text-center">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {[
              { q: "Puis-je annuler à tout moment ?", a: "Oui, sans condition ni préavis. Votre accès reste actif jusqu'à la fin de la période payée." },
              { q: "Qu'est-ce qu'un code d'invitation ?", a: "C'est un code unique qui vous donne 12 mois d'accès gratuit. Si vous en avez un, entrez-le au moment de l'activation." },
              { q: "Faut-il une carte bancaire pour tester ?", a: "Avec un code d'invitation, non. Sans code, oui — mais vous ne serez débité qu'après 30 jours." },
              { q: "Est-ce vraiment simple à utiliser ?", a: "C'est notre engagement numéro un. Si vous trouvez quelque chose de compliqué, contactez-nous et on l'améliore." },
            ].map(({ q, a }) => (
              <div key={q} className="bg-card rounded-xl p-5 border border-border">
                <p className="font-semibold text-sm text-foreground mb-2">{q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
