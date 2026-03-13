import { ShieldCheck, CreditCard, Server, Shield, Eye, TrendingUp, Lock, BarChart3, CheckCircle2 } from "lucide-react";

const trustBlocks = [
  {
    icon: ShieldCheck,
    title: "Vos données sont en sécurité",
    desc: "Tout est stocké de façon sécurisée. Chaque présentation, chaque gain, chaque transaction est enregistré et ne peut pas être modifié.",
    color: "hsl(218 72% 55%)",
  },
  {
    icon: CreditCard,
    title: "Les paiements sont gérés par Stripe",
    desc: "Stripe est le système de paiement utilisé par des millions d'entreprises dans le monde. Vos informations bancaires ne passent jamais par nos serveurs.",
    color: "hsl(152 62% 45%)",
  },
  {
    icon: Server,
    title: "Vos données restent en Europe",
    desc: "Toutes vos informations sont stockées sur des serveurs en Europe, conformément à la loi. Votre vie privée est respectée.",
    color: "hsl(24 100% 55%)",
  },
];

const proofs = [
  {
    icon: Shield,
    title: "Chaque présentation est protégée dès l'envoi",
    desc: "Votre rôle est enregistré au moment où vous envoyez la présentation. Même 6 mois plus tard, la preuve est là. Incontestable.",
    color: "hsl(38 95% 52%)",
  },
  {
    icon: Eye,
    title: "Vos gains sont visibles à tout moment",
    desc: "Montant, état, date — tout est affiché clairement. Plus de flou. Plus de questions sans réponse.",
    color: "hsl(262 72% 58%)",
  },
  {
    icon: TrendingUp,
    title: "Un score de réputation basé sur les vrais résultats",
    desc: "Chaque facilitateur a un score calculé à partir de ce qu'il a vraiment fait — qualité des présentations, rapidité, résultats obtenus.",
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
      </div>
    </section>
  );
}
