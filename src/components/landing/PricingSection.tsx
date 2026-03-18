import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, Zap, Users, Lock } from "lucide-react";
import { track } from "@/lib/landingTracking";
import { useFounderSlots } from "@/hooks/useFounderSlots";
import SlotCounter from "@/components/landing/SlotCounter";
import GuaranteeBadge from "@/components/landing/GuaranteeBadge";
import { CLOSED_BETA } from "@/lib/betaConfig";

const entrepriseFeatures = [
  "Missions publiées en 2 minutes — visibles immédiatement",
  "Introductions qualifiées envoyées par vos apporteurs",
  "Suivi complet et tracé de chaque opportunité",
  "Validation en un clic — vous gardez le contrôle total",
  "Gains automatiques tracés et versés à signature",
  "Votre espace personnel haut de gamme unifié",
  "Matching facilitateurs par mission",
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
  const { remaining, isSoldOut, loading } = useFounderSlots();

  return (
    <section id="pricing" className="bg-background py-20">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">
            Offre Founder Pass
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Simple, honnête, transparent.
          </h2>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Pour les entreprises : Pass Fondateur à <strong className="text-foreground">99 € par an</strong> seulement (au lieu de 990 €).{" "}
            Tout est inclus. Pour les facilitateurs : <strong className="text-foreground">Gratuit pour toujours</strong>, aucune carte demandée.
          </p>
        </div>

        {/* Live slot banner */}
        <div className="mb-7">
          {isSoldOut ? (
            <div
              className="flex items-center justify-center gap-3 rounded-2xl px-5 py-4 border"
              style={{ background: "hsl(218 20% 88% / 0.05)", borderColor: "hsl(218 20% 70% / 0.2)" }}
            >
              <Lock size={15} className="text-muted-foreground shrink-0" />
              <p className="text-sm font-semibold text-muted-foreground">
                Offre de lancement terminée — Merci à tous nos premiers Fondateurs !
              </p>
            </div>
          ) : (
            <SlotCounter variant="banner" remaining={remaining} loading={loading} />
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Entreprise */}
          <div
            className="bg-card rounded-2xl overflow-hidden border-2 flex flex-col"
            style={{ borderColor: isSoldOut ? "hsl(var(--border))" : "hsl(var(--primary))" }}
          >
            <div className="px-7 pt-7 pb-5" style={{ background: "var(--gradient-primary)" }}>
              <div className="mb-4">
                {loading ? (
                  <div className="h-6 w-40 rounded-full bg-white/15 animate-pulse" />
                ) : isSoldOut ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/50 text-xs font-bold">
                    <Lock size={10} /> Offre terminée
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold">
                    <Zap size={10} />
                    {CLOSED_BETA
                      ? "Bêta privée — places limitées"
                      : `Offre lancement — ${remaining} place${remaining !== 1 ? "s" : ""} restante${remaining !== 1 ? "s" : ""}`
                    }
                  </div>
                )}
              </div>
              <p className="text-white/90 text-xs font-semibold uppercase tracking-widest mb-2">Founder Pass</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="font-display font-bold text-5xl text-white leading-none">99 €</span>
                <div className="pb-1.5 flex flex-col">
                  <p className="text-white/90 text-sm">/an TTC</p>
                  <p className="text-white/50 text-xs line-through">990 €</p>
                </div>
              </div>
              <p className="text-white/80 text-xs font-semibold mt-1">
                Prix garanti à vie · Facturation annuelle · Premier arrivé premier servi
              </p>
            </div>

            <div className="px-7 py-6 flex flex-col flex-1">
              <ul className="space-y-3 mb-5 flex-1">
                {entrepriseFeatures.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" style={{ color: isSoldOut ? "hsl(var(--muted-foreground))" : "hsl(var(--primary))" }} />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>

              <GuaranteeBadge variant="card" className="mb-5" />

              {isSoldOut ? (
                <div className="space-y-3">
                  <div
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-semibold border cursor-not-allowed opacity-50"
                    style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
                  >
                    <Lock size={14} />
                    Offre de lancement terminée
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    Toutes les places ont été prises. Merci pour votre intérêt !
                  </p>
                </div>
              ) : (
                <>
                  <Link
                    to="/checkout"
                    className="btn-cta w-full text-center flex items-center justify-center gap-2 py-4 text-base font-bold"
                    onClick={() => track("cta_pricing_enterprise")}
                  >
                    <Zap size={16} />
                    Activer le Founder Pass — 99 € TTC/an
                    <ArrowRight size={16} />
                  </Link>
                  <GuaranteeBadge className="mt-3" />
                </>
              )}
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
