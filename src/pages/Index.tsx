import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import PublicNav from "@/components/layout/PublicNav";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import FacilitateurPainSection from "@/components/landing/FacilitateurPainSection";
import MecanismeSection from "@/components/landing/MecanismeSection";
import FeaturesValueSection from "@/components/landing/FeaturesValueSection";
import HowItWorksEntrepriseSection from "@/components/landing/HowItWorksEntrepriseSection";
import FacilitateurSection from "@/components/landing/FacilitateurSection";
import ProofSection from "@/components/landing/ProofSection";
import AntiBullshitSection from "@/components/landing/AntiBullshitSection";
import PricingSection from "@/components/landing/PricingSection";
import FinalCTASection from "@/components/landing/FinalCTASection";
import { initScrollTracking, track } from "@/lib/landingTracking";
import { trackEvent } from "@/lib/analytics";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  useEffect(() => {
    trackEvent("landing_view", null, { source: "direct" });
    const cleanup = initScrollTracking();
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      {/* 1 — HERO */}
      <HeroSection />

      {/* 2 — DOULEURS ENTREPRISES */}
      <ProblemSection />

      {/* 3 — DOULEURS FACILITATEURS */}
      <FacilitateurPainSection />

      {/* 4 — MÉCANISME DOUBLE MOTEUR */}
      <MecanismeSection />

      {/* 5 — FONCTIONNALITÉS COMPLÈTES */}
      <FeaturesValueSection />

      {/* 6 — COMMENT ÇA MARCHE ENTREPRISE */}
      <HowItWorksEntrepriseSection />

      {/* 7 — FACILITATEUR */}
      <FacilitateurSection />

      {/* 8 — PREUVES */}
      <ProofSection />

      {/* 9 — QUESTIONS & RÉPONSES (objections + FAQ fusionnées) */}
      <AntiBullshitSection />

      {/* 10 — PRICING */}
      <PricingSection />

      {/* 11 — CTA FINAL */}
      <FinalCTASection />

      {/* FOOTER */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--gradient-electric)" }}
            >
              <Zap size={13} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-sm text-foreground">
              WIINUP <span style={{ color: "hsl(var(--accent))" }}>MAX</span>
            </span>
          </div>
          <div className="flex flex-col items-center md:items-start gap-0.5">
            <span className="text-xs">© {new Date().getFullYear()} VLM Consulting. Tous droits réservés.</span>
            <span className="text-[10px] text-muted-foreground/60">SIRET 835 125 089 000 28</span>
          </div>
          <div className="flex flex-wrap justify-center gap-5 text-xs">
            <Link to="/a-propos" className="hover:text-foreground transition-colors">À propos</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Tarifs</Link>
            <Link to="/cgu" className="hover:text-foreground transition-colors">CGU</Link>
            <Link to="/confidentialite" className="hover:text-foreground transition-colors">Confidentialité</Link>
            <Link to="/mentions-legales" className="hover:text-foreground transition-colors">Mentions légales</Link>
            <a href="mailto:contact@wiinupmax.com" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* STICKY CTA — Mobile only */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: "hsl(218 72% 10% / 0.97)",
          borderTop: "1px solid hsl(218 55% 22% / 0.7)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="px-4 py-3 flex gap-2">
          <Link
            to="/signup"
            className="btn-cta flex-1 flex items-center justify-center gap-2 py-3.5 text-sm"
            onClick={() => track("cta_sticky_mobile")}
          >
            Créer mon accès
            <ArrowRight size={15} />
          </Link>
          <Link
            to="/login"
            className="px-4 py-3.5 rounded-xl text-sm font-medium border border-white/15 text-white/70 hover:text-white/90 transition-colors flex items-center"
            onClick={() => track("cta_sticky_mobile", { label: "login" })}
          >
            Connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
