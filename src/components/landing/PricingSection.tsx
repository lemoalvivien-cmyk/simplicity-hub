import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, Zap, Users, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/landingTracking";

const entrepriseFeatures = [
  "ADA prospecte en voix · 24/7 · swarm autonome",
  "Missions illimitées · Introductions tracées & validées",
  "OpenClaw apporte des affaires en autonomie",
  "Exécution autonome 24/7 via swarm multi-agents",
  "12 % royalty tokenisée WMAX · revendable sur secondary market",
  "Cockpit central de suivi · Assistant IA contextuel",
  "Marketplace de facilitateurs · Gains traçables",
  "Live cash flow · Eternal Trust Graph v2",
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

export default function PricingSection() {
  const [slotsRemaining, setSlotsRemaining] = useState(100);

  useEffect(() => {
    supabase
      .from("launch_quota")
      .select("total_slots, used_slots")
      .single()
      .then(({ data }) => {
        if (data) {
          setSlotsRemaining(Math.max(0, data.total_slots - data.used_slots));
        }
      });
  }, []);

  return (
    <section id="pricing" className="bg-background py-20">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">Offre lancement exclusive</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Simple, honnête, transparent.
          </h2>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            L'offre entreprise est payante. L'accès facilitateur est gratuit. Rien de caché.
          </p>
        </div>

        {/* URGENT scarcity banner */}
        <div
          className="flex items-center justify-center gap-3 rounded-2xl px-5 py-3.5 mb-7 border"
          style={{
            background: "hsl(38 100% 52% / 0.08)",
            borderColor: "hsl(38 100% 52% / 0.35)",
          }}
        >
          <Flame size={16} style={{ color: "hsl(38 100% 60%)" }} className="shrink-0" />
          <p className="text-sm font-semibold" style={{ color: "hsl(38 100% 68%)" }}>
            Offre de lancement exclusive : <strong className="text-white">99 € TTC/an au lieu de 990 €</strong>
            {" "}— ça part extrêmement vite,{" "}
            <span style={{ color: "hsl(38 100% 75%)" }}>premier arrivé premier servi !</span>
          </p>
          {slotsRemaining > 0 && slotsRemaining <= 50 && (
            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white">
              {slotsRemaining} places restantes
            </span>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Entreprise */}
          <div className="bg-card rounded-2xl overflow-hidden border-2 border-primary shadow-lg flex flex-col">
            <div className="px-7 pt-7 pb-5" style={{ background: "var(--gradient-primary)" }}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold mb-4">
                <Zap size={10} />
                Offre de lancement — {slotsRemaining} place{slotsRemaining !== 1 ? "s" : ""} restante{slotsRemaining !== 1 ? "s" : ""}
              </div>
              <p className="text-white/90 text-xs font-semibold uppercase tracking-widest mb-2">Entreprise</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="font-display font-bold text-5xl text-white leading-none">99 €</span>
                <div className="pb-1.5 flex flex-col">
                  <p className="text-white/90 text-sm">/an TTC</p>
                  <p className="text-white/50 text-xs line-through">990 €</p>
                </div>
              </div>
              <p className="text-white/80 text-xs font-semibold mt-1">
                soit 8,25 € / mois · Premier arrivé premier servi
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
                to="/signup"
                className="btn-cta w-full text-center flex items-center justify-center gap-2 py-4 text-base font-bold"
                onClick={() => track("cta_pricing_enterprise")}
              >
                <Zap size={16} />
                Activer maintenant — 99 € TTC/an
                <ArrowRight size={16} />
              </Link>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Annulation libre · Accès immédiat · Aucun engagement
              </p>
            </div>
          </div>

          {/* Facilitateur */}
          <div className="bg-card rounded-2xl overflow-hidden border-2 border-accent flex flex-col">
            <div className="px-7 pt-7 pb-5" style={{ background: "var(--gradient-accent)" }}>
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
                style={{ borderColor: "hsl(var(--accent))", color: "hsl(var(--accent))" }}
                onClick={() => track("cta_pricing_facilitator")}
              >
                <Users size={15} />
                Créer mon accès facilitateur — Gratuit
              </Link>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Attribution prouvée · Paiement garanti · Modèle transparent
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
