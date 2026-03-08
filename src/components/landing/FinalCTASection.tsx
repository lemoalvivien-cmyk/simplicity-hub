import { Link } from "react-router-dom";
import { ArrowRight, Users } from "lucide-react";

export default function FinalCTASection() {
  return (
    <section className="hero-bg py-24 md:py-32 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 70%, hsl(24 100% 40% / 0.12) 0%, transparent 65%)",
        }}
        aria-hidden="true"
      />
      <div className="container max-w-xl text-center relative z-10 px-4">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.15em] mb-5"
          style={{ color: "hsl(24 100% 62%)" }}
        >
          Le moment de décider
        </p>
        <h2 className="font-display text-[clamp(2rem,6vw,3.25rem)] font-bold text-white mb-5 leading-[1.1]">
          Arrêtez de séparer<br />
          <span
            style={{
              background: "linear-gradient(135deg, hsl(24 100% 62%), hsl(38 100% 70%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            prospection, réseau et suivi.
          </span>
        </h2>
        <p className="text-white/50 text-base mb-2 max-w-sm mx-auto leading-relaxed">
          Mettez-les enfin dans le même cockpit.
        </p>
        <p className="text-white/30 text-sm mb-10">
          Un système. Deux moteurs. Des résultats mesurables.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            to="/pricing"
            className="btn-cta text-base px-9 py-4 gap-2 w-full sm:w-auto"
          >
            Entreprise — Je démarre
            <ArrowRight size={17} />
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-white/60 border border-white/15 font-medium text-sm hover:border-white/30 hover:text-white/80 transition-all duration-200 w-full sm:w-auto"
          >
            <Users size={14} className="shrink-0" />
            Facilitateur — Accès gratuit
          </Link>
        </div>

        <p className="mt-6 text-white/25 text-xs">
          Sans engagement · Annulation libre · Aide incluse à chaque étape
        </p>
      </div>
    </section>
  );
}
