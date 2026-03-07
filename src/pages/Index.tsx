import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import HeroSection from "@/components/landing/HeroSection";
import LaunchQuotaBanner from "@/components/landing/LaunchQuotaBanner";
import {
  ArrowRight, CheckCircle2, Shield, Star, Building2, Users,
  MessageSquare, Bot, Zap, Send, TrendingUp
} from "lucide-react";

const steps = [
  { num: "01", title: "Publiez votre mission", detail: "Décrivez votre client idéal, votre secteur et la récompense pour l'apporteur. En moins de 5 minutes.", color: "hsl(218 72% 55%)" },
  { num: "02", title: "Les apporteurs entrent en action", detail: "Ils recommandent votre offre à leurs contacts. Vous recevez des introductions vérifiées.", color: "hsl(152 62% 45%)" },
  { num: "03", title: "Vous évaluez et validez", detail: "Chaque introduction est tracée. Vous validez ce qui correspond. Rien ne disparaît.", color: "hsl(24 100% 52%)" },
  { num: "04", title: "Les résultats sont mesurables", detail: "Gains, conversions, taux d'acceptation — tout est visible et défendable.", color: "hsl(38 90% 55%)" },
];

const forEntreprise = [
  "Publiez vos missions et ciblez les bons apporteurs",
  "Recevez des introductions qualifiées et vérifiées",
  "Piloter votre acquisition depuis un seul endroit",
  "Mesurez chaque résultat en temps réel",
  "Un assistant IA pour ne jamais vous perdre",
];

const forApporteur = [
  "Choisissez les missions qui correspondent à votre réseau",
  "Envoyez une introduction en quelques secondes",
  "Suivez vos validations et vos gains en temps réel",
  "Aucune commission prélevée par la plateforme",
  "Gratuit pour toujours — sans carte bancaire",
];

const faq = [
  { q: "C'est quoi WIINUP MAX ?", a: "Une plateforme où les entreprises publient des missions et les apporteurs d'affaires envoient des introductions vérifiées. Tout est tracé, validé, et mesuré." },
  { q: "À qui s'adresse WIINUP MAX ?", a: "Aux entreprises qui veulent trouver des clients via le bouche-à-oreille, et aux apporteurs d'affaires qui veulent monétiser leur réseau." },
  { q: "Combien ça coûte ?", a: "Les 100 premières entreprises bénéficient d'un accès à 99 € TTC pour la première année, puis 490 € / an. Les apporteurs d'affaires accèdent gratuitement, pour toujours." },
  { q: "Faut-il être technique ?", a: "Absolument pas. WIINUP MAX est conçu pour des professionnels non techniques. Tout est guidé, expliqué, simplifié." },
  { q: "Puis-je annuler à tout moment ?", a: "Oui. Sans condition. Votre accès reste actif jusqu'à la fin de la période payée." },
  { q: "Est-ce que ça marche vraiment ?", a: "Chaque introduction est reliée à une validation, une preuve et un résultat. Rien n'est flou. Tout est tracé." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <HeroSection />

      {/* ══ COMMENT ÇA MARCHE — SIMPLE ════════════════════════ */}
      <section id="comment-ca-marche" className="py-20 bg-background">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <p className="pill-tag mb-4 mx-auto w-fit">Le fonctionnement</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Simple à comprendre.<br />
              <span className="text-highlight">Puissant dans les résultats.</span>
            </h2>
          </div>
          <div className="space-y-3">
            {steps.map(({ num, title, detail, color }, i) => (
              <div key={num} className="flex gap-5 items-start">
                <div className="shrink-0 flex flex-col items-center">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm text-white"
                    style={{ background: color }}
                  >
                    {num}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 mt-2 min-h-6" style={{ background: "hsl(var(--border))" }} />
                  )}
                </div>
                <div className="pb-5">
                  <p className="font-semibold text-foreground text-base mb-1">{title}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/pricing" className="btn-primary px-8 py-3.5 inline-flex gap-2">
              Lancer ma première mission <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ DEUX PROFILS ══════════════════════════════════════ */}
      <section className="py-20 bg-muted">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <p className="pill-tag mb-4 mx-auto w-fit">Deux profils, une plateforme</p>
            <h2 className="font-display text-3xl font-bold text-foreground">
              Pour les entreprises. Pour les apporteurs.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Entreprise — dominant */}
            <div className="bg-card rounded-2xl overflow-hidden border-2 border-primary shadow-primary">
              <div className="p-6 border-b border-border" style={{ background: "var(--gradient-primary)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                    <Building2 size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-white text-lg">Entreprise</p>
                    <p className="text-white/65 text-xs">Offre lancement — 99 € TTC / an</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-3 mb-6">
                  {forEntreprise.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 size={14} style={{ color: "hsl(var(--primary))" }} className="shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/pricing" className="btn-primary w-full text-center block py-3.5 text-sm">
                  Voir l'offre entreprise →
                </Link>
              </div>
            </div>

            {/* Apporteur — secondaire */}
            <div className="bg-card rounded-2xl overflow-hidden border-2 border-accent">
              <div className="p-6 border-b border-border" style={{ background: "var(--gradient-accent)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Users size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-white text-lg">Apporteur d'affaires</p>
                    <p className="text-white/75 text-xs font-semibold">100% gratuit — toujours</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-3 mb-6">
                  {forApporteur.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 size={14} style={{ color: "hsl(var(--accent))" }} className="shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="btn-cta w-full text-center block py-3.5 text-sm">
                  Créer mon compte gratuit →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ JARVIS — ASSISTANT ════════════════════════════════ */}
      <section className="py-20 bg-background">
        <div className="container max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="pill-tag mb-5">Assistant IA intégré</p>
              <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                JARVIS vous guide<br />
                <span className="text-highlight">à chaque étape.</span>
              </h2>
              <p className="text-muted-foreground text-base mb-6 leading-relaxed">
                Il priorise vos actions, améliore vos messages et vous dit toujours quoi faire ensuite. Vous n'êtes jamais seul.
              </p>
              <ul className="space-y-3">
                {[
                  "Voici ce qui mérite votre attention maintenant",
                  "Cette introduction attend votre réponse",
                  "Améliorez ce message en un clic",
                  "Votre priorité du jour est ici",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Bot size={14} style={{ color: "hsl(var(--primary))" }} className="shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground italic">"{item}"</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* JARVIS mockup */}
            <div className="card-glass p-5 border rounded-2xl" style={{ borderColor: "hsl(218 72% 18% / 0.15)", background: "hsl(218 40% 97% / 0.7)" }}>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-electric)" }}>
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">JARVIS</p>
                  <p className="text-xs text-muted-foreground">Assistant personnel</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-xs text-muted-foreground">Actif</span>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { type: "jarvis", text: "Voici ce qui mérite votre attention aujourd'hui." },
                  { type: "action", text: "1 introduction en attente · 2 contacts à relancer" },
                  { type: "user", text: "Que dois-je faire en premier ?" },
                  { type: "jarvis", text: "Commencez par l'introduction en attente — c'est urgent." },
                ].map(({ type, text }, i) => (
                  <div key={i} className={`flex ${type === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${type === "user" ? "text-white" : type === "action" ? "border text-xs" : "text-foreground"}`}
                      style={{
                        background: type === "user" ? "var(--gradient-primary)" : type === "action" ? "hsl(24 100% 52% / 0.08)" : "hsl(var(--card))",
                        borderColor: type === "action" ? "hsl(24 100% 52% / 0.2)" : undefined,
                        color: type === "action" ? "hsl(24 80% 38%)" : undefined,
                      }}
                    >
                      {text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CONFIANCE & PROTECTION ════════════════════════════ */}
      <section className="py-20 bg-muted">
        <div className="container max-w-4xl text-center">
          <p className="pill-tag mb-5 mx-auto w-fit">Confiance & protection</p>
          <h2 className="font-display text-3xl font-bold text-foreground mb-4">
            Chaque introduction est prouvée.<br />Chaque gain est visible.
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto mb-10">
            Rien ne disparaît. Tout est tracé automatiquement. Vous êtes protégé à chaque étape.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield, label: "Intro protégée", desc: "Attribution tracée et défendable" },
              { icon: CheckCircle2, label: "Validation", desc: "Vérifiée avant tout paiement" },
              { icon: Star, label: "Réputation", desc: "Score de confiance factuel" },
              { icon: TrendingUp, label: "Résultats", desc: "Gains clairs et mesurables" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-card rounded-2xl p-5 border border-border text-center">
                <Icon size={20} className="mx-auto mb-2.5" style={{ color: "hsl(var(--primary))" }} />
                <p className="font-semibold text-foreground text-sm mb-1">{label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING SIMPLE ════════════════════════════════════ */}
      <section className="py-20 bg-background">
        <div className="container max-w-3xl">
          <div className="text-center mb-10">
            <p className="pill-tag mb-4 mx-auto w-fit">Tarifs clairs</p>
            <h2 className="font-display text-3xl font-bold text-foreground mb-3">
              Simple, honnête, transparent.
            </h2>
          </div>

          {/* Compteur d'urgence */}
          <LaunchQuotaBanner variant="pricing" />

          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-card rounded-2xl overflow-hidden border-2 border-primary shadow-primary">
              <div className="p-6 border-b border-border" style={{ background: "var(--gradient-primary)" }}>
                <p className="text-white/65 text-xs font-medium mb-2 uppercase tracking-wide">Entreprise</p>
                <div className="flex items-end gap-1.5">
                  <span className="font-display font-bold text-4xl text-white">99 €</span>
                  <div className="pb-1">
                    <p className="text-white/60 text-sm">TTC / an</p>
                    <p className="text-white/35 text-xs line-through">490 € / an</p>
                  </div>
                </div>
                <p className="text-white/45 text-xs mt-1">Offre lancement — 100 premières entreprises</p>
              </div>
              <div className="p-5">
                <ul className="space-y-2 mb-5">
                  {["Accès complet", "Missions, introductions, gains", "Assistant JARVIS illimité", "Support inclus"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 size={13} style={{ color: "hsl(var(--primary))" }} className="shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/pricing" className="btn-primary w-full text-center block py-3">
                  Démarrer →
                </Link>
              </div>
            </div>

            <div className="bg-card rounded-2xl overflow-hidden border-2 border-accent">
              <div className="p-6 border-b border-border" style={{ background: "var(--gradient-accent)" }}>
                <p className="text-white/80 text-xs font-medium mb-2 uppercase tracking-wide">Apporteur d'affaires</p>
                <span className="font-display font-bold text-4xl text-white">Gratuit</span>
                <p className="text-white/65 text-xs mt-1">Pour toujours · Sans carte bancaire</p>
              </div>
              <div className="p-5">
                <ul className="space-y-2 mb-5">
                  {["Toutes les missions", "Introductions illimitées", "Gains traçables", "Aucune commission"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 size={13} style={{ color: "hsl(var(--accent))" }} className="shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="btn-cta w-full text-center block py-3">
                  Créer mon compte →
                </Link>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-5">
            Paiement sécurisé · Données protégées · Annulation libre
          </p>
        </div>
      </section>

      {/* ══ FAQ ════════════════════════════════════════════════ */}
      <section className="py-20 bg-muted border-t border-border">
        <div className="container max-w-2xl">
          <div className="text-center mb-10">
            <p className="pill-tag mb-4 mx-auto w-fit">Questions fréquentes</p>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Tout ce qu'il faut savoir.
            </h2>
          </div>
          <div className="space-y-3">
            {faq.map(({ q, a }) => (
              <div key={q} className="bg-card rounded-2xl p-5 border border-border">
                <p className="font-semibold text-sm text-foreground mb-2">{q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ═════════════════════════════════════════ */}
      <section className="hero-bg py-20 relative">
        <div className="container max-w-xl text-center relative z-10">
          <h2 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
            Lancez votre première mission.<br />
            <span style={{
              background: "linear-gradient(135deg, hsl(24 100% 60%), hsl(38 100% 65%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              Recevez vos premières introductions.
            </span>
          </h2>
          <p className="text-white/55 text-base mb-8 max-w-sm mx-auto">
            Commencez simplement. Activez le reste ensuite.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/pricing" className="btn-cta text-base px-8 py-4 gap-2">
              Entreprise — 99 € / an <ArrowRight size={16} />
            </Link>
            <Link to="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white/75 border border-white/20 font-medium text-sm hover:bg-white/8 transition-colors">
              Apporteur — Gratuit
            </Link>
          </div>
          <p className="mt-6 text-white/30 text-xs">
            Sans engagement · Annulation libre · Aide incluse
          </p>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════ */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-electric)" }}>
              <Zap size={13} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-sm" style={{ color: "hsl(var(--foreground))" }}>
              WIINUP <span style={{ color: "hsl(var(--accent))" }}>MAX</span>
            </span>
          </div>
          <span className="text-xs">© 2026 WIINUP MAX. Tous droits réservés.</span>
          <div className="flex gap-5 text-xs">
            <a href="#" className="hover:text-foreground transition-colors">CGU</a>
            <a href="#" className="hover:text-foreground transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
