import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Zap } from "lucide-react";
import { track } from "@/lib/landingTracking";

const benefits = [
  "Vos contacts qualifiés présentés directement à votre équipe commerciale",
  "Chaque introduction est protégée, horodatée et traçable",
  "Paiement automatique dès la signature — sans relances",
  "Tableau de bord temps réel de vos introductions et conversions",
  "Résiliation libre · Sans engagement",
  "Prix garanti à vie — 99 €/an pour les 100 premiers",
];

export default function FacilitateurSection() {
  return (
    <section className="py-20 md:py-24 bg-muted">
      <div className="container max-w-4xl">
        <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          {/* Left — copy */}
          <div>
            <p className="pill-tag mb-5 w-fit">Pour les Entreprises B2B</p>
            <h2 className="font-display text-3xl md:text-[2rem] font-bold text-foreground mb-4 leading-tight">
              Trouvez vos prochains clients B2B via votre réseau.{" "}
              <span className="text-highlight">Vous ne payez que si ça marche.</span>
            </h2>
            <p className="text-muted-foreground text-base mb-3 leading-relaxed">
              Vos contacts — partenaires, anciens collègues, apporteurs d'affaires — vous présentent des prospects qu'ils connaissent personnellement. Affaire signée ? Le gain est versé automatiquement.
            </p>
            <p className="text-foreground text-base mb-8 leading-relaxed font-medium">
              <span className="text-highlight">Zéro prospecter à froid. Zéro commercial à embaucher. Zéro risque financier.</span>
            </p>
            <Link
              to="/checkout"
              className="btn-cta inline-flex items-center gap-2 px-8 py-4 text-base"
              onClick={() => track("cta_entreprise_section")}
            >
              <Zap size={16} />
              Activer Founder Pass — 99 € TTC/an
              <ArrowRight size={16} />
            </Link>
            <p className="text-[11px] text-muted-foreground mt-3">
              Founder Pass · Prix garanti à vie · Facturation annuelle
            </p>
          </div>

          {/* Right — card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(160deg, hsl(218 72% 8%), hsl(218 65% 13%))",
              border: "1px solid hsl(218 55% 25% / 0.6)",
              boxShadow: "0 8px 32px hsl(218 72% 5% / 0.45)",
            }}
          >
            <div
              className="px-6 pt-6 pb-4 border-b"
              style={{ borderColor: "hsl(218 55% 25% / 0.5)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(var(--accent))" }}>
                Founder Pass — Entreprise
              </p>
              <div className="flex items-baseline gap-2">
                <p className="font-display font-bold text-white text-2xl leading-none">99 € TTC/an</p>
                <p className="text-white/60 text-xs line-through">990 €</p>
              </div>
              <p className="text-white/60 text-xs mt-1">Prix garanti à vie · 100 places max</p>
            </div>
            <ul className="p-6 space-y-3">
              {benefits.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 size={14} style={{ color: "hsl(var(--accent))" }} className="shrink-0 mt-0.5" />
                  <span className="text-sm text-white/95 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
