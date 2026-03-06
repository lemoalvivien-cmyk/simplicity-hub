import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";

const included = [
  "Accès complet à toutes les fonctionnalités",
  "Assistant IA intégré pour vous guider",
  "Tableau de bord clair et organisé",
  "Centre d'aide disponible à tout moment",
  "Support par e-mail inclus",
  "Mises à jour automatiques sans surcoût",
];

export default function PricingSection() {
  return (
    <section className="py-20 bg-muted">
      <div className="container max-w-xl">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Offre de lancement
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Un seul tarif. Tout inclus.
          </h2>
        </div>

        <div className="bg-card border-2 border-primary rounded-2xl overflow-hidden shadow-lg">
          {/* Price header */}
          <div className="bg-primary px-8 py-8 text-center">
            <p className="text-primary-foreground/70 text-sm font-medium mb-1">Offre lancement</p>
            <div className="flex items-end justify-center gap-2">
              <span className="font-display font-bold text-5xl text-primary-foreground">59 €</span>
              <span className="text-primary-foreground/70 text-base pb-1">TTC / mois</span>
            </div>
            <p className="text-primary-foreground/60 text-xs mt-2">Sans engagement · Annulation en 1 clic</p>
          </div>

          {/* Included */}
          <div className="px-8 py-7">
            <p className="text-sm font-semibold text-foreground mb-4">Ce qui est inclus :</p>
            <ul className="space-y-3">
              {included.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle2 size={16} className="text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              to="/pricing"
              className="btn-cta w-full text-center block mt-8 py-4 flex items-center justify-center gap-2"
            >
              Je commence — 59 € / mois
              <ArrowRight size={16} />
            </Link>

            <p className="text-center text-xs text-muted-foreground mt-3">
              Vous pouvez annuler à tout moment, sans justification.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
