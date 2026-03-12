import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, FlaskConical } from "lucide-react";
import { track } from "@/lib/landingTracking";

const BETA_NOTE =
  "Bêta privée – fonctionnalités IA en cours d'activation réelle avec API externe. Interface actuellement en mode illustratif.";

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
        <p className="text-white/75 text-sm mb-4">
          Prospection IA assistée + réseau humain structuré. OpenClaw (en connexion réelle) et
          facilitateurs actifs travaillent en parallèle — des résultats mesurables.
        </p>

        <div className="flex flex-col items-center gap-3 mb-6">
          <Link
            to="/signup"
            className="btn-cta text-base px-9 py-4 gap-2 w-full sm:w-auto"
            onClick={() => track("cta_final_enterprise")}
          >
            Démarrer ma première mission
            <ArrowRight size={17} />
          </Link>
          <span className="flex items-center gap-1.5 text-white/60 text-xs">
            <ShieldCheck size={12} aria-hidden="true" />
            Satisfait ou remboursé 30 jours
          </span>
        </div>

        <p className="text-white/70 text-xs mb-6">
          Sans engagement · Annulation libre · Support inclus à chaque étape
        </p>

        {/* Beta disclaimer */}
        <div
          className="rounded-xl px-4 py-3 flex items-start gap-2.5 text-left"
          style={{
            background: "hsl(38 95% 52% / 0.08)",
            border: "1px solid hsl(38 95% 52% / 0.2)",
          }}
        >
          <FlaskConical size={13} style={{ color: "hsl(38 95% 52%)" }} className="shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[11px] leading-relaxed" style={{ color: "hsl(38 95% 52%)" }}>
            {BETA_NOTE}
          </p>
        </div>
      </div>
    </section>
  );
}
