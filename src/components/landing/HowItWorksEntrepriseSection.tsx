import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/landingTracking";

const steps = [
  {
    num: "01",
    title: "Publiez une mission",
    desc: "Décrivez votre client idéal, votre offre et la commission pour l'apporteur. En moins de 5 minutes, votre mission est visible par tous les facilitateurs actifs.",
    color: "hsl(218 72% 55%)",
    tag: "5 min",
  },
  {
    num: "02",
    title: "Activez le bon moteur",
    desc: "OpenClaw prospecte automatiquement. Les facilitateurs envoient des introductions. Les deux remontent dans votre cockpit — sans que vous ayez à orchestrer quoi que ce soit.",
    color: "hsl(152 62% 45%)",
    tag: "Automatique",
  },
  {
    num: "03",
    title: "Recevez des introductions qualifiées",
    desc: "Chaque introduction arrive avec contexte complet, contact, et historique. Vous voyez tout, sans chercher. Rien ne se perd.",
    color: "hsl(38 95% 50%)",
    tag: "Temps réel",
  },
  {
    num: "04",
    title: "Validez et mesurez votre ROI",
    desc: "Acceptez ou refusez en un clic. Vos gains, taux de conversion et ROI sont calculés automatiquement. Vous savez toujours ce qui fonctionne.",
    color: "hsl(24 100% 55%)",
    tag: "1 clic",
  },
];

export default function HowItWorksEntrepriseSection() {
  return (
    <section id="comment-ca-marche" className="py-20 md:py-24 bg-background scroll-mt-16">
      <div className="container max-w-2xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">Pour les entreprises</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            De zéro à vos premières opportunités{" "}
            <span className="text-highlight">en 4 étapes.</span>
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
            to="/pricing"
            className="btn-cta inline-flex items-center gap-2 px-8 py-4 text-base"
            onClick={() => track("cta_howitworks")}
          >
            Lancer ma première mission
            <ArrowRight size={16} />
          </Link>
          <p className="text-[11px] text-muted-foreground mt-3">
            Offre lancement — 99 € TTC / an · 100 premières entreprises uniquement
          </p>
        </div>
      </div>
    </section>
  );
}
