import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase, Users, TrendingUp, CheckCircle2, ArrowRight,
  Star, Shield, Zap, Target, Award, HandshakeIcon
} from "lucide-react";
import PublicNav, { LegalFooter } from "@/components/layout/PublicNav";
import founderPhoto from "@/assets/founder-photo.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

const AVANTAGES = [
  {
    icon: TrendingUp,
    title: "Revenus complémentaires réels",
    desc: "Chaque affaire que vous apportez vous rapporte une commission versée automatiquement. Pas de promesses vagues — un système transparent.",
  },
  {
    icon: Users,
    title: "Votre réseau devient un actif",
    desc: "Vos relations professionnelles ont une valeur concrète. WiinupMax vous aide à la monétiser sans effort et sans démarche commerciale.",
  },
  {
    icon: Shield,
    title: "Zéro risque, zéro avance",
    desc: "Vous n'avancez rien. Vous ne signez rien de complexe. Vous êtes rémunéré uniquement quand l'affaire aboutit.",
  },
  {
    icon: Target,
    title: "Des missions claires et ciblées",
    desc: "Les entreprises publient leurs besoins en détail. Vous choisissez celles qui correspondent à votre réseau. Aucune pression.",
  },
  {
    icon: Award,
    title: "Une réputation qui grandit",
    desc: "Chaque introduction réussie renforce votre profil et augmente vos chances d'être sollicité sur des missions à plus forte valeur.",
  },
  {
    icon: HandshakeIcon,
    title: "Un cadre sécurisé et légal",
    desc: "Contrats d'apport d'affaires conformes, traçabilité complète, paiements sécurisés. Tout est géré pour vous.",
  },
];

const ETAPES = [
  {
    num: "01",
    title: "Créez votre profil apporteur",
    desc: "Renseignez votre secteur, votre zone géographique et les types de contacts que vous pouvez mobiliser.",
  },
  {
    num: "02",
    title: "Parcourez les missions disponibles",
    desc: "Choisissez les entreprises qui cherchent exactement le type de contact que vous connaissez.",
  },
  {
    num: "03",
    title: "Faites une introduction",
    desc: "Présentez simplement le bon contact à la bonne entreprise. C'est tout ce qu'on vous demande.",
  },
  {
    num: "04",
    title: "Recevez votre gain automatiquement",
    desc: "Dès que l'affaire est conclue, votre commission est calculée et versée sans que vous ayez à relancer quiconque.",
  },
];

const TEMOIGNAGES = [
  {
    name: "Thomas R.",
    role: "Consultant indépendant, Lyon",
    quote: "En six mois, j'ai généré 4 200 € de commissions simplement en présentant deux contacts que je connaissais depuis des années. Je n'aurais jamais imaginé que mon carnet d'adresses valait autant.",
    stars: 5,
  },
  {
    name: "Sophie M.",
    role: "Ex-Directrice commerciale, Paris",
    quote: "Après une transition de carrière, WiinupMax m'a permis de maintenir un revenu pendant que je construisais mon nouveau projet. Simple, honnête, efficace.",
    stars: 5,
  },
  {
    name: "Karim B.",
    role: "Chef de projet, Bordeaux",
    quote: "Je suis apporteur d'affaires depuis 8 mois. La plateforme est claire, les paiements arrivent sans accroc. Je recommande à tous ceux qui ont un bon réseau.",
    stars: 5,
  },
];

export default function CreerEmploiPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />

      {/* ── HERO ──────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 md:py-28 bg-hero">
        <div className="container max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="space-y-6"
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border"
              style={{
                background: "hsl(var(--accent) / 0.12)",
                borderColor: "hsl(var(--accent) / 0.3)",
                color: "hsl(var(--accent))",
              }}>
              <Zap size={11} />
              Apporteur d'affaires — Offre Fondateur
            </span>

            <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight text-foreground">
              Créez un revenu complémentaire grâce à{" "}
              <span style={{ color: "hsl(var(--accent))" }}>votre réseau</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Vous connaissez les bonnes personnes. Des entreprises cherchent exactement ces contacts.
              WiinupMax vous connecte — et vous rémunère pour chaque affaire conclue.
              Sans avance de frais. Sans obligation. Sans jargon.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link to="/signup" className="btn-cta text-sm px-6 py-3 inline-flex items-center gap-2 justify-center">
                Rejoindre en tant qu'apporteur <ArrowRight size={16} />
              </Link>
              <Link to="/pricing" className="text-sm font-medium px-6 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors inline-flex items-center gap-2 justify-center">
                Voir les tarifs
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              {["Aucune avance de frais", "Paiement automatique", "100% légal"].map(item => (
                <span key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 size={13} style={{ color: "hsl(var(--success))" }} />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden md:block"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border/40">
              <img
                src={founderPhoto}
                alt="Apporteur d'affaires WiinupMax"
                className="w-full h-80 object-cover object-top"
              />
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(to top, hsl(var(--background) / 0.6) 0%, transparent 60%)" }} />
            </div>

            {/* floating card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute -bottom-5 -left-5 rounded-xl border border-border p-3 shadow-lg"
              style={{ background: "hsl(var(--card))" }}
            >
              <p className="text-xs text-muted-foreground mb-0.5">Gain moyen / introduction</p>
              <p className="font-display text-2xl font-bold" style={{ color: "hsl(var(--accent))" }}>
                850 €
              </p>
              <p className="text-[10px] text-muted-foreground">versé automatiquement</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── AVANTAGES ─────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="container max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
              Pourquoi devenir apporteur d'affaires WiinupMax ?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Pas de promesse magique. Des avantages concrets pour ceux qui ont un bon réseau professionnel.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AVANTAGES.map((item, i) => (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-xl border border-border p-5 space-y-3"
                style={{ background: "hsl(var(--card))" }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: "hsl(var(--primary) / 0.1)" }}>
                  <item.icon size={18} style={{ color: "hsl(var(--primary))" }} />
                </div>
                <h3 className="font-semibold text-sm text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ÉTAPES ────────────────────────────────────── */}
      <section className="py-16 md:py-24" style={{ background: "hsl(var(--muted) / 0.3)" }}>
        <div className="container max-w-4xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
              Comment ça marche ?
            </h2>
            <p className="text-muted-foreground">Quatre étapes. Pas plus.</p>
          </motion.div>

          <div className="space-y-4">
            {ETAPES.map((etape, i) => (
              <motion.div
                key={etape.num}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex gap-5 items-start rounded-xl border border-border p-5"
                style={{ background: "hsl(var(--card))" }}
              >
                <span className="font-display text-3xl font-bold shrink-0 leading-none"
                  style={{ color: "hsl(var(--accent) / 0.4)" }}>
                  {etape.num}
                </span>
                <div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">{etape.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{etape.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ───────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="container max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
              Ils ont commencé comme vous
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {TEMOIGNAGES.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-xl border border-border p-5 space-y-4"
                style={{ background: "hsl(var(--card))" }}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} size={13} fill="hsl(var(--accent))" style={{ color: "hsl(var(--accent))" }} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-hero">
        <div className="container max-w-2xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="space-y-6"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "var(--gradient-electric)" }}>
              <Briefcase size={22} className="text-white" />
            </div>
            <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground">
              Prêt à monétiser votre réseau ?
            </h2>
            <p className="text-muted-foreground">
              Rejoignez les apporteurs d'affaires WiinupMax. Offre Fondateur à 99 €/an — 100 places seulement.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link to="/signup" className="btn-cta text-sm px-8 py-3.5 inline-flex items-center gap-2 justify-center">
                Créer mon compte apporteur <ArrowRight size={16} />
              </Link>
              <Link to="/pricing" className="text-sm font-medium px-6 py-3.5 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 justify-center">
                Voir les tarifs
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              Aucune avance de frais · Paiements sécurisés · Résiliable à tout moment
            </p>
          </motion.div>
        </div>
      </section>

      <LegalFooter />
    </div>
  );
}
