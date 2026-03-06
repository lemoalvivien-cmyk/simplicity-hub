import PublicNav from "@/components/layout/PublicNav";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import WhySimpleSection from "@/components/landing/WhySimpleSection";
import PricingSection from "@/components/landing/PricingSection";
import PromoCodeSection from "@/components/landing/PromoCodeSection";
import ReassuranceSection from "@/components/landing/ReassuranceSection";
import FAQSection from "@/components/landing/FAQSection";
import FinalCTASection from "@/components/landing/FinalCTASection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />
      <HeroSection />
      <ProblemSection />
      <BenefitsSection />
      <HowItWorksSection />
      <WhySimpleSection />
      <PricingSection />
      <PromoCodeSection />
      <ReassuranceSection />
      <FAQSection />
      <FinalCTASection />

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="font-medium text-foreground">Planify</span>
          </div>
          <span>© 2025 Planify. Tous droits réservés.</span>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground transition-colors">CGU</a>
            <a href="#" className="hover:text-foreground transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
