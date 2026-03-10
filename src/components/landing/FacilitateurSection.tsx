import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { track } from "@/lib/landingTracking";

const benefits = [
  "Choisissez les missions qui correspondent à votre réseau",
  "Envoyez une intro qualifiée en moins de 2 minutes",
  "Suivez vos validations et vos gains en temps réel",
  "Chaque introduction est protégée et horodatée",
  "Aucune commission prélevée par la plateforme",
  "100% gratuit — sans carte bancaire, pour toujours",
];

export default function FacilitateurSection() {
  return (
    <section className="py-20 md:py-24 bg-muted">
      <div className="container max-w-4xl">
        <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          {/* Left — copy */}
          <div>
            <p className="pill-tag mb-5 w-fit">Apporteurs d'affaires</p>
            <h2 className="font-display text-3xl md:text-[2rem] font-bold text-foreground mb-4 leading-tight">
              Votre réseau vaut de l'argent.{" "}
              <span className="text-highlight">Maintenant vous pouvez le prouver.</span>
            </h2>
            <p className="text-muted-foreground text-base mb-3 leading-relaxed">
              Vous faites déjà des mises en relation. Mais c'est informel, flou, rarement payé, jamais tracé.
            </p>
            <p className="text-foreground text-base mb-8 leading-relaxed font-medium">
              Transformez-les en{" "}
              <span className="text-highlight">gains suivis, visibles et défendables.</span>{" "}
              Sans bricolage. Sans rien payer.
            </p>
            <Link
              to="/signup"
              className="btn-cta inline-flex items-center gap-2 px-8 py-4 text-base"
              onClick={() => track("cta_facilitateur_section")}
            >
              Monétiser mon réseau — Gratuit
              <ArrowRight size={16} />
            </Link>
            <p className="text-[11px] text-muted-foreground mt-3">
              Un modèle transparent d'apport d'affaires, avec attribution prouvée et paiement garanti.
            </p>
          </div>

          {/* Right — card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(160deg, hsl(24 60% 8%), hsl(38 50% 12%))",
              border: "1px solid hsl(24 55% 20% / 0.6)",
              boxShadow: "0 8px 32px hsl(24 60% 5% / 0.45)",
            }}
          >
            <div
              className="px-6 pt-6 pb-4 border-b"
              style={{ borderColor: "hsl(24 50% 22% / 0.5)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(24 100% 62%)" }}>
                Accès Facilitateur
              </p>
              <div className="flex items-baseline gap-2">
                <p className="font-display font-bold text-white text-2xl leading-none">Gratuit</p>
                <p className="text-white/60 text-xs">Pour toujours · Sans carte bancaire</p>
              </div>
            </div>
            <ul className="p-6 space-y-3">
              {benefits.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 size={14} style={{ color: "hsl(24 100% 60%)" }} className="shrink-0 mt-0.5" />
                  <span className="text-sm text-white/78 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
