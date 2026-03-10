import { Send, Brain, Zap, LayoutDashboard, TrendingUp, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Brain,
    name: "Prospection IA",
    badge: "Entreprise",
    what: "OpenClaw — cerveau autonome de prospection",
    problem: "Vous n'avez pas le temps de prospecter chaque jour.",
    impact: "Prospection continue. Sans effort manuel quotidien.",
    color: "hsl(218 80% 65%)",
  },
  {
    icon: Send,
    name: "Apport d'affaires",
    badge: "Les deux",
    what: "Mises en relation vérifiées et tracées",
    problem: "Les intros informelles ne sont pas traçables — elles disparaissent.",
    impact: "Zéro intro perdue. Tout est suivi. Rien ne se perd.",
    color: "hsl(152 62% 42%)",
  },
  {
    icon: Zap,
    name: "Matching intelligent",
    badge: "Entreprise",
    what: "IA identifie les meilleurs facilitateurs par mission",
    problem: "Vous ne savez pas qui dans votre réseau peut vous ramener des clients.",
    impact: "Les bons apporteurs sont sélectionnés automatiquement pour chaque mission.",
    color: "hsl(24 100% 55%)",
  },
  {
    icon: LayoutDashboard,
    name: "Dashboard unifié",
    badge: "Les deux",
    what: "Vue unifiée de toute votre acquisition",
    problem: "Vous ne savez jamais où en est votre pipeline en temps réel.",
    impact: "Décisions plus rapides. Pilotage en temps réel. Zéro surprise.",
    color: "hsl(218 55% 70%)",
  },
  {
    icon: TrendingUp,
    name: "Gains tracés",
    badge: "Facilitateur",
    what: "Commissions visibles et défendables en temps réel",
    problem: "Les apporteurs ne savent jamais s'ils seront payés, ni quand.",
    impact: "Confiance maximale → les meilleurs apporteurs restent actifs pour vous.",
    color: "hsl(38 95% 52%)",
  },
  {
    icon: ShieldCheck,
    name: "Score de confiance",
    badge: "Facilitateur",
    what: "Réputation calculée sur l'historique réel",
    problem: "Impossible de distinguer un bon apporteur d'un inconnu.",
    impact: "Les meilleurs facilitateurs se démarquent. La confiance est mesurable.",
    color: "hsl(152 62% 42%)",
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
