import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Zap, Users, TrendingDown, Heart, Globe, User, Scale,
  Handshake, MapPin, Brain, TrendingUp, Video,
  ArrowRight, CheckCircle2, MessageCircle, MapPinned
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import PublicNav, { LegalFooter } from "@/components/layout/PublicNav";
import PageTitle from "@/components/ui/PageTitle";

/* ── Fade-in on scroll ────────────────────────────────────────────────────── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("animate-fade-in");
          el.style.opacity = "1";
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    el.style.opacity = "0";
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ── Founder Card ─────────────────────────────────────────────────────────── */
function FounderCard({
  photoSrc, name, role, tagline, description, tags, quote, badgeLabel,
}: {
  photoSrc: string; name: string; role: string; tagline: string;
  description: string; tags: string[]; quote: string; badgeLabel: string;
}) {
  const ref = useFadeIn();
  return (
    <div
      ref={ref}
      className="card-premium overflow-hidden"
      style={{
        boxShadow: "var(--shadow-lg)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
    >
      {/* Photo */}
      <div className="relative h-72 overflow-hidden" style={{ background: "linear-gradient(160deg, hsl(218 75% 12%), hsl(218 60% 22%))" }}>
        <img
          src={photoSrc}
          alt={name}
          className="w-full h-full object-cover object-top"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, hsl(218 72% 9% / 0.85) 0%, transparent 50%)" }}
        />
        <div className="absolute bottom-4 left-5">
          <span
            className="pill-tag text-xs font-bold"
            style={{ background: "hsl(var(--accent) / 0.18)", color: "hsl(var(--accent))", border: "1px solid hsl(var(--accent) / 0.3)" }}
          >
            {badgeLabel}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-7">
        <h3 className="font-display text-2xl font-bold text-foreground mb-1">{name}</h3>
        <p className="text-sm font-medium mb-4" style={{ color: "hsl(var(--electric))" }}>{tagline}</p>
        <p className="text-muted-foreground text-sm leading-relaxed mb-5">{description}</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {tags.map(tag => (
            <span key={tag} className="pill-tag text-xs">{tag}</span>
          ))}
        </div>
        <blockquote
          className="text-sm italic leading-relaxed pl-4"
          style={{ borderLeft: "2px solid hsl(var(--accent) / 0.5)", color: "hsl(var(--foreground) / 0.7)" }}
        >
          {quote}
        </blockquote>
      </div>
    </div>
  );
}

/* ── Stat Line ─────────────────────────────────────────────────────────────── */
function StatLine({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm" style={{ color: "hsl(218 30% 65%)" }}>{label}</span>
      <span className="font-display font-bold text-2xl" style={{ color }}>{value}</span>
    </div>
  );
}

/* ── Philosophy Card ──────────────────────────────────────────────────────── */
function PhiloCard({ icon: Icon, title, text }: { icon: typeof User; title: string; text: string }) {
  return (
    <div className="card-premium p-7 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: "hsl(var(--primary) / 0.12)" }}
      >
        <Icon size={24} style={{ color: "hsl(var(--primary))" }} />
      </div>
      <h4 className="font-display text-base font-bold text-foreground mb-3">{title}</h4>
      <p className="text-muted-foreground text-sm text-center leading-relaxed">{text}</p>
    </div>
  );
}

/* ── Impact Bloc ──────────────────────────────────────────────────────────── */
function ImpactBloc({
  icon: Icon, iconBg, iconColor, title, text,
}: { icon: typeof Globe; iconBg: string; iconColor: string; title: string; text: string }) {
  return (
    <div className="bento-card p-7">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
        style={{ background: iconBg }}
      >
        <Icon size={22} style={{ color: iconColor }} />
      </div>
      <h4 className="font-display text-lg font-bold text-foreground mb-3">{title}</h4>
      <p className="text-muted-foreground text-sm leading-relaxed">{text}</p>
    </div>
  );
}

/* ── Roadmap Bloc ─────────────────────────────────────────────────────────── */
function RoadmapBloc({ num, icon: Icon, title, text }: { num: string; icon: typeof MapPin; title: string; text: string }) {
  return (
    <div className="bento-card p-7">
      <span
        className="font-display font-bold text-4xl leading-none mb-4 block"
        style={{ color: "hsl(var(--primary) / 0.18)" }}
      >
        {num}
      </span>
      <Icon size={22} className="mb-3" style={{ color: "hsl(var(--accent))" }} />
      <h4 className="font-display text-lg font-bold text-foreground mb-2">{title}</h4>
      <p className="text-muted-foreground text-sm leading-relaxed">{text}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function APropos() {
  useEffect(() => {
    trackEvent("apropos_view", null, { source: "nav" });
  }, []);

  const s1 = useFadeIn();
  const s2 = useFadeIn();
  const s3 = useFadeIn();
  const s4 = useFadeIn();
  const s5 = useFadeIn();
  const s6 = useFadeIn();
  const s7 = useFadeIn();
  const s8 = useFadeIn();
  const s9 = useFadeIn();

  return (
    <div className="min-h-screen bg-background">
      <PageTitle title="À propos" />
      <PublicNav />

      {/* ═══ SECTION 1 — HERO MANIFESTE ════════════════════════════════════ */}
      <section className="hero-bg pt-20 pb-16 md:pt-32 md:pb-24 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 50% 10%, hsl(218 72% 32% / 0.35) 0%, transparent 65%)",
          }}
          aria-hidden="true"
        />
        <div ref={s1} className="container max-w-3xl relative z-10 text-center">
          <div className="flex justify-center mb-7">
            <span
              className="pill-tag text-xs font-bold uppercase tracking-wider"
              style={{ color: "hsl(var(--accent))" }}
            >
              🌍 La première marketplace phygitale d'acquisition client
            </span>
          </div>

          <h1 className="font-display font-bold text-white leading-[1.08] tracking-tight mb-6">
            <span
              className="block text-[clamp(2.1rem,6vw,3.5rem)]"
              style={{
                background: "linear-gradient(135deg, hsl(24 100% 68%), hsl(38 100% 74%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Nous n'avons pas créé une plateforme.
            </span>
            <span className="block text-[clamp(1.55rem,4.5vw,2.6rem)] text-white/85 mt-3 font-semibold">
              Nous avons créé un mouvement.
            </span>
          </h1>

          <p className="text-[clamp(0.95rem,2.2vw,1.1rem)] text-white/52 max-w-lg mx-auto leading-[1.75] font-light text-center">
            WiinupMax est née d'une conviction simple : dans un monde ultra-connecté, les meilleures opportunités business ne passent pas par la pub.{" "}
            <span className="text-white/80 font-medium">Elles passent par les gens.</span>
          </p>
        </div>
        <div className="glow-line mt-16 md:mt-20" aria-hidden="true" />
      </section>

      <div className="section-divider" />

      {/* ═══ SECTION 2 — LE CONCEPT ════════════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div ref={s2} className="container max-w-2xl text-center mb-0">
          <span className="pill-tag text-xs font-bold uppercase tracking-wider mb-4 inline-block">
            Ce que nous avons inventé
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-5 leading-tight">
            Le concept
          </h2>
          <p className="text-muted-foreground leading-relaxed text-base">
            WiinupMax est une place de marché <span className="text-highlight">« phygitale »</span> — un concept unique au monde qui fusionne la puissance de l'intelligence artificielle avec la chaleur des connexions humaines. Deux moteurs. Une seule mission : vous faire grandir.
          </p>
        </div>

        {/* Deux moteurs */}
        <div className="container max-w-4xl grid md:grid-cols-2 gap-6 mt-12">
          {/* IA Agent */}
          <div className="bento-card p-7 flex flex-col justify-between">
            <div>
              <span
                className="pill-tag text-xs font-bold uppercase tracking-wider mb-4 inline-block"
                style={{ color: "hsl(var(--accent))", background: "hsl(var(--accent) / 0.1)", border: "1px solid hsl(var(--accent) / 0.25)" }}
              >
                IA AGENT
              </span>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                La Prospection Automatisée
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Des agents IA performants qui travaillent pour vous 24h/24. Scoring de leads, messages personnalisés, séquences automatiques. Vous vous concentrez sur la relation. L'IA s'occupe du reste.
              </p>
            </div>
            <div className="flex justify-end mt-5">
              <Zap size={32} style={{ color: "hsl(var(--accent))" }} />
            </div>
          </div>

          {/* Réseau humain */}
          <div className="bento-card p-7 flex flex-col justify-between">
            <div>
              <span
                className="pill-tag text-xs font-bold uppercase tracking-wider mb-4 inline-block"
                style={{ color: "hsl(var(--electric))", background: "hsl(var(--electric) / 0.1)", border: "1px solid hsl(var(--electric) / 0.25)" }}
              >
                RÉSEAU HUMAIN
              </span>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                L'Apport d'Affaires Industrialisé
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Un réseau de Facilitateurs qualifiés qui recommandent votre entreprise dans leur cercle. Des introductions qualifiées, tracées, rémunérées. Le bouche-à-oreille, à l'échelle.
              </p>
            </div>
            <div className="flex justify-end mt-5">
              <Users size={32} style={{ color: "hsl(var(--electric))" }} />
            </div>
          </div>
        </div>

        {/* Offre fondateur */}
        <div className="container max-w-lg mt-10">
          <div
            className="card-premium p-7 text-center border-2"
            style={{
              borderColor: "hsl(24 100% 52% / 0.5)",
              boxShadow: "var(--shadow-accent)",
            }}
          >
            <span
              className="pill-tag text-xs font-bold mb-5 inline-block"
              style={{ color: "hsl(24 100% 62%)", background: "hsl(24 100% 52% / 0.12)", border: "1px solid hsl(24 100% 52% / 0.3)" }}
            >
              🎯 Offre Fondateur — 100 premières entreprises
            </span>
            <div className="mb-2">
              <span className="text-muted-foreground text-sm line-through">990 € TTC / an</span>
            </div>
            <p
              className="font-display font-bold text-5xl mb-6"
              style={{ color: "hsl(24 100% 62%)" }}
            >
              99 € <span className="text-xl font-semibold text-muted-foreground">TTC / an</span>
            </p>
            <ul className="text-sm text-left space-y-2 mb-7 max-w-xs mx-auto">
              {["Introductions illimitées", "ROI Dashboard complet", "Accès La Mêlée", "Support prioritaire"].map(f => (
                <li key={f} className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} style={{ color: "hsl(152 62% 48%)", flexShrink: 0 }} />
                  <span className="text-foreground/80">{f}</span>
                </li>
              ))}
            </ul>
            <Link to="/pricing" className="btn-cta text-sm px-6 py-3 gap-2 inline-flex items-center">
              Rejoindre les 100 fondateurs
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══ SECTION 3 — LE FACILITATEUR ══════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div ref={s3} className="container max-w-5xl grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Texte */}
          <div>
            <span
              className="pill-tag text-xs font-bold uppercase tracking-wider mb-5 inline-block"
              style={{ color: "hsl(var(--accent))" }}
            >
              ✨ Nouveau métier
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              Nous avons inventé le Facilitateur.
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Toute personne de 18 ans et plus peut, en travaillant 15 à 20 heures par mois, générer entre{" "}
              <span className="text-foreground font-semibold">2 000 € et 5 000 € nets par mois</span>{" "}
              en tant qu'auto-entrepreneur — simplement en valorisant ce qu'elle fait déjà naturellement : recommander.
            </p>
            <p className="text-foreground font-semibold mb-5">
              Il vous faut un téléphone, une connexion internet, et savoir lire. C'est tout.
            </p>

            {/* Warning box */}
            <div
              className="rounded-xl p-4 mb-6 text-sm leading-relaxed"
              style={{
                background: "hsl(38 95% 52% / 0.08)",
                border: "1px solid hsl(38 95% 52% / 0.3)",
                color: "hsl(38 95% 70%)",
              }}
            >
              <span className="font-bold">⚠️ CE N'EST PAS DU MLM.</span>{" "}
              <span style={{ color: "hsl(38 95% 62%)" }}>
                Aucun recrutement. Aucune hiérarchie. Aucun produit à vendre. Juste des recommandations business entre professionnels, exactement comme autour d'un café — sauf que vous êtes rémunéré.
              </span>
            </div>

            <Link to="/signup" className="btn-cta text-sm px-7 py-3.5 gap-2 inline-flex items-center mb-3">
              Devenir Facilitateur — Gratuit
              <ArrowRight size={15} />
            </Link>
            <p className="text-xs text-muted-foreground">
              Sans carte bancaire · Sans engagement · Pour toujours gratuit
            </p>
          </div>

          {/* Stats card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(160deg, hsl(218 75% 11%), hsl(218 65% 18%))",
              border: "1px solid hsl(218 55% 25% / 0.6)",
              boxShadow: "0 8px 32px hsl(218 72% 5% / 0.45)",
            }}
          >
            <div
              className="px-6 pt-6 pb-4 border-b"
              style={{ borderColor: "hsl(218 55% 22% / 0.5)" }}
            >
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "hsl(24 100% 62%)" }}
              >
                REVENUS FACILITATEUR
              </span>
            </div>
            <div className="p-6 space-y-5">
              <StatLine
                label="Revenu mensuel possible"
                value="2 000 – 5 000 €"
                color="hsl(var(--foreground))"
              />
              <hr style={{ borderColor: "hsl(218 45% 22% / 0.5)" }} />
              <StatLine
                label="Heures par mois"
                value="15 – 20h"
                color="hsl(210 85% 65%)"
              />
              <hr style={{ borderColor: "hsl(218 45% 22% / 0.5)" }} />
              <StatLine
                label="Âge minimum"
                value="18 ans"
                color="hsl(152 62% 55%)"
              />
            </div>
            <div
              className="px-6 pb-5 pt-2 border-t"
              style={{ borderColor: "hsl(218 55% 22% / 0.5)" }}
            >
              <p className="text-[11px]" style={{ color: "hsl(218 30% 50%)" }}>
                Revenus indicatifs basés sur l'activité réseau. Résultats variables selon l'investissement personnel.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══ SECTION 4 — IMPACT SOCIAL ═════════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div ref={s4}>
          <div className="container max-w-2xl text-center mb-14">
            <div className="glow-line mb-8" aria-hidden="true" />
            <span className="pill-tag text-xs font-bold uppercase tracking-wider mb-4 inline-block">
              Notre mission
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              Une mission qui dépasse le business
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              WiinupMax n'est pas qu'une plateforme. C'est un levier de transformation sociale.
            </p>
          </div>

          <div className="container max-w-5xl grid md:grid-cols-3 gap-6">
            <ImpactBloc
              icon={TrendingDown}
              iconBg="hsl(152 62% 34% / 0.1)"
              iconColor="hsl(152 62% 40%)"
              title="Réduire le chômage"
              text="Créer un accès à un revenu réel et immédiat pour toute personne qui le souhaite. Sans diplôme requis. Sans expérience minimale. Juste la volonté."
            />
            <ImpactBloc
              icon={Heart}
              iconBg="hsl(var(--accent) / 0.1)"
              iconColor="hsl(var(--accent))"
              title="Les publics fragiles en premier"
              text="RSA, demandeurs d'emploi, personnes en reconversion... Un téléphone, internet, et savoir lire suffisent pour participer à l'économie et générer un revenu digne."
            />
            <ImpactBloc
              icon={Globe}
              iconBg="hsl(var(--electric) / 0.1)"
              iconColor="hsl(var(--electric))"
              title="L'économie des territoires"
              text="Local, national, international. WiinupMax connecte entreprises, CCI, MEDEF, CPME et business clubs pour dynamiser les territoires à toutes les échelles."
            />
          </div>

          {/* Citation */}
          <div className="container max-w-xl mx-auto mt-14 text-center">
            <blockquote
              className="text-lg md:text-xl font-medium leading-relaxed mb-3"
              style={{ color: "hsl(var(--foreground) / 0.85)" }}
            >
              « Recréer un équilibre financier pour tous en plaçant l'humain au cœur de l'économie. »
            </blockquote>
            <p className="text-sm text-muted-foreground">— La raison d'être de WiinupMax</p>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══ SECTION 5 — PHILOSOPHIE ═══════════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div ref={s5} className="container max-w-4xl">
          <div className="text-center mb-4">
            <span className="pill-tag text-xs font-bold uppercase tracking-wider inline-block">
              Notre philosophie
            </span>
          </div>
          <h2 className="font-display font-bold text-center text-3xl md:text-5xl mb-12 leading-tight">
            Simple is{" "}
            <span className="text-highlight">Beautiful.</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <PhiloCard
              icon={User}
              title="L'humain d'abord"
              text="La technologie est au service des relations, jamais l'inverse. OpenClaw, notre IA, travaille pour vous. Mais c'est toujours vous qui décidez."
            />
            <PhiloCard
              icon={Scale}
              title="L'équité comme moteur"
              text="PME ou solopreneur, allocataire RSA ou grand compte — vous avez exactement la même place dans l'écosystème WiinupMax. Aucune discrimination de taille ou de budget."
            />
            <PhiloCard
              icon={Handshake}
              title="La collaboration avant tout"
              text="Pas de compétition. Pas de jeu à somme nulle. Chaque succès généré sur WiinupMax en crée d'autres. Nous grandissons ensemble ou pas du tout."
            />
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══ SECTION 6 — LES FONDATEURS ════════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div ref={s6}>
          <div className="container max-w-2xl text-center mb-14">
            <div className="glow-line mb-8" aria-hidden="true" />
            <span className="pill-tag text-xs font-bold uppercase tracking-wider mb-4 inline-block">
              L'équipe fondatrice
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              Ceux qui ont tout mis en jeu
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              WiinupMax n'est pas né dans une salle de réunion. Il est né d'une conviction personnelle et d'une expérience terrain combinée de 35 ans.
            </p>
          </div>

          <div className="container max-w-5xl grid md:grid-cols-2 gap-8">
            <FounderCard
              photoSrc="/lovable-uploads/vivien-le-moal.jpg"
              name="Vivien Le Moal"
              role="Président & Co-fondateur"
              tagline="Entrepreneur serial · Community Builder · 20 ans terrain"
              description={"\"Ancien marchand de biens, ex-président de CCI, consultant en transformation commerciale pendant 15 ans. Vivien a accompagné des centaines d\u2019entreprises dans leur développement. Il n\u2019a pas créé WiinupMax depuis un bureau. Il l\u2019a créé parce qu\u2019il a vécu le problème : trouver des clients, faire confiance aux bonnes personnes, faire tourner une boîte pour de vrai."}
              tags={["Community Builder", "+20 ans terrain", "Ex-Président CCI", "Transformation commerciale"]}
              quote={"\"J\u2019ai passé 20 ans à aider des entreprises à grandir. WiinupMax, c\u2019est tout ce que j\u2019aurais voulu avoir dès le premier jour.\""}
              badgeLabel="Président & Co-fondateur"
            />
            <FounderCard
              photoSrc="/lovable-uploads/emilie-varnier.jpg"
              name="Émilie Varnier"
              role="CEO Associée & Co-fondatrice"
              tagline="Architecte de l'expérience humaine · DRH · Thérapeute"
              description={"\"Ancienne DRH d\u2019un groupe de plus de 500 personnes, thérapeute certifiée, entrepreneuse depuis 2016. Émilie a passé sa carrière à comprendre les gens — leurs peurs, leurs ambitions, leurs blocages. Elle apporte à WiinupMax ce qui manque à toutes les plateformes : la dimension humaine, et la conviction profonde que chacun peut s\u2019en sortir."}
              tags={["Architecte RH", "Thérapeute certifiée", "Ex-DRH 500 personnes", "Entrepreneuse depuis 2016"]}
              quote={"\"Les gens ont les compétences. Ce qui leur manque, c\u2019est le système qui valorise ce qu\u2019ils savent déjà faire.\""}
              badgeLabel="CEO Associée & Co-fondatrice"
            />
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══ SECTION 7 — LA MÊLÉE ══════════════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div ref={s7} className="container max-w-4xl">
          <div className="text-center mb-12">
            <span className="pill-tag text-xs font-bold uppercase tracking-wider mb-4 inline-block">
              🏉 Nos événements
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
              La <span className="text-highlight">Mêlée</span> by WiinupMax
            </h2>
            <p className="text-muted-foreground font-medium text-lg">
              Le networking sans bullshit. En vrai.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-10">
            {/* Texte */}
            <div className="card-premium p-7">
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                "Nous organisons des événements business par ville, en France et à l'international. Dans l'esprit du Rugby : on se retrouve dans de vraies entreprises du territoire, en mode auberge espagnole. Apportez votre boisson, vos chips. Rencontrez des Facilitateurs et des dirigeants locaux. Chill. Sans prise de tête. Ultra efficace."
              </p>
              <div className="space-y-3">
                {[
                  { icon: MapPinned, text: "Dans de vraies entreprises du territoire" },
                  { icon: Heart, text: "Mode auberge espagnole — détendu & direct" },
                  { icon: Users, text: "Facilitateurs + Entreprises en live" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-sm text-foreground">
                    <Icon size={14} style={{ color: "hsl(var(--accent))", flexShrink: 0 }} />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Discord card */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(160deg, hsl(218 75% 11%), hsl(218 65% 18%))",
                border: "1px solid hsl(218 55% 25% / 0.6)",
              }}
            >
              <div
                className="px-7 pt-7 pb-5 border-b flex items-center gap-3"
                style={{ borderColor: "hsl(218 55% 22% / 0.5)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "hsl(240 62% 48% / 0.2)" }}
                >
                  <MessageCircle size={15} style={{ color: "hsl(240 62% 70%)" }} />
                </div>
                <span className="font-display font-bold text-sm text-foreground">
                  Communauté Discord
                </span>
              </div>
              <div className="p-7 space-y-4">
                <p className="text-sm leading-relaxed" style={{ color: "hsl(218 30% 65%)" }}>
                  "2 heures par semaine en groupe. Questions à Vivien sur le business et l'acquisition commerciale. Questions à Émilie sur le développement personnel. Formations gratuites. Intervenants experts."
                </p>
                <div className="space-y-3 pt-2">
                  {[
                    { initials: "VLM", name: "Vivien Le Moal", spec: "Business & Acquisition" },
                    { initials: "EV", name: "Émilie Varnier", spec: "Développement personnel" },
                  ].map(({ initials, name, spec }) => (
                    <div key={name} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: "hsl(var(--primary) / 0.15)",
                          color: "hsl(var(--primary))",
                          border: "1px solid hsl(var(--primary) / 0.25)",
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground leading-none mb-0.5">{name}</p>
                        <p className="text-[11px]" style={{ color: "hsl(218 30% 55%)" }}>{spec}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  to="/signup"
                  className="btn-cta text-sm px-5 py-2.5 inline-flex items-center gap-2 w-full justify-center mt-2"
                >
                  Rejoindre la communauté
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══ SECTION 8 — ROADMAP 2026 ══════════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div ref={s8}>
          <div className="container max-w-2xl text-center mb-0">
            <div className="glow-line mb-8" aria-hidden="true" />
            <span className="pill-tag text-xs font-bold uppercase tracking-wider mb-4 inline-block">
              Vision 2026
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
              Ce n'est que le début.
            </h2>
            <p className="text-muted-foreground">Voici où nous allons.</p>
          </div>

          <div className="container max-w-4xl grid md:grid-cols-2 gap-5 mt-12">
            <RoadmapBloc
              num="01"
              icon={MapPin}
              title="Réseau Physique"
              text="Franchises locales dans toutes les grandes villes. La Mêlée dans chaque territoire. Un réseau humain ancré dans la réalité de chaque bassin d'emploi."
            />
            <RoadmapBloc
              num="02"
              icon={Brain}
              title="Hub IA"
              text="Formations IA illimitées. Mises en relation qualifiées par algorithme. OpenClaw encore plus puissant — un véritable co-pilote commercial pour chaque membre."
            />
            <RoadmapBloc
              num="03"
              icon={TrendingUp}
              title="Wiinup Invest"
              text="Financement pré-amorçage pour les startups membres. L'écosystème qui investit dans ses propres membres et crée un cercle vertueux."
            />
            <RoadmapBloc
              num="04"
              icon={Video}
              title="Wiinup Media"
              text="La chaîne Otantik. Interviews et portraits business des entrepreneurs qui font vraiment. La visibilité au service de ceux qui la méritent."
            />
          </div>

          {/* Partenaires */}
          <div className="container max-w-3xl mt-14">
            <div
              className="card-premium py-6 px-8 flex flex-col items-center gap-4"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nos partenaires institutionnels
              </p>
              <div className="flex gap-4 flex-wrap justify-center">
                {["CCI", "MEDEF", "CPME", "Business Clubs"].map(p => (
                  <span key={p} className="pill-tag text-sm px-4 py-2 font-semibold">{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 9 — CTA FINAL ══════════════════════════════════════════ */}
      <section className="hero-bg py-24 md:py-32 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 70%, hsl(24 100% 40% / 0.12) 0%, transparent 65%)",
          }}
          aria-hidden="true"
        />
        <div ref={s9} className="container max-w-2xl text-center relative z-10 px-4">
          <span
            className="pill-tag text-xs font-bold uppercase tracking-wider mb-6 inline-block"
            style={{ color: "hsl(24 100% 62%)", background: "hsl(24 100% 52% / 0.12)", border: "1px solid hsl(24 100% 52% / 0.3)" }}
          >
            Places limitées — 100 fondateurs
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
            Vous avez lu jusqu'ici.
            <br />
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
          <p className="text-white/55 text-base leading-relaxed mb-9 max-w-lg mx-auto">
            WiinupMax n'est pas pour tout le monde. C'est pour les entrepreneurs qui veulent des clients, pas des promesses. Pour les personnes qui croient que l'humain et la technologie peuvent faire de belles choses ensemble.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              to="/pricing"
              className="btn-cta text-base px-9 py-4 gap-2 w-full sm:w-auto inline-flex items-center justify-center"
            >
              Démarrer maintenant — 99 € / an
              <ArrowRight size={17} />
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-white/55 border border-white/12 font-medium text-sm hover:border-white/28 hover:text-white/78 transition-all duration-200 w-full sm:w-auto"
            >
              <Users size={14} className="shrink-0" />
              Devenir Facilitateur — Gratuit
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-white/28 text-xs mt-8">
            {[
              { icon: CheckCircle2, label: "Sans engagement" },
              { icon: CheckCircle2, label: "Paiement 100% sécurisé" },
              { icon: CheckCircle2, label: "Résiliable à tout moment" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon size={10} aria-hidden="true" /> {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <LegalFooter />
    </div>
  );
}
