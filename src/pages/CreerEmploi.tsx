/**
 * /creer-emploi — Mega tunnel de vente Facilitateur
 * Design system 100 % tokens existants — Sora/Inter — Framer Motion
 * Mobile-first — Lazy + Realtime quota
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, CheckCircle2, Star, Users, TrendingUp, Shield,
  Briefcase, HandshakeIcon, Globe, Building2, HeartHandshake,
  GraduationCap, Award, ChevronDown, Zap,
} from "lucide-react";
import PublicNav, { LegalFooter } from "@/components/layout/PublicNav";
import LaunchQuotaBanner from "@/components/landing/LaunchQuotaBanner";
import vivienPhoto from "@/assets/vivien-le-moal.jpg";

/* ─── Motion helpers ──────────────────────────────────────────────────── */
const BOUNCE = { type: "spring" as const, stiffness: 280, damping: 22 };
const EASE   = { ease: [0.22, 1, 0.36, 1] as const, duration: 0.65 };
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { ...EASE, delay } },
});

/* ─── Audiences ───────────────────────────────────────────────────────── */
const AUDIENCES = [
  {
    id: "rsa",
    icon: HeartHandshake,
    label: "RSA / Chômeurs",
    headline: "Rebondissez avec dignité",
    body: `Vous êtes entre deux emplois ou en recherche active ? WiinupMax vous donne la possibilité de générer un revenu complémentaire immédiat, sans investissement, sans formation complexe. Votre réseau — vos anciens collègues, voisins, relations — vaut de l'argent. Nous vous aidons à le valoriser légalement, simplement, sans rien bousculer dans votre quotidien. Chaque introduction que vous réalisez peut vous rapporter entre 300 € et 2 000 €, versés automatiquement dès que l'affaire est signée.`,
    cta: "Commencer gratuitement →",
    pills: ["Accès 100 % gratuit", "Sans formation requise", "Revenu dès la 1ʳᵉ introduction"],
  },
  {
    id: "salaries",
    icon: Briefcase,
    label: "Salariés",
    headline: "Un complément serein sans quitter votre poste",
    body: `Vous êtes salarié et vous avez un réseau professionnel solide ? Transformez ce capital relationnel en revenus complémentaires, sans risque, sans conflit d'intérêts, en toute transparence. Quelques introductions par mois — 8 heures maximum — peuvent générer entre 500 € et 3 000 € de gains annuels supplémentaires. Aucun déplacement obligatoire. Aucune pression commerciale. Vous choisissez les missions qui correspondent à votre réseau existant.`,
    cta: "Créer mon profil →",
    pills: ["Compatible avec votre emploi", "8h/semaine max", "Zéro pression commerciale"],
  },
  {
    id: "entrepreneurs",
    icon: TrendingUp,
    label: "Entrepreneurs",
    headline: "Votre réseau est votre ROI le plus puissant",
    body: `En tant qu'entrepreneur ou consultant, votre carnet d'adresses est votre actif le plus précieux. WiinupMax vous permet de le monétiser directement : présentez vos contacts aux entreprises qui en ont besoin et percevez votre commission automatiquement. Pas de relances, pas de paperasse. Le cadre légal et les paiements sont entièrement gérés pour vous. C'est la façon la plus rapide d'ajouter une ligne de revenus passifs à votre activité existante.`,
    cta: "Activer mon Founder Pass →",
    pills: ["ROI immédiat sur votre réseau", "Paiements automatiques", "Cadre légal géré"],
  },
  {
    id: "collectivites",
    icon: Building2,
    label: "Collectivités / Mairies",
    headline: "Dynamisez l'économie locale avec votre territoire",
    body: `Mairies, Régions, Départements : WiinupMax est un levier d'activation économique de proximité. En déployant notre programme sur votre territoire, vous créez de l'emploi local, renforcez les liens entre entreprises et talents, et générez une dynamique de réseau durable. Nos outils permettent un suivi en temps réel des introductions, des missions et des gains créés sur votre zone. Un tableau de bord transparent pour vos élus et vos services économiques.`,
    cta: "Nous contacter →",
    pills: ["Déploiement territorial", "Tableau de bord collectivité", "Impact mesurable"],
  },
  {
    id: "pole-emploi",
    icon: GraduationCap,
    label: "Pôle Emploi / Département",
    headline: "L'insertion par le réseau, enfin opérationnelle",
    body: `WiinupMax est un outil d'insertion professionnelle nouvelle génération : il permet à vos bénéficiaires de retrouver une activité rémunérée immédiatement, sans attendre un CDI, en mobilisant leurs réseaux personnels et professionnels. Nos rapports d'impact permettent un suivi précis pour vos équipes. Nous proposons des conventions adaptées aux opérateurs publics, avec une intégration simple dans vos dispositifs d'accompagnement existants.`,
    cta: "Demander une démo →",
    pills: ["Pour les opérateurs publics", "Rapports d'impact", "Convention disponible"],
  },
  {
    id: "etat",
    icon: Shield,
    label: "État / Gouvernement",
    headline: "Une solution française pour le plein-emploi",
    body: `Face aux défis de l'emploi, WiinupMax propose une réponse innovante, ancrée dans l'économie réelle : activer les réseaux humains pour créer de l'emploi par les affaires. Notre plateforme est 100 % française, conforme RGPD, et peut s'inscrire dans les programmes nationaux d'activation de la société civile. Nous estimons que 500 000 Français pourraient générer un revenu complémentaire via notre modèle d'ici 2028, sans aucune subvention publique.`,
    cta: "En savoir plus →",
    pills: ["Plateforme 100 % française", "RGPD / conforme", "Impact sociétal mesurable"],
  },
  {
    id: "drh-rse",
    icon: Globe,
    label: "DRH / RSE Grandes Entreprises",
    headline: "Outplacement digne, résultats concrets",
    body: `Pour les DRH et les équipes RSE, WiinupMax offre une alternative humaine aux plans de licenciement classiques : proposez à vos collaborateurs en transition une activité génératrice de revenus immédiats, en s'appuyant sur leur réseau professionnel existant. Résultats mesurables, impact RH positif, coût maîtrisé. Nous proposons des accords cadres pour les grands groupes avec un onboarding de masse simplifié et un reporting RSE clé en main.`,
    cta: "Parler à un expert →",
    pills: ["Outplacement humain", "Accord cadre entreprise", "Reporting RSE inclus"],
  },
];

/* ─── Étapes ──────────────────────────────────────────────────────────── */
const ETAPES = [
  {
    num: "01",
    icon: Users,
    title: "Créez votre profil apporteur",
    desc: "Renseignez votre secteur, votre zone et vos types de contacts. Cela prend moins de 5 minutes.",
  },
  {
    num: "02",
    icon: Briefcase,
    title: "Choisissez une mission",
    desc: "Parcourez les entreprises qui cherchent exactement le type de contact que vous pouvez apporter.",
  },
  {
    num: "03",
    icon: HandshakeIcon,
    title: "Faites une introduction",
    desc: "Présentez simplement le bon contact à la bonne entreprise. Un message suffit.",
  },
  {
    num: "04",
    icon: TrendingUp,
    title: "Recevez votre gain automatiquement",
    desc: "Dès que l'affaire est conclue, votre commission est calculée et versée. Sans relances.",
  },
];

/* ─── Témoignages ─────────────────────────────────────────────────────── */
const TEMOIGNAGES = [
  {
    name: "Thomas R.",
    role: "Consultant indépendant, Lyon",
    gain: "4 200 €",
    quote: "En 6 mois, j'ai généré 4 200 € simplement en présentant deux contacts que je connaissais depuis des années. Je n'aurais jamais imaginé que mon carnet d'adresses valait autant.",
    stars: 5,
  },
  {
    name: "Sophie M.",
    role: "Ex-Directrice commerciale, Paris",
    gain: "2 800 €",
    quote: "Après une transition de carrière, WiinupMax m'a permis de maintenir un revenu pendant que je construisais mon nouveau projet. Simple, honnête, efficace.",
    stars: 5,
  },
  {
    name: "Karim B.",
    role: "Chef de projet, Bordeaux",
    gain: "1 900 €",
    quote: "La plateforme est claire, les paiements arrivent sans accroc. Je recommande à tous ceux qui ont un bon réseau et envie de le valoriser.",
    stars: 5,
  },
];

/* ─── Stats ───────────────────────────────────────────────────────────── */
const STATS = [
  { value: "850 €", label: "Gain moyen par introduction" },
  { value: "< 8h", label: "Effort hebdomadaire" },
  { value: "100 %", label: "Légal & tracé" },
  { value: "0 €", label: "Avance de frais" },
];

/* ─── Component ───────────────────────────────────────────────────────── */
export default function CreerEmploiPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const audience = AUDIENCES[activeTab];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />

      {/* ══════════════════════════════════════════════════════════════════
          HERO FULL-SCREEN — dark navy, parallax glow, photo Vivien
      ══════════════════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-screen flex flex-col overflow-hidden"
        style={{ background: "linear-gradient(155deg, hsl(218 72% 4%) 0%, hsl(218 72% 9%) 50%, hsl(218 65% 13%) 100%)" }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(hsl(var(--primary-glow)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-glow)) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
          aria-hidden="true"
        />
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 55% 40%, hsl(218 72% 22% / 0.55) 0%, transparent 65%)" }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 inset-x-0 h-48 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, hsl(218 72% 4% / 0.9))" }}
          aria-hidden="true"
        />

        <div className="container relative z-10 flex-1 flex items-center pt-24 pb-16 md:pt-28 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 w-full items-center">

            {/* LEFT — copy */}
            <div className="flex flex-col">
              <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={EASE} className="mb-6">
                <LaunchQuotaBanner variant="hero" />
              </motion.div>

              <motion.p
                className="text-xs font-bold uppercase tracking-[0.18em] mb-3"
                style={{ color: "hsl(var(--accent))" }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...EASE, delay: 0.05 }}
              >
                Apporteur d'affaires — Devenez Facilitateur
              </motion.p>

              <motion.h1
                className="font-display font-bold text-white leading-[1.1] tracking-tight mb-6"
                style={{ fontSize: "clamp(1.6rem, 3.8vw, 3rem)" }}
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...EASE, delay: 0.08 }}
              >
                Créez votre propre emploi ou un{" "}
                <span style={{
                  background: "linear-gradient(135deg, hsl(var(--accent)), hsl(38 100% 70%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  complément de revenus
                </span>{" "}
                en toute sécurité, sans rien sortir de votre poche, sans charge mentale ni bousculer vos habitudes en travaillant moins de 8H par semaine
              </motion.h1>

              <motion.p
                className="font-semibold leading-relaxed mb-8"
                style={{
                  fontSize: "clamp(0.9rem, 1.6vw, 1.1rem)",
                  color: "hsl(0 0% 100% / 0.7)",
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...EASE, delay: 0.18 }}
              >
                Accès Facilitateur 100 % gratuit. Vous ne payez que si ça marche.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-3 mb-8"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...EASE, delay: 0.3 }}
              >
                <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={BOUNCE}>
                  <Link to="/checkout" className="btn-cta flex flex-col items-center justify-center gap-1 px-8 py-5 text-base leading-tight">
                    <span className="flex items-center gap-2 font-bold">
                      <Zap size={16} />
                      Activer Founder Pass — 99 € TTC/an
                      <ArrowRight size={16} />
                    </span>
                    <span className="text-[11px] font-semibold opacity-80 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-white/70 inline-block" />
                      Places limitées — 100 places max
                    </span>
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                className="flex flex-wrap gap-3"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...EASE, delay: 0.44 }}
              >
                {["Zéro avance de frais", "Paiement automatique", "100 % légal", "Accès gratuit"].map((pill, i) => (
                  <motion.span
                    key={pill}
                    initial={{ opacity: 0, scale: 0.85, x: -8 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ ...BOUNCE, delay: 0.48 + i * 0.07 }}
                    className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold"
                    style={{
                      background: "hsl(218 55% 18% / 0.55)",
                      border: "1px solid hsl(218 55% 33% / 0.3)",
                      color: "hsl(var(--primary-glow))",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {pill}
                  </motion.span>
                ))}
              </motion.div>
            </div>

            {/* RIGHT — photo Vivien */}
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
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, hsl(218 72% 6% / 0.75) 0%, transparent 55%)" }} />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="font-display font-bold text-white text-lg leading-tight">Vivien Le Moal</p>
                  <p className="text-white/70 text-sm mt-0.5">Président & Fondateur — WiinupMax</p>
                </div>
              </div>

              {/* Floating stat */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ ...BOUNCE, delay: 0.8 }}
                className="absolute -bottom-5 -left-6 rounded-2xl px-5 py-4"
                style={{
                  background: "hsl(218 55% 13% / 0.92)",
                  border: "1px solid hsl(var(--accent) / 0.3)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 12px 40px hsl(218 72% 5% / 0.6)",
                }}
              >
                <p className="text-[11px] font-medium text-white/50 mb-0.5">Gain moyen / introduction</p>
                <p className="font-display font-bold text-3xl leading-none" style={{ color: "hsl(var(--accent))" }}>850 €</p>
                <p className="text-[10px] text-white/40 mt-0.5">versé automatiquement</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ ...BOUNCE, delay: 0.95 }}
                className="absolute -top-4 -right-4 rounded-2xl px-4 py-3"
                style={{
                  background: "hsl(218 55% 13% / 0.92)",
                  border: "1px solid hsl(152 62% 34% / 0.35)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <p className="text-[10px] font-medium text-white/50 mb-0.5">Places restantes</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(152 62% 45%)" }} />
                  <p className="font-display font-bold text-xl text-white leading-none">Live</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 cursor-pointer"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          style={{ color: "hsl(0 0% 100% / 0.28)" }}
          onClick={() => window.scrollBy({ top: window.innerHeight, behavior: "smooth" })}
          whileHover={{ color: "hsl(0 0% 100% / 0.55)" }}
        >
          <span className="text-[9px] font-semibold tracking-[0.2em] uppercase">Scroll</span>
          <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown size={17} />
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          STATS ANIMÉES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-12 border-y border-border" style={{ background: "hsl(var(--muted) / 0.4)" }}>
        <div className="container max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp(i * 0.1)}
                className="text-center"
              >
                <p className="font-display font-bold mb-1" style={{
                  fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                  background: "linear-gradient(135deg, hsl(var(--accent)), hsl(38 100% 70%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          POUR QUI ? — 7 ONGLETS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24">
        <div className="container max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp()}
            className="text-center mb-12"
          >
            <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-3">
              Pour qui est WiinupMax ?
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              Notre programme s'adapte à chaque profil. Choisissez le vôtre.
            </p>
          </motion.div>

          {/* Tabs — scrollable mobile */}
          <div className="overflow-x-auto pb-2 mb-8 scrollbar-none">
            <div className="flex gap-2 min-w-max md:flex-wrap md:justify-center">
              {AUDIENCES.map((aud, i) => {
                const Icon = aud.icon;
                const isActive = activeTab === i;
                return (
                  <motion.button
                    key={aud.id}
                    onClick={() => setActiveTab(i)}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all shrink-0"
                    style={{
                      background: isActive ? "hsl(var(--primary))" : "hsl(var(--card))",
                      color: isActive ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                      borderColor: isActive ? "hsl(var(--primary))" : "hsl(var(--border))",
                      boxShadow: isActive ? "var(--shadow-primary)" : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Icon size={14} className="shrink-0" />
                    {aud.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-border p-6 md:p-8"
              style={{ background: "hsl(var(--card))" }}
            >
              <div className="grid md:grid-cols-[1fr_auto] gap-8 items-start">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "hsl(var(--primary) / 0.1)" }}>
                      <audience.icon size={20} style={{ color: "hsl(var(--primary))" }} />
                    </div>
                    <h3 className="font-display text-xl md:text-2xl font-bold text-foreground">
                      {audience.headline}
                    </h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base mb-5">
                    {audience.body}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {audience.pills.map(pill => (
                      <span key={pill} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border"
                        style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}>
                        <CheckCircle2 size={11} />
                        {pill}
                      </span>
                    ))}
                  </div>
                  <Link
                    to="/signup"
                    className="btn-cta text-sm px-6 py-3 inline-flex items-center gap-2"
                  >
                    {audience.cta} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          COMMENT ÇA MARCHE — 4 ÉTAPES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24" style={{ background: "hsl(var(--muted) / 0.35)" }}>
        <div className="container max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp()}
            className="text-center mb-12"
          >
            <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-3">
              Comment ça marche ?
            </h2>
            <p className="text-muted-foreground">Quatre étapes. Pas une de plus.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            {ETAPES.map((etape, i) => {
              const Icon = etape.icon;
              return (
                <motion.div
                  key={etape.num}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp(i * 0.12)}
                  className="flex gap-5 rounded-2xl border border-border p-5 md:p-6"
                  style={{ background: "hsl(var(--card))" }}
                >
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <span className="font-display text-3xl font-bold leading-none w-10 text-center"
                      style={{ color: "hsl(var(--accent) / 0.45)" }}>
                      {etape.num}
                    </span>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "hsl(var(--primary) / 0.08)" }}>
                      <Icon size={17} style={{ color: "hsl(var(--primary))" }} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm md:text-base text-foreground mb-1.5">{etape.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{etape.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TÉMOIGNAGES + IMPACT
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24">
        <div className="container max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp()}
            className="text-center mb-12"
          >
            <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-3">
              Ils ont commencé comme vous
            </h2>
            <p className="text-muted-foreground">Des profils ordinaires, des résultats réels.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {TEMOIGNAGES.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp(i * 0.1)}
                whileHover={{ y: -4 }}
                transition={BOUNCE}
                className="rounded-2xl border border-border p-5 space-y-4 flex flex-col"
                style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-sm)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} size={13} fill="hsl(var(--accent))" style={{ color: "hsl(var(--accent))" }} />
                    ))}
                  </div>
                  <span className="font-display font-bold text-sm px-2.5 py-1 rounded-lg"
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

      {/* ══════════════════════════════════════════════════════════════════
          FAQ LÉGÈRE
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20" style={{ background: "hsl(var(--muted) / 0.35)" }}>
        <div className="container max-w-3xl mx-auto px-6">
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp()}
            className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10"
          >
            Questions fréquentes
          </motion.h2>
          <div className="space-y-3">
            {[
              { q: "Est-ce vraiment gratuit pour les facilitateurs ?", a: "Oui. L'inscription et l'accès à la plateforme sont 100 % gratuits pour les apporteurs d'affaires (facilitateurs). Vous n'avancez rien. Vous êtes rémunéré uniquement quand une affaire aboutit." },
              { q: "C'est légal d'être apporteur d'affaires en France ?", a: "Absolument. L'apport d'affaires est un cadre juridique reconnu en France. WiinupMax gère les contrats, la traçabilité et la conformité pour vous. Aucun statut particulier n'est obligatoire pour commencer." },
              { q: "Combien de temps faut-il consacrer par semaine ?", a: "Moins de 8 heures par semaine suffisent pour obtenir des résultats. La plupart de nos facilitateurs réalisent 1 à 3 introductions par mois, ce qui représente quelques heures d'effort maximum." },
              { q: "Quand est-ce que je reçois mon argent ?", a: "Le versement est automatique dès que l'entreprise confirme la réalisation de l'affaire. Il n'y a aucune relance à faire de votre côté. Les délais moyens de paiement sont de 15 à 30 jours après confirmation." },
              { q: "Faut-il déjà avoir un grand réseau ?", a: "Non. Même un réseau modeste de quelques dizaines de contacts professionnels peut suffire. L'important est la qualité et la pertinence de vos relations, pas leur nombre." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp(i * 0.06)}
                className="rounded-xl border border-border overflow-hidden"
                style={{ background: "hsl(var(--card))" }}
              >
                <button
                  className="flex items-center justify-between w-full px-5 py-4 text-left"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                >
                  <span className="font-semibold text-sm text-foreground pr-4">{item.q}</span>
                  <motion.div
                    animate={{ rotate: faqOpen === i ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="shrink-0"
                  >
                    <ChevronDown size={16} className="text-muted-foreground" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {faqOpen === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          MEGA CTA FINAL
      ══════════════════════════════════════════════════════════════════ */}
      <section
        className="py-20 md:py-32 relative overflow-hidden"
        style={{ background: "linear-gradient(155deg, hsl(218 72% 4%) 0%, hsl(218 72% 9%) 50%, hsl(218 65% 13%) 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 55% at 50% 50%, hsl(24 100% 52% / 0.07) 0%, transparent 65%)" }}
          aria-hidden="true" />

        <div className="container max-w-3xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp()}
            className="space-y-6"
          >
            {/* Live quota */}
            <div className="flex justify-center mb-2">
              <LaunchQuotaBanner variant="pricing" />
            </div>

            <div className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full border"
              style={{
                background: "hsl(var(--accent) / 0.12)",
                borderColor: "hsl(var(--accent) / 0.35)",
                color: "hsl(var(--accent))",
              }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(var(--accent))" }} />
              Places limitées — Offre Fondateur
            </div>

            <h2 className="font-display text-3xl md:text-5xl font-bold text-white leading-tight">
              Obtenez vos premiers clients B2B{" "}
              <span style={{
                background: "linear-gradient(135deg, hsl(var(--accent)), hsl(38 100% 70%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                dès cette semaine
              </span>
            </h2>

            <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
              Founder Pass à 99 €/an — prix garanti à vie. Vos contacts vous envoient des introductions qualifiées. Vous ne payez que si ça marche. 100 places seulement.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <motion.div whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }} transition={BOUNCE}>
                <Link to="/checkout" className="btn-cta text-base px-10 py-5 inline-flex flex-col items-center gap-1">
                  <span className="flex items-center gap-2 font-bold">
                    <Award size={18} />
                    Activer Founder Pass — 99 € TTC/an
                    <ArrowRight size={18} />
                  </span>
                  <span className="text-[12px] font-semibold opacity-85 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-white/70 inline-block" />
                    Places limitées — 100 places max
                  </span>
                </Link>
              </motion.div>
            </div>

            <div className="flex flex-wrap justify-center gap-5 pt-4">
              {["Aucune avance de frais", "Résiliable à tout moment", "Paiements sécurisés Stripe", "100 % légal France"].map(item => (
                <span key={item} className="flex items-center gap-1.5 text-xs text-white/50">
                  <CheckCircle2 size={12} style={{ color: "hsl(152 62% 45%)" }} />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <LegalFooter />

      {/* ── Sticky CTA Mobile ────────────────────────────────────────────── */}
      <div
        className="md:hidden fixed bottom-0 inset-x-0 z-50 px-4 pb-4 pt-2"
        style={{ background: "linear-gradient(to top, hsl(218 72% 5%) 60%, transparent)" }}
      >
        <Link
          to="/checkout"
          className="btn-cta w-full flex flex-col items-center justify-center gap-0.5 py-4 text-sm font-bold rounded-2xl"
        >
          <span className="flex items-center gap-2">
            <Zap size={15} />
            Activer Founder Pass — 99 € TTC/an
            <ArrowRight size={15} />
          </span>
          <span className="text-[11px] font-semibold opacity-80 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-white/70 inline-block" />
            Places limitées — 100 places max
          </span>
        </Link>
      </div>
    </div>
  );
}
