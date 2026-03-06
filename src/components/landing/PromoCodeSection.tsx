import { Link } from "react-router-dom";
import { Gift, ArrowRight } from "lucide-react";

export default function PromoCodeSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container max-w-2xl">
        <div className="bg-accent/10 border border-accent/25 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-5">
            <Gift size={28} className="text-accent" />
          </div>

          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
            Vous avez reçu un code d'invitation ?
          </h2>

          <p className="text-muted-foreground text-base mb-6 max-w-md mx-auto leading-relaxed">
            Certaines personnes reçoivent un code qui leur donne accès à{" "}
            <strong className="text-foreground">12 mois gratuits</strong>.
            Si vous avez reçu un tel code, vous pouvez l'utiliser lors de votre inscription.
          </p>

          {/* Important clarification */}
          <div className="bg-card border border-border rounded-xl px-5 py-4 mb-7 text-left">
            <p className="text-sm font-semibold text-foreground mb-1">⚠️ Important à savoir :</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ce code est un <strong className="text-foreground">code de réduction</strong>,
              pas un mot de passe. Vous l'entrez une seule fois lors de votre inscription.
              Il ne vous sera jamais demandé de nouveau.
            </p>
          </div>

          <Link
            to="/signup"
            className="btn-cta inline-flex items-center gap-2 px-8 py-4"
          >
            Utiliser mon code d'invitation
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
