import { GitBranch, BarChart2, Network, AlertCircle, Layers, TrendingDown } from "lucide-react";

const problems = [
  {
    icon: GitBranch,
    color: "hsl(218 72% 55%)",
    title: "Prospection dispersée.",
    desc: "LinkedIn par-là, relances par-ci, tableur pour suivre. Rien n'avance, tout se perd.",
  },
  {
    icon: BarChart2,
    color: "hsl(262 72% 58%)",
    title: "Pipeline invisible.",
    desc: "Combien de prospects chauds ? Combien de deals en cours ? Vous ne savez pas.",
  },
  {
    icon: Network,
    color: "hsl(152 62% 42%)",
    title: "Réseau inexploité.",
    desc: "Des contacts qui pourraient ouvrir des portes. Rien n'est activé, rien n'est tracé.",
  },
  {
    icon: AlertCircle,
    color: "hsl(24 100% 55%)",
    title: "Intros qui disparaissent.",
    desc: "Une mise en relation il y a 3 semaines. Jamais relancée. Le deal est mort.",
  },
  {
    icon: Layers,
    color: "hsl(38 95% 52%)",
    title: "Outils fragmentés.",
    desc: "CRM ici, emailing là, commissions dans un tableur. C'est épuisant et ça coûte des deals.",
  },
  {
    icon: TrendingDown,
    color: "hsl(0 72% 55%)",
    title: "Zéro ROI mesurable.",
    desc: "Quel canal rapporte ? Quel apporteur convertit ? Mystère total.",
  },
];

export default function ProblemSection() {
  return (
    <section className="py-20 md:py-24 bg-muted">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">Le vrai problème</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Votre acquisition client fuit de partout.
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto">
            Pas parce que vous travaillez mal.{" "}
            <strong className="text-foreground font-semibold">Parce que vos outils ne sont pas faits pour ça.</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {problems.map(({ icon: Icon, color, title, desc }) => {
            const bg = color.replace(")", " / 0.09)");
            const border = color.replace(")", " / 0.18)");
            return (
              <div
                key={title}
                className="bg-card border rounded-2xl p-5 flex gap-3.5 items-start transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
                style={{ borderColor: border }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: bg }}
                >
                  <Icon size={15} style={{ color }} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm mb-1.5 leading-snug">{title}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="mt-8 rounded-2xl px-6 py-4 text-center border"
          style={{
            background: "hsl(var(--primary) / 0.05)",
            borderColor: "hsl(var(--primary) / 0.15)",
          }}
        >
          <p className="text-foreground text-sm font-semibold">
            Wiinup Max règle tout ça — dans un seul système.{" "}
            <span className="text-muted-foreground font-normal">
              Sans 3 semaines de formation. Sans changer votre façon de travailler.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
