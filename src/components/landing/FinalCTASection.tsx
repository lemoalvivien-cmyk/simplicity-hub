import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function FinalCTASection() {
  return (
    <section className="hero-bg py-20">
      <div className="container max-w-2xl text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
          Prêt à simplifier votre travail ?
        </h2>
        <p className="text-white/70 text-lg mb-3 max-w-md mx-auto">
          Commencez maintenant. Vous serez opérationnel en moins de 5 minutes.
        </p>
        <p className="text-white/45 text-sm mb-8">
          Aucune compétence technique requise · Aide disponible à chaque étape
        </p>
        <Link
          to="/pricing"
          className="btn-cta inline-flex items-center gap-2 text-base px-10 py-4"
        >
          Voir les tarifs
          <ArrowRight size={18} />
        </Link>
        <p className="mt-5 text-white/40 text-xs">
          Sans engagement · Annulation libre · Aucune surprise
        </p>
      </div>
    </section>
  );
}
