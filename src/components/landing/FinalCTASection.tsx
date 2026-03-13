import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Zap, Flame } from "lucide-react";
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
          Prêt à transformer<br />
          <span
            style={{
              background: "linear-gradient(135deg, hsl(24 100% 62%), hsl(38 100% 70%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            vos journées en vraies opportunités ?
          </span>
        </h2>

        {/* Pricing urgency block */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl mb-5 border"
          style={{
            background: "hsl(38 100% 52% / 0.1)",
            borderColor: "hsl(38 100% 52% / 0.3)",
          }}
        >
          <Flame size={14} style={{ color: "hsl(38 100% 65%)" }} />
          <p className="text-sm font-semibold text-white/90">
            Offre de lancement :{" "}
            <span style={{ color: "hsl(38 100% 70%)" }}>99 € TTC/an au lieu de 990 €</span>
            {" "}— premier arrivé premier servi
          </p>
        </div>

        <p className="text-white/90 text-base mb-5 max-w-sm mx-auto leading-relaxed font-medium">
          Prospection IA assistée + réseau humain structuré. OpenClaw et facilitateurs actifs
          travaillent en parallèle. Chaque opportunité est tracée. Chaque résultat est mesurable.
        </p>

        <div className="flex flex-col items-center gap-3 mb-5">
          <Link
            to="/signup"
            className="btn-cta text-base px-9 py-4 gap-2 w-full sm:w-auto font-bold"
            onClick={() => track("cta_final_enterprise")}
          >
            <Zap size={16} />
            Activer maintenant — 99 € TTC/an
            <ArrowRight size={17} />
          </Link>
          <span className="flex items-center gap-1.5 text-white/60 text-xs">
            <ShieldCheck size={12} aria-hidden="true" />
            Satisfait ou remboursé 30 jours
          </span>
        </div>

        <p className="text-white/70 text-xs mb-6">
          Sans engagement · Annulation libre · Support inclus · Accès immédiat
        </p>
      </div>
    </section>
  );
}
