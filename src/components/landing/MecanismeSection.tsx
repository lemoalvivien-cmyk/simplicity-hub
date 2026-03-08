import { Brain, Users, BarChart3, Zap } from "lucide-react";

export default function MecanismeSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">Le mécanisme</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Un double moteur. Un seul cockpit.
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Ce n'est pas un CRM. Ce n'est pas un outil d'emailing. C'est une infrastructure d'acquisition qui combine deux moteurs complémentaires.
          </p>
        </div>

        {/* Two engines + bridge */}
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          {/* Moteur 1 */}
          <div
            className="rounded-2xl overflow-hidden border border-border"
            style={{ background: "linear-gradient(160deg, hsl(218 65% 9%), hsl(218 55% 13%))" }}
          >
            <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "hsl(218 40% 22% / 0.5)" }}>
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
                  <p className="font-display font-bold text-white text-base">Prospection pilotée par IA</p>
                </div>
              </div>
              <p className="text-white/55 text-sm leading-relaxed">
                OpenClaw prospecte pendant que vous dormez. Il détecte les signaux, prépare les messages,
                et pilote vos campagnes sans intervention manuelle.
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-2.5">
                {[
                  "Agents autonomes qui prospectent 24h/24",
                  "Deal Radar — signaux d'intention détectés",
                  "Campagnes automatisées multicanal",
                  "Messages rédigés et optimisés par l'IA",
                  "Leads chauds remontés automatiquement",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: "hsl(218 72% 55%)" }}
                    />
                    <span className="text-sm text-white/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Moteur 2 */}
          <div
            className="rounded-2xl overflow-hidden border border-border"
            style={{ background: "linear-gradient(160deg, hsl(24 60% 8%), hsl(38 50% 12%))" }}
          >
            <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "hsl(24 50% 22% / 0.5)" }}>
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
              <p className="text-white/55 text-sm leading-relaxed">
                Un réseau de facilitateurs actifs recommande votre offre à leurs contacts.
                Chaque introduction est tracée, vérifiée et prouvable.
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-2.5">
                {[
                  "Marketplace de facilitateurs qualifiés",
                  "Introductions vérifiées avant livraison",
                  "Protection de chaque mise en relation",
                  "Gains traçables en temps réel",
                  "Validation en un clic, sans ambiguïté",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: "hsl(24 100% 60%)" }}
                    />
                    <span className="text-sm text-white/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Cockpit central */}
        <div
          className="rounded-2xl p-6 border text-center"
          style={{
            background: "linear-gradient(135deg, hsl(218 50% 8%), hsl(218 45% 11%))",
            borderColor: "hsl(218 40% 22% / 0.5)",
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--gradient-electric)" }}
            >
              <BarChart3 size={16} className="text-white" aria-hidden="true" />
            </div>
            <p className="font-display font-bold text-white text-lg">Cockpit central</p>
          </div>
          <p className="text-white/55 text-sm max-w-lg mx-auto">
            Les deux moteurs remontent dans le même tableau de bord. Validation, suivi, gains, priorités —
            tout est au même endroit. JARVIS vous dit toujours quoi faire ensuite.
          </p>
        </div>
      </div>
    </section>
  );
}
