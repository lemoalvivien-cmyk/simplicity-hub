import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import {
  ArrowRight, Zap, Target, Users, Send, TrendingUp, Play,
  Briefcase, CheckCircle2, Shield, Star, ChevronRight,
  Building2, MessageSquare, BarChart3, Bot, Globe
} from "lucide-react";

// ─── DATA ────────────────────────────────────────────────
const features = [
  { icon: Target, label: "Prospection ciblée", desc: "Organisez vos contacts, lancez des campagnes, suivez chaque action." },
  { icon: Briefcase, label: "Missions business", desc: "Publiez des missions, recevez des candidatures d'apporteurs qualifiés." },
  { icon: Send, label: "Introductions vérifiées", desc: "Chaque introduction est tracée, validée, et reliée à un résultat." },
  { icon: TrendingUp, label: "Gains & résultats", desc: "Suivez ce qui se passe, ce qui fonctionne, ce que vous gagnez." },
  { icon: Play, label: "Campagnes guidées", desc: "Préparez vos séquences, vos messages, votre rythme de travail." },
  { icon: Bot, label: "Assistant JARVIS", desc: "Une IA qui vous guide, priorise et améliore votre travail au bon moment." },
];

const forEntreprise = [
  "Trouver de nouvelles opportunités via le réseau",
  "Lancer des missions et attirer des apporteurs",
  "Piloter la prospection depuis un seul endroit",
  "Recevoir des introductions qualifiées et vérifiées",
  "Suivre les résultats en temps réel",
];

const forApporteur = [
  "Activer votre réseau existant sans effort",
  "Choisir les missions qui correspondent à vos contacts",
  "Envoyer des introductions en quelques secondes",
  "Suivre vos validations et vos gains",
  "Utiliser la plateforme gratuitement, toujours",
];

const steps = [
  { num: "01", who: "Entreprise", action: "Lance une mission ou une campagne", detail: "En quelques minutes, elle décrit ce qu'elle cherche." },
  { num: "02", who: "Réseau", action: "Les contacts et introductions circulent", detail: "Les apporteurs recommandent, les campagnes avancent." },
  { num: "03", who: "Validation", action: "Chaque opportunité est suivie et vérifiée", detail: "Rien ne se perd. Tout est tracé automatiquement." },
  { num: "04", who: "Résultats", action: "Les gains et résultats deviennent visibles", detail: "Entreprise et apporteur voient l'impact business réel." },
];

const differentiators = [
  { icon: Globe, title: "Pas juste un outil de prospection", desc: "WIINUP MAX combine prospection active et réseau d'apport d'affaires dans une seule plateforme." },
  { icon: Shield, title: "Pas juste un réseau", desc: "Chaque introduction est validée, tracée, associée à un résultat mesurable." },
  { icon: BarChart3, title: "Pas juste un CRM", desc: "Un cockpit de pilotage commercial complet, avec priorisation intelligente et assistant IA." },
  { icon: Star, title: "Un réseau mesurable et monétisable", desc: "Transformez votre réseau invisible en pipeline prouvé, vérifié, et rentable." },
];

const faq = [
  { q: "C'est quoi WIINUP MAX exactement ?", a: "Une plateforme qui combine deux moteurs : la prospection business (contacts, campagnes, actions) et l'apport d'affaires (missions, introductions, gains). Le tout piloté par un assistant IA." },
  { q: "À qui s'adresse WIINUP MAX ?", a: "Aux entreprises qui veulent trouver des clients, et aux apporteurs d'affaires qui veulent valoriser leur réseau. Les deux profils coexistent sur la même plateforme." },
  { q: "Combien coûte la plateforme ?", a: "Les 100 premières entreprises bénéficient d'une offre de lancement à 99 € TTC pour la première année. Ensuite, l'abonnement annuel est à 490 € TTC. Les apporteurs d'affaires accèdent gratuitement, sans limite de temps." },
  { q: "Faut-il être technique pour l'utiliser ?", a: "Absolument pas. WIINUP MAX est conçu pour des professionnels non techniques. Tout est guidé, expliqué, simplifié." },
  { q: "Comment fonctionne l'assistant JARVIS ?", a: "JARVIS vous guide en temps réel : il priorise vos actions, améliore vos messages, explique les statuts, et vous indique toujours la prochaine étape utile." },
  { q: "Puis-je annuler à tout moment ?", a: "Oui. Sans condition. Votre accès reste actif jusqu'à la fin de la période payée." },
];

// ─── COMPOSANT ────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      {/* ══ HERO ══════════════════════════════════════════ */}
      <section className="hero-bg py-24 md:py-36 relative">
        <div className="container max-w-4xl text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/8 text-white/80 text-xs font-semibold mb-10">
            <div className="electric-dot" />
            Plateforme de prospection & apport d'affaires — 2026
          </div>

          {/* Titre */}
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-none tracking-tight">
            Votre réseau devient<br />
            <span style={{
              background: "linear-gradient(135deg, hsl(24 100% 60%), hsl(38 100% 65%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              une machine commerciale.
            </span>
          </h1>

          {/* Sous-titre */}
          <p className="text-xl md:text-2xl text-white/65 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            WIINUP MAX relie prospection, apport d'affaires et pilotage IA dans une seule plateforme.
            Simple. Mesurable. Puissant.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/pricing" className="btn-cta text-base px-8 py-4 gap-2">
              Démarrer maintenant
              <ArrowRight size={18} />
            </Link>
            <a
              href="#comment-ca-marche"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white/75 border border-white/20 font-semibold text-base hover:bg-white/8 transition-colors"
            >
              Comment ça marche
              <ChevronRight size={16} />
            </a>
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/40 text-xs">
            <span>✓ Offre lancement 99 € / an</span>
            <span className="hidden sm:block">·</span>
            <span>✓ Apporteur d'affaires — gratuit</span>
            <span className="hidden sm:block">·</span>
            <span>✓ Annulation libre</span>
            <span className="hidden sm:block">·</span>
            <span>✓ Aucune compétence technique</span>
          </div>
        </div>

        {/* Product mockup */}
        <div className="container max-w-5xl mt-20 px-4 relative z-10">
          <div className="rounded-2xl overflow-hidden border border-white/10" style={{ boxShadow: "0 32px 80px hsl(218 72% 8% / 0.6), 0 0 0 1px hsl(218 72% 40% / 0.08)" }}>
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/8" style={{ background: "hsl(218 72% 10% / 0.8)", backdropFilter: "blur(10px)" }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: "hsl(0 70% 55%)" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "hsl(38 90% 55%)" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "hsl(120 55% 45%)" }} />
              </div>
              <div className="flex-1 mx-4 h-6 rounded-md flex items-center px-3" style={{ background: "hsl(218 50% 20% / 0.5)" }}>
                <span className="text-white/30 text-xs">wiinupmax.app/pilotage</span>
              </div>
            </div>
            {/* Dashboard preview */}
            <div className="p-6 md:p-8" style={{ background: "hsl(218 65% 12% / 0.9)", backdropFilter: "blur(20px)" }}>
              {/* Top metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Opportunités actives", val: "14", color: "hsl(24 100% 52%)", bg: "hsl(24 100% 52% / 0.12)" },
                  { label: "Introductions reçues", val: "6", color: "hsl(152 62% 45%)", bg: "hsl(152 62% 45% / 0.12)" },
                  { label: "Missions ouvertes", val: "3", color: "hsl(210 85% 55%)", bg: "hsl(210 85% 55% / 0.12)" },
                  { label: "Gains ce mois", val: "2 840 €", color: "hsl(38 90% 58%)", bg: "hsl(38 90% 58% / 0.12)" },
                ].map(({ label, val, color, bg }) => (
                  <div key={label} className="rounded-xl p-4" style={{ background: bg, border: `1px solid ${color}20` }}>
                    <p className="text-white/45 text-xs mb-1.5">{label}</p>
                    <p className="font-display font-bold text-2xl" style={{ color }}>{val}</p>
                  </div>
                ))}
              </div>
              {/* Bottom rows */}
              <div className="grid md:grid-cols-2 gap-3">
                <div className="rounded-xl p-4" style={{ background: "hsl(218 50% 18% / 0.6)", border: "1px solid hsl(218 40% 30% / 0.3)" }}>
                  <p className="text-white/40 text-xs mb-3 font-semibold uppercase tracking-wider">JARVIS — Priorités du jour</p>
                  <div className="space-y-2">
                    {["3 contacts à relancer aujourd'hui", "1 introduction attend votre validation", "Campagne Prospection Nord : vérifier"].map((item) => (
                      <div key={item} className="flex items-center gap-2.5">
                        <div className="electric-dot shrink-0" />
                        <span className="text-white/65 text-xs">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-4" style={{ background: "hsl(218 50% 18% / 0.6)", border: "1px solid hsl(218 40% 30% / 0.3)" }}>
                  <p className="text-white/40 text-xs mb-3 font-semibold uppercase tracking-wider">Dernières actions</p>
                  <div className="space-y-2">
                    {[
                      { t: "Introduction validée — Tech SaaS", c: "hsl(152 62% 45%)" },
                      { t: "Campagne envoyée à 48 contacts", c: "hsl(210 85% 55%)" },
                      { t: "Mission publiée — Finance Paris", c: "hsl(24 100% 52%)" },
                    ].map(({ t, c }) => (
                      <div key={t} className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c }} />
                        <span className="text-white/65 text-xs">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CE QUE FAIT WIINUP MAX ════════════════════════ */}
      <section className="py-24 bg-background">
        <div className="container max-w-5xl">
          <div className="text-center mb-16">
            <p className="pill-tag mb-4">La plateforme complète</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tout ce dont vous avez besoin.<br />Dans un seul espace.
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              WIINUP MAX réunit prospection, réseau, missions et pilotage. Rien ne manque. Rien n'est de trop.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="card-premium p-6">
                <div className="w-11 h-11 rounded-xl mb-4 flex items-center justify-center" style={{ background: "hsl(218 72% 18% / 0.08)", border: "1px solid hsl(218 72% 18% / 0.12)" }}>
                  <Icon size={20} style={{ color: "hsl(var(--primary))" }} />
                </div>
                <h3 className="font-semibold text-foreground text-base mb-2">{label}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ POUR LES ENTREPRISES + APPORTEURS ════════════ */}
      <section className="py-24 bg-muted">
        <div className="container max-w-5xl">
          <div className="text-center mb-16">
            <p className="pill-tag mb-4">Deux profils, une plateforme</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Conçu pour vous, quelle que soit votre position.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Entreprise */}
            <div className="bg-card rounded-2xl overflow-hidden border-2 border-primary shadow-md">
              <div className="p-6 border-b border-border" style={{ background: "var(--gradient-primary)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                    <Building2 size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-white text-lg">Vous êtes une entreprise</p>
                    <p className="text-white/65 text-sm">Offre lancement — 99 € TTC / an</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-3 mb-6">
                  {forEntreprise.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 size={16} style={{ color: "hsl(var(--primary))" }} className="shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/pricing" className="btn-primary w-full text-center block py-3 text-sm">
                  Voir l'offre entreprise →
                </Link>
              </div>
            </div>

            {/* Apporteur */}
            <div className="bg-card rounded-2xl overflow-hidden border-2 border-accent shadow-md">
              <div className="p-6 border-b border-border" style={{ background: "var(--gradient-accent)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Users size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-white text-lg">Vous êtes apporteur d'affaires</p>
                    <p className="text-white/75 text-sm font-semibold">100% gratuit — toujours</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-3 mb-6">
                  {forApporteur.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 size={16} style={{ color: "hsl(var(--accent))" }} className="shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="btn-cta w-full text-center block py-3 text-sm">
                  Créer mon compte gratuit →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ COMMENT ÇA MARCHE ═════════════════════════════ */}
      <section id="comment-ca-marche" className="py-24 bg-background">
        <div className="container max-w-4xl">
          <div className="text-center mb-16">
            <p className="pill-tag mb-4">Le fonctionnement</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Simple à comprendre.<br />Puissant dans les résultats.
            </h2>
          </div>

          <div className="space-y-4">
            {steps.map(({ num, who, action, detail }, i) => (
              <div key={num} className="flex gap-5 items-start group">
                <div className="shrink-0 flex flex-col items-center">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm text-white"
                    style={{ background: i % 2 === 0 ? "var(--gradient-primary)" : "var(--gradient-accent)" }}
                  >
                    {num}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 mt-2 min-h-8" style={{ background: "hsl(var(--border))" }} />
                  )}
                </div>
                <div className="pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge-electric">{who}</span>
                  </div>
                  <p className="font-semibold text-foreground text-base">{action}</p>
                  <p className="text-muted-foreground text-sm mt-1">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ JARVIS ════════════════════════════════════════ */}
      <section className="py-24 bg-muted">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="pill-tag mb-5">Assistant IA intégré</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-5">
                JARVIS — Votre cerveau<br />
                <span className="text-highlight">commercial toujours actif.</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-7 leading-relaxed">
                JARVIS ne vous laisse jamais vous perdre. Il vous dit quoi faire, quand le faire, et comment le faire mieux.
              </p>
              <ul className="space-y-3">
                {[
                  "Voici ce qui mérite votre attention maintenant",
                  "Améliorez ce message en un clic",
                  "Votre priorité du jour est ici",
                  "Cette introduction attend une réponse",
                  "Simplifiez ce texte pour être plus convaincant",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Bot size={15} style={{ color: "hsl(var(--primary))" }} className="shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground italic">"{item}"</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* JARVIS mockup */}
            <div className="card-glass p-6 border" style={{ borderColor: "hsl(218 72% 18% / 0.15)", background: "hsl(218 40% 97% / 0.7)" }}>
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
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
                  { type: "action", text: "3 contacts à relancer · 1 introduction en attente · 1 campagne à vérifier" },
                  { type: "user", text: "Que dois-je faire en premier ?" },
                  { type: "jarvis", text: "Commencez par l'introduction en attente. C'est la plus urgente." },
                ].map(({ type, text }, i) => (
                  <div key={i} className={`flex ${type === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                        type === "user"
                          ? "text-white"
                          : type === "action"
                          ? "border text-xs"
                          : "text-foreground"
                      }`}
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
              <div className="mt-4 grid grid-cols-2 gap-2">
                {["Que dois-je faire ?", "Résume ma situation"].map((q) => (
                  <button key={q} className="px-3 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-muted transition-colors text-left">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ DIFFÉRENCIATEURS ══════════════════════════════ */}
      <section className="py-24 bg-background">
        <div className="container max-w-5xl">
          <div className="text-center mb-16">
            <p className="pill-tag mb-4">Ce qui est différent</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Votre réseau invisible devient<br />
              <span className="text-highlight">un pipeline mesurable.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {differentiators.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bento-card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-electric)" }}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-base mb-1.5">{title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TRAÇABILITÉ & PREUVE ══════════════════════════ */}
      <section className="py-24 bg-muted">
        <div className="container max-w-4xl text-center">
          <p className="pill-tag mb-5 mx-auto w-fit">Traçabilité complète</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
            Chaque affaire est prouvée.<br />Chaque gain est visible.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-12">
            Chaque introduction est reliée à une mission, à une validation, à un gain. Rien n'est flou. Tout est tracé.
          </p>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { label: "Preuve", icon: "📋", desc: "Chaque action laisse une trace visible" },
              { label: "Validation", icon: "✅", desc: "Les introductions sont vérifiées avant paiement" },
              { label: "Historique", icon: "🕐", desc: "L'historique complet est conservé" },
              { label: "Résultats", icon: "📈", desc: "Les gains sont clairs et mesurables" },
            ].map(({ label, icon, desc }) => (
              <div key={label} className="bg-card rounded-2xl p-5 border border-border text-center">
                <div className="text-3xl mb-3">{icon}</div>
                <p className="font-semibold text-foreground text-sm mb-1.5">{label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ═══════════════════════════════════════ */}
      <section className="py-24 bg-background">
        <div className="container max-w-4xl">
          <div className="text-center mb-16">
            <p className="pill-tag mb-4">Tarifs clairs</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Simple, honnête, transparent.
            </h2>
            <p className="text-muted-foreground text-lg">
              Pas de surprise. Pas de version light frustrante.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Entreprise */}
            <div className="bg-card rounded-2xl overflow-hidden border-2 border-primary shadow-primary">
              <div className="p-7 border-b border-border" style={{ background: "var(--gradient-primary)" }}>
                <p className="text-white/65 text-sm font-medium mb-2">Entreprise</p>
                <div className="flex items-end gap-1.5">
                  <span className="font-display font-bold text-5xl text-white">29 €</span>
                  <span className="text-white/60 text-sm pb-1">TTC / mois</span>
                </div>
                <p className="text-white/50 text-xs mt-1.5">Sans engagement · Annulation libre</p>
              </div>
              <div className="p-6">
                <ul className="space-y-2.5 mb-6">
                  {[
                    "Accès complet à toutes les fonctionnalités",
                    "Pilotage, campagnes, contacts, missions",
                    "Assistant JARVIS illimité",
                    "Introductions reçues et vérifiées",
                    "Support par e-mail inclus",
                    "Mises à jour automatiques",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                      <CheckCircle2 size={14} style={{ color: "hsl(var(--primary))" }} className="shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/pricing" className="btn-primary w-full text-center block py-3.5 text-sm">
                  Commencer à 29 € / mois →
                </Link>
              </div>
            </div>

            {/* Apporteur */}
            <div className="bg-card rounded-2xl overflow-hidden border-2 border-accent shadow-accent">
              <div className="p-7 border-b border-border" style={{ background: "var(--gradient-accent)" }}>
                <p className="text-white/80 text-sm font-medium mb-2">Apporteur d'affaires</p>
                <div className="flex items-end gap-1.5">
                  <span className="font-display font-bold text-5xl text-white">Gratuit</span>
                </div>
                <p className="text-white/65 text-xs mt-1.5">Pour toujours · Sans carte bancaire</p>
              </div>
              <div className="p-6">
                <ul className="space-y-2.5 mb-6">
                  {[
                    "Accès complet à toutes les missions",
                    "Envoi d'introductions illimité",
                    "Suivi des validations en temps réel",
                    "Tableau de bord des gains",
                    "Assistant JARVIS inclus",
                    "Aucune commission prélevée par la plateforme",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                      <CheckCircle2 size={14} style={{ color: "hsl(var(--accent))" }} className="shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="btn-cta w-full text-center block py-3.5 text-sm">
                  Créer mon compte gratuit →
                </Link>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Paiement sécurisé · Données protégées · Aide disponible
          </p>
        </div>
      </section>

      {/* ══ FAQ ═══════════════════════════════════════════ */}
      <section className="py-24 bg-muted border-t border-border">
        <div className="container max-w-3xl">
          <div className="text-center mb-14">
            <p className="pill-tag mb-4">Questions fréquentes</p>
            <h2 className="font-display text-3xl font-bold text-foreground">
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

      {/* ══ CTA FINAL ═════════════════════════════════════ */}
      <section className="hero-bg py-24 relative">
        <div className="container max-w-2xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/8 text-white/75 text-xs font-semibold mb-8">
            <div className="electric-dot" />
            Prêt à démarrer ?
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
            Transformez votre réseau<br />
            <span style={{
              background: "linear-gradient(135deg, hsl(24 100% 60%), hsl(38 100% 65%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              en résultats mesurables.
            </span>
          </h2>
          <p className="text-white/60 text-lg mb-10 max-w-md mx-auto">
            Commencez maintenant. Votre espace est prêt en moins de 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing" className="btn-cta text-base px-8 py-4">
              Entreprise — 29 € / mois <ArrowRight size={18} />
            </Link>
            <Link to="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white/80 border border-white/20 font-semibold text-base hover:bg-white/8 transition-colors">
              Apporteur — Gratuit <ArrowRight size={18} />
            </Link>
          </div>
          <p className="mt-7 text-white/35 text-xs">
            Sans engagement · Annulation libre · Aide incluse
          </p>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════ */}
      <footer className="bg-card border-t border-border py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--gradient-electric)" }}
            >
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
