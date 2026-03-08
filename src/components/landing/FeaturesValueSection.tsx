import { Target, Send, CheckCircle2, TrendingUp, Users, Megaphone, Brain, Radar, ShoppingBag, Link2, Bot, LayoutDashboard } from "lucide-react";

const features = [
  {
    icon: Target,
    name: "Missions",
    badge: "Entreprise",
    what: "Décrivez exactement qui vous cherchez",
    problem: "Vos apporteurs ne savent pas quels clients vous ciblez.",
    impact: "Plus d'introductions pertinentes. Moins de bruit dans votre pipeline.",
    color: "hsl(218 72% 55%)",
  },
  {
    icon: Send,
    name: "Introductions",
    badge: "Les deux",
    what: "Mises en relation vérifiées et tracées",
    problem: "Les intros informelles ne sont pas traçables — elles disparaissent.",
    impact: "Zéro intro perdue. Tout est suivi. Rien ne se perd.",
    color: "hsl(152 62% 42%)",
  },
  {
    icon: CheckCircle2,
    name: "Validation",
    badge: "Entreprise",
    what: "Qualifiez ce qui mérite votre temps",
    problem: "Comment savoir si une intro est sérieuse avant d'investir du temps ?",
    impact: "Vous ne traitez que les opportunités qui le valent.",
    color: "hsl(38 95% 50%)",
  },
  {
    icon: TrendingUp,
    name: "Gains",
    badge: "Facilitateur",
    what: "Commissions tracées en temps réel",
    problem: "Les apporteurs ne savent jamais s'ils seront payés, ni quand.",
    impact: "Confiance maximale → les meilleurs apporteurs restent actifs pour vous.",
    color: "hsl(24 100% 55%)",
  },
  {
    icon: Users,
    name: "Contacts & Import",
    badge: "Entreprise",
    what: "Base de prospects centralisée",
    problem: "Vos contacts sont éparpillés entre CSV, LinkedIn et votre mémoire.",
    impact: "Votre base devient actionnable dès le premier jour.",
    color: "hsl(262 72% 58%)",
  },
  {
    icon: Megaphone,
    name: "Campagnes",
    badge: "Entreprise",
    what: "Séquences de prospection automatisées",
    problem: "Les relances manuelles ne se font jamais, ou trop tard.",
    impact: "Plus de contacts touchés. Moins d'effort humain.",
    color: "hsl(218 72% 62%)",
  },
  {
    icon: Brain,
    name: "OpenClaw",
    badge: "Entreprise",
    what: "Cerveau autonome de prospection",
    problem: "Vous n'avez pas le temps de prospecter chaque jour.",
    impact: "Prospection continue. Sans effort manuel quotidien.",
    color: "hsl(218 80% 65%)",
  },
  {
    icon: Radar,
    name: "Deal Radar",
    badge: "Entreprise",
    what: "Signaux d'intention d'achat",
    problem: "Vous contactez des prospects froids et essuyez des refus.",
    impact: "Vos efforts vont là où les chances de conversion sont les plus élevées.",
    color: "hsl(152 62% 42%)",
  },
  {
    icon: ShoppingBag,
    name: "Marketplace",
    badge: "Entreprise",
    what: "Réseau d'apporteurs actifs et qualifiés",
    problem: "Vous ne savez pas qui dans votre réseau peut vous ramener des clients.",
    impact: "Choisissez les meilleurs apporteurs pour chaque mission.",
    color: "hsl(24 100% 58%)",
  },
  {
    icon: Link2,
    name: "Diffusion passive",
    badge: "Facilitateur",
    what: "Liens traqués pour partager votre offre",
    problem: "Vous partagez votre offre mais ne savez jamais qui clique.",
    impact: "Votre réseau travaille pour vous — même quand vous dormez.",
    color: "hsl(38 95% 52%)",
  },
  {
    icon: Bot,
    name: "JARVIS",
    badge: "Les deux",
    what: "Copilote IA — toujours la prochaine action",
    problem: "Vous arrivez dans la plateforme et ne savez pas par où commencer.",
    impact: "Vous ne perdez jamais de temps à réfléchir à la prochaine étape.",
    color: "hsl(218 72% 68%)",
  },
  {
    icon: LayoutDashboard,
    name: "Cockpit central",
    badge: "Les deux",
    what: "Vue unifiée de toute votre acquisition",
    problem: "Vous ne savez jamais où en est votre pipeline en temps réel.",
    impact: "Décisions plus rapides. Pilotage en temps réel. Zéro surprise.",
    color: "hsl(218 55% 70%)",
  },
];

const badgeStyle: Record<string, string> = {
  "Entreprise": "hsl(218 72% 55%)",
  "Facilitateur": "hsl(24 100% 58%)",
  "Les deux": "hsl(152 62% 42%)",
};

export default function FeaturesValueSection() {
  return (
    <section className="py-20 md:py-24 bg-muted">
      <div className="container max-w-5xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">Ce que vous obtenez</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Chaque fonctionnalité règle un vrai problème.
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Pas de gadgets. Pas de fonctionnalités décoratives.{" "}
            <strong className="text-foreground font-medium">Chaque module est traduit en valeur business réelle.</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {features.map(({ icon: Icon, name, badge, what, problem, impact, color }) => {
            const bgAlpha = color.replace(")", " / 0.07)");
            const borderAlpha = color.replace(")", " / 0.16)");
            const badgeColor = badgeStyle[badge] ?? color;
            return (
              <div
                key={name}
                className="bg-card rounded-2xl p-5 border flex flex-col gap-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: borderAlpha }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: bgAlpha, border: `1px solid ${borderAlpha}` }}
                    >
                      <Icon size={15} style={{ color }} aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm leading-tight">{name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{what}</p>
                    </div>
                  </div>
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                    style={{
                      background: badgeColor.replace(")", " / 0.1)"),
                      color: badgeColor,
                      border: `1px solid ${badgeColor.replace(")", " / 0.2)")}`,
                    }}
                  >
                    {badge}
                  </span>
                </div>

                {/* Separator */}
                <div className="h-px bg-border" />

                {/* Value rows */}
                <div className="space-y-2.5 text-xs flex-1">
                  <div>
                    <p className="text-muted-foreground/65 font-bold uppercase tracking-wide text-[9px] mb-1">
                      Sans ça
                    </p>
                    <p className="text-foreground/72 leading-relaxed">{problem}</p>
                  </div>
                  <div
                    className="rounded-xl px-3 py-2.5"
                    style={{ background: bgAlpha }}
                  >
                    <p className="font-bold uppercase tracking-wide text-[9px] mb-1" style={{ color: color.replace(")", " / 0.65)") }}>
                      Avec Wiinup Max
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
