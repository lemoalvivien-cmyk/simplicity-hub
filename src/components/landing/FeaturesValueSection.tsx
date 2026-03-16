import { Send, FileText, Zap, LayoutDashboard, TrendingUp, ShieldCheck, MessageSquare, Bell } from "lucide-react";

const features = [
  {
    icon: FileText,
    name: "Missions publiées en 2 minutes",
    badge: "Entreprise",
    what: "Décrivez le client idéal, votre réseau reçoit la mission immédiatement",
    problem: "Vous n'avez pas le temps de prospecter et de personnaliser chaque jour.",
    impact: "Vos apporteurs voient votre besoin immédiatement et vous envoient des introductions qualifiées.",
    color: "hsl(218 80% 65%)",
  },
  {
    icon: Send,
    name: "Introductions traçées et horodatées",
    badge: "Les deux",
    what: "Chaque mise en relation est enregistrée et protégée",
    problem: "Les intros informelles ne sont pas traçables — elles disparaissent.",
    impact: "Chaque introduction est datée, signée et défendable. Zéro intro perdue. Rien ne se perd.",
    color: "hsl(152 62% 42%)",
  },
  {
    icon: LayoutDashboard,
    name: "Votre espace personnel haut de gamme",
    badge: "Les deux",
    what: "Un seul écran magnifique où tout est clair",
    problem: "Vous ne savez jamais où en est votre pipeline en temps réel.",
    impact: "Les clients intéressés, les présentations de vos contacts, vos gains en cours, et la prochaine action simple à faire.",
    color: "hsl(218 55% 70%)",
  },
  {
    icon: Bell,
    name: "Le suivi doux et automatique",
    badge: "Les deux",
    what: "Notifications au bon moment, sans jamais vous embêter",
    problem: "Vous ratez des signaux critiques parce qu'ils se noient dans le bruit.",
    impact: "Chaque événement important remonte immédiatement. Zéro opportunité manquée.",
    color: "hsl(218 72% 62%)",
  },
  {
    icon: ShieldCheck,
    name: "Les gains protégés et transparents",
    badge: "Facilitateur",
    what: "Chaque présentation est enregistrée en sécurité",
    problem: "Les apporteurs ne savent jamais s'ils seront payés, ni quand.",
    impact: "Dès la signature, l'argent est versé automatiquement. Zéro surprise, zéro stress.",
    color: "hsl(152 62% 42%)",
  },
  {
    icon: Zap,
    name: "Matching facilitateurs",
    badge: "Entreprise",
    what: "Suggestions de facilitateurs pertinents par mission",
    problem: "Vous ne savez pas qui dans votre réseau peut vous ramener des clients.",
    impact: "Les apporteurs les plus adaptés sont mis en avant pour chaque mission.",
    color: "hsl(24 100% 55%)",
  },
  {
    icon: TrendingUp,
    name: "Gains traçables en temps réel",
    badge: "Facilitateur",
    what: "Commissions visibles et défendables en temps réel",
    problem: "Les apporteurs ne savent jamais s'ils seront payés, ni quand.",
    impact: "Confiance maximale → les meilleurs apporteurs restent actifs pour vous.",
    color: "hsl(38 95% 52%)",
  },
  {
    icon: MessageSquare,
    name: "Suggestions de prochaine action",
    badge: "Les deux",
    what: "Prochaine étape claire selon l'état de votre pipeline",
    problem: "Vous ne savez pas toujours quelle action prioriser parmi toutes les tâches.",
    impact: "Des suggestions concrètes basées sur l'état réel de votre pipeline.",
    color: "hsl(262 72% 60%)",
  },
];

const badgeStyle: Record<string, string> = {
  "Entreprise": "hsl(218 72% 55%)",
  "Facilitateur": "hsl(24 100% 58%)",
  "Les deux": "hsl(152 62% 42%)",
};

export default function FeaturesValueSection() {
  return (
    <section className="py-20 md:py-24 bg-background">
      <div className="container max-w-5xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">Ce que vous avez vraiment</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tout ce dont vous avez besoin. Rien de superflu.
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Pas de gadgets. Pas de fonctionnalités décoratives.{" "}
            <strong className="text-foreground font-medium">Chaque module est traduit en valeur business réelle.</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

                <div className="h-px bg-border" />

                <div className="space-y-2.5 text-xs flex-1">
                  <div>
                    <p className="text-muted-foreground/65 font-bold uppercase tracking-wide text-[9px] mb-1">
                      Sans ça
                    </p>
                    <p className="text-foreground/80 leading-relaxed">{problem}</p>
                  </div>
                  <div
                    className="rounded-xl px-3 py-2.5"
                    style={{ background: bgAlpha }}
                  >
                    <p className="font-bold uppercase tracking-wide text-[9px] mb-1" style={{ color: color.replace(")", " / 0.75)") }}>
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
