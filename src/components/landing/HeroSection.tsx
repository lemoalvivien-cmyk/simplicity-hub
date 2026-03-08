import { Link } from "react-router-dom";
import { ArrowRight, Users, CheckCircle2, Shield, TrendingUp } from "lucide-react";
import LaunchQuotaBanner from "@/components/landing/LaunchQuotaBanner";

const trustItems = [
  { icon: CheckCircle2, label: "Introductions traçées" },
  { icon: Shield, label: "Gains protégés" },
  { icon: TrendingUp, label: "Résultats mesurables" },
];

export default function HeroSection() {
  return (
    <section className="hero-bg pt-20 pb-16 md:pt-28 md:pb-24 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 20%, hsl(218 72% 30% / 0.3) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="container max-w-4xl relative z-10">
        {/* Urgency banner */}
        <div className="flex justify-center mb-6">
          <LaunchQuotaBanner variant="hero" />
        </div>

        {/* Main headline */}
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-white leading-tight tracking-tight mb-5">
            <span
              className="block text-4xl md:text-5xl lg:text-6xl"
              style={{
                background: "linear-gradient(135deg, hsl(24 100% 65%), hsl(38 100% 72%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Trouvez vos prochains clients.
            </span>
            <span className="block text-3xl md:text-4xl lg:text-5xl text-white mt-2">
              Via votre réseau. Via l'IA. Dans un seul cockpit.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
            Wiinup Max combine <strong className="text-white/85 font-semibold">prospection pilotée par IA</strong> et{" "}
            <strong className="text-white/85 font-semibold">apport d'affaires structuré</strong> dans un système unique.
            Chaque opportunité est tracée. Chaque résultat est mesurable.
          </p>

          {/* Dual CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
            <Link
              to="/pricing"
              className="btn-cta text-base px-10 py-4 gap-2 w-full sm:w-auto flex items-center justify-center"
            >
              Je veux plus de clients
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white/70 border border-white/20 font-medium text-sm hover:bg-white/8 transition-colors w-full sm:w-auto"
            >
              <Users size={14} />
              Je veux monétiser mon réseau — Gratuit
            </Link>
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-white/35 text-xs">
            {trustItems.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon size={11} className="text-white/40" aria-hidden="true" /> {label}
              </span>
            ))}
          </div>
        </div>

        {/* Visual mockup — the cockpit */}
        <div
          className="rounded-2xl overflow-hidden border border-white/10 mt-10"
          style={{
            boxShadow: "0 32px 80px hsl(218 72% 8% / 0.7), 0 0 0 1px hsl(218 72% 40% / 0.08)",
            background: "hsl(218 65% 12% / 0.95)",
          }}
        >
          {/* Browser chrome */}
          <div
            className="flex items-center gap-2 px-5 py-3 border-b border-white/8"
            style={{ background: "hsl(218 72% 10% / 0.9)" }}
          >
            <div className="flex gap-1.5" aria-hidden="true">
              <div className="w-3 h-3 rounded-full" style={{ background: "hsl(0 70% 55%)" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "hsl(38 90% 55%)" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "hsl(120 55% 45%)" }} />
            </div>
            <div
              className="flex-1 mx-4 h-5 rounded flex items-center px-3"
              style={{ background: "hsl(218 50% 20% / 0.5)" }}
            >
              <span className="text-white/30 text-xs">wiinupmax.app / cockpit</span>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="p-5 md:p-6 grid md:grid-cols-4 gap-3">
            {[
              { label: "Missions actives", value: "3", color: "hsl(218 72% 55%)", dot: true },
              { label: "Intros reçues", value: "12", color: "hsl(152 62% 45%)", dot: true },
              { label: "En validation", value: "4", color: "hsl(38 95% 50%)", dot: false },
              { label: "Gains traçés", value: "2 800 €", color: "hsl(24 100% 60%)", dot: false },
            ].map(({ label, value, color, dot }) => (
              <div
                key={label}
                className="rounded-xl p-4"
                style={{
                  background: "hsl(218 50% 16% / 0.7)",
                  border: `1px solid ${color}20`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {dot && (
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: color }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="text-xs font-medium text-white/45">{label}</span>
                </div>
                <p className="font-display font-bold text-xl" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
