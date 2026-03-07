import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import {
  Tag, CheckCircle2, CreditCard, Lock, ArrowRight,
  Loader2, AlertCircle, Zap, Clock, Gift, ShieldCheck
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";

type Step = "choose" | "promo" | "payment" | "success";
type SuccessType = "promo" | "stripe_launch" | "stripe_standard";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { redeemPromo, startCheckout, status, launchAvailable, launchSlotsRemaining, refresh } = useSubscription();

  const [step, setStep] = useState<Step>("choose");
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoEndDate, setPromoEndDate] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [successType, setSuccessType] = useState<SuccessType>("promo");

  // Quota for unauthenticated visitors
  const [localLaunchAvailable, setLocalLaunchAvailable] = useState(true);
  const [localSlotsRemaining, setLocalSlotsRemaining] = useState(100);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      const offerParam = searchParams.get("offer");
      setSuccessType(offerParam === "launch" ? "stripe_launch" : offerParam === "standard" ? "stripe_standard" : "promo");
      setStep("success");
    }
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

  // ─── PROMO PATH (zero Stripe) ────────────────────────────────────────────
  const checkPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoStatus("idle");
    setPromoEndDate(null);
    try {
      if (!user) {
        // Redirect to signup with intent to use promo after login
        navigate(`/signup?redirect=/checkout&code=${encodeURIComponent(promoCode.trim())}`);
        return;
      }
      const result = await redeemPromo(promoCode.trim());
      if (result.valid) {
        setPromoStatus("valid");
        setPromoMessage(result.message);
        // Parse end date from message if available
        await refresh();
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

  // ─── STRIPE PATH ──────────────────────────────────────────────────────────
  const handleStripeCheckout = async () => {
    if (!user) {
      window.location.href = "/signup?redirect=/checkout";
      return;
    }
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const result = await startCheckout();
      setSuccessType(result?.offer_type === "launch" ? "stripe_launch" : "stripe_standard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors du paiement.";
      setCheckoutError(msg);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // ─── SUCCESS SCREEN ───────────────────────────────────────────────────────
  if (step === "success") {
    const isPromo = successType === "promo";
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicNav />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="card-surface p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: isPromo ? "hsl(var(--accent)/0.15)" : "hsl(var(--success-light))" }}>
              {isPromo
                ? <Gift size={32} className="text-accent" />
                : <CheckCircle2 size={32} className="text-success" />
              }
            </div>

            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              {isPromo ? "Accès gratuit activé ! 🎉" : "Bienvenue dans WIINUP MAX ! 🎉"}
            </h1>

            {isPromo ? (
              <div className="space-y-3 mb-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Votre accès gratuit de 12 mois est activé.
                  Aucun paiement n'est nécessaire avec ce code.
                </p>
                <div className="flex items-center gap-2 p-3 bg-accent/10 rounded-xl text-sm">
                  <ShieldCheck size={16} className="text-accent shrink-0" />
                  <p className="text-left text-muted-foreground">
                    Accès complet à toutes les fonctionnalités pendant <strong className="text-foreground">12 mois</strong>, sans engagement.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-6 space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  <Zap size={14} />
                  {successType === "stripe_launch" ? "Offre de lancement — 99 € TTC / an" : "Abonnement annuel — 490 € TTC / an"}
                </div>
                {/* Deux moteurs activés */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="p-3.5 rounded-xl border" style={{
                    background: "linear-gradient(135deg, hsl(218 65% 8%), hsl(218 55% 11%))",
                    borderColor: "hsl(218 40% 22% / 0.6)"
                  }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(218 72% 65%)" }}>
                      Moteur 1
                    </p>
                    <p className="font-semibold text-white text-sm">Prospection automatisée</p>
                    <p className="text-white/50 text-xs mt-1">OpenClaw est prêt.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border" style={{
                    background: "linear-gradient(135deg, hsl(24 60% 8%), hsl(38 50% 11%))",
                    borderColor: "hsl(24 50% 22% / 0.6)"
                  }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(24 100% 65%)" }}>
                      Moteur 2
                    </p>
                    <p className="font-semibold text-white text-sm">Apport d'affaires</p>
                    <p className="text-white/50 text-xs mt-1">Votre réseau est activé.</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Vous pouvez maintenant utiliser la prospection automatisée et l'apport d'affaires dans un seul cockpit.
                </p>
              </div>
            )}

            <Link
              to={user ? "/onboarding" : "/signup"}
              className="btn-cta text-sm px-8 py-4 block text-center"
            >
              {user ? "Configurer mon espace →" : "Créer mon compte →"}
            </Link>
          </div>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full space-y-4">

          {/* Header */}
          {step === "choose" && (
            <div className="text-center mb-2">
              <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                Accéder à WIINUP MAX
              </h1>
              <p className="text-muted-foreground text-sm">
                Deux chemins, une seule destination.
              </p>
            </div>
          )}

          {/* ── STEP: CHOOSE ──────────────────────────────────────────── */}
          {step === "choose" && (
            <div className="space-y-3">
              {/* PROMO PATH */}
              <button
                onClick={() => setStep("promo")}
                className="w-full card-surface p-5 border-2 border-accent/30 hover:border-accent hover:bg-accent/5 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0 group-hover:bg-accent/25 transition-colors">
                    <Gift size={20} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-foreground text-sm">Code d'invitation</p>
                      <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-semibold">Gratuit</span>
                    </div>
                    <p className="text-xs text-muted-foreground">12 mois d'accès complet · Aucune carte requise · Aucun paiement</p>
                  </div>
                  <ArrowRight size={16} className="text-muted-foreground shrink-0 mt-1 group-hover:text-accent transition-colors" />
                </div>
              </button>

              {/* STRIPE PATH */}
              <button
                onClick={() => setStep("payment")}
                className="w-full card-surface p-5 border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <CreditCard size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-foreground text-sm">Abonnement payant</p>
                      {effectiveLaunchAvailable && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-semibold">
                          <Zap size={9} />
                          Lancement
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {effectiveLaunchAvailable
                        ? `99 € TTC / an · Offre lancement (${effectiveSlotsRemaining} places)`
                        : "490 € TTC / an · Abonnement annuel standard"}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
                </div>
              </button>

              <p className="text-xs text-muted-foreground text-center pt-1">
                Apporteur d'affaires ?{" "}
                <Link to="/signup" className="text-primary hover:underline font-medium">Accès gratuit ici →</Link>
              </p>
            </div>
          )}

          {/* ── STEP: PROMO (zero Stripe) ──────────────────────────────── */}
          {step === "promo" && (
            <div className="card-surface p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
                  <Gift size={18} className="text-accent" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground text-sm">Code d'invitation</h2>
                  <p className="text-xs text-muted-foreground">Accès gratuit 12 mois · Aucun paiement</p>
                </div>
              </div>

              <div className="p-3 bg-accent/8 rounded-xl border border-accent/20 mb-5">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 Ce code est votre <strong className="text-foreground">clé d'accès</strong>, pas un mot de passe.
                  Il active directement 12 mois gratuits — sans carte bancaire, sans paiement.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Votre code d'invitation</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase().replace(/\s/g, ""));
                        setPromoStatus("idle");
                      }}
                      placeholder="Ex : VIP1AN-001-ALPHA"
                      className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                      onKeyDown={(e) => e.key === "Enter" && checkPromo()}
                    />
                    <button
                      onClick={checkPromo}
                      disabled={!promoCode || promoLoading}
                      className="btn-primary px-5 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                    >
                      {promoLoading ? <Loader2 size={14} className="animate-spin" /> : "Activer"}
                    </button>
                  </div>
                </div>

                {promoStatus === "valid" && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-success-light rounded-xl border border-success/20">
                    <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-success">Accès activé avec succès !</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{promoMessage}</p>
                    </div>
                  </div>
                )}
                {promoStatus === "invalid" && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-destructive/8 rounded-xl border border-destructive/20">
                    <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{promoMessage}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => { setStep("choose"); setPromoStatus("idle"); setPromoCode(""); }}
                    className="flex-1 px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    Retour
                  </button>
                  {promoStatus === "valid" && (
                    <Link
                      to={user ? "/dashboard" : "/signup"}
                      className="flex-1 btn-cta text-sm text-center py-3"
                    >
                      {user ? "Accéder à mon espace →" : "Créer mon compte →"}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: PAYMENT (Stripe) ─────────────────────────────────── */}
          {step === "payment" && (
            <div className="card-surface p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard size={18} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground text-sm">Abonnement WIINUP MAX</h2>
                  <p className="text-xs text-muted-foreground">Paiement sécurisé via Stripe</p>
                </div>
              </div>

              {/* Plan card */}
              <div className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 mb-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground text-sm">WIINUP MAX — Entreprise</p>
                      {effectiveLaunchAvailable && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-semibold">
                          <Zap size={9} />
                          Lancement
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Accès complet · Toutes fonctionnalités · 1 an</p>
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

              <div className="space-y-1.5 mb-5">
                {["Prospection multicanale automatisée", "Missions & introductions", "Assistant JARVIS IA", "Deal Radar & opportunités", "Pilotage & rapports", "Support prioritaire"].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 size={13} className="text-success shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              {checkoutError && (
                <div className="flex items-start gap-2 p-3 bg-destructive/8 rounded-xl border border-destructive/20 mb-4">
                  <AlertCircle size={14} className="text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">{checkoutError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("choose")}
                  className="flex-1 px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
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
                    <>Payer 99 € / an <ArrowRight size={14} /></>
                  ) : (
                    <>Payer 490 € / an <ArrowRight size={14} /></>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-3">
                <Lock size={11} />
                Paiement sécurisé par Stripe · Facture incluse
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
