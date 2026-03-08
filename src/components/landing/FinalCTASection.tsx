import { Link } from "react-router-dom";
import { ArrowRight, Users } from "lucide-react";

export default function FinalCTASection() {
  return (
    <section className="hero-bg py-24 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 60%, hsl(24 100% 40% / 0.15) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div className="container max-w-2xl text-center relative z-10">
        <p
          className="text-xs font-bold uppercase tracking-widest mb-5"
          style={{ color: "hsl(24 100% 65%)" }}
        >
          Le moment de décider
        </p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
          Arrêtez de séparer<br />
          <span
            style={{
              background: "linear-gradient(135deg, hsl(24 100% 60%), hsl(38 100% 68%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            prospection, réseau et suivi.
          </span>
        </h2>
        <p className="text-white/55 text-lg mb-3 max-w-md mx-auto leading-relaxed">
          Mettez-les enfin dans le même cockpit.
        </p>
        <p className="text-white/35 text-sm mb-10">
          Un système. Deux moteurs. Des résultats mesurables.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            to="/pricing"
            className="btn-cta text-base px-10 py-4 gap-2 w-full sm:w-auto flex items-center justify-center"
          >
            Entreprise — Je démarre
            <ArrowRight size={18} />
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white/70 border border-white/20 font-medium text-sm hover:bg-white/8 transition-colors w-full sm:w-auto"
          >
            <Users size={14} />
            Facilitateur — Accès gratuit
          </Link>
        </div>

        <p className="mt-6 text-white/30 text-xs">
          Sans engagement · Annulation libre · Aide incluse à chaque étape
        </p>
      </div>
    </section>
  );
}
