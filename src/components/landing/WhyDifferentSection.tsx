import { motion } from "framer-motion";
import { Network, ShieldCheck, Coins, ArrowRight, Check, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { track } from "@/lib/landingTracking";

const pillars = [
  {
    icon: Network,
    tag: "Réseau vivant",
    title: "Un réseau structuré qui crée de vraies opportunités",
    desc: "Chaque présentation renforce la confiance. Vos apporteurs ont un espace dédié, traçable et motivant. Le réseau grandit avec vous.",
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
    icon: ShieldCheck,
    tag: "Traçabilité totale",
    title: "Chaque introduction, datée et protégée pour toujours",
    desc: "La date, l'heure, les parties — tout est enregistré dès l'envoi. Même si l'affaire se conclut dans 6 mois, la paternité de la mise en relation est incontestable.",
    gradient: "linear-gradient(135deg, hsl(152 62% 20%), hsl(152 50% 12%))",
    glowColor: "hsl(152 62% 42% / 0.15)",
    accentColor: "hsl(152 62% 52%)",
    visual: (
      <div className="relative w-full h-28 flex items-center justify-center">
        <div className="flex flex-col gap-2 w-full max-w-[160px]">
          {[
            { label: "Introduction envoyée", date: "14/03 09:41", done: true },
            { label: "Validée par l'entreprise", date: "14/03 11:22", done: true },
            { label: "Affaire signée", date: "28/03 14:05", done: true },
          ].map(({ label, date, done }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shrink-0 flex items-center justify-center"
                style={{ background: done ? "hsl(152 62% 42% / 0.3)" : "hsl(218 30% 30%)", border: `1px solid ${done ? "hsl(152 62% 52%)" : "hsl(218 30% 50%)"}` }}>
                {done && <div className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(152 62% 52%)" }} />}
              </div>
              <div>
                <p className="text-[10px] font-medium text-white/70 leading-none">{label}</p>
                <p className="text-[9px] text-white/35 mt-0.5">{date}</p>
              </div>
            </div>
          ))}
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

const comparisonData = [
  { feature: "Introductions tracées et horodatées", wiinup: true, apporteurs: false, linkedin: false },
  { feature: "Commission automatique à la signature", wiinup: true, apporteurs: false, linkedin: false },
  { feature: "IA de prospection (OpenClaw)", wiinup: true, apporteurs: false, linkedin: false },
  { feature: "Gratuit pour les facilitateurs", wiinup: true, apporteurs: true, linkedin: false },
  { feature: "Score de réputation vérifié", wiinup: true, apporteurs: false, linkedin: false },
  { feature: "Preuve juridique de mise en relation", wiinup: true, apporteurs: false, linkedin: false },
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
          {pillars.map(({ icon: Icon, tag, title, desc, glowColor, accentColor, visual }) => (
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

        {/* Comparison table */}
        <div className="mt-16">
          <p className="text-center text-base text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Chez les concurrents gratuits, vous payez avec votre temps — des heures à trier
            des contacts froids non qualifiés. Chez WiinupMax, vous payez 99&nbsp;€/an et vous
            recevez des introductions qualifiées, traçables et sourcées par des personnes
            qui engagent leur réputation. <strong className="text-foreground">Ce n'est pas le même produit.</strong>
          </p>
          <h3 className="font-display text-xl md:text-2xl font-bold text-foreground text-center mb-8">
            Pourquoi les professionnels choisissent WIINUP MAX
          </h3>

          {/* Desktop table */}
          <div className="hidden md:block rounded-2xl border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "hsl(var(--primary) / 0.06)", borderBottom: "1px solid hsl(var(--border))" }}>
                  <th className="text-left px-5 py-3.5 text-muted-foreground font-medium w-[44%]">Fonctionnalité</th>
                  <th className="text-center px-4 py-3.5 font-bold w-[18%]" style={{ color: "hsl(var(--primary))" }}>WIINUP MAX</th>
                  <th className="text-center px-4 py-3.5 text-muted-foreground font-medium w-[19%]">ApporteursAffaires</th>
                  <th className="text-center px-4 py-3.5 text-muted-foreground font-medium w-[19%]">LinkedIn</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map(({ feature, wiinup, apporteurs, linkedin }, i) => (
                  <tr
                    key={feature}
                    style={{
                      borderBottom: i < comparisonData.length - 1 ? "1px solid hsl(var(--border))" : undefined,
                      background: i % 2 === 0 ? "hsl(var(--card))" : "hsl(var(--background))",
                    }}
                  >
                    <td className="px-5 py-3.5 text-foreground text-sm">{feature}</td>
                    <td className="px-4 py-3.5 text-center">
                      {wiinup ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full" style={{ background: "hsl(152 62% 42% / 0.15)" }}>
                          <Check size={13} style={{ color: "hsl(152 62% 52%)" }} aria-label="Oui" />
                        </span>
                      ) : (
                        <Minus size={14} className="mx-auto text-muted-foreground/40" aria-label="Non" />
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {apporteurs ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full" style={{ background: "hsl(152 62% 42% / 0.15)" }}>
                          <Check size={13} style={{ color: "hsl(152 62% 52%)" }} aria-label="Oui" />
                        </span>
                      ) : (
                        <Minus size={14} className="mx-auto text-muted-foreground/40" aria-label="Non" />
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {linkedin ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full" style={{ background: "hsl(152 62% 42% / 0.15)" }}>
                          <Check size={13} style={{ color: "hsl(152 62% 52%)" }} aria-label="Oui" />
                        </span>
                      ) : (
                        <Minus size={14} className="mx-auto text-muted-foreground/40" aria-label="Non" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: WIINUP MAX column only */}
          <div className="md:hidden rounded-2xl border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
            <div className="px-4 py-3 text-center font-bold text-sm" style={{ background: "hsl(var(--primary) / 0.06)", color: "hsl(var(--primary))", borderBottom: "1px solid hsl(var(--border))" }}>
              WIINUP MAX
            </div>
            {comparisonData.map(({ feature, wiinup }, i) => (
              <div
                key={feature}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{
                  borderBottom: i < comparisonData.length - 1 ? "1px solid hsl(var(--border))" : undefined,
                  background: i % 2 === 0 ? "hsl(var(--card))" : "hsl(var(--background))",
                }}
              >
                <span className="inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-full" style={{ background: "hsl(152 62% 42% / 0.15)" }}>
                  <Check size={13} style={{ color: "hsl(152 62% 52%)" }} aria-hidden="true" />
                </span>
                <span className="text-foreground text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm mb-4">
            Tout ça inclus dans l'offre à{" "}
            <strong className="text-foreground">99 € TTC/an</strong>
            {" "}— au lieu de 990 €.
          </p>
          <Link
            to="/checkout"
            className="btn-cta inline-flex items-center gap-2 px-8 py-4"
            onClick={() => track("cta_why_different")}
          >
            Je veux mes premiers clients dès demain — 99 € TTC/an
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
