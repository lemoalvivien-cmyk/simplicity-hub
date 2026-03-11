import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { track } from "@/lib/landingTracking";

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
        <p className="text-white/90 text-base mb-2 max-w-sm mx-auto leading-relaxed">
          Mettez-les enfin dans le même cockpit.
        </p>
        <p className="text-white/75 text-sm mb-10">
          Un système. Deux moteurs. Des résultats mesurables.
        </p>

        <div className="flex flex-col items-center gap-3">
          <Link
            to="/pricing"
            className="btn-cta text-base px-9 py-4 gap-2 w-full sm:w-auto"
            onClick={() => track("cta_final_enterprise")}
          >
            Démarrer ma première mission — 99 €/an
            <ArrowRight size={17} />
          </Link>
          <span className="flex items-center gap-1.5 text-white/60 text-xs">
            <ShieldCheck size={12} aria-hidden="true" />
            Satisfait ou remboursé 30 jours
          </span>
        </div>

        <p className="mt-5 text-white/50 text-xs">
          Sans engagement · Annulation libre · Support inclus à chaque étape
        </p>
      </div>
    </section>
  );
}
