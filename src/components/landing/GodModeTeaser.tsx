import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Zap, Brain, Mic, ToggleRight, Swords, Radio, Bot } from "lucide-react";

const features = [
  {
    id: "swarm",
    icon: Swords,
    tag: "TRIPLE THREAT SWARM",
    title: "3 IA en duel permanent",
    description:
      "Gemini, Qwen et Grok analysent chaque opportunité en parallèle. Le consensus forge la décision optimale. Zéro biais unique.",
    color: "hsl(var(--accent))",
    glow: "hsl(var(--accent) / 0.25)",
    badge: "Bêta • IA assistée",
    cols: "md:col-span-2",
  },
  {
    id: "voice",
    icon: Mic,
    tag: "WAR CALLER VOICE",
    title: "Voix IA de guerre",
    description:
      "Briefings vocaux en temps réel sur vos opportunités critiques. Priorisez sans regarder votre écran.",
    color: "hsl(var(--primary-glow))",
    glow: "hsl(var(--primary-glow) / 0.25)",
    badge: "Via ElevenLabs",
    cols: "md:col-span-1",
  },
  {
    id: "autopilot",
    icon: Bot,
    tag: "AUTO-PILOT",
    title: "Prospection assistée",
    description:
      "OpenClaw scanne, score et priorise vos leads pendant que vous vous concentrez sur la clôture.",
    color: "hsl(152 62% 48%)",
    glow: "hsl(152 62% 48% / 0.2)",
    badge: "OpenClaw Engine",
    cols: "md:col-span-1",
  },
];

const MotionDiv = motion.div;

export default function GodModeTeaser() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <section
      ref={ref}
      className="relative py-24 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, hsl(218 72% 7%) 0%, hsl(218 72% 10%) 100%)",
      }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary-glow)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-glow)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden="true"
      />

      {/* Glow blobs */}
      <div
        className="absolute top-0 left-1/4 w-[500px] h-[300px] pointer-events-none -translate-y-1/2"
        style={{
          background:
            "radial-gradient(ellipse, hsl(var(--accent) / 0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />

      <div className="container relative z-10">
        {/* Header */}
        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
            style={{
              background: "hsl(var(--accent) / 0.1)",
              border: "1px solid hsl(var(--accent) / 0.3)",
              color: "hsl(var(--accent))",
            }}
          >
            <Zap size={11} />
            God Mode — Armement IA
          </div>

          <h2
            className="font-display font-bold text-white leading-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}
          >
            Trois armes.{" "}
            <span
              style={{
                background: "linear-gradient(135deg, hsl(var(--accent)), hsl(38 100% 74%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Un seul cockpit.
            </span>
          </h2>
          <p className="text-white/65 mt-4 text-lg max-w-xl mx-auto">
            L'arsenal IA complet — prospection, voix, automation. Tout piloté depuis Wiinup.
          </p>
        </MotionDiv>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            const isActive = activeId === f.id;
            return (
              <MotionDiv
                key={f.id}
                className={`relative ${f.cols} rounded-2xl overflow-hidden cursor-default`}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                onHoverStart={() => setActiveId(f.id)}
                onHoverEnd={() => setActiveId(null)}
                style={{
                  background: "hsl(218 55% 13% / 0.85)",
                  border: `1px solid ${isActive ? f.color.replace(")", " / 0.5)") : "hsl(218 55% 22% / 0.4)"}`,
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  boxShadow: isActive
                    ? `0 0 40px ${f.glow}, inset 0 1px 0 hsl(0 0% 100% / 0.06)`
                    : "inset 0 1px 0 hsl(0 0% 100% / 0.04)",
                  transition: "border-color 0.3s, box-shadow 0.3s",
                }}
              >
                {/* Glow orb background */}
                <MotionDiv
                  className="absolute inset-0 pointer-events-none"
                  animate={{ opacity: isActive ? 1 : 0 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    background: `radial-gradient(circle at 20% 20%, ${f.glow} 0%, transparent 60%)`,
                  }}
                  aria-hidden="true"
                />

                <div className="relative z-10 p-6 md:p-7">
                  {/* Tag */}
                  <div className="flex items-center justify-between mb-5">
                    <span
                      className="text-[9px] font-bold tracking-[0.18em] uppercase"
                      style={{ color: f.color }}
                    >
                      {f.tag}
                    </span>
                    <span
                      className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: `${f.color.replace(")", " / 0.12)")}`,
                        color: f.color,
                        border: `1px solid ${f.color.replace(")", " / 0.25)")}`,
                      }}
                    >
                      {f.badge}
                    </span>
                  </div>

                  {/* Icon */}
                  <MotionDiv
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    animate={{
                      background: isActive
                        ? `${f.color.replace(")", " / 0.18)")}`
                        : "hsl(218 55% 18% / 0.8)",
                    }}
                    transition={{ duration: 0.3 }}
                    style={{ border: `1px solid ${f.color.replace(")", " / 0.2)")}` }}
                  >
                    <Icon size={22} style={{ color: f.color }} strokeWidth={1.5} />
                  </MotionDiv>

                  <h3 className="font-display font-bold text-white text-xl mb-3">
                    {f.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {f.description}
                  </p>

                  {/* Fake status indicator */}
                  <div className="mt-6 flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: "hsl(152 62% 48%)",
                        boxShadow: "0 0 6px hsl(152 62% 48%)",
                        animation: "pulse 2s infinite",
                      }}
                    />
                    <span className="text-white/40 text-xs">Disponible en bêta</span>
                  </div>
                </div>
              </MotionDiv>
            );
          })}
        </div>

        {/* Bottom disclaimer */}
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-white/30 text-xs">
            Bêta privée — fonctionnalités IA en cours d'activation réelle avec API externe. Les résultats dépendent de votre réseau et de votre suivi.
          </p>
        </MotionDiv>
      </div>
    </section>
  );
}
