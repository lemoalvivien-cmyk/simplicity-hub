import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, Zap, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AB, track } from "@/lib/landingTracking";

const entrepriseFeatures = [
  "Missions illimitées",
  "Introductions tracées & validées",
  "Prospection automatisée OpenClaw",
  "Deal Radar — signaux d'intention",
  "Cockpit central de suivi",
  "Assistant JARVIS illimité",
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

const PRICING_FRAME = {
  v1_offre: {
    badge: "Offre lancement",
    headline: "Simple, honnête, transparent.",
    sub: "L'offre entreprise est payante. L'accès facilitateur est gratuit. Il n'y a rien de caché.",
    ctaLabel: (_isLaunch: boolean) => "Lancer ma première mission — 99 €",
  },
  v2_investissement: {
...
    headline: "Moins qu'un commercial junior. Pour tout un système.",
    sub: "99 € pour activer prospection IA + réseau humain structuré + cockpit de suivi.",
    ctaLabel: (_isLaunch: boolean) => "Activer mon acquisition — 99 €",
  },
};

export default function PricingSection() {
  const [launchAvailable, setLaunchAvailable] = useState(true);
  const [slotsRemaining, setSlotsRemaining] = useState(100);
  const pricingVariant = AB.pricingFrame();
  const frame = PRICING_FRAME[pricingVariant];

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
    <section className="py-20 bg-background" id="pricing">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">{frame.badge}</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            {frame.headline}
          </h2>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            {frame.sub}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Entreprise — dominant */}
          <div className="bg-card rounded-2xl overflow-hidden border-2 border-primary shadow-lg flex flex-col">
            {/* Header */}
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
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">Entreprise</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="font-display font-bold text-5xl text-white">
                  {launchAvailable ? "99 €" : "490 €"}
                </span>
                <div className="pb-1">
                  <p className="text-white/60 text-sm">TTC / an</p>
                  {launchAvailable && (
                    <p className="text-white/35 text-xs line-through">490 € / an</p>
                  )}
                </div>
              </div>
              <p className="text-white/45 text-xs">
                {launchAvailable
                  ? "Réservée aux 100 premières entreprises — accès complet immédiat"
                  : "Abonnement annuel — accès complet, support inclus"}
              </p>
            </div>

            {/* Features */}
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
                onClick={() => track("cta_pricing_enterprise", { variant: pricingVariant })}
              >
                {frame.ctaLabel(launchAvailable)}
                <ArrowRight size={16} />
              </Link>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Annulation libre à tout moment · Aucun engagement
              </p>
            </div>
          </div>

          {/* Facilitateur — secondaire */}
          <div className="bg-card rounded-2xl overflow-hidden border-2 border-accent flex flex-col">
            {/* Header */}
            <div
              className="px-7 pt-7 pb-5"
              style={{ background: "var(--gradient-accent)" }}
            >
              <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-2">Facilitateur / Apporteur</p>
              <div className="flex items-baseline gap-3 mb-1">
                <span className="font-display font-bold text-5xl text-white">Gratuit</span>
              </div>
              <p className="text-white/65 text-xs mt-1">Pour toujours · Sans carte bancaire · Zéro frais caché</p>
            </div>

            {/* Features */}
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
                Ce n'est pas du MLM · Apport d'affaires structuré et traçable
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Paiement sécurisé · Données protégées · Facturation annuelle · Aucun frais caché
        </p>
      </div>
    </section>
  );
}
