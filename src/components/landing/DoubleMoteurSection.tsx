import { Users, Zap, MessageSquare, Link2, Send, TrendingUp, Shield, FileText } from "lucide-react";

const moteur1Features = [
  { icon: FileText, label: "Missions publiées en 2 minutes" },
  { icon: Zap, label: "Brouillons de messages prêts à personnaliser" },
  { icon: Link2, label: "Liens traqués pour mesurer chaque intérêt" },
  { icon: MessageSquare, label: "Brouillons multicanaux — WhatsApp, email, LinkedIn" },
  { icon: TrendingUp, label: "Alertes de suivi et de relance" },
];

const moteur2Features = [
  { icon: Users, label: "Réseau de facilitateurs" },
  { icon: Send, label: "Introductions vérifiées" },
  { icon: TrendingUp, label: "Gains traçables en temps réel" },
  { icon: Shield, label: "Introductions protégées dès l'envoi" },
  { icon: Zap, label: "Validation en un clic" },
];

export default function DoubleMoteurSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">Double moteur</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Deux moteurs. Un seul guichet.
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Missions publiées + réseau humain structuré. Vos facilitateurs actifs travaillent pour vous. Chaque opportunité est tracée. Chaque résultat est mesurable.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Moteur 1 — Missions & prospection */}
          <div
            className="rounded-2xl overflow-hidden border border-border"
            style={{ background: "linear-gradient(160deg, hsl(218 65% 9%), hsl(218 55% 12%))" }}
          >
            <div
              className="px-6 pt-6 pb-4 border-b"
              style={{ borderColor: "hsl(218 40% 22% / 0.6)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <FileText size={18} className="text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(218 72% 65%)" }}>
                    Moteur 1
                  </p>
                  <p className="font-display font-bold text-white text-base">Missions & messages</p>
                </div>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Publiez votre mission en 2 minutes. Des brouillons de messages sont prêts à personnaliser. Vous gardez le contrôle de chaque envoi.
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {moteur1Features.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "hsl(218 72% 18% / 0.5)", border: "1px solid hsl(218 40% 30% / 0.4)" }}
                    >
                      <Icon size={12} style={{ color: "hsl(218 72% 65%)" }} aria-hidden="true" />
                    </div>
                    <span className="text-sm text-white/75">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Moteur 2 — Apport d'affaires */}
          <div
            className="rounded-2xl overflow-hidden border border-border"
            style={{ background: "linear-gradient(160deg, hsl(24 60% 8%), hsl(38 50% 11%))" }}
          >
            <div
              className="px-6 pt-6 pb-4 border-b"
              style={{ borderColor: "hsl(24 50% 20% / 0.6)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--gradient-accent)" }}
                >
                  <Users size={18} className="text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(24 100% 65%)" }}>
                    Moteur 2
                  </p>
                  <p className="font-display font-bold text-white text-base">Réseau humain structuré</p>
                </div>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Un réseau de facilitateurs actifs recommande votre offre à leurs contacts. Chaque intro est tracée et prouvable.
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {moteur2Features.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "hsl(24 80% 15% / 0.6)", border: "1px solid hsl(24 60% 25% / 0.4)" }}
                    >
                      <Icon size={12} style={{ color: "hsl(24 100% 65%)" }} aria-hidden="true" />
                    </div>
                    <span className="text-sm text-white/75">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Pont */}
        <div
          className="mt-6 rounded-2xl p-5 text-center border"
          style={{ background: "linear-gradient(135deg, hsl(218 50% 8%), hsl(218 45% 10%))", borderColor: "hsl(218 40% 22% / 0.5)" }}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-electric)" }}>
              <Zap size={12} className="text-white" aria-hidden="true" />
            </div>
            <p className="font-semibold text-white text-sm">Les deux ensemble = plus puissant</p>
          </div>
          <p className="text-white/60 text-sm">
            Vos missions attirent des apporteurs. Votre réseau ouvre des portes. Tout converge dans un seul cockpit.
          </p>
        </div>

      </div>
    </section>
  );
}
