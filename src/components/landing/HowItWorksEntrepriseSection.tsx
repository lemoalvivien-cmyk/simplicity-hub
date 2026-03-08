import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    num: "01",
    title: "Publiez une mission",
    desc: "Décrivez votre client idéal, votre offre et la commission pour l'apporteur. En moins de 5 minutes, votre mission est visible.",
    color: "hsl(218 72% 55%)",
    tag: "5 minutes",
  },
  {
    num: "02",
    title: "Activez le bon moteur",
    desc: "OpenClaw prospecte automatiquement. Les facilitateurs envoient des introductions. Les deux remontent dans votre cockpit.",
    color: "hsl(152 62% 45%)",
    tag: "Automatique",
  },
  {
    num: "03",
    title: "Recevez des introductions suivies",
    desc: "Chaque introduction arrive avec contexte, contact, et historique. Vous voyez tout sans chercher.",
    color: "hsl(38 95% 50%)",
    tag: "Temps réel",
  },
  {
    num: "04",
    title: "Validez et mesurez",
    desc: "Acceptez ou refusez en un clic. Vos gains, conversions et ROI sont calculés automatiquement.",
    color: "hsl(24 100% 55%)",
    tag: "1 clic",
  },
];

export default function HowItWorksEntrepriseSection() {
  return (
    <section id="comment-ca-marche" className="py-20 bg-background scroll-mt-16">
      <div className="container max-w-3xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">Pour les entreprises</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            De zéro à vos premières opportunités.<br />
            <span className="text-highlight">En 4 étapes.</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Pas de formation. Pas de configuration longue. Vous êtes opérationnel le jour même.
          </p>
        </div>

        <div className="space-y-3">
          {steps.map(({ num, title, desc, color, tag }, i) => (
            <div key={num} className="flex gap-5 items-start">
              <div className="shrink-0 flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-sm text-white"
                  style={{ background: color }}
                >
                  {num}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 mt-2 min-h-6 bg-border" />
                )}
              </div>
              <div className="pb-5 flex-1">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <p className="font-semibold text-foreground text-base">{title}</p>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${color}18`, color }}
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
          <Link to="/pricing" className="btn-cta inline-flex items-center gap-2 px-8 py-4 text-base">
            Lancer ma première mission
            <ArrowRight size={16} />
          </Link>
          <p className="text-xs text-muted-foreground mt-3">
            Offre lancement — 99 € TTC / an · 100 premières entreprises
          </p>
        </div>
      </div>
    </section>
  );
}
