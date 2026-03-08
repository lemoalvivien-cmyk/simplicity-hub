import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import PublicNav from "@/components/layout/PublicNav";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import MecanismeSection from "@/components/landing/MecanismeSection";
import FeaturesValueSection from "@/components/landing/FeaturesValueSection";
import HowItWorksEntrepriseSection from "@/components/landing/HowItWorksEntrepriseSection";
import FacilitateurSection from "@/components/landing/FacilitateurSection";
import PreuveSérieuxSection from "@/components/landing/PreuveSérieuxSection";
import AntiBullshitSection from "@/components/landing/AntiBullshitSection";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import FinalCTASection from "@/components/landing/FinalCTASection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      {/* 1 — HERO */}
      <HeroSection />

      {/* 2 — PROBLÈMES */}
      <ProblemSection />

      {/* 3 — MÉCANISME / DOUBLE MOTEUR */}
      <MecanismeSection />

      {/* 4 — FONCTIONNALITÉS = VALEUR BUSINESS */}
      <FeaturesValueSection />

      {/* 5 — COMMENT ÇA MARCHE (ENTREPRISE) */}
      <HowItWorksEntrepriseSection />

      {/* 6 — FACILITATEUR */}
      <FacilitateurSection />

      {/* 7 — PREUVES DE SÉRIEUX */}
      <PreuveSérieuxSection />

      {/* 8 — ANTI-BULLSHIT / OBJECTIONS */}
      <AntiBullshitSection />

      {/* 9 — PRICING */}
      <PricingSection />

      {/* 10 — FAQ */}
      <FAQSection />

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
          <span className="text-xs">© {new Date().getFullYear()} VLM Consulting. Tous droits réservés.</span>
          <div className="flex gap-5 text-xs">
            <Link to="/cgu" className="hover:text-foreground transition-colors">CGU</Link>
            <Link to="/confidentialite" className="hover:text-foreground transition-colors">Confidentialité</Link>
            <Link to="/mentions-legales" className="hover:text-foreground transition-colors">Mentions légales</Link>
            <a href="mailto:contact@vlmconsulting.fr" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
