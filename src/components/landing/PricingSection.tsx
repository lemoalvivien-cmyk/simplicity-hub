import { forwardRef, type RefObject } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, Zap, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/landingTracking";

const entrepriseFeatures = [
  "Missions illimitées",
  "Introductions tracées & validées",
  "Prospection automatisée OpenClaw",
  "Deal Radar — signaux d'intention",
  "Cockpit central de suivi",
  "Assistant KITT IA illimité",
  "Marketplace de facilitateurs",
  "Gains & commissions traçables",
  "Support inclus · Mises à jour incluses",
];

const facilitateurFeatures = [
  "Toutes les missions disponibles",
  "Introductions illimitées",
  "Suivi des gains en temps réel",
  "Protection de chaque introduction",
  "Score de confiance visible",
  "Aucune commission prélevée par la plateforme",
];

function PricingSectionInner() {
  const [launchAvailable, setLaunchAvailable] = useState(true);
  const [slotsRemaining, setSlotsRemaining] = useState(100);

  useEffect(() => {
    supabase
      .from("launch_quota")
      .select("total_slots, used_slots")
      .single()
      .then(({ data }) => {
        if (data) {
          const remaining = Math.max(0, data.total_slots - data.used_slots);
          setLaunchAvailable(remaining > 0);
          setSlotsRemaining(remaining);
        }
      });
  }, []);

  return (
    <div className="py-20 bg-background">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">Offre lancement</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Simple, honnête, transparent.
          </h2>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            L'offre entreprise est payante. L'accès facilitateur est gratuit. Rien de caché.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Entreprise — dominant */}
          <div className="bg-card rounded-2xl overflow-hidden border-2 border-primary shadow-lg flex flex-col">
            <div
              className="px-7 pt-7 pb-5"
              style={{ background: "var(--gradient-primary)" }}
            >
              {launchAvailable && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold mb-4">
                  <Zap size={10} />
                  {slotsRemaining} place{slotsRemaining > 1 ? "s" : ""} restante{slotsRemaining > 1 ? "s" : ""} — Offre lancement
                </div>
              )}
              <p className="text-white/90 text-xs font-semibold uppercase tracking-widest mb-2">Entreprise</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="font-display font-bold text-5xl text-white leading-none">8,25 €</span>
                <div className="pb-1.5">
                  <p className="text-white/90 text-sm">/mois</p>
                </div>
              </div>
              <p className="text-white/90 text-sm font-medium mb-1">99 € facturé annuellement</p>
              <p className="text-white/75 text-xs italic">
                Le prix d'un café par semaine. Pour une machine d'acquisition complète.
              </p>
              <p className="text-white/75 text-xs mt-2">
                {launchAvailable
                  ? "Réservée aux 100 premières entreprises — accès complet immédiat"
                  : "Abonnement annuel — accès complet, support inclus"}
              </p>
            </div>

            <div className="px-7 py-6 flex flex-col flex-1">
              <ul className="space-y-3 mb-7 flex-1">
                {entrepriseFeatures.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" style={{ color: "hsl(var(--primary))" }} />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/pricing"
                className="btn-cta w-full text-center flex items-center justify-center gap-2 py-4"
                onClick={() => track("cta_pricing_enterprise")}
              >
                Lancer ma première mission — 99 €
                <ArrowRight size={16} />
              </Link>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Annulation libre à tout moment · Aucun engagement
              </p>
            </div>
          </div>

          {/* Facilitateur — secondaire */}
          <div className="bg-card rounded-2xl overflow-hidden border-2 border-accent flex flex-col">
            <div
              className="px-7 pt-7 pb-5"
              style={{ background: "var(--gradient-accent)" }}
            >
              <p className="text-white/90 text-xs font-semibold uppercase tracking-widest mb-2">Facilitateur / Apporteur</p>
              <div className="flex items-baseline gap-3 mb-1">
                <span className="font-display font-bold text-5xl text-white">Gratuit</span>
              </div>
              <p className="text-white/80 text-xs mt-1">Pour toujours · Sans carte bancaire · Zéro frais caché</p>
            </div>

            <div className="px-7 py-6 flex flex-col">
              <ul className="space-y-3 mb-7">
                {facilitateurFeatures.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" style={{ color: "hsl(var(--accent))" }} />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className="w-full text-center flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm transition-all duration-200 border-2 hover:opacity-90"
                style={{
                  borderColor: "hsl(var(--accent))",
                  color: "hsl(var(--accent))",
                }}
                onClick={() => track("cta_pricing_facilitator")}
              >
                <Users size={15} />
                Créer mon accès facilitateur — Gratuit
              </Link>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Modèle transparent d'apport d'affaires · Attribution prouvée · Paiement garanti
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Paiement sécurisé · Données protégées · Facturation annuelle · Aucun frais caché
        </p>
      </div>
    </div>
  );
}

const PricingSection = forwardRef<HTMLElement>(function PricingSection(_, ref) {
  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="pricing" className="bg-background">
      <PricingSectionInner />
    </section>
  );
});
PricingSection.displayName = "PricingSection";

export default PricingSection;
