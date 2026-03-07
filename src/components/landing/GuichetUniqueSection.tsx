import { Brain, Target, Users, Send, TrendingUp, Bot, Radar, Shield, Smartphone, Zap, CheckCircle2, ArrowRight, Moon } from "lucide-react";
import { Link } from "react-router-dom";

const engines = [
  {
    icon: Brain,
    color: "hsl(218 72% 55%)",
    bg: "hsl(218 72% 55% / 0.12)",
    title: "OpenClaw — Cerveau IA",
    desc: "Vos agents prospectent, préparent et agissent pendant que vous dormez.",
    tag: "Cerveau central",
  },
  {
    icon: Radar,
    color: "hsl(152 62% 45%)",
    bg: "hsl(152 62% 45% / 0.12)",
    title: "Deal Radar",
    desc: "Détecte les opportunités business en temps réel. Signaux, scores, matching.",
    tag: "Détection auto",
  },
  {
    icon: Target,
    color: "hsl(24 100% 52%)",
    bg: "hsl(24 100% 52% / 0.12)",
    title: "Prospection automatisée",
    desc: "Contacts, listes, campagnes, actions. Tout organisé et priorisé par l'IA.",
    tag: "Moteur actif",
  },
  {
    icon: Users,
    color: "hsl(38 90% 55%)",
    bg: "hsl(38 90% 55% / 0.12)",
    title: "Réseau d'apporteurs",
    desc: "Des centaines de facilitateurs qui recommandent vos missions à leurs contacts.",
    tag: "Réseau activé",
  },
  {
    icon: Send,
    color: "hsl(262 72% 60%)",
    bg: "hsl(262 72% 60% / 0.12)",
    title: "Introductions vérifiées",
    desc: "Chaque introduction est tracée, validée, reliée à un résultat business réel.",
    tag: "Tracé & prouvé",
  },
  {
    icon: Bot,
    color: "hsl(210 85% 55%)",
    bg: "hsl(210 85% 55% / 0.12)",
    title: "JARVIS — Assistant IA",
    desc: "Priorise, conseille, améliore vos messages. Toujours disponible.",
    tag: "IA illimitée",
  },
  {
    icon: TrendingUp,
    color: "hsl(152 62% 45%)",
    bg: "hsl(152 62% 45% / 0.12)",
    title: "Gains & résultats",
    desc: "Suivez ce que vous gagnez, ce qui convertit, ce qui fonctionne vraiment.",
    tag: "Mesurable",
  },
  {
    icon: Shield,
    color: "hsl(38 80% 50%)",
    bg: "hsl(38 80% 50% / 0.12)",
    title: "Validations humaines",
    desc: "Vous gardez le contrôle. Aucune action sensible sans votre accord explicite.",
    tag: "Vous décidez",
  },
  {
    icon: Smartphone,
    color: "hsl(218 72% 55%)",
    bg: "hsl(218 72% 55% / 0.12)",
    title: "App mobile installable",
    desc: "Installez WIINUP MAX sur iOS et Android. Une vraie app premium.",
    tag: "PWA native",
  },
];

export default function GuichetUniqueSection() {
  return (
    <>
      {/* ══ GUICHET UNIQUE ═══════════════════════════════════════ */}
      <section className="py-24 bg-background">
        <div className="container max-w-5xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6">
              <Zap size={12} />
              Le guichet unique de votre acquisition client
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-5 leading-tight">
              Tout ce qui existe pour trouver<br className="hidden md:block" />
              <span className="text-highlight"> des clients. Dans un seul endroit.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Prospection automatisée + apport d'affaires + agents IA + Deal Radar + assistance illimitée.
              <br className="hidden md:block" />
              Vous n'avez plus besoin d'aller ailleurs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {engines.map(({ icon: Icon, color, bg, title, desc, tag }) => (
              <div key={title} className="card-surface p-5 group hover:shadow-md transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full mt-0.5" style={{ background: bg, color }}>
                    {tag}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1.5">{title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/pricing" className="btn-cta text-base px-10 py-4 gap-2 inline-flex">
              Accéder à tout ça maintenant
              <ArrowRight size={18} />
            </Link>
            <p className="text-muted-foreground text-sm mt-3">Entreprise à partir de 99 € / an · Apporteur toujours gratuit</p>
          </div>
        </div>
      </section>

      {/* ══ MODE AUTOPILOT — POUR CEUX QUI DÉTESTENT PROSPECTER ══ */}
      <section className="py-24 relative overflow-hidden" style={{ background: "hsl(218 65% 8%)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 70% 60% at 30% 50%, hsl(218 72% 30% / 0.2) 0%, transparent 70%)"
        }} />
        <div className="container max-w-5xl relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/20 bg-orange-500/8 text-orange-400/80 text-xs font-semibold mb-6">
                <Moon size={12} />
                Mode Autopilot — Pour ceux qui détestent prospecter
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-5 leading-tight">
                Vous détestez prospecter ?<br />
                <span style={{
                  background: "linear-gradient(135deg, hsl(24 100% 60%), hsl(38 100% 65%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}>
                  Très bien. On s'en occupe.
                </span>
              </h2>
              <p className="text-white/60 text-lg mb-8 leading-relaxed">
                Remplissez votre dossier une seule fois. OpenClaw prépare les campagnes, les messages, les priorités. Vous validez juste l'essentiel.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Vos agents travaillent pendant que vous dormez",
                  "Vous recevez les opportunités déjà qualifiées",
                  "Vous validez d'un clic, ou laissez passer",
                  "Le Deal Radar trouve les cibles à votre place",
                  "JARVIS priorise ce qui mérite vraiment votre temps",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 size={14} style={{ color: "hsl(152 62% 45%)" }} className="shrink-0" />
                    <span className="text-white/75 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/pricing" className="btn-cta text-sm px-7 py-3.5 gap-2 inline-flex">
                Activer le mode Autopilot
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Mockup Autopilot */}
            <div className="rounded-2xl overflow-hidden border border-white/10" style={{
              background: "hsl(218 65% 12% / 0.95)",
              boxShadow: "0 24px 60px hsl(218 72% 8% / 0.6)"
            }}>
              <div className="p-5 border-b border-white/8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-electric)" }}>
                      <Zap size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white/85 text-sm font-semibold">Mode Autopilot</p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-white/40 text-xs">Actif · OpenClaw travaille</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "hsl(152 62% 45% / 0.2)", color: "hsl(152 62% 50%)" }}>
                    Autonomie haute
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { icon: "🎯", title: "3 opportunités préparées", sub: "Par le Deal Radar · À valider", color: "hsl(24 100% 52%)", urgent: true },
                  { icon: "📬", title: "2 messages rédigés", sub: "Prêts à envoyer · Relances LinkedIn", color: "hsl(210 85% 55%)", urgent: false },
                  { icon: "🤝", title: "1 introduction en attente", sub: "Votre accord requis", color: "hsl(38 80% 55%)", urgent: true },
                  { icon: "📊", title: "Brief du matin disponible", sub: "Résumé · Priorités · Plan", color: "hsl(152 62% 45%)", urgent: false },
                ].map(({ icon, title, sub, color, urgent }) => (
                  <div key={title} className="flex items-center gap-3 p-3 rounded-xl" style={{
                    background: urgent ? `${color}12` : "hsl(218 50% 18% / 0.5)",
                    border: `1px solid ${urgent ? color + "30" : "hsl(218 40% 30% / 0.2)"}`
                  }}>
                    <span className="text-xl shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/85 text-xs font-semibold truncate">{title}</p>
                      <p className="text-white/40 text-xs truncate">{sub}</p>
                    </div>
                    {urgent && (
                      <div className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ background: color }} />
                    )}
                  </div>
                ))}
                <div className="pt-2">
                  <div className="w-full py-2.5 rounded-xl text-center text-xs font-semibold" style={{
                    background: "linear-gradient(135deg, hsl(24 100% 52%), hsl(38 100% 60%))",
                    color: "white"
                  }}>
                    Tout valider en 1 clic →
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ APPORT D'AFFAIRES — SECTION FORTE ══════════════════ */}
      <section className="py-24 bg-muted">
        <div className="container max-w-5xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/20 bg-accent/8 text-accent text-xs font-semibold mb-6">
              <TrendingUp size={12} />
              Apport d'affaires — Monétisez votre réseau
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-5">
              Votre réseau a de la valeur.<br />
              <span className="text-highlight">Commencez à le monétiser.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Pas besoin d'être commercial. Vous connaissez des gens. WIINUP MAX transforme ça en revenus réels.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              {
                step: "1",
                icon: "🎯",
                title: "Choisissez une mission",
                desc: "Des entreprises cherchent des clients. Vous connaissez peut-être quelqu'un.",
                color: "hsl(var(--primary))",
              },
              {
                step: "2",
                icon: "🤝",
                title: "Faites l'introduction",
                desc: "En quelques secondes. JARVIS vous aide à rédiger le bon message.",
                color: "hsl(24 100% 52%)",
              },
              {
                step: "3",
                icon: "💰",
                title: "Récupérez votre gain",
                desc: "L'entreprise valide. Vous recevez votre part. Simple et tracé.",
                color: "hsl(152 62% 45%)",
              },
            ].map(({ step, icon, title, desc, color }) => (
              <div key={step} className="bg-card rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: color }}>
                    {step}
                  </div>
                  <span className="text-2xl">{icon}</span>
                </div>
                <h3 className="font-semibold text-foreground text-base mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl p-6 border-2 border-accent/30 max-w-2xl mx-auto text-center">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold text-foreground text-base mb-2">OpenClaw vous dit qui contacter</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Le Deal Radar analyse les missions et suggère les contacts de votre réseau qui correspondent le mieux. Vous n'avez plus à chercher.
            </p>
            <Link to="/signup" className="btn-cta text-sm px-7 py-3 inline-flex gap-2">
              Créer mon compte apporteur gratuit <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
