import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Zap, Mic, Bot, Swords, Activity, ChevronRight } from "lucide-react";

// cubic-bezier 0.34,1.56,0.64,1 = snappy spring overshoot
const SPRING_BOUNCE = { type: "spring" as const, stiffness: 280, damping: 18 };

const FEATURES = [
  {
    id: "swarm",
    tag: "TRIPLE THREAT SWARM",
    title: "3 IA en duel permanent",
    icon: Swords,
    description: "Gemini, Qwen et Grok analysent chaque opportunité simultanément. Le consensus forge la décision optimale — zéro biais, zéro hallucination unique.",
    color: "hsl(var(--accent))",
    glowRaw: "38 95% 52%",
    badge: "Bêta · IA assistée",
    span: "col-span-1 md:col-span-2 row-span-1",
    agents: ["Gemini", "Qwen", "Grok"],
  },
  {
    id: "voice",
    tag: "WAR CALLER VOICE",
    title: "Briefings vocaux IA",
    icon: Mic,
    description: "Vos opportunités critiques dictées en temps réel. Priorisez sans regarder l'écran.",
    color: "hsl(var(--primary-glow))",
    glowRaw: "210 88% 68%",
    badge: "ElevenLabs",
    span: "col-span-1 row-span-1",
    agents: [],
  },
  {
    id: "autopilot",
    tag: "AUTO-PILOT MODE",
    title: "Pipeline autonome",
    icon: Bot,
    description: "OpenClaw scanne, score et priorise vos leads. Vous intervenez uniquement pour conclure.",
    color: "hsl(152 62% 52%)",
    glowRaw: "152 62% 52%",
    badge: "OpenClaw Engine",
    span: "col-span-1 row-span-1",
    agents: [],
  },
];

function BentoCard({ f, i, inView }: { f: typeof FEATURES[0]; i: number; inView: boolean }) {
  const Icon = f.icon;
  const [hovered, setHovered] = useState(false);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const glowX = useSpring(mouseX, { stiffness: 120, damping: 20 });
  const glowY = useSpring(mouseY, { stiffness: 120, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - r.left) / r.width);
    mouseY.set((e.clientY - r.top) / r.height);
  };

  return (
    <motion.div
      className={`relative ${f.span} rounded-2xl overflow-hidden cursor-default select-none`}
      initial={{ opacity: 0, y: 48, scale: 0.96 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ ...SPRING_BOUNCE, delay: i * 0.1 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onMouseMove={handleMouseMove}
      style={{
        background: "hsl(218 55% 11% / 0.82)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${hovered ? `hsl(${f.glowRaw} / 0.45)` : "hsl(218 45% 20% / 0.45)"}`,
        boxShadow: hovered
          ? `0 0 48px hsl(${f.glowRaw} / 0.18), 0 2px 0 inset hsl(0 0% 100% / 0.07)`
          : "0 2px 0 inset hsl(0 0% 100% / 0.04)",
        transition: "border-color 0.3s, box-shadow 0.35s",
        willChange: "transform",
      }}
    >
      {/* Dynamic glow that follows cursor */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${glowX.get() * 100}% ${glowY.get() * 100}%, hsl(${f.glowRaw} / 0.14) 0%, transparent 55%)`,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s",
        }}
        aria-hidden="true"
      />

      {/* Scanline top accent */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        animate={{ opacity: hovered ? 1 : 0.3 }}
        style={{ background: `linear-gradient(90deg, transparent 0%, hsl(${f.glowRaw} / 0.6) 50%, transparent 100%)` }}
      />

      <div className="relative z-10 p-6 md:p-8 h-full flex flex-col">
        {/* Header row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <span
              className="text-[9px] font-bold tracking-[0.2em] uppercase block mb-1.5"
              style={{ color: f.color }}
            >
              {f.tag}
            </span>
            <motion.div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              animate={{
                background: hovered ? `hsl(${f.glowRaw} / 0.2)` : "hsl(218 45% 17% / 0.9)",
                boxShadow: hovered ? `0 0 20px hsl(${f.glowRaw} / 0.3)` : "none",
              }}
              transition={{ duration: 0.3 }}
              style={{ border: `1px solid hsl(${f.glowRaw} / 0.25)` }}
            >
              <Icon size={20} style={{ color: f.color }} strokeWidth={1.5} />
            </motion.div>
          </div>

          {/* Badge */}
          <span
            className="text-[9px] font-semibold px-2.5 py-1 rounded-full shrink-0"
            style={{
              background: `hsl(${f.glowRaw} / 0.1)`,
              border: `1px solid hsl(${f.glowRaw} / 0.25)`,
              color: f.color,
            }}
          >
            {f.badge}
          </span>
        </div>

        {/* Title + description */}
        <h3 className="font-display font-bold text-white text-xl mb-3 leading-tight">
          {f.title}
        </h3>
        <p className="text-white/65 text-sm leading-relaxed flex-1">
          {f.description}
        </p>

        {/* Agent pills (Swarm card only) */}
        {f.agents.length > 0 && (
          <div className="flex gap-2 mt-5 flex-wrap">
            {f.agents.map((a, ai) => (
              <motion.span
                key={a}
                className="px-3 py-1 rounded-full text-[10px] font-bold"
                initial={{ opacity: 0, x: -8 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.1 + ai * 0.06 + 0.35 }}
                style={{
                  background: `hsl(${f.glowRaw} / 0.1)`,
                  border: `1px solid hsl(${f.glowRaw} / 0.3)`,
                  color: f.color,
                }}
              >
                {a}
              </motion.span>
            ))}
            <motion.div
              className="flex items-center gap-1 text-[10px]"
              style={{ color: "hsl(152 62% 52%)" }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.6 }}
            >
              <Activity size={10} />
              <span className="font-semibold">Consensus actif</span>
            </motion.div>
          </div>
        )}

        {/* Status footer */}
        <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "hsl(152 62% 52%)", boxShadow: "0 0 6px hsl(152 62% 52%)" }}
            />
            <span className="text-white/40 text-[10px]">Disponible en bêta</span>
          </div>
          <motion.div
            className="flex items-center gap-1 text-[10px] font-semibold"
            style={{ color: f.color, opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            Activer <ChevronRight size={10} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default function GodModeTeaser() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      ref={ref}
      className="relative py-28 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, hsl(218 72% 6%) 0%, hsl(218 72% 10%) 60%, hsl(218 72% 8%) 100%)",
      }}
    >
      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: "linear-gradient(hsl(var(--primary-glow)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-glow)) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
        aria-hidden="true"
      />

      {/* Large accent glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, hsl(var(--accent) / 0.1) 0%, transparent 70%)", filter: "blur(48px)" }}
        aria-hidden="true"
      />

      <div className="container relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <motion.div
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-6"
            animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={SPRING_BOUNCE}
            style={{
              background: "hsl(var(--accent) / 0.08)",
              border: "1px solid hsl(var(--accent) / 0.35)",
              color: "hsl(var(--accent))",
            }}
          >
            <Zap size={10} strokeWidth={2.5} />
            God Mode — Armement IA
          </motion.div>

          <h2
            className="font-display font-bold text-white leading-tight mb-4"
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
          <p className="text-white/60 text-lg max-w-lg mx-auto leading-relaxed">
            L'arsenal IA complet — prospection, voix, automation — piloté depuis Wiinup.
          </p>
        </motion.div>

        {/* Asymmetric bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {FEATURES.map((f, i) => (
            <BentoCard key={f.id} f={f} i={i} inView={inView} />
          ))}
        </div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.75, duration: 0.5 }}
          className="mt-8 text-center text-white/30 text-[11px]"
        >
          Bêta privée — fonctionnalités IA en cours d'activation réelle avec API externe.
        </motion.p>
      </div>
    </section>
  );
}
