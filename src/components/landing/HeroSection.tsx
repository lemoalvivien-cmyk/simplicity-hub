import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Shield, TrendingUp, Users } from "lucide-react";
import LaunchQuotaBanner from "@/components/landing/LaunchQuotaBanner";
import { track } from "@/lib/landingTracking";

const trustItems = [
  { icon: CheckCircle2, label: "Introductions traçées" },
  { icon: Shield, label: "Gains protégés" },
  { icon: TrendingUp, label: "Résultats mesurables" },
];

export default function HeroSection() {
  return (
    <section className="hero-bg pt-20 pb-16 md:pt-32 md:pb-28 relative overflow-hidden">
      {/* Atmospheric glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 10%, hsl(218 72% 32% / 0.35) 0%, transparent 65%)",
        }}
        aria-hidden="true"
      />

      <div className="container max-w-3xl relative z-10">
        {/* Urgency banner */}
        <div className="flex justify-center mb-7">
          <LaunchQuotaBanner variant="hero" />
        </div>

        {/* Main headline */}
        <div className="text-center mb-10">
          <h1 className="font-display font-bold text-white leading-[1.08] tracking-tight mb-6">
            <span
              className="block text-[clamp(2.4rem,7vw,4rem)]"
              style={{
                background: "linear-gradient(135deg, hsl(24 100% 68%), hsl(38 100% 74%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Trouvez vos prochains clients.
            </span>
            <span className="block text-[clamp(1.55rem,4.5vw,2.6rem)] text-white/85 mt-3 font-semibold">
              Via votre réseau. Via l'IA.
              <br className="hidden sm:block" />
              {" "}Dans un seul cockpit.
            </span>
          </h1>

          <p className="text-[clamp(0.95rem,2.2vw,1.1rem)] text-white/75 mb-5 max-w-lg mx-auto leading-[1.75] font-light px-2">
            Wiinup Max combine{" "}
            <span className="text-white/90 font-medium">prospection pilotée par IA</span> et{" "}
            <span className="text-white/90 font-medium">apport d'affaires structuré</span>.
            Chaque opportunité est tracée. Chaque résultat est mesurable.
          </p>

          <p className="text-[clamp(1rem,2.5vw,1.15rem)] text-white font-medium mb-9 max-w-lg mx-auto leading-[1.7] px-2 text-center" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
            Avec Wiinup, augmentez vos revenus en toute sécurité, sans investir, sans charge mentale et sans changer vos habitudes.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-3 mb-9 px-2">
            <Link
              to="/signup"
              className="btn-cta text-base px-9 py-4 gap-2 w-full sm:w-auto"
              onClick={() => track("cta_hero_enterprise")}
            >
              Créer mon compte — gratuit
              <ArrowRight size={17} />
            </Link>
            <Link
              to="/signup"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold border border-white/20 text-white/80 hover:text-white hover:border-white/35 transition-all duration-200 w-full sm:w-auto justify-center"
              onClick={() => track("cta_hero_facilitateur")}
            >
              <Users size={15} />
              Devenir facilitateur — Gratuit
            </Link>
            <p className="text-white/55 text-xs mt-1">
              Premières recommandations IA sous 5 minutes
            </p>
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-white/60 text-xs">
            {trustItems.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon size={10} aria-hidden="true" /> {label}
              </span>
            ))}
          </div>
        </div>

        {/* Dashboard preview mockup */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            boxShadow:
              "0 40px 100px hsl(218 72% 5% / 0.75), 0 0 0 1px hsl(218 72% 45% / 0.1), inset 0 1px 0 hsl(218 72% 55% / 0.08)",
            background: "hsl(218 65% 11% / 0.98)",
          }}
        >
          {/* Browser chrome */}
          <div
            className="flex items-center gap-2 px-5 py-3.5 border-b"
            style={{
              background: "hsl(218 72% 9% / 0.95)",
              borderColor: "hsl(218 55% 20% / 0.5)",
            }}
          >
            <div className="flex gap-1.5" aria-hidden="true">
              {["hsl(0 68% 52%)", "hsl(38 88% 52%)", "hsl(120 52% 42%)"].map((c, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              ))}
            </div>
            <div
              className="flex-1 mx-4 h-5 rounded-md flex items-center px-2.5 gap-1.5"
              style={{ background: "hsl(218 50% 18% / 0.6)" }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: "hsl(152 55% 40%)" }} aria-hidden="true" />
              <span className="text-white/25 text-[10px] font-mono">wiinupmax.app</span>
            </div>
          </div>

          {/* KPI grid */}
          <div className="p-4 md:p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Missions actives", value: "3", color: "hsl(218 72% 58%)", live: true },
              { label: "Intros reçues", value: "12", color: "hsl(152 62% 48%)", live: true },
              { label: "En validation", value: "4", color: "hsl(38 95% 52%)", live: false },
              { label: "Gains tracés", value: "2 800 €", color: "hsl(24 100% 62%)", live: false },
            ].map(({ label, value, color, live }) => (
              <div
                key={label}
                className="rounded-xl p-3.5 md:p-4"
                style={{
                  background: "hsl(218 55% 15% / 0.65)",
                  border: `1px solid ${color}22`,
                }}
              >
                <div className="flex items-center gap-1.5 mb-2.5">
                  {live && (
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                      style={{ background: color }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="text-[10px] font-medium text-white/65 leading-tight">{label}</span>
                </div>
                <p className="font-display font-bold text-lg md:text-xl leading-none" style={{ color }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
          <p className="text-center text-white/20 text-[9px] px-4 pb-3 pt-1">
            Interface illustrative — données de démonstration
          </p>
        </div>
      </div>
    </section>
  );
}
