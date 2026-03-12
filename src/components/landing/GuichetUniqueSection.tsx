import { Brain, Target, Users, Send, TrendingUp, ShieldCheck, Shield, Smartphone, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const engines = [
  {
    icon: Brain,
    color: "hsl(218 72% 55%)",
    bg: "hsl(218 72% 55% / 0.12)",
    title: "OpenClaw — Prospection IA assistée",
    desc: "Suggestions de cibles et brouillons de messages. En connexion réelle avec API externe.",
    tag: "IA assistée",
  },
  {
    icon: Target,
    color: "hsl(24 100% 52%)",
    bg: "hsl(24 100% 52% / 0.12)",
    title: "Suivi de prospection",
    desc: "Contacts, listes, actions. Tout organisé et visible dans un seul tableau de bord.",
    tag: "Centralisé",
  },
  {
    icon: Users,
    color: "hsl(38 90% 55%)",
    bg: "hsl(38 90% 55% / 0.12)",
    title: "Réseau d'apporteurs",
    desc: "Des facilitateurs recommandent vos missions à leurs contacts qualifiés.",
    tag: "Réseau humain",
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
    icon: ShieldCheck,
    color: "hsl(210 85% 55%)",
    bg: "hsl(210 85% 55% / 0.12)",
    title: "Assistant IA contextuel",
    desc: "Suggestions de prochaine action selon l'état de votre pipeline.",
    tag: "Suggestions",
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
              Prospection IA assistée + réseau humain structuré. OpenClaw (en connexion réelle) et facilitateurs actifs travaillent en parallèle. Chaque opportunité est tracée. Chaque résultat est mesurable.
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

          <div className="text-center mb-6">
            <Link to="/pricing" className="btn-cta text-base px-10 py-4 gap-2 inline-flex">
              Accéder à tout ça maintenant
              <ArrowRight size={18} />
            </Link>
            <p className="text-muted-foreground text-sm mt-3">Entreprise à partir de 99 € / an · Apporteur toujours gratuit</p>
          </div>

        </div>
      </section>

      {/* ══ COMMENT ÇA MARCHE — APPORT D'AFFAIRES ══════════════════ */}
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
              Pas besoin d'être commercial. Vous connaissez des gens. WIINUP MAX structure et trace ça en revenus réels.
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
                desc: "En quelques secondes. L'interface vous aide à rédiger le bon message.",
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
            <h3 className="font-semibold text-foreground text-base mb-2">OpenClaw vous suggère qui contacter</h3>
            <p className="text-muted-foreground text-sm mb-4">
              L'assistant IA analyse les missions et suggère les contacts de votre réseau qui correspondent le mieux. Vous gardez le contrôle de chaque envoi.
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
