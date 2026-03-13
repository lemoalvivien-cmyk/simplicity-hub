import { motion } from "framer-motion";
import { Network, Brain, Coins, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { track } from "@/lib/landingTracking";

const pillars = [
  {
    icon: Network,
    tag: "Réseau vivant",
    title: "Un réseau qui apprend de lui-même",
    desc: "Chaque présentation renforce le système. Il découvre les connexions cachées que personne ne voit — et vous indique le meilleur chemin pour atteindre un nouveau client.",
    gradient: "var(--gradient-primary)",
    glowColor: "hsl(var(--primary) / 0.18)",
    accentColor: "hsl(var(--primary))",
    visual: (
      <div className="relative w-full h-28 flex items-center justify-center">
        {/* Center node */}
        <div className="absolute w-8 h-8 rounded-full border-2 flex items-center justify-center z-10"
          style={{ background: "hsl(var(--primary)/0.2)", borderColor: "hsl(var(--primary)/0.6)" }}>
          <Network size={13} style={{ color: "hsl(var(--primary))" }} />
        </div>
        {/* Satellite nodes */}
        {[
          { top: "10%", left: "10%", size: 5 },
          { top: "15%", right: "12%", size: 6 },
          { bottom: "15%", left: "15%", size: 4 },
          { bottom: "10%", right: "18%", size: 5 },
          { top: "45%", left: "5%", size: 4 },
          { top: "38%", right: "6%", size: 5 },
        ].map((pos, i) => (
          <div key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              ...pos,
              width: (pos.size * 4),
              height: (pos.size * 4),
              background: `hsl(var(--primary)/${0.3 + i * 0.05})`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
        {/* Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 200 112">
          <line x1="100" y1="56" x2="20" y2="20" stroke="hsl(var(--primary))" strokeWidth="0.8" />
          <line x1="100" y1="56" x2="176" y2="22" stroke="hsl(var(--primary))" strokeWidth="0.8" />
          <line x1="100" y1="56" x2="25" y2="88" stroke="hsl(var(--primary))" strokeWidth="0.8" />
          <line x1="100" y1="56" x2="168" y2="90" stroke="hsl(var(--primary))" strokeWidth="0.8" />
          <line x1="100" y1="56" x2="12" y2="56" stroke="hsl(var(--primary))" strokeWidth="0.8" />
          <line x1="100" y1="56" x2="188" y2="52" stroke="hsl(var(--primary))" strokeWidth="0.8" />
        </svg>
      </div>
    ),
  },
  {
    icon: Brain,
    tag: "Assistant vocal",
    title: "Un assistant qui cherche et qui parle",
    desc: "Il cherche des clients potentiels pour vous, analyse les situations, et vous informe au bon moment. Il travaille même quand vous dormez.",
    gradient: "linear-gradient(135deg, hsl(270 70% 30%), hsl(280 60% 20%))",
    glowColor: "hsl(270 70% 50% / 0.15)",
    accentColor: "hsl(270 80% 70%)",
    visual: (
      <div className="relative w-full h-28 flex items-center justify-center">
        <div className="flex items-end gap-1 h-16">
          {[40, 65, 52, 80, 72, 90, 85, 92].map((h, i) => (
            <div key={i}
              className="rounded-t-sm"
              style={{
                width: 14,
                height: `${h}%`,
                background: i < 6
                  ? "hsl(270 70% 55% / 0.4)"
                  : "linear-gradient(180deg, hsl(270 80% 70%), hsl(270 60% 50%))",
                transition: "height 0.5s ease",
              }}
            />
          ))}
        </div>
        <div className="absolute top-2 right-4 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
          style={{ background: "hsl(270 70% 55% / 0.2)", color: "hsl(270 80% 75%)", border: "1px solid hsl(270 60% 50% / 0.3)" }}>
          <Brain size={9} /> 92% de précision
        </div>
      </div>
    ),
  },
  {
    icon: Coins,
    tag: "Gains automatiques",
    title: "Chaque présentation génère des revenus",
    desc: "Les facilitateurs sont payés automatiquement. WiinupMax ne prend aucune commission sur vos gains. Vous présentez, l'affaire se signe, vous recevez votre part. C'est tout.",
    gradient: "var(--gradient-accent)",
    glowColor: "hsl(var(--accent) / 0.15)",
    accentColor: "hsl(var(--accent))",
    visual: (
      <div className="relative w-full h-28 flex items-center justify-center gap-4">
        {[
          { label: "Entreprise", value: "+CA", color: "hsl(var(--accent))" },
          { label: "Facilitateur", value: "+COM", color: "hsl(38 100% 65%)" },
          { label: "Plateforme", value: "0%", color: "hsl(var(--muted-foreground))" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border"
              style={{ background: `${color}15`, borderColor: `${color}30` }}>
              <span className="text-xs font-bold" style={{ color }}>{value}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
          </div>
        ))}
        <div className="absolute inset-x-0 top-1/2 flex items-center justify-center pointer-events-none">
          <div className="h-px w-2/3 opacity-20" style={{ background: "hsl(var(--accent))" }} />
        </div>
      </div>
    ),
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function WhyDifferentSection() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, hsl(var(--primary) / 0.04) 0%, transparent 70%)",
        }}
      />

      <div className="container max-w-5xl relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="pill-tag mb-4 mx-auto w-fit">Ce qui nous rend uniques</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
            Pourquoi WiinupMax est{" "}
            <span
              style={{
                background: "var(--gradient-electric)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              différent
            </span>
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">
            Trois choses que personne d'autre ne propose ensemble. Chacune est puissante. Les trois réunies, c'est inarrêtable.
          </p>
        </div>

        {/* Cards */}
        <motion.div
          className="grid md:grid-cols-3 gap-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {pillars.map(({ icon: Icon, tag, title, desc, gradient, glowColor, accentColor, visual }) => (
            <motion.div
              key={tag}
              variants={cardVariants}
              className="relative rounded-2xl border overflow-hidden flex flex-col"
              style={{
                background: "hsl(var(--card))",
                borderColor: `${accentColor}30`,
                boxShadow: `0 0 32px ${glowColor}`,
              }}
            >
              {/* Visual header */}
              <div
                className="px-5 pt-5 pb-3"
                style={{ background: `${glowColor}` }}
              >
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3"
                  style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}30` }}
                >
                  <Icon size={9} />
                  {tag}
                </div>
                {visual}
              </div>

              {/* Content */}
              <div className="px-5 py-5 flex-1">
                <h3 className="font-display font-bold text-foreground text-base mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm mb-4">
            Tout ça inclus dans l'offre à{" "}
            <strong className="text-foreground">99 € TTC/an</strong>
            {" "}— au lieu de 990 €.
          </p>
          <Link
            to="/signup"
            className="btn-cta inline-flex items-center gap-2 px-8 py-4"
            onClick={() => track("cta_why_different")}
          >
            Activer maintenant — 99 € TTC/an
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
