import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Users } from "lucide-react";
import { track } from "@/lib/landingTracking";

const FinalCTASection = forwardRef<HTMLElement>((_, ref) => {
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
          La décision qui change votre acquisition
        </p>
        <h2 className="font-display text-[clamp(1.9rem,5.5vw,3.1rem)] font-bold text-white mb-5 leading-[1.1]">
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
        <p className="text-white/52 text-base mb-2 max-w-sm mx-auto leading-relaxed">
          Mettez-les enfin dans le même cockpit.
        </p>
        <p className="text-white/28 text-sm mb-10">
          Un système. Deux moteurs. Des résultats mesurables.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            to="/pricing"
            className="btn-cta text-base px-9 py-4 gap-2 w-full sm:w-auto"
            onClick={() => track("cta_final_enterprise")}
          >
            Activer mon acquisition
            <ArrowRight size={17} />
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-white/55 border border-white/12 font-medium text-sm hover:border-white/28 hover:text-white/78 transition-all duration-200 w-full sm:w-auto"
            onClick={() => track("cta_final_facilitator")}
          >
            <Users size={14} className="shrink-0" />
            Monétiser mon réseau — Gratuit
          </Link>
        </div>

        <p className="mt-6 text-white/22 text-xs">
          Sans engagement · Annulation libre · Support inclus à chaque étape
        </p>
      </div>
    </section>
  );
}
