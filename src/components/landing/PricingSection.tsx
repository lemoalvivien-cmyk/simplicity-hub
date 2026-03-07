import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const included = [
  "Accès complet à toutes les fonctionnalités",
  "Assistant IA intégré pour vous guider",
  "Tableau de bord clair et organisé",
  "Centre d'aide disponible à tout moment",
  "Support par e-mail inclus",
  "Mises à jour automatiques sans surcoût",
];

export default function PricingSection() {
  const [launchAvailable, setLaunchAvailable] = useState(true);
  const [slotsRemaining, setSlotsRemaining] = useState(100);

  useEffect(() => {
    supabase.from("launch_quota").select("total_slots, used_slots").single().then(({ data }) => {
      if (data) {
        const remaining = Math.max(0, data.total_slots - data.used_slots);
        setLaunchAvailable(remaining > 0);
        setSlotsRemaining(remaining);
      }
    });
  }, []);

  return (
    <section className="py-20 bg-muted">
      <div className="container max-w-xl">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            {launchAvailable ? "Offre de lancement" : "Abonnement annuel"}
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Un seul tarif. Tout inclus.
          </h2>
        </div>

        <div className="bg-card border-2 border-primary rounded-2xl overflow-hidden shadow-lg">
          {/* Price header */}
          <div className="bg-primary px-8 py-8 text-center">
            {launchAvailable && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-3">
                <Zap size={10} />
                Offre lancement — {slotsRemaining} places restantes
              </div>
            )}
            <div className="flex items-end justify-center gap-2">
              {launchAvailable ? (
                <>
                  <span className="font-display font-bold text-5xl text-primary-foreground">99 €</span>
                  <div className="pb-1 text-left">
                    <p className="text-primary-foreground/70 text-sm">TTC / an</p>
                    <p className="text-primary-foreground/40 text-xs line-through">490 € / an</p>
                  </div>
                </>
              ) : (
                <>
                  <span className="font-display font-bold text-5xl text-primary-foreground">490 €</span>
                  <span className="text-primary-foreground/70 text-base pb-1">TTC / an</span>
                </>
              )}
            </div>
            <p className="text-primary-foreground/60 text-xs mt-2">
              {launchAvailable ? "Offre réservée aux 100 premières entreprises" : "Abonnement annuel renouvelable"}
            </p>
          </div>

          {/* Included */}
          <div className="px-8 py-7">
            <p className="text-sm font-semibold text-foreground mb-4">Ce qui est inclus :</p>
            <ul className="space-y-3">
              {included.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle2 size={16} className="text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              to="/pricing"
              className="btn-cta w-full text-center block mt-8 py-4 flex items-center justify-center gap-2"
            >
              {launchAvailable ? `Je commence — 99 € / an` : "Je m'abonne — 490 € / an"}
              <ArrowRight size={16} />
            </Link>

            <p className="text-center text-xs text-muted-foreground mt-3">
              Vous pouvez annuler à tout moment, sans justification.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
