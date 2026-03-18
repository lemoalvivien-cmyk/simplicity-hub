import { useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";
import PublicNav from "@/components/layout/PublicNav";
import ProblemSection from "@/components/landing/ProblemSection";
import FacilitateurPainSection from "@/components/landing/FacilitateurPainSection";
import MecanismeSection from "@/components/landing/MecanismeSection";
import FeaturesValueSection from "@/components/landing/FeaturesValueSection";
import HowItWorksEntrepriseSection from "@/components/landing/HowItWorksEntrepriseSection";
import FacilitateurSection from "@/components/landing/FacilitateurSection";
// SECTION CRÉER EMPLOI — RESTAURÉE EN #1 BUSINESS CRITIQUE (photo nouvelle + texte exact screenshot)
import CreerEmploiCTASection from "@/components/landing/CreerEmploiCTASection";
import ProofSection from "@/components/landing/ProofSection";
import AntiBullshitSection from "@/components/landing/AntiBullshitSection";
import PricingSection from "@/components/landing/PricingSection";
import FinalCTASection from "@/components/landing/FinalCTASection";
import WhyDifferentSection from "@/components/landing/WhyDifferentSection";
import GuaranteeBadge from "@/components/landing/GuaranteeBadge";
import ClosedBetaBanner from "@/components/landing/ClosedBetaBanner";
import { initScrollTracking, track } from "@/lib/landingTracking";
import { trackEvent } from "@/lib/analytics";
import { CLOSED_BETA } from "@/lib/betaConfig";

const HeroFounderPass = lazy(() => import("@/components/landing/HeroFounderPass"));
const MagneticCursor  = lazy(() => import("@/components/landing/MagneticCursor"));

function HeroFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(155deg, hsl(218 72% 4%) 0%, hsl(218 72% 9%) 50%, hsl(218 65% 13%) 100%)" }}
    >
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "hsl(var(--primary-glow))" }} />
    </div>
  );
}

export default function LandingPage() {
  useEffect(() => {
    trackEvent("landing_view", null, { source: "direct", beta: CLOSED_BETA });
    const cleanup = initScrollTracking();
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Suspense fallback={null}>
        <MagneticCursor />
      </Suspense>

      <PublicNav />

      <Suspense fallback={<HeroFallback />}>
        <HeroFounderPass />
      </Suspense>

      {/* CLOSED BETA — liste d'attente visible juste sous le hero */}
      {CLOSED_BETA && (
        <section className="py-10 bg-background">
          <div className="container max-w-xl">
            <ClosedBetaBanner />
          </div>
        </section>
      )}

      {/* === BUSINESS CRITICAL — NE JAMAIS TOUCHER — Page Emploi STAR ===
          Position #1 conversion maximale — juste après le Hero.
          Ne jamais déplacer, conditionner, commenter ou supprimer. */}
      <div
        id="section-creer-emploi"
        data-protected="business-critical"
        data-version="2026-03-18-permanent"
        data-never-remove="true"
      >
        <CreerEmploiCTASection />
      </div>

      <ProblemSection />
      <FacilitateurPainSection />
      <MecanismeSection />
      <FeaturesValueSection />
      <HowItWorksEntrepriseSection />
      <FacilitateurSection />
      <ProofSection />
      <AntiBullshitSection />
      <WhyDifferentSection />
      <PricingSection />
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
            <Link to="/creer-emploi" className="hover:text-foreground transition-colors font-medium" style={{ color: "hsl(var(--accent))" }}>Créer son Emploi</Link>
            <Link to="/a-propos" className="hover:text-foreground transition-colors">À propos</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Tarifs</Link>
            <Link to="/cgu" className="hover:text-foreground transition-colors">CGU</Link>
            <Link to="/confidentialite" className="hover:text-foreground transition-colors">Confidentialité</Link>
            <Link to="/mentions-legales" className="hover:text-foreground transition-colors">Mentions légales</Link>
            <a href="mailto:contact@wiinupmax.com" className="hover:text-foreground transition-colors">Contact</a>
            <span className="text-muted-foreground/20">|</span>
            <a href="mailto:contact@wiinupmax.com?subject=Demande%20de%20demo%20WiinupMax" className="hover:text-foreground transition-colors font-medium" style={{ color: "hsl(var(--accent))" }}>Demander une démo</a>
          </div>
        </div>
        <div className="container mt-5">
          <GuaranteeBadge variant="bar" />
        </div>
      </footer>

      {/* STICKY CTA — Mobile uniquement, masqué en beta */}
      {!CLOSED_BETA && (
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
              to="/creer-emploi"
              className="btn-cta flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold"
              onClick={() => track("cta_hero_creer_emploi")}
            >
              Créer ma Mission →
            </Link>
            <Link
              to="/checkout"
              className="px-4 py-3.5 rounded-xl text-sm font-medium border border-white/15 text-white/70 hover:text-white/90 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              onClick={() => track("cta_sticky_mobile")}
            >
              99 €/an →
            </Link>
          </div>
          <GuaranteeBadge className="pb-2 px-4" />
        </div>
      )}
    </div>
  );
}
