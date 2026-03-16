/**
 * PassiveSectionLanding — Section "Facilitateur" pour la landing
 * "Monétisez votre réseau."
 */
import { Link } from "react-router-dom";
import { ArrowRight, Upload, Share2, Link2, TrendingUp, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: Upload,
    num: "01",
    title: "Importez votre réseau",
    desc: "CSV ou Excel en 30 secondes. Vos meilleurs contacts sont disponibles dans le système.",
    color: "hsl(218 72% 55%)",
  },
  {
    icon: Share2,
    num: "02",
    title: "Choisissez une offre",
    desc: "Parcourez les offres des entreprises. Des brouillons de messages sont prêts à personnaliser selon votre réseau.",
    color: "hsl(24 100% 52%)",
  },
  {
    icon: Link2,
    num: "03",
    title: "Partagez avec un lien traqué",
    desc: "WhatsApp, email, LinkedIn — vous copiez et envoyez. Chaque clic est suivi.",
    color: "hsl(152 62% 45%)",
  },
  {
    icon: TrendingUp,
    num: "04",
    title: "Suivez et gagnez",
    desc: "Clic → intérêt → introduction → validation → gain. Tout est traçable et prouvé.",
    color: "hsl(38 90% 55%)",
  },
];

const proofPoints = [
  "Votre réseau génère des opportunités tracées",
  "Des brouillons de messages prêts à personnaliser",
  "Chaque introduction est certifiée et prouvée",
  "100% gratuit pour les facilitateurs — toujours",
];

export default function PassiveSectionLanding() {
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "hsl(218 65% 8%)" }}>
      {/* Glow décoratif */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 70% 60% at 30% 50%, hsl(24 100% 52% / 0.07) 0%, transparent 70%)"
      }} />

      <div className="container max-w-5xl relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/5 text-white/75 text-xs font-semibold mb-8">
            Réseau structuré & traçable
          </div>
          <h2 className="font-display font-bold text-white text-3xl md:text-4xl lg:text-5xl leading-tight mb-5">
            Monétisez votre réseau<br />
            <span style={{
              background: "linear-gradient(135deg, hsl(24 100% 65%), hsl(38 100% 70%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>avec traçabilité complète.</span>
          </h2>
          <p className="text-white/55 text-lg max-w-2xl mx-auto leading-relaxed">
            Réseau humain structuré. Vos facilitateurs actifs vous apportent des introductions qualifiées en parallèle de votre prospection. Chaque opportunité est tracée. Chaque résultat est mesurable.
          </p>
        </div>

        {/* Étapes */}
        <div className="grid md:grid-cols-4 gap-4 mb-16">
          {steps.map(({ icon: Icon, num, title, desc, color }) => (
            <div key={num} className="rounded-2xl p-5" style={{
              background: "hsl(218 50% 14% / 0.7)",
              border: `1px solid ${color}20`
            }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <span className="font-display font-bold text-white/30 text-sm">{num}</span>
              </div>
              <p className="font-semibold text-white text-sm mb-2">{title}</p>
              <p className="text-white/45 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Proof points + CTA */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-4">Ce que vous obtenez</p>
            <ul className="space-y-3">
              {proofPoints.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <CheckCircle2 size={16} style={{ color: "hsl(152 62% 45%)" }} className="shrink-0 mt-0.5" />
                  <span className="text-white/80 text-sm">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mini mockup */}
          <div className="rounded-2xl p-5" style={{
            background: "hsl(218 50% 16% / 0.8)",
            border: "1px solid hsl(218 40% 30% / 0.3)"
          }}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: "hsl(218 40% 25% / 0.4)" }}>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/50 text-xs font-semibold">Wiinup Max · Brouillon prêt à personnaliser</span>
            </div>
            <div className="space-y-2.5">
              {[
  {
    icon: "🤝",
    label: "WhatsApp court",
    status: "✓ Brouillon",
  },
                { icon: "📧", label: "Email professionnel", status: "✓ Brouillon" },
                { icon: "🔗", label: "Lien traqué unique", status: "✓ Actif" },
                { icon: "📊", label: "Suivi des clics", status: "3 clics" },
              ].map(({ icon, label, status }) => (
                <div key={label} className="flex items-center justify-between gap-3 p-3 rounded-xl" style={{ background: "hsl(218 40% 20% / 0.5)" }}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{icon}</span>
                    <span className="text-white/75 text-xs font-medium">{label}</span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "hsl(152 62% 50%)" }}>{status}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-xl flex items-center gap-2" style={{ background: "hsl(24 100% 52% / 0.1)", border: "1px solid hsl(24 100% 52% / 0.2)" }}>
              <p className="text-xs" style={{ color: "hsl(24 80% 65%)" }}>
                Vous validez chaque message avant envoi. Rien ne part sans votre accord.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link to="/signup" className="btn-cta text-base px-10 py-4 gap-2 inline-flex">
            Créer mon compte gratuit
            <ArrowRight size={18} />
          </Link>
          <p className="text-white/30 text-xs mt-3">100% gratuit pour les facilitateurs · Toujours</p>
        </div>
      </div>
    </section>
  );
}
