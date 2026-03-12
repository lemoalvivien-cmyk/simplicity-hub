import { Brain, Users, Zap, MessageSquare, Link2, Send, TrendingUp, Shield, FlaskConical } from "lucide-react";

const DISCLAIMER =
  "Bêta privée – fonctionnalités IA en cours d'activation réelle avec API externe. Interface actuellement en mode illustratif. Les résultats dépendent de votre réseau et de votre suivi.";

const moteur1Features = [
  { icon: Brain, label: "OpenClaw — assistant IA de prospection" },
  { icon: Zap, label: "Suggestions de cibles et de messages" },
  { icon: MessageSquare, label: "Brouillons de messages à personnaliser" },
  { icon: Link2, label: "Diffusion passive & liens traqués" },
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
            Prospection IA assistée + réseau humain structuré. OpenClaw (en connexion réelle) et facilitateurs actifs travaillent en parallèle. Chaque opportunité est tracée. Chaque résultat est mesurable.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Moteur 1 — Prospection IA assistée */}
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
                  <Brain size={18} className="text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(218 72% 65%)" }}>
                    Moteur 1
                  </p>
                  <p className="font-display font-bold text-white text-base">Prospection IA assistée</p>
                </div>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                OpenClaw (en connexion réelle avec API externe) vous suggère des cibles, prépare des brouillons et vous alerte. L'humain valide et envoie.
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
            L'assistant IA assiste la prospection. Votre réseau ouvre des portes. Tout converge dans un seul cockpit.
          </p>
        </div>

        {/* Disclaimer */}
        <div
          className="mt-5 rounded-xl px-5 py-4 flex items-start gap-3"
          style={{ background: "hsl(38 95% 52% / 0.08)", border: "1px solid hsl(38 95% 52% / 0.28)" }}
        >
          <FlaskConical size={15} style={{ color: "hsl(38 95% 52%)" }} className="shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs font-semibold leading-relaxed" style={{ color: "hsl(38 95% 52%)" }}>
            {DISCLAIMER}
          </p>
        </div>
      </div>
    </section>
  );
}
