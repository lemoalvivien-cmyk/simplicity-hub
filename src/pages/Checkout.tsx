import { useState } from "react";
import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import { Tag, CheckCircle2, CreditCard, Lock, ArrowRight } from "lucide-react";

type Step = "choose" | "promo" | "payment" | "success";

export default function Checkout() {
  const [step, setStep] = useState<Step>("choose");
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [promoLoading, setPromoLoading] = useState(false);

  const checkPromo = () => {
    setPromoLoading(true);
    setTimeout(() => {
      setPromoLoading(false);
      if (promoCode.toUpperCase() === "BIENVENUE12") {
        setPromoStatus("valid");
      } else {
        setPromoStatus("invalid");
      }
    }, 800);
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicNav />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} className="text-success" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-3">
              Bienvenue ! 🎉
            </h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Votre compte est activé. Il ne reste qu'une étape : configurez votre espace en 2 minutes.
            </p>
            <Link to="/onboarding" className="btn-cta text-base px-8 py-4 block text-center">
              Configurer mon espace →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-8 justify-center">
            {["Choix", "Code promo", "Paiement"].map((s, i) => {
              const current = step === "choose" ? 0 : step === "promo" ? 1 : 2;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < current ? "bg-success text-success-foreground" :
                    i === current ? "bg-primary text-primary-foreground" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {i < current ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium ${i === current ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
                  {i < 2 && <div className="w-8 h-px bg-border" />}
                </div>
              );
            })}
          </div>

          {/* STEP: choose */}
          {step === "choose" && (
            <div className="card-surface p-8">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Avez-vous un code d'invitation ?
              </h1>
              <p className="text-muted-foreground mb-8">
                Un code d'invitation vous donne 12 mois d'accès gratuit.
                Sinon, vous pouvez payer directement.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setStep("promo")}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-accent bg-accent-light hover:border-accent hover:bg-accent-light transition-colors text-left"
                >
                  <Tag size={22} className="text-accent shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">J'ai un code d'invitation</p>
                    <p className="text-xs text-muted-foreground">12 mois gratuits — aucune carte requise</p>
                  </div>
                  <ArrowRight size={18} className="text-muted-foreground ml-auto" />
                </button>

                <button
                  onClick={() => setStep("payment")}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary transition-colors text-left"
                >
                  <CreditCard size={22} className="text-primary shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">Je préfère payer par carte</p>
                    <p className="text-xs text-muted-foreground">59 € / mois — annulable à tout moment</p>
                  </div>
                  <ArrowRight size={18} className="text-muted-foreground ml-auto" />
                </button>
              </div>
            </div>
          )}

          {/* STEP: promo */}
          {step === "promo" && (
            <div className="card-surface p-8">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Entrez votre code d'invitation
              </h1>
              <p className="text-muted-foreground mb-8">
                Votre code est sur le message ou l'invitation que vous avez reçu.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    Code d'invitation
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoStatus("idle"); }}
                      placeholder="Ex : BIENVENUE12"
                      className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                    />
                    <button
                      onClick={checkPromo}
                      disabled={!promoCode || promoLoading}
                      className="btn-primary px-5 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {promoLoading ? "..." : "Vérifier"}
                    </button>
                  </div>
                </div>

                {promoStatus === "valid" && (
                  <div className="flex items-center gap-2 p-3 bg-success-light rounded-lg">
                    <CheckCircle2 size={16} className="text-success shrink-0" />
                    <p className="text-sm font-medium text-success">Code valide ! 12 mois gratuits activés.</p>
                  </div>
                )}
                {promoStatus === "invalid" && (
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <p className="text-sm font-medium text-destructive">Ce code n'est pas valide ou a déjà été utilisé.</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep("choose")} className="flex-1 px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    Retour
                  </button>
                  {promoStatus === "valid" && (
                    <button onClick={() => setStep("success")} className="flex-1 btn-cta text-sm">
                      Activer mon compte →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP: payment */}
          {step === "payment" && (
            <div className="card-surface p-8">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Paiement par carte
              </h1>
              <p className="text-muted-foreground mb-8">
                Sécurisé par Stripe. Vos données bancaires ne nous sont jamais transmises.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Nom sur la carte</label>
                  <input type="text" placeholder="Marie Dupont" className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Numéro de carte</label>
                  <div className="w-full px-4 py-3 rounded-xl border border-input bg-muted text-sm text-muted-foreground flex items-center gap-2">
                    <CreditCard size={16} />
                    <span>Formulaire Stripe sécurisé (intégration à venir)</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Expiration</label>
                    <input type="text" placeholder="MM / AA" className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">CVC</label>
                    <input type="text" placeholder="123" className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep("choose")} className="flex-1 px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    Retour
                  </button>
                  <button onClick={() => setStep("success")} className="flex-1 btn-cta text-sm">
                    Payer 59 € / mois →
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Lock size={12} />
                  Paiement 100% sécurisé par Stripe
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
