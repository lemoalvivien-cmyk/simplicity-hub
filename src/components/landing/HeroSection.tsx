import { Link } from "react-router-dom";
import { ArrowRight, Brain, Zap, Shield, Smartphone, Moon, Bot, CheckCircle2, ChevronRight } from "lucide-react";

export default function HeroSection() {
  return (
    <>
      {/* ══ HERO PRINCIPAL ══════════════════════════════════════ */}
      <section className="hero-bg py-20 md:py-32 relative overflow-hidden">
        {/* Glow décoratif */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 30%, hsl(218 72% 30% / 0.25) 0%, transparent 70%)"
        }} />

        <div className="container max-w-4xl text-center relative z-10">
          {/* Badge IA */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/5 text-white/75 text-xs font-semibold mb-10 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            OpenClaw actif — Agents commerciaux IA
          </div>

          {/* ACCROCHE PRINCIPALE */}
          <h1 className="font-display font-bold text-white leading-none tracking-tight mb-6">
            <span className="block text-4xl md:text-5xl lg:text-6xl mb-3" style={{
              background: "linear-gradient(135deg, hsl(24 100% 65%), hsl(38 100% 70%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              Va te coucher,
            </span>
            <span className="block text-4xl md:text-5xl lg:text-6xl text-white">
              je prospecte pendant
            </span>
            <span className="block text-4xl md:text-5xl lg:text-6xl text-white">
              que tu dors.
            </span>
          </h1>

          {/* Sous-titre */}
          <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            WIINUP MAX est le premier Agent OS commercial autonome.<br className="hidden md:block" />
            Vos agents prospectent, préparent et vous alertent — vous gardez le contrôle.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/pricing" className="btn-cta text-base px-8 py-4 gap-2">
              Activer mes agents
              <ArrowRight size={18} />
            </Link>
            <a
              href="#ia-autonome"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white/70 border border-white/20 font-semibold text-base hover:bg-white/8 transition-colors"
            >
              Voir comment ça marche
              <ChevronRight size={16} />
            </a>
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-white/35 text-xs">
            <span>✓ OpenClaw — moteur open source</span>
            <span className="hidden sm:block">·</span>
            <span>✓ Vous gardez le contrôle</span>
            <span className="hidden sm:block">·</span>
            <span>✓ Offre lancement 99 € / an</span>
            <span className="hidden sm:block">·</span>
            <span>✓ Installable sur mobile</span>
          </div>
        </div>

        {/* Agent status bar — mockup */}
        <div className="container max-w-5xl mt-16 px-4 relative z-10">
          <div className="rounded-2xl overflow-hidden border border-white/10" style={{
            boxShadow: "0 32px 80px hsl(218 72% 8% / 0.7), 0 0 0 1px hsl(218 72% 40% / 0.08)"
          }}>
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/8" style={{ background: "hsl(218 72% 10% / 0.9)" }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: "hsl(0 70% 55%)" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "hsl(38 90% 55%)" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "hsl(120 55% 45%)" }} />
              </div>
              <div className="flex-1 mx-4 h-6 rounded-md flex items-center px-3" style={{ background: "hsl(218 50% 20% / 0.5)" }}>
                <span className="text-white/30 text-xs">wiinupmax.app/agents</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "hsl(120 55% 50%)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                OpenClaw actif
              </div>
            </div>
            {/* Agents preview */}
            <div className="p-6 md:p-8 grid md:grid-cols-3 gap-4" style={{ background: "hsl(218 65% 12% / 0.95)" }}>
              {[
                { name: "Stratège", status: "Analyse dossier", color: "hsl(210 85% 55%)", pulse: true },
                { name: "Sourcing", status: "Identifie 3 cibles", color: "hsl(152 62% 45%)", pulse: true },
                { name: "Messages", status: "Rédige relances", color: "hsl(24 100% 52%)", pulse: true },
                { name: "Exécution", status: "En attente", color: "hsl(38 80% 55%)", pulse: false },
                { name: "Qualification", status: "En attente", color: "hsl(38 80% 55%)", pulse: false },
                { name: "Contrôle", status: "⚡ Kill switch prêt", color: "hsl(var(--accent))", pulse: false },
              ].map(({ name, status, color, pulse }) => (
                <div key={name} className="rounded-xl p-4 flex items-center gap-3" style={{ background: "hsl(218 50% 18% / 0.6)", border: "1px solid hsl(218 40% 30% / 0.3)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                    <Bot size={14} style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white/80 text-xs font-semibold">{name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {pulse && <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: color }} />}
                      <p className="text-white/40 text-xs truncate">{status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION IA AUTONOME ════════════════════════════════ */}
      <section id="ia-autonome" className="py-24 relative overflow-hidden" style={{ background: "hsl(218 65% 8%)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 100%, hsl(24 100% 52% / 0.08) 0%, transparent 70%)"
        }} />

        <div className="container max-w-4xl relative z-10">
          {/* Tagline centrale */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/20 bg-orange-500/8 text-orange-400/80 text-xs font-semibold mb-8">
              <Moon size={12} />
              Agent OS — Prospection autonome
            </div>
            <blockquote className="font-display font-bold text-white text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
              « Va te coucher,<br />
              <span style={{
                background: "linear-gradient(135deg, hsl(24 100% 60%), hsl(38 100% 65%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}>je prospecte pendant<br />que tu dors. »</span>
            </blockquote>
            <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed">
              OpenClaw est le cerveau de vos agents. Il comprend votre business, prépare le travail, alerte sur ce qui compte — vous validez, vous décidez.
            </p>
          </div>

          {/* Étapes du flux agentique */}
          <div className="grid md:grid-cols-5 gap-3 mb-16 items-start">
            {[
              { step: "1", icon: "📋", title: "Vous remplissez votre dossier", sub: "Une seule fois" },
              { step: "→", icon: null, title: null, sub: null },
              { step: "2", icon: "🧠", title: "OpenClaw comprend", sub: "Votre cible, vos règles" },
              { step: "→", icon: null, title: null, sub: null },
              { step: "3", icon: "🤖", title: "Les agents se mettent au travail", sub: "Pendant que vous dormez" },
            ].map((item, i) => item.icon ? (
              <div key={i} className="rounded-2xl p-5 text-center" style={{ background: "hsl(218 50% 15% / 0.6)", border: "1px solid hsl(218 40% 30% / 0.2)" }}>
                <div className="text-3xl mb-3">{item.icon}</div>
                <p className="text-white/85 text-sm font-semibold mb-1">{item.title}</p>
                <p className="text-white/35 text-xs">{item.sub}</p>
              </div>
            ) : (
              <div key={i} className="hidden md:flex items-center justify-center pt-8">
                <ArrowRight size={20} style={{ color: "hsl(24 100% 52% / 0.5)" }} />
              </div>
            ))}
          </div>

          {/* Suite du flux */}
          <div className="grid md:grid-cols-3 gap-4 mb-16">
            {[
              { icon: "📬", title: "Les validations remontent", sub: "Rien de sensible ne part sans votre accord", color: "hsl(38 90% 55%)" },
              { icon: "⚡", title: "Vous gardez le contrôle", sub: "Kill switch global disponible à tout moment", color: "hsl(210 85% 55%)" },
              { icon: "📈", title: "Résultats dans l'app", sub: "Actions, campagnes, opportunités créées automatiquement", color: "hsl(152 62% 45%)" },
            ].map(({ icon, title, sub, color }) => (
              <div key={title} className="rounded-2xl p-6 text-center" style={{ background: "hsl(218 50% 15% / 0.4)", border: `1px solid ${color}20` }}>
                <div className="text-3xl mb-3">{icon}</div>
                <p className="font-semibold mb-1.5" style={{ color }}>{title}</p>
                <p className="text-white/40 text-sm leading-relaxed">{sub}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link to="/pricing" className="btn-cta text-base px-10 py-4 gap-2 inline-flex">
              Activer mes agents maintenant
              <ArrowRight size={18} />
            </Link>
            <p className="text-white/30 text-xs mt-4">OpenClaw · Self-hosted · Open source · Contrôlé par vous</p>
          </div>
        </div>
      </section>

      {/* ══ GARANTIES / VALEURS ════════════════════════════════ */}
      <section className="py-16 bg-background border-t border-border">
        <div className="container max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Brain, label: "OpenClaw", sub: "Cerveau open source", color: "hsl(var(--primary))" },
              { icon: Shield, label: "Vous contrôlez", sub: "Kill switch & validations", color: "hsl(152 62% 45%)" },
              { icon: Smartphone, label: "App mobile", sub: "Installable sur iOS & Android", color: "hsl(24 100% 52%)" },
              { icon: Zap, label: "Toujours simple", sub: "Pas de jargon technique", color: "hsl(38 90% 55%)" },
            ].map(({ icon: Icon, label, sub, color }) => (
              <div key={label} className="rounded-2xl p-5 text-center card-surface">
                <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <p className="font-semibold text-foreground text-sm">{label}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
