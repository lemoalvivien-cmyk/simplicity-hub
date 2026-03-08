import { Target, Send, CheckCircle2, TrendingUp, Users, Megaphone, Brain, Radar, ShoppingBag, Link2, Bot, LayoutDashboard } from "lucide-react";

const features = [
  {
    icon: Target,
    name: "Missions",
    what: "Publiez ce que vous recherchez",
    problem: "Vos apporteurs ne savent pas exactement qui vous cherchez.",
    impact: "Plus d'introductions pertinentes, moins de bruit.",
    color: "hsl(218 72% 55%)",
  },
  {
    icon: Send,
    name: "Introductions",
    what: "Mises en relation vérifiées",
    problem: "Les intros informelles ne sont pas traçables et se perdent.",
    impact: "Zéro intro perdue. Tout est suivi automatiquement.",
    color: "hsl(152 62% 42%)",
  },
  {
    icon: CheckCircle2,
    name: "Validation",
    what: "Qualifiez ce qui vaut votre temps",
    problem: "Comment savoir si une intro est sérieuse avant d'investir du temps ?",
    impact: "Vous ne traitez que ce qui mérite votre attention.",
    color: "hsl(38 95% 50%)",
  },
  {
    icon: TrendingUp,
    name: "Gains",
    what: "Commissions tracées en temps réel",
    problem: "Les apporteurs ne savent jamais si et quand ils seront payés.",
    impact: "Confiance maximale des apporteurs → plus d'intros actives.",
    color: "hsl(24 100% 55%)",
  },
  {
    icon: Users,
    name: "Contacts & Import",
    what: "Base de prospects centralisée",
    problem: "Vos contacts sont éparpillés entre CSV, LinkedIn et votre mémoire.",
    impact: "Votre base devient actionnable dès le premier jour.",
    color: "hsl(262 72% 58%)",
  },
  {
    icon: Megaphone,
    name: "Campagnes & Actions",
    what: "Séquences de prospection automatisées",
    problem: "Les relances manuelles ne se font jamais, ou trop tard.",
    impact: "Plus de contacts touchés, moins d'effort manuel.",
    color: "hsl(218 72% 62%)",
  },
  {
    icon: Brain,
    name: "OpenClaw",
    what: "Cerveau central de prospection autonome",
    problem: "Vous n'avez pas le temps de prospecter tous les jours.",
    impact: "Prospection continue sans effort humain quotidien.",
    color: "hsl(218 80% 65%)",
  },
  {
    icon: Radar,
    name: "Deal Radar",
    what: "Signaux d'intention d'achat",
    problem: "Vous contactez des prospects froids et essuyez des refus.",
    impact: "Vos efforts vont là où les chances de conversion sont les plus hautes.",
    color: "hsl(152 62% 42%)",
  },
  {
    icon: ShoppingBag,
    name: "Marketplace facilitateurs",
    what: "Réseau d'apporteurs actifs et qualifiés",
    problem: "Vous ne savez pas qui peut vous apporter des clients.",
    impact: "Vous choisissez les meilleurs apporteurs pour chaque mission.",
    color: "hsl(24 100% 58%)",
  },
  {
    icon: Link2,
    name: "Diffusion passive",
    what: "Liens traqués pour partager votre offre",
    problem: "Vous partagez votre offre mais ne savez jamais qui clique.",
    impact: "Votre réseau travaille pour vous même quand vous dormez.",
    color: "hsl(38 95% 52%)",
  },
  {
    icon: Bot,
    name: "JARVIS",
    what: "Copilote IA qui sait toujours quoi faire",
    problem: "Vous arrivez dans la plateforme et ne savez pas par où commencer.",
    impact: "Vous ne perdez jamais de temps à réfléchir à la prochaine étape.",
    color: "hsl(218 72% 68%)",
  },
  {
    icon: LayoutDashboard,
    name: "Cockpit central",
    what: "Vue unifiée de toute votre acquisition",
    problem: "Vous ne savez jamais où en est votre pipeline en temps réel.",
    impact: "Décisions plus rapides. Pilotage en temps réel. Zéro surprise.",
    color: "hsl(218 55% 70%)",
  },
];

export default function FeaturesValueSection() {
  return (
    <section className="py-20 md:py-24 bg-muted">
      <div className="container max-w-5xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">Ce que vous obtenez</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Chaque fonctionnalité résout un vrai problème.
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Pas de gadgets. Chaque module est traduit en valeur business réelle.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {features.map(({ icon: Icon, name, what, problem, impact, color }) => {
            const bgAlpha = color.replace(")", " / 0.07)");
            const borderAlpha = color.replace(")", " / 0.18)");
            return (
              <div
                key={name}
                className="bg-card rounded-2xl p-5 border flex flex-col gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: borderAlpha }}
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: bgAlpha, border: `1px solid ${borderAlpha}` }}
                  >
                    <Icon size={15} style={{ color }} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm leading-tight">{name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{what}</p>
                  </div>
                </div>

                {/* Separator */}
                <div className="h-px bg-border" />

                {/* Value rows */}
                <div className="space-y-2.5 text-xs flex-1">
                  <div>
                    <p className="text-muted-foreground/70 font-medium uppercase tracking-wide text-[9px] mb-1">Problème</p>
                    <p className="text-foreground/75 leading-relaxed">{problem}</p>
                  </div>
                  <div
                    className="rounded-xl px-3 py-2.5"
                    style={{ background: bgAlpha }}
                  >
                    <p className="font-medium uppercase tracking-wide text-[9px] mb-1" style={{ color: color.replace(")", " / 0.7)") }}>
                      Impact business
                    </p>
                    <p className="font-semibold leading-relaxed" style={{ color }}>{impact}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
