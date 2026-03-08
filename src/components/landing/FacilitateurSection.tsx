import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const benefits = [
  "Choisissez les missions qui collent à votre réseau",
  "Envoyez une intro qualifiée en 2 minutes",
  "Suivez vos validations et vos gains en temps réel",
  "Chaque introduction est protégée et prouvable",
  "Aucune commission prélevée par la plateforme",
  "100% gratuit — sans carte bancaire, pour toujours",
];

export default function FacilitateurSection() {
  return (
    <section className="py-20 bg-muted">
      <div className="container max-w-4xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left — copy */}
          <div>
            <p className="pill-tag mb-5 w-fit">Apporteurs d'affaires</p>
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Votre réseau vaut de l'argent.<br />
              <span className="text-highlight">Maintenant vous pouvez le prouver.</span>
            </h2>
            <p className="text-muted-foreground text-base mb-6 leading-relaxed">
              Vous connaissez des gens. Vous faites des mises en relation informelles.
              Mais ça reste flou, impayé, non tracé. Wiinup Max change ça.
            </p>
            <p className="text-muted-foreground text-base mb-8 leading-relaxed">
              Transformez vos mises en relation en <strong className="text-foreground">gains suivis, visibles et défendables</strong>.
              Sans bricolage. Sans ambiguïté. Sans rien payer.
            </p>
            <Link
              to="/signup"
              className="btn-cta inline-flex items-center gap-2 px-8 py-4 text-base"
            >
              Créer mon compte facilitateur — Gratuit
              <ArrowRight size={16} />
            </Link>
            <p className="text-xs text-muted-foreground mt-3">
              Ce n'est pas du MLM. C'est de l'apport d'affaires traçable.
            </p>
          </div>

          {/* Right — benefits card */}
          <div
            className="rounded-2xl overflow-hidden border border-border"
            style={{ background: "linear-gradient(160deg, hsl(24 60% 8%), hsl(38 50% 12%))" }}
          >
            <div
              className="px-6 pt-6 pb-4 border-b"
              style={{ borderColor: "hsl(24 50% 22% / 0.5)" }}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(24 100% 65%)" }}>
                Accès Facilitateur
              </p>
              <p className="font-display font-bold text-white text-2xl">Gratuit</p>
              <p className="text-white/55 text-xs mt-1">Pour toujours · Sans carte bancaire</p>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {benefits.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={15} style={{ color: "hsl(24 100% 60%)" }} className="shrink-0 mt-0.5" />
                    <span className="text-sm text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
