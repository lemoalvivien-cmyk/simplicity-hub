import { Brain, Users, BarChart3, ArrowDown } from "lucide-react";

export default function MecanismeSection() {
  return (
    <section className="py-20 md:py-24 bg-muted">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">Comment ça fonctionne</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            WiinupMax, c'est comme avoir deux amis exceptionnels qui travaillent pour vous en même temps.
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
            L'un cherche automatiquement les bonnes personnes pendant que vous dormez. L'autre vous présente des clients de confiance. Les deux ensemble dans un seul espace calme et protégé.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-3">
          {/* Moteur 1 */}
          <div
            className="rounded-2xl overflow-hidden transition-shadow duration-200 hover:shadow-xl"
            style={{
              background: "linear-gradient(160deg, hsl(218 65% 9%), hsl(218 55% 13%))",
              border: "1px solid hsl(218 55% 20% / 0.6)",
              boxShadow: "0 4px 24px hsl(218 72% 8% / 0.5)",
            }}
          >
            <div className="px-6 pt-6 pb-5 border-b" style={{ borderColor: "hsl(218 40% 22% / 0.5)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Brain size={17} className="text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(218 72% 60%)" }}>
                    Moteur 1
                  </p>
                  <p className="font-display font-bold text-white text-[0.95rem] leading-tight mt-0.5">
                    Prospection IA assistée
                  </p>
                </div>
              </div>
              <p className="text-white/90 text-sm leading-relaxed">
                Un assistant discret et efficace fouille le marché à votre place. Il trouve les personnes vraiment intéressées, prépare les messages parfaits et vous prévient au bon moment. Il continue même pendant que vous dormez.
              </p>
            </div>
            <ul className="p-6 space-y-2.5">
              {[
                "Suggestions de cibles basées sur votre profil",
                "Brouillons de messages prêts à personnaliser",
                "Alertes de suivi pour ne rien laisser traîner",
                "Analyse de pertinence avant envoi",
                "Tableau de bord d'activité unifié",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: "hsl(218 72% 75%)" }}
                    aria-hidden="true"
                  />
                  <span className="text-sm text-white">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Moteur 2 */}
          <div
            className="rounded-2xl overflow-hidden transition-shadow duration-200 hover:shadow-xl"
            style={{
              background: "linear-gradient(160deg, hsl(24 60% 8%), hsl(38 50% 12%))",
              border: "1px solid hsl(24 55% 20% / 0.6)",
              boxShadow: "0 4px 24px hsl(24 60% 5% / 0.5)",
            }}
          >
            <div className="px-6 pt-6 pb-5 border-b" style={{ borderColor: "hsl(24 50% 22% / 0.5)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--gradient-accent)" }}
                >
                  <Users size={17} className="text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(24 100% 62%)" }}>
                    Moteur 2
                  </p>
                  <p className="font-display font-bold text-white text-[0.95rem] leading-tight mt-0.5">
                    Réseau humain structuré
                  </p>
                </div>
              </div>
              <p className="text-white/90 text-sm leading-relaxed">
                Des gens de confiance qui connaissent du monde. Ils vous présentent simplement des clients qu'ils apprécient. Quand l'affaire est signée, ils reçoivent une récompense juste et automatique. Vous, vous ne gérez absolument rien.
              </p>
            </div>
            <ul className="p-6 space-y-2.5">
              {[
                "Marketplace de facilitateurs qualifiés",
                "Introductions vérifiées avant livraison",
                "Protection de chaque mise en relation",
                "Gains traçables et visibles en temps réel",
                "Validation en un clic, sans ambiguïté",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: "hsl(24 100% 75%)" }}
                    aria-hidden="true"
                  />
                  <span className="text-sm text-white">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Arrow connector */}
        <div className="flex justify-center -my-1">
          <ArrowDown size={18} className="text-muted-foreground/30" />
        </div>

        {/* Cockpit central */}
        <div
          className="rounded-2xl p-5 md:p-6 text-center mt-3"
          style={{
            background: "linear-gradient(135deg, hsl(218 50% 8%), hsl(218 45% 12%))",
            border: "1px solid hsl(218 40% 28% / 0.5)",
            boxShadow: "0 2px 12px hsl(218 72% 5% / 0.4), 0 0 0 1px hsl(218 72% 45% / 0.06)",
          }}
        >
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--gradient-electric)" }}
            >
              <BarChart3 size={14} className="text-white" aria-hidden="true" />
            </div>
            <p className="font-display font-bold text-white text-base">Votre espace personnel unifié</p>
          </div>
          <p className="text-white/90 text-sm max-w-md mx-auto leading-relaxed">
            Les deux moteurs remontent dans le même tableau de bord.
            Validation, suivi, gains, priorités — tout est visible. Vous gardez le contrôle à chaque étape.
          </p>
        </div>
      </div>
    </section>
  );
}
