import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import { Tag, CheckCircle2, CreditCard, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";

type Step = "choose" | "promo" | "payment" | "success";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { redeemPromo, startCheckout, status } = useSubscription();

  const [step, setStep] = useState<Step>("choose");
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Handle return from Stripe
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setStep("success");
    }
  }, [searchParams]);

  const checkPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoStatus("idle");
    try {
      if (!user) {
        setPromoMessage("Vous devez être connecté pour utiliser un code.");
        setPromoStatus("invalid");
        return;
      }
      const result = await redeemPromo(promoCode.trim());
      if (result.valid) {
        setPromoStatus("valid");
        setPromoMessage(result.message);
      } else {
        setPromoStatus("invalid");
        setPromoMessage(result.message);
      }
    } catch (err) {
      setPromoStatus("invalid");
      setPromoMessage("Une erreur est survenue. Réessayez.");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleStripeCheckout = async () => {
    if (!user) {
      window.location.href = "/signup?redirect=/checkout";
      return;
    }
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      await startCheckout();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors du paiement.";
      setCheckoutError(msg);
    } finally {
      setCheckoutLoading(false);
    }
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
              Votre accès est activé. Configurez votre espace en 2 minutes pour commencer.
            </p>
            <Link to={user ? "/onboarding" : "/signup"} className="btn-cta text-base px-8 py-4 block text-center">
              {user ? "Configurer mon espace →" : "Créer mon compte →"}
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
            {["Choix", "Code d'invitation", "Paiement"].map((s, i) => {
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
                Comment souhaitez-vous accéder à WIINUP MAX ?
              </h1>
              <p className="text-muted-foreground mb-8">
                Choisissez votre mode d'accès. Les deux options donnent accès à toutes les fonctionnalités.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setStep("promo")}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-accent bg-accent/5 hover:bg-accent/10 transition-colors text-left"
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
                    <p className="font-semibold text-foreground text-sm">Je m'abonne directement</p>
                    <p className="text-xs text-muted-foreground">29€ TTC / mois — annulable à tout moment</p>
                  </div>
                  <ArrowRight size={18} className="text-muted-foreground ml-auto" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-6">
                Apporteur d'affaires ?{" "}
                <Link to="/signup" className="text-primary hover:underline">Créez votre compte gratuitement →</Link>
              </p>
            </div>
          )}

          {/* STEP: promo */}
          {step === "promo" && (
            <div className="card-surface p-8">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Entrez votre code d'invitation
              </h1>
              <p className="text-muted-foreground mb-8">
                Votre code d'invitation se trouve dans le message ou l'email que vous avez reçu.
                <br />
                <span className="text-xs text-muted-foreground/70 mt-1 block">Ce code n'est pas un mot de passe — il active votre accès gratuit de 12 mois.</span>
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
                      onKeyDown={(e) => e.key === "Enter" && checkPromo()}
                    />
                    <button
                      onClick={checkPromo}
                      disabled={!promoCode || promoLoading}
                      className="btn-primary px-5 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {promoLoading ? <Loader2 size={14} className="animate-spin" /> : "Vérifier"}
                    </button>
                  </div>
                </div>

                {promoStatus === "valid" && (
                  <div className="flex items-start gap-2 p-3 bg-success-light rounded-lg">
                    <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-success">{promoMessage}</p>
                  </div>
                )}
                {promoStatus === "invalid" && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                    <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-destructive">{promoMessage}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep("choose")} className="flex-1 px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    Retour
                  </button>
                  {promoStatus === "valid" && (
                    <Link to={user ? "/dashboard" : "/signup"} className="flex-1 btn-cta text-sm text-center">
                      {user ? "Accéder à mon espace →" : "Créer mon compte →"}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP: payment */}
          {step === "payment" && (
            <div className="card-surface p-8">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Abonnement WIINUP MAX
              </h1>
              <p className="text-muted-foreground mb-6">
                Accès complet à toutes les fonctionnalités. Annulable à tout moment.
              </p>

              {/* Plan summary */}
              <div className="p-4 rounded-xl border-2 border-primary bg-primary/5 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">WIINUP MAX — Entreprise</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Accès illimité · Toutes fonctionnalités</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl font-bold text-foreground">29€</p>
                    <p className="text-xs text-muted-foreground">TTC / mois</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {["Prospection multicanale", "Missions & introductions", "Assistant JARVIS IA", "Pilotage & rapports", "Support prioritaire"].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 size={14} className="text-success shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>

              {checkoutError && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg mb-4">
                  <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{checkoutError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep("choose")} className="flex-1 px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  Retour
                </button>
                <button
                  onClick={handleStripeCheckout}
                  disabled={checkoutLoading}
                  className="flex-1 btn-cta text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {checkoutLoading ? (
                    <><Loader2 size={14} className="animate-spin" /> Chargement…</>
                  ) : (
                    <>Payer 29€ / mois →</>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-4">
                <Lock size={12} />
                Paiement sécurisé par Stripe · Annulable à tout moment
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
