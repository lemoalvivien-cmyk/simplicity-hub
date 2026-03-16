/**
 * /rejoindre — Landing dédiée aux personnes en recherche d'emploi / RSA
 * Hors menu principal · URL directe ou campagne marketing
 * Design system 100% tokens Shadcn/Tailwind · Framer Motion
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, CheckCircle2, Star, HeartHandshake, Zap,
  ShieldCheck, TrendingUp, Users,
} from "lucide-react";
import PublicNav, { LegalFooter } from "@/components/layout/PublicNav";
import vivienPhoto from "@/assets/vivien-le-moal.jpg";

const EASE = { ease: [0.22, 1, 0.36, 1] as const, duration: 0.65 };
const BOUNCE = { type: "spring" as const, stiffness: 280, damping: 22 };
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { ...EASE, delay } },
});

const AVANTAGES = [
  "Inscription 100 % gratuite — sans carte bancaire",
  "Gagnez entre 300 € et 2 000 € par introduction réussie",
  "Moins de 8 heures par semaine suffisent",
  "Compatible avec le RSA, le chômage et toute allocation",
  "Aucune formation requise — votre réseau suffit",
  "Paiement automatique dès que l'affaire est signée",
];

const TEMOIGNAGES = [
  {
    name: "Amina K.",
    role: "Ancienne chargée de clientèle, Marseille",
    gain: "1 400 €",
    quote: "Je cherchais un emploi depuis 8 mois. En attendant, j'ai présenté deux personnes de mon réseau et j'ai reçu 1 400 € sans avancer un centime. C'est honnête et simple.",
  },
  {
    name: "Patrick D.",
    role: "Bénéficiaire RSA, Nantes",
    gain: "890 €",
    quote: "Je ne savais pas que mon carnet d'adresses pouvait me rapporter de l'argent. La plateforme m'a guidé pas à pas. Recommande.",
  },
  {
    name: "Sylvie R.",
    role: "En reconversion, Toulouse",
    gain: "2 100 €",
    quote: "Pendant ma transition professionnelle, j'ai pu maintenir un revenu grâce à WiinupMax. Sans pression, sans risque.",
  },
];

export default function LandingRSA() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col overflow-hidden"
        style={{ background: "linear-gradient(155deg, hsl(218 72% 4%) 0%, hsl(218 72% 9%) 50%, hsl(218 65% 13%) 100%)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(hsl(var(--primary-glow)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-glow)) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, hsl(218 72% 22% / 0.5) 0%, transparent 65%)" }} aria-hidden="true" />
        <div className="absolute bottom-0 inset-x-0 h-48 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, hsl(218 72% 4% / 0.9))" }} aria-hidden="true" />

        <div className="container relative z-10 flex-1 flex items-center pt-24 pb-16 md:pt-28 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 w-full items-center">

            {/* LEFT */}
            <div className="flex flex-col">
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...EASE }}
                className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full w-fit text-xs font-bold"
                style={{ background: "hsl(152 62% 22% / 0.25)", border: "1px solid hsl(152 62% 34% / 0.4)", color: "hsl(152 62% 55%)" }}
              >
                <HeartHandshake size={13} />
                Accès 100 % gratuit — Sans carte bancaire
              </motion.div>

              <motion.h1
                className="font-display font-bold text-white leading-[1.1] tracking-tight mb-6"
                style={{ fontSize: "clamp(1.7rem, 4vw, 3.2rem)" }}
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...EASE, delay: 0.08 }}
              >
                Vous cherchez un emploi ou un{" "}
                <span style={{
                  background: "linear-gradient(135deg, hsl(var(--accent)), hsl(38 100% 70%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  revenu complémentaire immédiat ?
                </span>
              </motion.h1>

              <motion.p
                className="text-white/70 text-base leading-relaxed mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...EASE, delay: 0.18 }}
              >
                Votre réseau — anciens collègues, voisins, amis — vaut de l'argent. WiinupMax vous permet de le valoriser <strong className="text-white/90">légalement, gratuitement, sans rien bousculer dans votre quotidien.</strong>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...EASE, delay: 0.3 }}
              >
                <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={BOUNCE}>
                  <Link
                    to="/signup"
                    className="btn-cta inline-flex flex-col items-center justify-center gap-1 px-8 py-5 text-base leading-tight"
                  >
                    <span className="flex items-center gap-2 font-bold">
                      <Zap size={16} />
                      Je m'inscris gratuitement
                      <ArrowRight size={16} />
                    </span>
                    <span className="text-[11px] font-medium opacity-75">
                      Aucune carte bancaire · Aucune formation requise
                    </span>
                  </Link>
                </motion.div>
              </motion.div>

              <motion.ul
                className="flex flex-wrap gap-3 mt-7"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...EASE, delay: 0.44 }}
              >
                {["Gratuit pour toujours", "100 % légal", "Paiement automatique", "< 8h/semaine"].map((pill) => (
                  <li key={pill} className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5"
                    style={{ background: "hsl(218 55% 18% / 0.55)", border: "1px solid hsl(218 55% 33% / 0.3)", color: "hsl(var(--primary-glow))" }}>
                    <CheckCircle2 size={10} />
                    {pill}
                  </li>
                ))}
              </motion.ul>
            </div>

            {/* RIGHT — photo */}
            <motion.div
              className="relative hidden lg:block"
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative rounded-3xl overflow-hidden"
                style={{ boxShadow: "0 32px 80px hsl(218 72% 5% / 0.7), 0 0 0 1px hsl(218 55% 30% / 0.2)" }}>
                <img
                  src={vivienPhoto}
                  alt="Vivien Le Moal, Président WiinupMax"
                  className="w-full h-[520px] object-cover object-top"
                  loading="eager"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(218 72% 6% / 0.75) 0%, transparent 55%)" }} />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="font-display font-bold text-white text-lg leading-tight">Vivien Le Moal</p>
                  <p className="text-white/70 text-sm mt-0.5">Président & Fondateur — WiinupMax</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── AVANTAGES ────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-card border-y border-border">
        <div className="container max-w-4xl">
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp()}
            className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10"
          >
            Tout ce que vous obtenez — gratuitement
          </motion.h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {AVANTAGES.map((item, i) => (
              <motion.div
                key={item}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp(i * 0.08)}
                className="flex items-start gap-3 rounded-xl border border-border p-4"
                style={{ background: "hsl(var(--background))" }}
              >
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" style={{ color: "hsl(152 62% 45%)" }} />
                <span className="text-sm text-foreground leading-snug">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ────────────────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="container max-w-4xl">
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp()}
            className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10"
          >
            3 étapes. C'est tout.
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { num: "01", icon: Users, title: "Créez votre profil", desc: "5 minutes. Gratuit. Aucune CB requise." },
              { num: "02", icon: HeartHandshake, title: "Faites une présentation", desc: "Présentez quelqu'un de votre réseau à une entreprise. Un message suffit." },
              { num: "03", icon: TrendingUp, title: "Recevez votre argent", desc: "Affaire signée ? Votre gain est versé automatiquement. Sans relance." },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp(i * 0.12)}
                  className="rounded-2xl border border-border p-6 text-center"
                  style={{ background: "hsl(var(--card))" }}
                >
                  <span className="font-display text-4xl font-bold block mb-3" style={{ color: "hsl(var(--accent) / 0.4)" }}>
                    {step.num}
                  </span>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: "hsl(var(--primary) / 0.08)" }}>
                    <Icon size={18} style={{ color: "hsl(var(--primary))" }} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ──────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20" style={{ background: "hsl(var(--muted) / 0.35)" }}>
        <div className="container max-w-4xl">
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp()}
            className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10"
          >
            Ils ont commencé comme vous
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-5">
            {TEMOIGNAGES.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp(i * 0.1)}
                className="rounded-2xl border border-border p-5 space-y-4 flex flex-col"
                style={{ background: "hsl(var(--card))" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={12} fill="hsl(var(--accent))" style={{ color: "hsl(var(--accent))" }} />
                    ))}
                  </div>
                  <span className="font-bold text-sm px-2.5 py-1 rounded-lg"
                    style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}>
                    +{t.gain}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic flex-1">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────── */}
      <section
        className="py-20 md:py-28 relative overflow-hidden"
        style={{ background: "linear-gradient(155deg, hsl(218 72% 4%) 0%, hsl(218 72% 9%) 50%, hsl(218 65% 13%) 100%)" }}
      >
        <div className="container max-w-xl text-center relative z-10">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp()}
            className="space-y-6"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight">
              Prêt à valoriser{" "}
              <span style={{
                background: "linear-gradient(135deg, hsl(var(--accent)), hsl(38 100% 70%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                votre réseau ?
              </span>
            </h2>
            <p className="text-white/70 text-base leading-relaxed">
              Inscription gratuite. Aucune obligation. Vos premiers gains possibles dès votre première présentation.
            </p>
            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={BOUNCE} className="inline-block">
              <Link
                to="/signup"
                className="btn-cta text-base px-10 py-5 inline-flex flex-col items-center gap-1"
              >
                <span className="flex items-center gap-2 font-bold">
                  <Zap size={18} />
                  Je m'inscris gratuitement
                  <ArrowRight size={18} />
                </span>
                <span className="text-[11px] font-medium opacity-75">
                  Aucune carte bancaire · Gratuit pour toujours
                </span>
              </Link>
            </motion.div>
            <div className="flex flex-wrap justify-center gap-5 pt-2">
              {["100 % légal France", "RGPD conforme", "Paiements sécurisés Stripe", "Aucune avance"].map(item => (
                <span key={item} className="flex items-center gap-1.5 text-xs text-white/50">
                  <ShieldCheck size={11} style={{ color: "hsl(152 62% 45%)" }} />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <LegalFooter />

      {/* Sticky CTA Mobile */}
      <div
        className="md:hidden fixed bottom-0 inset-x-0 z-50 px-4 pb-4 pt-2"
        style={{ background: "linear-gradient(to top, hsl(218 72% 5%) 60%, transparent)" }}
      >
        <Link
          to="/signup"
          className="btn-cta w-full flex flex-col items-center justify-center gap-0.5 py-4 text-sm font-bold rounded-2xl"
        >
          <span className="flex items-center gap-2">
            <Zap size={15} />
            Je m'inscris gratuitement
            <ArrowRight size={15} />
          </span>
          <span className="text-[11px] font-medium opacity-75">
            Gratuit pour toujours · Aucune CB
          </span>
        </Link>
      </div>
    </div>
  );
}
