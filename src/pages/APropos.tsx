import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Brain, Users, ArrowRight, Target, Heart, Handshake,
  MapPin, Cpu, TrendingUp, Newspaper, Star, Clock, Euro,
  Zap, Quote
} from "lucide-react";
import PublicNav, { LegalFooter } from "@/components/layout/PublicNav";

/* ── Fade-in on scroll hook ─────────────────────────────────────────────── */
function useFadeIn(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ── Reusable animated section wrapper ─────────────────────────────────── */
function FadeSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useFadeIn();
  return (
    <section
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
    >
      {children}
    </section>
  );
}

export default function APropos() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      {/* ── SECTION 1 : HERO MANIFESTE ──────────────────────────────────── */}
      <section className="hero-bg pt-24 pb-20 md:pt-36 md:pb-28 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 10%, hsl(218 72% 30% / 0.4) 0%, transparent 65%)",
          }}
          aria-hidden="true"
        />
        <div className="container max-w-3xl text-center relative z-10">
          <span className="pill-tag mb-6 mx-auto w-fit inline-block">
            La première plateforme qui connecte entreprises et présentateurs
          </span>
          <h1 className="font-display font-bold leading-[1.08] tracking-tight mb-5">
            <span
              className="block text-[clamp(2rem,6vw,3.5rem)]"
              style={{
                background: "linear-gradient(135deg, hsl(24 100% 65%), hsl(38 100% 72%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Nous n'avons pas créé un outil.
            </span>
            <span className="block text-[clamp(1.6rem,4.5vw,2.6rem)] text-white/90 mt-3 font-semibold">
              Nous avons créé quelque chose de nouveau.
            </span>
          </h1>
          <p className="text-white/75 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            WiinupMax est née d'une conviction simple : les meilleures opportunités ne viennent pas de la publicité.{" "}
            <strong className="text-white/95 font-semibold">Elles viennent des gens.</strong>
          </p>
        </div>
      </section>

      {/* ── SECTION 2 : LE CONCEPT ──────────────────────────────────────── */}
      <FadeSection className="py-20 md:py-24 bg-muted">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <p className="pill-tag mb-4 mx-auto w-fit">Le concept</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-5">
              Une plateforme qui{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, hsl(218 72% 55%), hsl(262 72% 60%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                connecte tout le monde.
              </span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              WiinupMax réunit l'intelligence automatique et la chaleur des connexions humaines.{" "}
              <strong className="text-foreground font-semibold">Deux façons de trouver des clients. Une seule plateforme simple.</strong>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Carte IA */}
            <div
              className="rounded-2xl p-6 flex flex-col gap-4"
              style={{
                background: "linear-gradient(160deg, hsl(218 65% 9%), hsl(218 55% 13%))",
                border: "1px solid hsl(218 55% 22% / 0.6)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Brain size={18} className="text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Moteur 1</p>
                  <p className="font-display font-bold text-white text-base leading-tight">IA Agent</p>
                </div>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                <strong className="text-white">La recherche automatique.</strong>{" "}
                Un assistant cherche pour vous en continu, repère les personnes intéressées, prépare les messages et remonte les meilleures opportunités — sans que vous ayez à intervenir.
              </p>
              <ul className="space-y-1.5">
                {["Actif 24h/24 pour vous", "Détecte les personnes intéressées", "Prépare les messages à envoyer"].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-white/75">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Carte Réseau humain */}
            <div
              className="rounded-2xl p-6 flex flex-col gap-4"
              style={{
                background: "linear-gradient(160deg, hsl(24 60% 8%), hsl(38 50% 12%))",
                border: "1px solid hsl(24 55% 22% / 0.6)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--gradient-accent)" }}
                >
                  <Users size={18} className="text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(24 100% 62%)" }}>Moteur 2</p>
                  <p className="font-display font-bold text-white text-base leading-tight">Réseau Humain</p>
                </div>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                <strong className="text-white">Les présentations humaines.</strong>{" "}
                Des personnes de confiance recommandent votre offre à leurs contacts. Chaque présentation est enregistrée, vérifiée et prouvable.
              </p>
              <ul className="space-y-1.5">
                {["Présentations vérifiées et protégées", "Gains visibles en temps réel", "Validation en un seul clic"].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-white/75">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "hsl(24 100% 60%)" }} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </FadeSection>

      {/* ── SECTION 3 : LE FACILITATEUR ─────────────────────────────────── */}
      <FadeSection className="py-20 md:py-24 bg-background">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <p className="pill-tag mb-4 mx-auto w-fit">Innovation sociale</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-5">
              Nous avons créé{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, hsl(24 100% 58%), hsl(38 100% 65%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                le Facilitateur.
              </span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-4">
              N'importe qui peut, en travaillant{" "}
              <strong className="text-foreground">15 à 20 heures par mois</strong>, gagner entre{" "}
              <strong className="text-foreground">2 000 € et 5 000 € nets par mois</strong> en présentant simplement des gens qu'il connaît.
            </p>
            <p className="text-foreground font-semibold text-base">
              Il vous faut un téléphone, une connexion internet, et savoir lire. C'est tout.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Euro, value: "2 000 – 5 000 €", label: "Revenu mensuel net estimé", color: "hsl(38 95% 52%)" },
              { icon: Clock, value: "15 – 20h", label: "Par mois seulement", color: "hsl(218 72% 58%)" },
              { icon: Star, value: "18 ans", label: "Âge minimum. Rien d'autre.", color: "hsl(152 62% 45%)" },
            ].map(({ icon: Icon, value, label, color }) => (
              <div
                key={label}
                className="bg-card rounded-2xl p-6 text-center border"
                style={{ borderColor: color.replace(")", " / 0.2)") }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: color.replace(")", " / 0.1)"), border: `1px solid ${color.replace(")", " / 0.2)")}` }}
                >
                  <Icon size={18} style={{ color }} aria-hidden="true" />
                </div>
                <p className="font-display font-bold text-foreground text-xl mb-1">{value}</p>
                <p className="text-muted-foreground text-xs leading-snug">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Link
              to="/signup"
              className="btn-cta text-base px-8 py-4 gap-2"
            >
              Devenir Facilitateur — Gratuit
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </FadeSection>

      {/* ── SECTION 4 : IMPACT SOCIAL ───────────────────────────────────── */}
      <FadeSection className="py-20 md:py-24 bg-muted">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <p className="pill-tag mb-4 mx-auto w-fit">Mission sociale</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Une mission qui va au-delà des affaires.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              {
                icon: Users,
                color: "hsl(218 72% 55%)",
                title: "Aider les personnes sans emploi",
                desc: "Permettre à des milliers de personnes de gagner un revenu en valorisant leurs contacts — sans formation spéciale, sans investissement.",
              },
              {
                icon: Heart,
                color: "hsl(24 100% 55%)",
                title: "Les personnes fragilisées en premier",
                desc: "Retraités, personnes en transition, salariés à temps partiel : WiinupMax est pensé pour ceux que l'économie habituelle a laissés de côté.",
              },
              {
                icon: MapPin,
                color: "hsl(152 62% 42%)",
                title: "Faire vivre les territoires",
                desc: "Des connexions locales qui créent de la valeur locale. Pas un réseau centralisé — un tissu humain vivant.",
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div
                key={title}
                className="bg-card rounded-2xl p-6 border flex flex-col gap-3"
                style={{ borderColor: color.replace(")", " / 0.2)") }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: color.replace(")", " / 0.1)"), border: `1px solid ${color.replace(")", " / 0.2)")}` }}
                >
                  <Icon size={17} style={{ color }} aria-hidden="true" />
                </div>
                <p className="font-semibold text-foreground text-sm">{title}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Citation */}
          <div
            className="rounded-2xl px-8 py-6 text-center relative"
            style={{
              background: "linear-gradient(135deg, hsl(218 50% 8%), hsl(218 45% 12%))",
              border: "1px solid hsl(218 40% 28% / 0.5)",
            }}
          >
            <Quote size={20} className="mx-auto mb-3 opacity-40 text-white" aria-hidden="true" />
            <p className="text-white/90 text-base md:text-lg font-semibold italic max-w-xl mx-auto leading-relaxed">
              « Recréer un équilibre financier pour tous en mettant l'humain au cœur de l'économie. »
            </p>
          </div>
        </div>
      </FadeSection>

      {/* ── SECTION 5 : PHILOSOPHIE ─────────────────────────────────────── */}
      <FadeSection className="py-20 md:py-24 bg-background">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <p className="pill-tag mb-4 mx-auto w-fit">Nos valeurs</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Simple is Beautiful.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: Heart,
                color: "hsl(24 100% 55%)",
                title: "L'humain d'abord",
                desc: "La technologie ne remplace pas les relations. Elle les amplifie. Chaque fonctionnalité est pensée pour remettre l'humain au centre de la transaction.",
              },
              {
                icon: Target,
                color: "hsl(218 72% 55%)",
                title: "L'équité comme moteur",
                desc: "Même outil, mêmes règles, mêmes opportunités — qu'on soit dirigeant d'une PME ou retraité de 62 ans. L'accès ne se mérite pas, il se donne.",
              },
              {
                icon: Handshake,
                color: "hsl(152 62% 42%)",
                title: "La collaboration avant tout",
                desc: "On ne gagne pas seul. La plateforme est conçue pour que la réussite de l'un amplifie la réussite des autres. Pas de jeu à somme nulle.",
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div
                key={title}
                className="bg-card rounded-2xl p-6 border flex flex-col gap-3 hover:-translate-y-0.5 transition-all duration-200"
                style={{ borderColor: color.replace(")", " / 0.2)") }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: color.replace(")", " / 0.1)"), border: `1px solid ${color.replace(")", " / 0.2)")}` }}
                >
                  <Icon size={17} style={{ color }} aria-hidden="true" />
                </div>
                <p className="font-semibold text-foreground text-sm">{title}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── SECTION 6 : LES FONDATEURS ──────────────────────────────────── */}
      <FadeSection className="py-20 md:py-24 bg-muted">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <p className="pill-tag mb-4 mx-auto w-fit">Les fondateurs</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ceux qui ont tout mis en jeu.
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              WiinupMax n'est pas né dans une salle de réunion. Il est né d'une conviction personnelle
              et d'une{" "}
              <strong className="text-foreground font-semibold">expérience terrain combinée de 35 ans.</strong>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                photo: "/lovable-uploads/vivien-le-moal.jpg",
                name: "Vivien Le Moal",
                role: "Président & Co-fondateur",
                tags: ["Entrepreneur serial", "Community Builder", "20 ans terrain", "ex-Président CCI"],
                quote: "J'ai passé 20 ans à aider des entreprises à grandir. WiinupMax, c'est tout ce que j'aurais voulu avoir dès le premier jour.",
                color: "hsl(218 72% 55%)",
              },
              {
                photo: "/lovable-uploads/emilie-varnier.jpg",
                name: "Émilie Varnier",
                role: "CEO Associée & Co-fondatrice",
                tags: ["Architecte RH", "Thérapeute certifiée", "ex-DRH 500 personnes"],
                quote: "Les gens ont les compétences. Ce qui leur manque, c'est le système qui valorise ce qu'ils savent déjà faire.",
                color: "hsl(24 100% 55%)",
              },
            ].map(({ photo, name, role, tags, quote, color }) => (
              <div
                key={name}
                className="bg-card rounded-2xl overflow-hidden border flex flex-col"
                style={{ borderColor: color.replace(")", " / 0.2)") }}
              >
                {/* Photo */}
                <div className="h-56 overflow-hidden">
                  <img
                    src={photo}
                    alt={name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                {/* Content */}
                <div className="p-6 flex flex-col gap-4 flex-1">
                  <div>
                    <p className="font-display font-bold text-foreground text-lg">{name}</p>
                    <p className="text-muted-foreground text-sm">{role}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: color.replace(")", " / 0.1)"),
                          color,
                          border: `1px solid ${color.replace(")", " / 0.2)")}`,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div
                    className="rounded-xl px-4 py-3 flex-1"
                    style={{ background: color.replace(")", " / 0.06)") }}
                  >
                    <Quote size={14} style={{ color }} className="mb-2 opacity-60" aria-hidden="true" />
                    <p className="text-foreground/85 text-sm italic leading-relaxed">"{quote}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── SECTION 7 : LA MÊLÉE ────────────────────────────────────────── */}
      <FadeSection className="py-20 md:py-24 bg-background">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <p className="pill-tag mb-4 mx-auto w-fit">Communauté</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              La Mêlée by WiinupMax.
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              Du networking{" "}
              <strong className="text-foreground font-semibold">sans bullshit</strong>, en vrai,
              dans de vraies entreprises du territoire.
              Pas des conférences. Des séances de travail.
            </p>
          </div>

          <div
            className="rounded-2xl p-7 border"
            style={{
              background: "linear-gradient(135deg, hsl(262 55% 8%), hsl(218 55% 11%))",
              border: "1px solid hsl(262 55% 25% / 0.4)",
            }}
          >
            <div className="flex items-start gap-4 mb-5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "hsl(262 72% 55% / 0.15)", border: "1px solid hsl(262 72% 55% / 0.3)" }}
              >
                <Users size={20} style={{ color: "hsl(262 72% 65%)" }} aria-hidden="true" />
              </div>
              <div>
                <p className="font-display font-bold text-white text-base">Communauté Discord Privée</p>
                <p className="text-white/65 text-sm mt-1 leading-relaxed">
                  Sessions hebdomadaires avec <strong className="text-white/90">Vivien</strong> (business, stratégie, pipeline)
                  et <strong className="text-white/90">Émilie</strong> (développement personnel, mindset, organisation).
                  Un espace où les membres s'entraident, partagent des missions et créent des synergies réelles.
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: "Sessions live hebdo", sub: "Business & Perso" },
                { label: "Partage de missions", sub: "Entre membres" },
                { label: "Networking réel", sub: "Sur le terrain" },
              ].map(({ label, sub }) => (
                <div
                  key={label}
                  className="rounded-xl px-4 py-3 text-center"
                  style={{ background: "hsl(262 55% 14% / 0.6)", border: "1px solid hsl(262 55% 25% / 0.3)" }}
                >
                  <p className="text-white/90 text-sm font-semibold">{label}</p>
                  <p className="text-white/55 text-xs mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeSection>

      {/* ── SECTION 8 : ROADMAP 2026 ────────────────────────────────────── */}
      <FadeSection className="py-20 md:py-24 bg-muted">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <p className="pill-tag mb-4 mx-auto w-fit">Vision 2026</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Ce qui vient ensuite.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {[
              {
                icon: MapPin,
                color: "hsl(218 72% 55%)",
                title: "Réseau physique",
                desc: "Des hubs locaux dans chaque territoire. La Mêlée dans toute la France.",
              },
              {
                icon: Cpu,
                color: "hsl(262 72% 60%)",
                title: "Hub IA",
                desc: "Une suite IA complète pour PME : scoring, analyse de marché, recommandations stratégiques.",
              },
              {
                icon: TrendingUp,
                color: "hsl(38 95% 52%)",
                title: "Wiinup Invest",
                desc: "Un fonds d'investissement communautaire — les membres investissent dans les missions des autres.",
              },
              {
                icon: Newspaper,
                color: "hsl(152 62% 42%)",
                title: "Wiinup Media",
                desc: "Des contenus, des témoignages, des études de cas. La voix de ceux qui ont changé leur vie.",
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div
                key={title}
                className="bg-card rounded-2xl p-5 border flex gap-4 items-start hover:-translate-y-0.5 transition-all duration-200"
                style={{ borderColor: color.replace(")", " / 0.2)") }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: color.replace(")", " / 0.1)"), border: `1px solid ${color.replace(")", " / 0.2)")}` }}
                >
                  <Icon size={17} style={{ color }} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm mb-1">{title}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Partenaires */}
          <div
            className="rounded-2xl px-6 py-5 text-center border"
            style={{
              background: "hsl(var(--primary) / 0.04)",
              borderColor: "hsl(var(--primary) / 0.15)",
            }}
          >
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold mb-3">
              Partenaires institutionnels
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {["CCI", "MEDEF", "CPME", "Business Clubs"].map(p => (
                <span
                  key={p}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold bg-card border border-border text-muted-foreground"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </FadeSection>

      {/* ── SECTION 9 : CTA FINAL ───────────────────────────────────────── */}
      <section className="hero-bg py-24 md:py-32 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 70%, hsl(24 100% 40% / 0.12) 0%, transparent 65%)",
          }}
          aria-hidden="true"
        />
        <div className="container max-w-xl text-center relative z-10">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.15em] mb-5"
            style={{ color: "hsl(24 100% 62%)" }}
          >
            La décision est là
          </p>
          <h2 className="font-display text-[clamp(1.7rem,5vw,2.8rem)] font-bold text-white mb-4 leading-[1.1]">
            Vous avez lu jusqu'ici.{" "}
            <span
              style={{
                background: "linear-gradient(135deg, hsl(24 100% 62%), hsl(38 100% 70%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              C'est que quelque chose résonne.
            </span>
          </h2>
          <p className="text-white/70 text-base mb-10 max-w-sm mx-auto">
            Rejoignez le mouvement. En tant qu'entreprise ou en tant que facilitateur.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/pricing"
              className="btn-cta text-base px-8 py-4 gap-2 w-full sm:w-auto"
            >
              Démarrer maintenant — 99 €/an
              <ArrowRight size={17} />
            </Link>
            <Link
              to="/signup"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold border border-white/20 text-white/85 hover:text-white hover:border-white/35 transition-all duration-200 w-full sm:w-auto"
            >
              <Users size={15} />
              Devenir Facilitateur — Gratuit
            </Link>
          </div>
          <p className="mt-5 text-white/50 text-xs">
            Sans engagement · Annulation libre · Support inclus à chaque étape
          </p>
        </div>
      </section>

      <LegalFooter />
    </div>
  );
}
