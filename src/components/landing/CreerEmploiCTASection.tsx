// SECTION CRÉER EMPLOI — RESTAURÉE EN #1 BUSINESS CRITIQUE (photo nouvelle + texte exact screenshot)
// Positionnée immédiatement après le Hero pour conversion maximale
import { Link } from "react-router-dom";
import {
  ArrowRight,
  TrendingUp,
  Clock,
  Shield,
  Briefcase,
  Star,
  CheckCircle2,
  ChevronRight,
  Zap,
  Users,
  Award,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { track } from "@/lib/landingTracking";

const EASE = { ease: [0.22, 1, 0.36, 1] as const, duration: 0.7 };
const SPRING = { type: "spring" as const, stiffness: 240, damping: 20 };

const benefits = [
  {
    icon: TrendingUp,
    title: "300 € à 2 000 € par mission",
    desc: "Commissions directes et automatiques, sans négociation.",
    color: "hsl(var(--accent))",
  },
  {
    icon: Clock,
    title: "Moins de 8h / semaine",
    desc: "Travaillez à votre rythme, sans horaires imposés.",
    color: "hsl(152 62% 52%)",
  },
  {
    icon: Shield,
    title: "Gains 100 % tracés & prouvés",
    desc: "Chaque introduction est horodatée, juridiquement protégée.",
    color: "hsl(var(--primary-glow))",
  },
  {
    icon: Briefcase,
    title: "Compatible emploi salarié",
    desc: "Activité complémentaire déclarée, sans conflit.",
    color: "hsl(38 100% 65%)",
  },
];

const earningsRows = [
  { month: "Mois 1", intros: "2 introductions validées", gain: "+800 €", w: "25%" },
  { month: "Mois 2", intros: "3 introductions validées", gain: "+1 400 €", w: "45%" },
  { month: "Mois 3", intros: "5 introductions validées", gain: "+2 200 €", w: "68%" },
  { month: "Mois 4+", intros: "6 introductions validées", gain: "+3 200 €", w: "100%" },
];

const audiences = [
  "En reconversion professionnelle",
  "À la recherche d'emploi",
  "Salarié cherchant un complément",
  "Bénéficiaire du RSA",
  "Auto-entrepreneur",
  "Retraité actif",
  "Freelance en intercontrat",
];

const trustItems = [
  { label: "Accès gratuit facilitateurs", color: "hsl(152 62% 52%)" },
  { label: "Paiement automatique à la signature", color: "hsl(var(--accent))" },
  { label: "Zéro commission sur vos gains", color: "hsl(var(--primary-glow))" },
  { label: "Résiliation libre à tout moment", color: "hsl(38 100% 65%)" },
];

function AnimatedBar({ w, delay }: { w: string; delay: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <div
      ref={ref}
      className="relative h-2 rounded-full overflow-hidden"
      style={{ background: "hsl(218 55% 14% / 0.8)" }}
    >
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background: "linear-gradient(90deg, hsl(var(--accent)), hsl(38 100% 70%))",
        }}
        initial={{ width: "0%" }}
        animate={isInView ? { width: w } : { width: "0%" }}
        transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

export default function CreerEmploiCTASection() {
  return (
    <section
      className="relative overflow-hidden"
      aria-labelledby="creer-emploi-heading"
      style={{ paddingTop: "clamp(4rem, 8vw, 7rem)", paddingBottom: "clamp(4rem, 8vw, 7rem)" }}
    >
      {/* ─── Background premium ─────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(158deg, hsl(218 72% 4%) 0%, hsl(218 68% 8%) 45%, hsl(24 30% 8%) 100%)",
        }}
        aria-hidden="true"
      />
      {/* Amber glow — top right */}
      <div
        className="absolute -top-40 -right-40 w-[900px] h-[900px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--accent) / 0.12) 0%, transparent 60%)",
          filter: "blur(60px)",
        }}
        aria-hidden="true"
      />
      {/* Blue glow — bottom left */}
      <div
        className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary-glow) / 0.09) 0%, transparent 62%)",
          filter: "blur(48px)",
        }}
        aria-hidden="true"
      />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.018] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--accent)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--accent)) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
        aria-hidden="true"
      />
      {/* Top separator line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--accent) / 0.35) 30%, hsl(var(--primary-glow) / 0.25) 70%, transparent)",
        }}
        aria-hidden="true"
      />

      <div className="container max-w-7xl relative z-10 px-4 md:px-6">

        {/* ─── Header badge ───────────────────────────────────────────── */}
        <motion.div
          className="flex flex-col items-center text-center mb-14"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={EASE}
        >
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] mb-6"
            style={{
              background: "hsl(var(--accent) / 0.10)",
              color: "hsl(var(--accent))",
              border: "1px solid hsl(var(--accent) / 0.3)",
              boxShadow: "0 0 32px hsl(var(--accent) / 0.10)",
            }}
          >
            <Zap size={11} fill="currentColor" />
            Créez votre activité — Opportunité Facilitateur
          </div>

          <h2
            id="creer-emploi-heading"
            className="font-display font-black text-white leading-[1.08] tracking-tight mb-5"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", maxWidth: "820px" }}
          >
            Créez votre prochaine mission en{" "}
            <span
              style={{
                background: "linear-gradient(92deg, hsl(var(--accent)), hsl(38 100% 74%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              60 secondes
            </span>
            {" "}et gagnez jusqu'à{" "}
            <span
              style={{
                background: "linear-gradient(92deg, hsl(152 62% 52%), hsl(var(--primary-glow)))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              15 000 €
            </span>
          </h2>

          <p
            className="text-white/55 leading-relaxed max-w-2xl"
            style={{ fontSize: "clamp(0.95rem, 1.8vw, 1.15rem)" }}
          >
            Avec WiinupMax, augmentez vos revenus en toute sécurité, sans rien sortir de votre poche,{" "}
            <strong className="text-white/80">sans charge mentale, ni bousculer vos habitudes.</strong>
          </p>
        </motion.div>

        {/* ─── Main 3-column grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px_1fr] gap-10 xl:gap-14 items-start">

          {/* ── COL 1 — Bénéfices + audiences + CTA ──────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -36 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={EASE}
          >
            {/* Benefits grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-10">
              {benefits.map(({ icon: Icon, title, desc, color }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ ...EASE, delay: i * 0.09 }}
                  className="flex items-start gap-3.5 rounded-2xl p-4"
                  style={{
                    background: "hsl(218 58% 10% / 0.7)",
                    border: `1px solid ${color.replace(")", " / 0.18)")}`,
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${color.replace(")", " / 0.13)")}` }}
                  >
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm leading-snug mb-0.5">{title}</p>
                    <p className="text-white/45 text-xs leading-snug">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Audience chips */}
            <div className="mb-10">
              <p className="text-white/35 text-[10px] font-bold uppercase tracking-[0.18em] mb-3 flex items-center gap-2">
                <Users size={10} />
                Pour ceux qui sont…
              </p>
              <div className="flex flex-wrap gap-2">
                {audiences.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium"
                    style={{
                      background: "hsl(218 55% 13% / 0.75)",
                      color: "hsl(218 30% 76%)",
                      border: "1px solid hsl(218 35% 28% / 0.55)",
                    }}
                  >
                    <CheckCircle2 size={10} style={{ color: "hsl(152 62% 52%)" }} />
                    {a}
                  </span>
                ))}
              </div>
            </div>

            {/* Primary CTA — massif ambre */}
            <motion.div
              whileHover={{ scale: 1.025, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING}
            >
              <Link
                to="/creer-emploi"
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl font-black text-[1.05rem] px-8 w-full sm:w-auto"
                style={{
                  padding: "1.1rem 2rem",
                  background: "linear-gradient(135deg, hsl(var(--accent)), hsl(38 100% 56%))",
                  color: "hsl(218 72% 4%)",
                  boxShadow:
                    "0 10px 40px hsl(var(--accent) / 0.42), 0 2px 0 hsl(38 100% 80% / 0.28) inset",
                }}
                onClick={() => track("cta_hero_creer_emploi")}
                aria-label="Créer ma Mission sur WiinupMax"
              >
                <Zap size={17} strokeWidth={2.5} />
                Créer ma Mission maintenant
                <ArrowRight size={17} />
              </Link>
            </motion.div>

            <p className="text-white/25 text-[11px] mt-3 flex items-center gap-1.5">
              <CheckCircle2 size={10} style={{ color: "hsl(152 62% 48%)" }} />
              Accès 100 % gratuit pour les facilitateurs · Inscription en 60 secondes
            </p>
          </motion.div>

          {/* ── COL 2 — Photo fondateur ───────────────────────────────── */}
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ ...EASE, delay: 0.18 }}
          >
            <div className="relative w-full max-w-[390px] mx-auto">
              {/* Ambient glow ring */}
              <motion.div
                className="absolute -inset-6 rounded-[3rem] pointer-events-none"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  background:
                    "radial-gradient(ellipse at center, hsl(var(--accent) / 0.20) 0%, transparent 68%)",
                  filter: "blur(24px)",
                }}
                aria-hidden="true"
              />

              {/* Card */}
              <div
                className="relative rounded-[2rem] overflow-hidden"
                style={{
                  border: "1px solid hsl(var(--accent) / 0.25)",
                  boxShadow:
                    "0 40px 100px hsl(218 72% 3% / 0.75), 0 12px 32px hsl(var(--accent) / 0.14), 0 0 0 1px hsl(var(--accent) / 0.06)",
                }}
              >
                {/* Photo */}
                <div className="relative" style={{ aspectRatio: "4/5" }}>
                  <img
                    src="/vivien-founder-new.jpg"
                    alt="Vivien Le Moal — Fondateur de WiinupMax, créateur du modèle d'apport d'affaires automatisé"
                    width={390}
                    height={488}
                    className="w-full h-full object-cover object-top"
                    loading="eager"
                    style={{
                      filter: "brightness(1.05) contrast(1.03) saturate(1.06)",
                    }}
                  />
                  {/* Gradient fade bottom */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-56 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent 0%, hsl(218 70% 6% / 0.97) 100%)",
                    }}
                    aria-hidden="true"
                  />

                  {/* Identity block */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2.5"
                      style={{
                        background: "hsl(var(--accent) / 0.16)",
                        color: "hsl(var(--accent))",
                        border: "1px solid hsl(var(--accent) / 0.32)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <Star size={8} fill="currentColor" />
                      Founder Pass
                    </div>
                    <p className="text-white font-display font-bold text-xl leading-tight">
                      Vivien Le Moal
                    </p>
                    <p className="text-white/50 text-xs mt-0.5">Fondateur — WiinupMax</p>
                  </div>
                </div>

                {/* Quote */}
                <div
                  className="px-5 py-4"
                  style={{ background: "hsl(218 62% 7% / 0.97)" }}
                >
                  <p className="text-white/65 text-sm leading-relaxed italic">
                    "J'ai créé WiinupMax pour que chacun puisse monétiser son réseau sans risque
                    et sans avoir besoin d'être commercial."
                  </p>
                </div>
              </div>

              {/* Floating badge — Gains versés */}
              <motion.div
                className="absolute -right-4 top-10 px-3.5 py-2.5 rounded-2xl"
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ ...EASE, delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                style={{
                  background: "hsl(152 62% 8% / 0.96)",
                  border: "1px solid hsl(152 62% 38% / 0.38)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 10px 36px hsl(218 72% 3% / 0.55)",
                }}
              >
                <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5 text-white/38">
                  Gains versés
                </p>
                <p
                  className="font-display font-black text-2xl leading-none"
                  style={{ color: "hsl(152 62% 54%)" }}
                >
                  Auto
                </p>
              </motion.div>

              {/* Floating badge — Inscription */}
              <motion.div
                className="absolute -left-4 bottom-28 px-3.5 py-2.5 rounded-2xl"
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ ...EASE, delay: 0.72 }}
                whileHover={{ scale: 1.05 }}
                style={{
                  background: "hsl(218 68% 10% / 0.96)",
                  border: "1px solid hsl(var(--accent) / 0.30)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 10px 36px hsl(218 72% 3% / 0.55)",
                }}
              >
                <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5 text-white/38">
                  Inscription
                </p>
                <p
                  className="font-display font-black text-2xl leading-none"
                  style={{ color: "hsl(var(--accent))" }}
                >
                  60 sec
                </p>
              </motion.div>

              {/* Floating badge — Founder Pass */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 -bottom-4 px-4 py-2 rounded-full"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...EASE, delay: 0.85 }}
                style={{
                  background: "linear-gradient(135deg, hsl(var(--accent)), hsl(38 100% 56%))",
                  boxShadow: "0 6px 24px hsl(var(--accent) / 0.4)",
                }}
              >
                <p className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap" style={{ color: "hsl(218 72% 5%)" }}>
                  ★ Founder Pass — 99 €/an
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* ── COL 3 — Earnings chart + checklist + CTA secondaire ───── */}
          <motion.div
            initial={{ opacity: 0, x: 36 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ ...EASE, delay: 0.12 }}
          >
            {/* Earnings simulation card */}
            <div
              className="rounded-2xl overflow-hidden mb-5"
              style={{
                background: "hsl(218 60% 7% / 0.88)",
                border: "1px solid hsl(var(--accent) / 0.16)",
                boxShadow: "0 28px 64px hsl(218 72% 3% / 0.6)",
                backdropFilter: "blur(24px)",
              }}
            >
              <div
                className="px-6 py-4"
                style={{ borderBottom: "1px solid hsl(218 40% 20% / 0.5)" }}
              >
                <div className="flex items-center justify-between">
                  <p
                    className="text-[10px] font-black uppercase tracking-[0.16em]"
                    style={{ color: "hsl(var(--accent))" }}
                  >
                    Revenus estimés — Exemple réel
                  </p>
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: "hsl(152 62% 42% / 0.12)",
                      color: "hsl(152 62% 56%)",
                      border: "1px solid hsl(152 62% 42% / 0.22)",
                    }}
                  >
                    Simulation
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {earningsRows.map(({ month, intros, gain, w }, i) => (
                  <motion.div
                    key={month}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ ...EASE, delay: i * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div>
                        <p className="text-white font-semibold text-sm leading-none">{month}</p>
                        <p className="text-white/32 text-xs mt-0.5">{intros}</p>
                      </div>
                      <span
                        className="font-display font-black text-lg"
                        style={{
                          color:
                            i === earningsRows.length - 1
                              ? "hsl(var(--accent))"
                              : "hsl(152 62% 53%)",
                        }}
                      >
                        {gain}
                      </span>
                    </div>
                    <AnimatedBar w={w} delay={0.32 + i * 0.12} />
                  </motion.div>
                ))}
              </div>

              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ borderTop: "1px solid hsl(218 40% 20% / 0.5)" }}
              >
                <span className="text-white/38 text-xs font-medium">Total estimé (4 mois)</span>
                <span
                  className="font-display font-black text-3xl"
                  style={{ color: "hsl(var(--accent))" }}
                >
                  +7 600 €
                </span>
              </div>
              <p className="text-white/18 text-[10px] text-center pb-4 px-4 leading-relaxed">
                Basé sur une commission moyenne de 400 € par introduction qualifiée validée. Résultats non garantis.
              </p>
            </div>

            {/* Founder Pass checklist */}
            <div
              className="rounded-2xl p-5 mb-5"
              style={{
                background: "hsl(218 58% 7% / 0.65)",
                border: "1px solid hsl(218 40% 22% / 0.5)",
              }}
            >
              <p className="text-white/45 text-[10px] font-black uppercase tracking-[0.18em] mb-3 flex items-center gap-1.5">
                <Award size={10} style={{ color: "hsl(var(--accent))" }} />
                Ce qui est inclus dans le Founder Pass
              </p>
              {[
                "Tableau de bord facilitateur complet",
                "Tracking automatique de chaque introduction",
                "Versement automatique dès la signature",
                "Support prioritaire fondateurs",
                "Accès à vie — prix 99 €/an garanti",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 py-1.5">
                  <ChevronRight
                    size={12}
                    style={{ color: "hsl(var(--accent))", flexShrink: 0 }}
                  />
                  <span className="text-white/65 text-sm leading-snug">{item}</span>
                </div>
              ))}
            </div>

            {/* CTA secondaire */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING}
            >
              <Link
                to="/creer-emploi"
                className="flex items-center justify-center gap-2 w-full rounded-2xl py-4 text-sm font-bold border transition-colors"
                style={{
                  borderColor: "hsl(var(--accent) / 0.38)",
                  color: "hsl(var(--accent))",
                  background: "hsl(var(--accent) / 0.07)",
                }}
                onClick={() => track("cta_hero_creer_emploi")}
                aria-label="En savoir plus sur le programme facilitateur"
              >
                En savoir plus sur le programme
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* ─── Trust bar ──────────────────────────────────────────────── */}
        <motion.div
          className="mt-16 pt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
          style={{ borderTop: "1px solid hsl(218 40% 20% / 0.45)" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          {trustItems.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: color }}
              />
              <span className="text-white/42 text-xs font-medium">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
