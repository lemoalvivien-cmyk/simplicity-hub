import { ShieldCheck, CreditCard, Server, Shield, Eye, TrendingUp, Lock, BarChart3, CheckCircle2, FlaskConical } from "lucide-react";

const BETA_NOTE =
  "Bêta privée – fonctionnalités IA en cours d'activation réelle avec API externe. Interface actuellement en mode illustratif.";

const trustBlocks = [
  {
    icon: ShieldCheck,
    title: "Architecture vérifiée par audit indépendant",
    desc: "Notre infrastructure technique suit les meilleures pratiques de sécurité. Chaque introduction, gain et transaction est tracé et immuable.",
    color: "hsl(218 72% 55%)",
  },
  {
    icon: CreditCard,
    title: "Paiements sécurisés par Stripe",
    desc: "Toutes les transactions sont gérées par Stripe, leader mondial du paiement en ligne. Vos données bancaires ne transitent jamais par nos serveurs.",
    color: "hsl(152 62% 45%)",
  },
  {
    icon: Server,
    title: "Données hébergées en Europe (Supabase EU)",
    desc: "Vos données sont stockées exclusivement sur des serveurs européens, conformément au RGPD. Souveraineté numérique garantie.",
    color: "hsl(24 100% 55%)",
  },
];

const proofs = [
  {
    icon: Shield,
    title: "Chaque intro est protégée dès l'envoi",
    desc: "L'attribution est enregistrée instantanément. Si ça aboutit dans 6 mois, la preuve est là. Incontestable.",
    color: "hsl(38 95% 52%)",
  },
  {
    icon: Eye,
    title: "Gains visibles en temps réel",
    desc: "Montant, statut, date — tout est visible à tout moment. Plus de flou. Plus de relances embarrassantes.",
    color: "hsl(262 72% 58%)",
  },
  {
    icon: TrendingUp,
    title: "Score de confiance factuel",
    desc: "Chaque facilitateur a un score calculé sur son historique réel — validations, qualité d'intro, réactivité.",
    color: "hsl(218 80% 62%)",
  },
];

export default function ProofSection() {
  return (
    <section className="py-20 md:py-24 bg-background">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">Sérieux &amp; traçabilité</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Rien ne disparaît. Tout est prouvable.
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">
            Chaque action laisse une trace défendable —{" "}
            <strong className="text-foreground font-semibold">pour les entreprises comme pour les facilitateurs.</strong>
          </p>
        </div>

        {/* Trust infrastructure — 3 concrete blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {trustBlocks.map(({ icon: Icon, title, desc, color }) => {
            const bg = color.replace(")", " / 0.08)");
            const border = color.replace(")", " / 0.18)");
            return (
              <div
                key={title}
                className="bg-card rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: border }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: bg }}
                >
                  <Icon size={18} style={{ color }} aria-hidden="true" />
                </div>
                <p className="font-semibold text-foreground text-sm mb-2 leading-snug">{title}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
              </div>
            );
          })}
        </div>

        {/* Platform proof grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {proofs.map(({ icon: Icon, title, desc, color }) => {
            const bg = color.replace(")", " / 0.08)");
            const border = color.replace(")", " / 0.14)");
            return (
              <div
                key={title}
                className="bg-card rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: border }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: bg }}
                >
                  <Icon size={15} style={{ color }} aria-hidden="true" />
                </div>
                <p className="font-semibold text-foreground text-sm mb-1.5 leading-snug">{title}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
              </div>
            );
          })}
        </div>

        {/* Reinforcer */}
        <div
          className="mt-6 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
          style={{
            background: "hsl(var(--primary) / 0.06)",
            border: "1px solid hsl(var(--primary) / 0.14)",
          }}
        >
          <Lock size={22} style={{ color: "hsl(var(--primary))", flexShrink: 0 }} aria-hidden="true" />
          <p className="text-sm text-foreground leading-relaxed">
            <strong className="font-semibold">La plateforme est conçue pour être défendable.</strong>{" "}
            Chaque action, chaque intro, chaque gain — enregistré, tracé, prouvable. Pas de zones grises.
          </p>
        </div>

        {/* Beta disclaimer */}
        <div
          className="mt-5 rounded-xl px-4 py-3 flex items-start gap-2.5"
          style={{
            background: "hsl(38 95% 52% / 0.07)",
            border: "1px solid hsl(38 95% 52% / 0.18)",
          }}
        >
          <FlaskConical size={13} style={{ color: "hsl(38 95% 52%)" }} className="shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[11px] leading-relaxed" style={{ color: "hsl(38 95% 52%)" }}>
            {BETA_NOTE}
          </p>
        </div>
      </div>
    </section>
  );
}
