import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import { Tag, CheckCircle2, CreditCard, Lock, ArrowRight, Loader2, AlertCircle, Zap, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";

type Step = "choose" | "promo" | "payment" | "success";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { redeemPromo, startCheckout, status, launchAvailable, launchSlotsRemaining } = useSubscription();

  const [step, setStep] = useState<Step>("choose");
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [activatedOfferType, setActivatedOfferType] = useState<string | null>(null);

  // Fetch quota for unauthenticated visitors too
  const [localLaunchAvailable, setLocalLaunchAvailable] = useState(true);
  const [localSlotsRemaining, setLocalSlotsRemaining] = useState(100);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setActivatedOfferType(searchParams.get("offer"));
      setStep("success");
    }
    // Load quota for public display
    supabase.from("launch_quota").select("total_slots, used_slots").single().then(({ data }) => {
      if (data) {
        const remaining = Math.max(0, data.total_slots - data.used_slots);
        setLocalLaunchAvailable(remaining > 0);
        setLocalSlotsRemaining(remaining);
      }
    });
  }, [searchParams]);

  const effectiveLaunchAvailable = user ? launchAvailable : localLaunchAvailable;
  const effectiveSlotsRemaining = user ? launchSlotsRemaining : localSlotsRemaining;

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
    } catch {
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
      const result = await startCheckout();
      setActivatedOfferType(result?.offer_type ?? null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors du paiement.";
      setCheckoutError(msg);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const offerLabel = activatedOfferType === "launch"
    ? "Offre de lancement — 99 € TTC pour 1 an"
    : activatedOfferType === "standard"
    ? "Abonnement annuel — 490 € TTC / an"
    : "Votre accès a été activé";

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicNav />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} className="text-success" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Bienvenue ! 🎉
            </h1>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <Zap size={14} />
              {offerLabel}
            </div>
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
                  <span className={`text-xs font-medium hidden sm:block ${i === current ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
                  {i < 2 && <div className="w-6 sm:w-8 h-px bg-border" />}
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
              <p className="text-muted-foreground mb-8 text-sm">
                Choisissez votre mode d'accès. Les deux options donnent accès à toutes les fonctionnalités sans restriction.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setStep("promo")}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-accent bg-accent/5 hover:bg-accent/10 transition-colors text-left"
                >
                  <Tag size={22} className="text-accent shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">J'ai un code d'invitation</p>
                    <p className="text-xs text-muted-foreground">12 mois gratuits — aucune carte requise</p>
                  </div>
                  <ArrowRight size={18} className="text-muted-foreground" />
                </button>

                <button
                  onClick={() => setStep("payment")}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary transition-colors text-left"
                >
                  <CreditCard size={22} className="text-primary shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground text-sm">Je m'abonne directement</p>
                      {effectiveLaunchAvailable && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-semibold">
                          <Zap size={9} />
                          Lancement
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {effectiveLaunchAvailable
                        ? `99 € TTC / an — Offre lancement (${effectiveSlotsRemaining} places restantes)`
                        : "490 € TTC / an — Abonnement annuel standard"}
                    </p>
                  </div>
                  <ArrowRight size={18} className="text-muted-foreground" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-6">
                Apporteur d'affaires ?{" "}
                <Link to="/signup" className="text-primary hover:underline font-medium">Créez votre compte gratuitement →</Link>
              </p>
            </div>
          )}

          {/* STEP: promo */}
          {step === "promo" && (
            <div className="card-surface p-8">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Entrez votre code d'invitation
              </h1>
              <p className="text-muted-foreground mb-2 text-sm">
                Votre code d'invitation se trouve dans l'email ou le message que vous avez reçu.
              </p>
              <p className="text-xs text-muted-foreground/70 mb-8 p-3 bg-muted/50 rounded-lg">
                💡 Ce code n'est pas un mot de passe — il active simplement votre accès gratuit de 12 mois.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Code d'invitation</label>
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
                    <Link to={user ? "/dashboard" : "/signup"} className="flex-1 btn-cta text-sm text-center py-3">
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
              <p className="text-muted-foreground mb-6 text-sm">
                Accès complet à toutes les fonctionnalités. Abonnement annuel.
              </p>

              {/* Plan summary */}
              <div className="p-4 rounded-xl border-2 border-primary bg-primary/5 mb-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">WIINUP MAX — Entreprise</p>
                      {effectiveLaunchAvailable && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-semibold">
                          <Zap size={9} />
                          Lancement
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Accès illimité · Toutes fonctionnalités · 1 an</p>
                    {effectiveLaunchAvailable && (
                      <p className="text-xs text-accent font-medium mt-1 flex items-center gap-1">
                        <Clock size={10} />
                        Plus que {effectiveSlotsRemaining} places à ce tarif
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {effectiveLaunchAvailable ? (
                      <>
                        <p className="font-display text-2xl font-bold text-foreground">99 €</p>
                        <p className="text-xs text-muted-foreground">TTC / an</p>
                        <p className="text-xs text-muted-foreground line-through mt-0.5">490 € / an</p>
                      </>
                    ) : (
                      <>
                        <p className="font-display text-2xl font-bold text-foreground">490 €</p>
                        <p className="text-xs text-muted-foreground">TTC / an</p>
                      </>
                    )}
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
                  ) : effectiveLaunchAvailable ? (
                    <>Payer 99 € / an →</>
                  ) : (
                    <>Payer 490 € / an →</>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-4">
                <Lock size={12} />
                Paiement sécurisé par Stripe · Facture incluse
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
