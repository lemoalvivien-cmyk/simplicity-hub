// SECTION STAR CRÉATION D'EMPLOI — CTA #1 business (photo Vivien nouvelle version — positionnée pour conversion max)
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Clock, Shield, Briefcase, Star, CheckCircle2, ChevronRight } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { track } from "@/lib/landingTracking";

const EASE = { ease: [0.22, 1, 0.36, 1] as const, duration: 0.7 };

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
    title: "Gains 100 % tracés",
    desc: "Chaque introduction est horodatée, juridiquement prouvée.",
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
  { month: "Mois 1", intros: "2 introductions validées", gain: "+800 €", w: "35%" },
  { month: "Mois 2", intros: "3 introductions validées", gain: "+1 400 €", w: "58%" },
  { month: "Mois 3", intros: "5 introductions validées", gain: "+2 200 €", w: "80%" },
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

function CounterRow({ gain, delay, w }: { gain: string; delay: number; w: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <div ref={ref} className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(218 55% 14% / 0.8)" }}>
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: "linear-gradient(90deg, hsl(var(--accent)), hsl(38 100% 70%))" }}
        initial={{ width: "0%" }}
        animate={isInView ? { width: w } : { width: "0%" }}
        transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

export default function CreerEmploiCTASection() {
  const sectionRef = useRef(null);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-36 overflow-hidden"
      aria-labelledby="creer-emploi-heading"
    >
      {/* ─── Layered background ─────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, hsl(218 72% 3%) 0%, hsl(218 68% 7%) 40%, hsl(24 35% 9%) 100%)",
        }}
        aria-hidden="true"
      />
      {/* Accent glow top-right */}
      <div
        className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(var(--accent) / 0.10) 0%, transparent 68%)",
          filter: "blur(48px)",
        }}
        aria-hidden="true"
      />
      {/* Blue glow bottom-left */}
      <div
        className="absolute -bottom-24 -left-24 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary-glow) / 0.08) 0%, transparent 65%)",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.022] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--accent)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--accent)) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
        aria-hidden="true"
      />

      <div className="container max-w-7xl relative z-10 px-4 md:px-6">

        {/* ─── Top label ──────────────────────────────────────────────── */}
        <motion.div
          className="flex justify-center mb-12"
          initial={{ opacity: 0, y: -16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={EASE}
        >
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{
              background: "hsl(var(--accent) / 0.10)",
              color: "hsl(var(--accent))",
              border: "1px solid hsl(var(--accent) / 0.28)",
              boxShadow: "0 0 28px hsl(var(--accent) / 0.08)",
            }}
          >
            <Briefcase size={12} />
            Opportunité Facilitateur — Créez votre activité
          </div>
        </motion.div>

        {/* ─── Main 3-column layout ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px_1fr] gap-10 lg:gap-8 xl:gap-14 items-start">

          {/* ── LEFT : Copy + benefits ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={EASE}
          >
            <h2
              id="creer-emploi-heading"
              className="font-display font-black text-white leading-[1.12] tracking-tight mb-6"
              style={{ fontSize: "clamp(1.75rem, 3.8vw, 2.75rem)" }}
            >
              Créez votre prochaine mission en{" "}
              <span
                style={{
                  background: "linear-gradient(92deg, hsl(var(--accent)), hsl(38 100% 72%))",
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

            <p className="text-white/60 text-base md:text-lg leading-relaxed mb-10 max-w-lg">
              Vous avez un réseau professionnel ? Monétisez-le en présentant des prospects qualifiés
              aux entreprises qui en ont besoin. Aucun investissement. Aucune formation complexe.
              Vous êtes payé{" "}
              <strong className="text-white/90">uniquement quand l'affaire est signée.</strong>
            </p>

            {/* Benefits grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {benefits.map(({ icon: Icon, title, desc, color }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ ...EASE, delay: i * 0.08 }}
                  className="flex items-start gap-3.5 rounded-2xl p-4 border"
                  style={{
                    background: `${color.replace(")", " / 0.05)")}`,
                    borderColor: `${color.replace(")", " / 0.18)")}`,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${color.replace(")", " / 0.12)")}` }}
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
              <p className="text-white/35 text-[10px] font-semibold uppercase tracking-widest mb-3">
                Pour ceux qui sont…
              </p>
              <div className="flex flex-wrap gap-2">
                {audiences.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium"
                    style={{
                      background: "hsl(218 55% 14% / 0.7)",
                      color: "hsl(218 30% 75%)",
                      border: "1px solid hsl(218 35% 28% / 0.6)",
                    }}
                  >
                    <CheckCircle2 size={10} style={{ color: "hsl(152 62% 52%)" }} />
                    {a}
                  </span>
                ))}
              </div>
            </div>

            {/* Main CTA */}
            <motion.div whileHover={{ scale: 1.025, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/creer-emploi"
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl font-bold text-base px-8 py-4.5 py-[1.1rem] w-full sm:w-auto"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--accent)), hsl(38 100% 58%))",
                  color: "hsl(218 72% 5%)",
                  boxShadow: "0 8px 32px hsl(var(--accent) / 0.35), 0 2px 0 hsl(38 100% 75% / 0.3) inset",
                }}
                onClick={() => track("cta_hero_creer_emploi")}
              >
                Créer ma Mission maintenant
                <ArrowRight size={17} />
              </Link>
            </motion.div>
            <p className="text-white/28 text-[11px] mt-3">
              Accès gratuit pour les facilitateurs · Inscription en 60 secondes
            </p>
          </motion.div>

          {/* ── CENTER : Founder photo card ──────────────────────────────── */}
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 32, scale: 0.94 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ ...EASE, delay: 0.15 }}
          >
            {/* Photo frame */}
            <div className="relative w-full max-w-[380px] mx-auto">
              {/* Glow ring */}
              <div
                className="absolute -inset-4 rounded-[2.5rem] pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at center, hsl(var(--accent) / 0.18) 0%, transparent 70%)",
                  filter: "blur(20px)",
                }}
                aria-hidden="true"
              />

              {/* Card */}
              <div
                className="relative rounded-[2rem] overflow-hidden"
                style={{
                  border: "1px solid hsl(var(--accent) / 0.22)",
                  boxShadow:
                    "0 32px 80px hsl(218 72% 3% / 0.7), 0 8px 24px hsl(var(--accent) / 0.12), 0 0 0 1px hsl(var(--accent) / 0.08)",
                }}
              >
                {/* Photo */}
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src="/vivien-founder-new.jpg"
                    alt="Vivien Le Moal — Fondateur de WiinupMax, créateur du modèle d'apport d'affaires automatisé"
                    width={380}
                    height={475}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                    style={{ filter: "brightness(1.04) contrast(1.02) saturate(1.05)" }}
                  />
                  {/* Bottom gradient fade */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
                    style={{
                      background: "linear-gradient(to bottom, transparent 0%, hsl(218 72% 6% / 0.95) 100%)",
                    }}
                    aria-hidden="true"
                  />

                  {/* Identity block at bottom of photo */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2"
                      style={{
                        background: "hsl(var(--accent) / 0.15)",
                        color: "hsl(var(--accent))",
                        border: "1px solid hsl(var(--accent) / 0.3)",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <Star size={8} fill="currentColor" />
                      Founder Pass
                    </div>
                    <p className="text-white font-display font-bold text-lg leading-tight">Vivien Le Moal</p>
                    <p className="text-white/55 text-xs mt-0.5">Fondateur — WiinupMax</p>
                  </div>
                </div>

                {/* Quote card below photo */}
                <div
                  className="px-5 py-4"
                  style={{ background: "hsl(218 60% 7% / 0.95)" }}
                >
                  <p className="text-white/70 text-sm leading-relaxed italic">
                    "J'ai créé WiinupMax pour que chacun puisse monétiser son réseau sans risque
                    et sans avoir besoin d'être commercial."
                  </p>
                </div>
              </div>

              {/* Floating badge — gains automatiques */}
              <motion.div
                className="absolute -right-5 top-12 px-3.5 py-2.5 rounded-xl"
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ ...EASE, delay: 0.55 }}
                style={{
                  background: "hsl(152 62% 8% / 0.95)",
                  border: "1px solid hsl(152 62% 40% / 0.35)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 8px 32px hsl(218 72% 3% / 0.5)",
                }}
              >
                <p className="text-[9px] font-semibold uppercase tracking-widest mb-0.5 text-white/40">
                  Gains versés
                </p>
                <p className="font-display font-bold text-xl leading-none" style={{ color: "hsl(152 62% 52%)" }}>
                  Auto
                </p>
              </motion.div>

              {/* Floating badge — 60 secondes */}
              <motion.div
                className="absolute -left-5 bottom-24 px-3.5 py-2.5 rounded-xl"
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ ...EASE, delay: 0.65 }}
                style={{
                  background: "hsl(218 65% 10% / 0.95)",
                  border: "1px solid hsl(var(--accent) / 0.28)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 8px 32px hsl(218 72% 3% / 0.5)",
                }}
              >
                <p className="text-[9px] font-semibold uppercase tracking-widest mb-0.5 text-white/40">
                  Inscription
                </p>
                <p className="font-display font-bold text-xl leading-none" style={{ color: "hsl(var(--accent))" }}>
                  60 sec
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* ── RIGHT : Earnings chart + secondary CTA ──────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ ...EASE, delay: 0.1 }}
          >
            {/* Earnings card */}
            <div
              className="rounded-2xl overflow-hidden mb-6"
              style={{
                background: "hsl(218 58% 7% / 0.85)",
                border: "1px solid hsl(var(--accent) / 0.15)",
                boxShadow: "0 24px 60px hsl(218 72% 3% / 0.6)",
                backdropFilter: "blur(24px)",
              }}
            >
              <div
                className="px-6 py-4 border-b"
                style={{ borderColor: "hsl(218 40% 20% / 0.5)" }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "hsl(var(--accent))" }}>
                    Revenus estimés — Exemple réel
                  </p>
                  <span
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: "hsl(152 62% 42% / 0.12)",
                      color: "hsl(152 62% 55%)",
                      border: "1px solid hsl(152 62% 42% / 0.2)",
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
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ ...EASE, delay: i * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-white font-semibold text-sm leading-none">{month}</p>
                        <p className="text-white/35 text-xs mt-0.5">{intros}</p>
                      </div>
                      <span
                        className="font-display font-bold text-lg"
                        style={{
                          color: i === earningsRows.length - 1
                            ? "hsl(var(--accent))"
                            : "hsl(152 62% 52%)",
                        }}
                      >
                        {gain}
                      </span>
                    </div>
                    <CounterRow gain={gain} delay={0.3 + i * 0.12} w={w} />
                  </motion.div>
                ))}
              </div>

              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ borderTop: "1px solid hsl(218 40% 20% / 0.5)" }}
              >
                <span className="text-white/40 text-xs font-medium">Total estimé (4 mois)</span>
                <span
                  className="font-display font-black text-2xl"
                  style={{ color: "hsl(var(--accent))" }}
                >
                  +7 600 €
                </span>
              </div>

              <p className="text-white/20 text-[10px] text-center pb-4 px-4">
                Basé sur une commission moyenne de 400 € par introduction qualifiée validée. Résultats non garantis.
              </p>
            </div>

            {/* Mini checklist */}
            <div
              className="rounded-2xl p-5 mb-6"
              style={{
                background: "hsl(218 58% 7% / 0.6)",
                border: "1px solid hsl(218 40% 22% / 0.5)",
              }}
            >
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-3">
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
                  <ChevronRight size={12} style={{ color: "hsl(var(--accent))", flexShrink: 0 }} />
                  <span className="text-white/65 text-sm">{item}</span>
                </div>
              ))}
            </div>

            {/* Secondary CTA */}
            <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/creer-emploi"
                className="flex items-center justify-center gap-2 w-full rounded-2xl py-4 text-sm font-bold border transition-colors"
                style={{
                  borderColor: "hsl(var(--accent) / 0.35)",
                  color: "hsl(var(--accent))",
                  background: "hsl(var(--accent) / 0.06)",
                }}
                onClick={() => track("cta_hero_creer_emploi")}
              >
                En savoir plus sur le programme
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* ─── Bottom trust bar ───────────────────────────────────────────── */}
        <motion.div
          className="mt-16 pt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
          style={{ borderTop: "1px solid hsl(218 40% 20% / 0.5)" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          {[
            { label: "Accès gratuit facilitateurs", color: "hsl(152 62% 52%)" },
            { label: "Paiement automatique à la signature", color: "hsl(var(--accent))" },
            { label: "Zéro commission prélevée sur vos gains", color: "hsl(var(--primary-glow))" },
            { label: "Résiliation libre à tout moment", color: "hsl(38 100% 65%)" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              <span className="text-white/45 text-xs font-medium">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
