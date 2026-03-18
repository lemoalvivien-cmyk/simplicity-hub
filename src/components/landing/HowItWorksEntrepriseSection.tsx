import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/landingTracking";

const steps = [
  {
    num: "01",
    title: "Vous commencez en 2 minutes",
    desc: "Votre nom, votre téléphone ou email. C'est tout.",
    color: "hsl(218 72% 55%)",
    tag: "2 min",
  },
  {
    num: "02",
    title: "Vous dites simplement ce que vous cherchez",
    desc: "Vous décrivez votre client idéal en quelques mots. Votre espace est configuré en 2 minutes, et votre réseau reçoit votre mission immédiatement.",
    color: "hsl(152 62% 45%)",
    tag: "Simple",
  },
  {
    num: "03",
    title: "Vos facilitateurs envoient des introductions",
    desc: "Vos apporteurs d'affaires — anciens collègues, partenaires, contacts — vous présentent des prospects qu'ils connaissent personnellement. Chaque introduction arrive directement dans votre espace.",
    color: "hsl(38 95% 50%)",
    tag: "Automatique",
  },
  {
    num: "04",
    title: "Vous validez et vous récoltez",
    desc: "Un seul clic pour dire oui. Vous voyez en temps réel qui a aidé, combien ça rapporte, et l'argent arrive automatiquement sur votre compte. Beaucoup d'entrepreneurs reçoivent leurs premières introductions dès les 24 premières heures. Aussi simple que d'allumer votre téléphone le matin.",
    color: "hsl(24 100% 55%)",
    tag: "1 clic",
  },
];

export default function HowItWorksEntrepriseSection() {
  return (
    <section id="comment-ca-marche" className="py-20 md:py-24 bg-background scroll-mt-16">
      <div className="container max-w-2xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">Comment ça marche</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            En 4 étapes,{" "}
            <span className="text-highlight">vos premiers clients arrivent.</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-sm mx-auto">
            Pas de formation. Pas de configuration longue. Opérationnel le jour même.
          </p>
        </div>

        <div className="space-y-2">
          {steps.map(({ num, title, desc, color, tag }, i) => (
            <div key={num} className="flex gap-4 md:gap-5">
              {/* Timeline */}
              <div className="shrink-0 flex flex-col items-center">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center font-display font-bold text-sm text-white shrink-0"
                  style={{ background: color, boxShadow: `0 4px 16px ${color.replace(")", " / 0.35)")}` }}
                >
                  {num}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="w-px flex-1 mt-2 min-h-5"
                    style={{ background: `linear-gradient(to bottom, ${color.replace(")", " / 0.4)")}, transparent)` }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="pb-5 pt-1.5 flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <p className="font-semibold text-foreground text-[0.95rem]">{title}</p>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full leading-none"
                    style={{
                      background: color.replace(")", " / 0.1)"),
                      color,
                      border: `1px solid ${color.replace(")", " / 0.2)")}`,
                    }}
                  >
                    {tag}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/checkout"
            className="btn-cta inline-flex items-center gap-2 px-8 py-4 text-base"
            onClick={() => track("cta_howitworks")}
          >
            Je veux mes premiers clients dès demain — 99 €/an
            <ArrowRight size={16} />
          </Link>
          <p className="text-[11px] text-muted-foreground mt-3">
            Accès immédiat · 30 jours satisfait ou remboursé · Paiement sécurisé Stripe
          </p>
        </div>

        
      </div>
    </section>
  );
}
