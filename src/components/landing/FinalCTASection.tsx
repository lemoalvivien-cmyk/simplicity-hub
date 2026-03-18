import { Link } from "react-router-dom";
import { ArrowRight, Zap, Lock } from "lucide-react";
import { track } from "@/lib/landingTracking";
import { useFounderSlots } from "@/hooks/useFounderSlots";
import SlotCounter from "@/components/landing/SlotCounter";
import GuaranteeBadge from "@/components/landing/GuaranteeBadge";
import { CLOSED_BETA } from "@/lib/betaConfig";

export default function FinalCTASection() {
  const { isSoldOut, isUrgent, remaining } = useFounderSlots();

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

        {/* Live slot counter */}
        <div className="flex justify-center mb-5">
          <SlotCounter variant="hero" />
        </div>

        <p className="text-white/80 text-base mb-6 max-w-sm mx-auto leading-relaxed font-medium">
          Rejoignez les entrepreneurs qui ont déjà choisi la simplicité et la tranquillité.
        </p>

        <div className="flex flex-col items-center gap-3 mb-5">
          {CLOSED_BETA ? (
            <div
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold border w-full sm:w-auto"
              style={{ borderColor: "hsl(var(--primary-glow) / 0.4)", color: "hsl(var(--primary-glow))" }}
            >
              <Lock size={15} />
              Bêta privée — inscrivez-vous sur liste d'attente ci-dessus
            </div>
          ) : isSoldOut ? (
            <div
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold border cursor-not-allowed opacity-60 w-full sm:w-auto"
              style={{ borderColor: "hsl(218 20% 60% / 0.3)", color: "hsl(218 20% 70%)" }}
            >
              <Lock size={15} />
              Offre de lancement terminée — Merci d'avoir participé
            </div>
          ) : (
            <Link
              to="/checkout"
              className="btn-cta text-base px-9 py-4 gap-2 w-full sm:w-auto font-bold"
              onClick={() => track("cta_final_enterprise")}
            >
              <Zap size={16} />
              Je veux mes premiers clients dès demain — 99 € TTC/an
              <ArrowRight size={17} />
            </Link>
          )}
          <GuaranteeBadge className="text-white/70" />
        </div>

        <p className="text-white/50 text-xs mb-6">
          Paiement sécurisé par Stripe · RGPD · Facture envoyée immédiatement
        </p>
      </div>
    </section>
  );
}
