import { Link } from "react-router-dom";
import PublicNav, { LegalFooter } from "@/components/layout/PublicNav";
import LaunchQuotaBanner from "@/components/landing/LaunchQuotaBanner";
import { CheckCircle2, Tag, Building2, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";

const moteur1Features = [
  "Missions illimitées",
  "Prospection automatisée OpenClaw",
  "Deal Radar — signaux d'intention",
  "Scoring IA des leads entrants",
  "Cockpit central de suivi",
  "Assistant KITT IA illimité",
];

const moteur2Features = [
  "Marketplace de facilitateurs qualifiés",
  "Introductions tracées & validées",
  "Gains & commissions traçables",
  "Score de confiance des apporteurs",
  "Protection de chaque introduction",
  "Support inclus · Mises à jour incluses",
];

const freeFeatures = [
  "Toutes les missions disponibles",
  "Introductions illimitées",
  "Suivi des gains en temps réel",
  "Protection de chaque introduction",
  "Score de confiance visible",
  "Aucune commission prélevée par la plateforme",
];

const faqItems = [
  {
    q: "Combien de places restent disponibles à ce tarif ?",
    a: "L'offre lancement est limitée aux 100 premières entreprises. Après ça, le prix augmentera.",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui. L'abonnement est sans engagement. Vous pouvez annuler depuis votre espace compte à tout moment.",
  },
  {
    q: "Les facilitateurs paient-ils quelque chose ?",
    a: "Non. L'accès facilitateur est gratuit pour toujours. Aucune carte bancaire requise.",
  },
  {
    q: "La plateforme prélève-t-elle une commission sur les gains ?",
    a: "Non. Wiinup Max ne prélève aucune commission sur les gains des facilitateurs. 100% des commissions vous reviennent.",
  },
  {
    q: "Que se passe-t-il après la période de lancement ?",
    a: "Votre tarif est garanti à vie si vous vous abonnez pendant la période de lancement. Aucune surprise.",
  },
];

export default function Pricing() {
  const [slotsRemaining, setSlotsRemaining] = useState(100);

  useEffect(() => {
    trackEvent("pricing_view", null, { source: "direct" });

    supabase.from("launch_quota").select("total_slots, used_slots").single().then(({ data }) => {
      if (data) {
        setSlotsRemaining(Math.max(0, data.total_slots - data.used_slots));
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      {/* Header */}
      <section className="py-14 text-center container max-w-2xl">
        <p className="pill-tag mb-4 mx-auto w-fit">Tarifs</p>
        <h1 className="font-display text-4xl font-bold text-foreground mb-3">
          Simple, honnête, transparent.
        </h1>
        <p className="text-muted-foreground text-base">
          L'offre entreprise est payante. L'accès facilitateur est gratuit. Rien de caché.
        </p>
      </section>

      {/* Compteur de places */}
      <div className="container max-w-2xl mb-2">
        <LaunchQuotaBanner variant="pricing" />
      </div>

      {/* Pricing cards */}
      <div className="container max-w-4xl pb-16">
        <div className="grid md:grid-cols-2 gap-6">

          {/* Entreprise */}
          <div className="bg-card rounded-2xl overflow-hidden border-2 border-primary shadow-primary">
            <div className="p-7 border-b border-border" style={{ background: "var(--gradient-primary)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <Building2 size={18} className="text-white" />
                </div>
                <p className="text-white/80 text-sm font-semibold uppercase tracking-wider">Entreprise</p>
              </div>

              {slotsRemaining > 0 && (
                <div className="mb-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
                    <Zap size={10} />
                    {slotsRemaining} place{slotsRemaining > 1 ? "s" : ""} restante{slotsRemaining > 1 ? "s" : ""} — Offre lancement
                  </span>
                </div>
              )}

              <div className="flex items-end gap-2 mt-2">
                <span className="font-display font-bold text-5xl text-white">99 €</span>
                <div className="pb-1">
                  <span className="text-white/60 text-sm">/an TTC</span>
                </div>
              </div>
              <p className="text-white/50 text-xs mt-2">
                {slotsRemaining > 0
                  ? "Réservée aux 100 premières entreprises — prix garanti à vie"
                  : "Abonnement annuel — accès complet, support inclus"}
              </p>
            </div>
            <div className="p-7">
              {/* Moteur 1 */}
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--primary))" }}>
                Moteur 1 — Prospection IA
              </p>
              <ul className="space-y-2 mb-4">
                {moteur1Features.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={14} style={{ color: "hsl(var(--primary))" }} className="shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              {/* Moteur 2 */}
              <p className="text-xs font-bold uppercase tracking-wider mb-3 mt-5" style={{ color: "hsl(var(--accent))" }}>
                Moteur 2 — Apport d'affaires
              </p>
              <ul className="space-y-2 mb-7">
                {moteur2Features.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={14} style={{ color: "hsl(var(--accent))" }} className="shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/checkout"
                className="btn-primary w-full text-center text-base py-4 block"
                onClick={() => trackEvent("cta_click", null, { source: "pricing_enterprise", label: "launch" })}
              >
                Démarrer maintenant — 99 €/an
              </Link>
              <div className="mt-4 p-3 rounded-lg border flex items-center gap-2" style={{ background: "hsl(218 72% 18% / 0.05)", borderColor: "hsl(218 72% 18% / 0.12)" }}>
                <Tag size={14} style={{ color: "hsl(var(--primary))" }} className="shrink-0" />
                <p className="text-xs text-foreground">
                  <strong>Code promo ?</strong> Saisissez-le à l'étape suivante pour obtenir votre remise.
                </p>
              </div>
            </div>
          </div>

          {/* Apporteur — Gratuit */}
          <div className="bg-card rounded-2xl overflow-hidden border-2 border-accent">
            <div className="p-7 border-b border-border" style={{ background: "var(--gradient-accent)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users size={18} className="text-white" />
                </div>
                <p className="text-white/90 text-sm font-semibold uppercase tracking-wider">
                  Apporteur / Facilitateur
                </p>
              </div>
              <div className="flex items-end gap-1.5">
                <span className="font-display text-5xl font-bold text-white">Gratuit</span>
              </div>
              <p className="text-white/65 text-xs mt-2">Pour toujours · Sans carte bancaire · Zéro frais caché</p>
            </div>
            <div className="p-7">
              <ul className="space-y-3 mb-7">
                {freeFeatures.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={16} style={{ color: "hsl(var(--accent))" }} className="shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="btn-cta w-full text-center text-base py-4 block">
                Créer mon accès gratuit
              </Link>
            </div>
          </div>
        </div>

        {/* Reassurance */}
        <p className="text-center text-xs text-muted-foreground mt-7">
          Paiement sécurisé · Données protégées · Facturation annuelle · Aucun frais caché
        </p>
      </div>

      {/* FAQ */}
      <section className="border-t border-border py-16 bg-muted">
        <div className="container max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-foreground mb-8 text-center">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {faqItems.map(({ q, a }) => (
              <div key={q} className="bg-card rounded-xl p-5 border border-border">
                <p className="font-semibold text-sm text-foreground mb-2">{q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <LegalFooter />
    </div>
  );
}
