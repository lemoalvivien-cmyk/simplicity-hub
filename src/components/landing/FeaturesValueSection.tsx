import { Target, Send, CheckCircle2, TrendingUp, Users, Megaphone, Brain, Radar, ShoppingBag, Link2, Bot, LayoutDashboard } from "lucide-react";

const features = [
  {
    icon: Target,
    name: "Missions",
    what: "Publiez ce que vous recherchez",
    problem: "Vos apporteurs ne savent pas exactement qui vous cherchez",
    benefit: "Chaque facilitateur sait précisément comment vous aider",
    impact: "Plus d'introductions pertinentes, moins de bruit",
    color: "hsl(218 72% 55%)",
    bg: "hsl(218 72% 55% / 0.08)",
    border: "hsl(218 72% 55% / 0.2)",
  },
  {
    icon: Send,
    name: "Introductions",
    what: "Mises en relation vérifiées",
    problem: "Les intros informelles ne sont pas traçables et se perdent",
    benefit: "Chaque introduction arrive structurée, avec contexte et contact",
    impact: "Zéro intro perdue. Tout est suivi automatiquement",
    color: "hsl(152 62% 40%)",
    bg: "hsl(152 62% 40% / 0.08)",
    border: "hsl(152 62% 40% / 0.2)",
  },
  {
    icon: CheckCircle2,
    name: "Validation",
    what: "Qualifiez ce qui vaut votre temps",
    problem: "Comment savoir si une intro est sérieuse avant d'investir du temps ?",
    benefit: "Un processus clair de qualification en 1 clic",
    impact: "Vous ne traitez que ce qui mérite votre attention",
    color: "hsl(38 95% 50%)",
    bg: "hsl(38 95% 50% / 0.08)",
    border: "hsl(38 95% 50% / 0.2)",
  },
  {
    icon: TrendingUp,
    name: "Gains",
    what: "Commissions tracées pour les facilitateurs",
    problem: "Les apporteurs ne savent jamais si et quand ils seront payés",
    benefit: "Chaque gain est lié à une intro, une validation, une preuve",
    impact: "Confiance maximale des apporteurs → plus d'intros actives",
    color: "hsl(24 100% 55%)",
    bg: "hsl(24 100% 55% / 0.08)",
    border: "hsl(24 100% 55% / 0.2)",
  },
  {
    icon: Users,
    name: "Contacts & Import",
    what: "Votre base de prospects centralisée",
    problem: "Vos contacts sont éparpillés entre CSV, LinkedIn et votre mémoire",
    benefit: "Import rapide, enrichissement auto, segmentation immédiate",
    impact: "Votre base devient actionnable dès le premier jour",
    color: "hsl(262 72% 58%)",
    bg: "hsl(262 72% 58% / 0.08)",
    border: "hsl(262 72% 58% / 0.2)",
  },
  {
    icon: Megaphone,
    name: "Campagnes & Actions",
    what: "Séquences de prospection automatisées",
    problem: "Les relances manuelles ne se font jamais, ou trop tard",
    benefit: "Des séquences qui tournent seules sur vos contacts ciblés",
    impact: "Plus de contacts touchés, moins d'effort manuel",
    color: "hsl(218 72% 62%)",
    bg: "hsl(218 72% 62% / 0.08)",
    border: "hsl(218 72% 62% / 0.2)",
  },
  {
    icon: Brain,
    name: "OpenClaw",
    what: "Cerveau central de prospection autonome",
    problem: "Vous n'avez pas le temps de prospecter tous les jours",
    benefit: "Il détecte les opportunités et prépare tout pendant que vous dormez",
    impact: "Prospection continue sans effort humain quotidien",
    color: "hsl(218 80% 65%)",
    bg: "hsl(218 80% 65% / 0.08)",
    border: "hsl(218 80% 65% / 0.2)",
  },
  {
    icon: Radar,
    name: "Deal Radar",
    what: "Détection de signaux d'intention d'achat",
    problem: "Vous contactez des prospects froids et essuyez des refus",
    benefit: "Il identifie ceux qui montrent des signaux d'intérêt réels",
    impact: "Vos efforts vont là où les chances de conversion sont les plus hautes",
    color: "hsl(152 62% 42%)",
    bg: "hsl(152 62% 42% / 0.08)",
    border: "hsl(152 62% 42% / 0.2)",
  },
  {
    icon: ShoppingBag,
    name: "Marketplace facilitateurs",
    what: "Réseau d'apporteurs actifs et qualifiés",
    problem: "Vous ne savez pas qui dans votre réseau peut vous apporter des clients",
    benefit: "Des facilitateurs scorés, avec historique et taux de conversion visible",
    impact: "Vous choisissez les meilleurs apporteurs pour chaque mission",
    color: "hsl(24 100% 58%)",
    bg: "hsl(24 100% 58% / 0.08)",
    border: "hsl(24 100% 58% / 0.2)",
  },
  {
    icon: Link2,
    name: "Diffusion passive",
    what: "Liens traqués pour partager votre offre",
    problem: "Vous partagez votre offre mais ne savez jamais qui clique ni d'où vient la conversion",
    benefit: "Chaque lien est traçable, chaque clic est enregistré",
    impact: "Votre réseau travaille pour vous même quand vous dormez",
    color: "hsl(38 95% 52%)",
    bg: "hsl(38 95% 52% / 0.08)",
    border: "hsl(38 95% 52% / 0.2)",
  },
  {
    icon: Bot,
    name: "JARVIS — Assistant IA",
    what: "Votre copilote qui sait toujours quoi faire",
    problem: "Vous arrivez dans la plateforme et ne savez pas par où commencer",
    benefit: "Il priorise vos actions, améliore vos messages, vous guide",
    impact: "Vous ne perdez jamais de temps à réfléchir à la prochaine étape",
    color: "hsl(218 72% 68%)",
    bg: "hsl(218 72% 68% / 0.08)",
    border: "hsl(218 72% 68% / 0.2)",
  },
  {
    icon: LayoutDashboard,
    name: "Cockpit central",
    what: "Vue unifiée de toute votre acquisition",
    problem: "Vous ne savez jamais où en est votre pipeline en temps réel",
    benefit: "Tout remonte ici : intros, validations, gains, actions en cours",
    impact: "Décisions plus rapides. Pilotage en temps réel. Zéro surprise.",
    color: "hsl(218 55% 72%)",
    bg: "hsl(218 55% 72% / 0.08)",
    border: "hsl(218 55% 72% / 0.2)",
  },
];

export default function FeaturesValueSection() {
  return (
    <section className="py-20 bg-muted">
      <div className="container max-w-5xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">Ce que vous obtenez</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Chaque fonctionnalité résout un vrai problème.
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Pas de gadgets. Pas de fonctions dont vous n'avez pas besoin. Chaque module est traduit en valeur business réelle.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, name, what, problem, benefit, impact, color, bg, border }) => (
            <div
              key={name}
              className="bg-card rounded-2xl p-5 border flex flex-col gap-4"
              style={{ borderColor: border }}
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: bg, border: `1px solid ${border}` }}
                >
                  <Icon size={16} style={{ color }} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{name}</p>
                  <p className="text-xs text-muted-foreground">{what}</p>
                </div>
              </div>

              {/* Value rows */}
              <div className="space-y-2.5 text-xs">
                <div className="flex gap-2">
                  <span className="shrink-0 text-muted-foreground font-medium w-20">Problème</span>
                  <span className="text-foreground/80 leading-relaxed">{problem}</span>
                </div>
                <div className="flex gap-2">
                  <span className="shrink-0 text-muted-foreground font-medium w-20">Bénéfice</span>
                  <span className="text-foreground/80 leading-relaxed">{benefit}</span>
                </div>
                <div
                  className="flex gap-2 rounded-lg px-3 py-2"
                  style={{ background: bg }}
                >
                  <span className="shrink-0 font-semibold w-20" style={{ color }}>Impact</span>
                  <span className="leading-relaxed font-medium" style={{ color }}>{impact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
