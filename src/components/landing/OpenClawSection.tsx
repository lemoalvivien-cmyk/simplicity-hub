import { Brain, Zap, Radar, MessageSquare, Activity, Link2, Flame, CheckCircle2 } from "lucide-react";

const features = [
  { icon: Brain, title: "OpenClaw, cerveau central", desc: "Votre IA pilote la prospection automatisée 24h/24." },
  { icon: Radar, title: "Deal Radar", desc: "Détecte les opportunités avant qu'elles soient visibles." },
  { icon: MessageSquare, title: "Messages préparés", desc: "Packs de messages multicanaux générés automatiquement." },
  { icon: Link2, title: "Diffusion passive", desc: "Liens traqués pour mesurer chaque clic et chaque intérêt." },
  { icon: Flame, title: "Ce qui chauffe", desc: "Leads chauds et signaux d'intention détectés en temps réel." },
  { icon: Activity, title: "Cockpit de pilotage", desc: "Missions, campagnes, gains — tout centralisé." },
];

export default function OpenClawSection() {
  return (
    <section className="py-20 bg-muted">
      <div className="container max-w-4xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="pill-tag mb-5">Moteur 1 · Prospection automatisée</p>
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              OpenClaw pilote votre<br />
              <span className="text-highlight">prospection automatisée.</span>
            </h2>
            <p className="text-muted-foreground text-base mb-6 leading-relaxed">
              OpenClaw est le cerveau central de WIINUP MAX. Il analyse vos données,
              détecte les opportunités, prépare les messages et recommande les meilleures actions —
              pendant que vous vous concentrez sur votre métier.
            </p>
            <div className="space-y-2.5">
              {[
                "OpenClaw transforme vos signaux en actions concrètes",
                "Agent OS coordonne plusieurs agents spécialisés",
                "Deal Radar détecte les leads avant les autres",
                "Tout remonte dans un seul cockpit",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <CheckCircle2
                    size={15}
                    style={{ color: "hsl(var(--primary))" }}
                    className="shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* OpenClaw mockup */}
          <div
            className="rounded-2xl overflow-hidden border"
            style={{
              background: "linear-gradient(160deg, hsl(218 65% 8%), hsl(218 55% 11%))",
              borderColor: "hsl(218 40% 22% / 0.6)",
            }}
          >
            <div
              className="flex items-center gap-3 px-5 py-4 border-b"
              style={{ borderColor: "hsl(218 40% 20% / 0.5)" }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Brain size={15} className="text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">OpenClaw</p>
                <p className="text-white/40 text-xs">Prospection automatisée active</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: "hsl(var(--success))" }}
                  aria-hidden="true"
                />
                <span className="text-xs text-white/40">En cours</span>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{
                    background: "hsl(218 40% 14% / 0.6)",
                    border: "1px solid hsl(218 40% 22% / 0.3)",
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "hsl(218 72% 18% / 0.5)" }}
                  >
                    <Icon size={13} style={{ color: "hsl(218 72% 65%)" }} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white/85">{title}</p>
                    <p className="text-xs text-white/40 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5">
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{
                  background: "hsl(var(--primary) / 0.1)",
                  border: "1px solid hsl(var(--primary) / 0.2)",
                }}
              >
                <Zap size={12} style={{ color: "hsl(var(--primary))" }} aria-hidden="true" />
                <p className="text-xs text-white/50">
                  <span className="font-semibold text-white/80">Vos agents travaillent</span> pendant
                  que votre réseau diffuse.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
