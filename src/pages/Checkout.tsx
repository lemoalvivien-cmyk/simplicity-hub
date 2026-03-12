import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import {
  Tag, CheckCircle2, CreditCard, Lock, ArrowRight,
  Loader2, AlertCircle, Zap, Clock, Gift, ShieldCheck
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, isAccessActive } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";

type SuccessType = "promo" | "stripe_launch" | "stripe_standard";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { redeemPromo, startCheckout, launchAvailable, launchSlotsRemaining, refresh, status, loading: subLoading } = useSubscription();

  const [isSuccess, setIsSuccess] = useState(false);
  const [successType, setSuccessType] = useState<SuccessType>("stripe_launch");

  // Promo code (inline on payment page)
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const [localSlotsRemaining, setLocalSlotsRemaining] = useState<number | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [quotaError, setQuotaError] = useState(false);

  const fetchQuota = async (attempt = 0) => {
    try {
      setQuotaLoading(true);
      setQuotaError(false);
      const { data, error } = await supabase.from("launch_quota").select("total_slots, used_slots").single();
      if (error || !data) throw new Error("quota fetch failed");
      const remaining = Math.max(0, data.total_slots - data.used_slots);
      setLocalSlotsRemaining(remaining);
    } catch {
      if (attempt < 2) {
        setTimeout(() => fetchQuota(attempt + 1), 1500 * (attempt + 1));
      } else {
        setQuotaError(true);
        setLocalSlotsRemaining(null);
      }
    } finally {
      setQuotaLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      const offerParam = searchParams.get("offer");
      const sType: SuccessType = offerParam === "launch" ? "stripe_launch" : offerParam === "standard" ? "stripe_standard" : "promo";
      setSuccessType(sType);
      setIsSuccess(true);
      trackEvent("checkout_success", user?.id, { offer_type: sType });
      // Refresh subscription status — webhook may already have synced by now
      refresh();
      // Poll until active (max 12s) then redirect to dashboard
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        await refresh();
        // Status is read from context — handled by navigate below
        if (attempts >= 6) clearInterval(poll);
      }, 2000);
      return () => clearInterval(poll);
    }
    fetchQuota();
  }, [searchParams, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveSlotsRemaining = user ? launchSlotsRemaining : localSlotsRemaining;
  const effectiveLaunchAvailable = user ? launchAvailable : (localSlotsRemaining !== null && localSlotsRemaining > 0);
  const showSlotCounter = !quotaLoading && !quotaError && effectiveSlotsRemaining !== null && effectiveLaunchAvailable;

  const checkPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoStatus("idle");
    try {
      if (!user) {
        window.location.href = `/signup?redirect=/checkout&code=${encodeURIComponent(promoCode.trim())}`;
        return;
      }
      const result = await redeemPromo(promoCode.trim());
      if (result.valid) {
        setPromoStatus("valid");
        setPromoMessage(result.message);
        trackEvent("promo_redeemed", user?.id, { code: promoCode.trim() });
        await refresh();
        setSuccessType("promo");
        setIsSuccess(true);
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
    if (checkoutLoading) return;
    setCheckoutLoading(true);
    setCheckoutError("");
    trackEvent("checkout_start", user.id, { source: "checkout_page" });
    try {
      const result = await startCheckout();
      setSuccessType(result?.offer_type === "launch" ? "stripe_launch" : "stripe_standard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Impossible d'ouvrir le paiement. Réessayez.";
      setCheckoutError(msg);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // ── SUCCESS SCREEN ──────────────────────────────────────────
  if (isSuccess) {
    const isPromo = successType === "promo";

    // After a Stripe payment: once subscription is confirmed active, auto-redirect to dashboard.
    // We do NOT go to /onboarding — the user already completed it before paying.
    const subscriptionConfirmed = isAccessActive(status) || subLoading;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicNav />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="card-surface p-8 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: isPromo ? "hsl(var(--accent)/0.15)" : "hsl(var(--success-light))" }}>
                {isPromo ? <Gift size={32} className="text-accent" /> : <CheckCircle2 size={32} className="text-success" />}
              </div>

              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                {isPromo ? "Accès activé avec succès !" : "Bienvenue dans WiinupMax !"}
              </h1>

              {isPromo ? (
                <div className="space-y-3 mb-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">Votre code a été validé. Votre accès est maintenant actif.</p>
                  <div className="flex items-center gap-2 p-3 bg-accent/10 rounded-xl text-sm">
                    <ShieldCheck size={16} className="text-accent shrink-0" />
                    <p className="text-left text-muted-foreground">
                      <strong className="text-foreground">Accès garanti — sans carte bancaire requise.</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-6 space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                    <Zap size={14} />
                    {successType === "stripe_launch" ? "🎉 Offre Fondateur activée" : "Accès Standard activé"}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="p-3.5 rounded-xl border" style={{ background: "linear-gradient(135deg, hsl(218 65% 8%), hsl(218 55% 11%))", borderColor: "hsl(218 40% 22% / 0.6)" }}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(218 72% 65%)" }}>Moteur 1</p>
                      <p className="font-semibold text-white text-sm">Prospection IA assistée</p>
                      <p className="text-white/50 text-xs mt-1">OpenClaw en connexion réelle</p>
                    </div>
                    <div className="p-3.5 rounded-xl border" style={{ background: "linear-gradient(135deg, hsl(24 60% 8%), hsl(38 50% 11%))", borderColor: "hsl(24 50% 22% / 0.6)" }}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(24 100% 65%)" }}>Moteur 2</p>
                      <p className="font-semibold text-white text-sm">Réseau Facilitateurs</p>
                      <p className="text-white/50 text-xs mt-1">Introductions qualifiées</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Les deux moteurs travaillent ensemble pour accélérer votre acquisition.</p>
                </div>
              )}

              {user ? (
                <button
                  onClick={() => navigate("/dashboard", { replace: true })}
                  className="btn-cta text-sm px-8 py-4 w-full flex items-center justify-center gap-2"
                  disabled={!isPromo && subLoading}
                >
                  {!isPromo && subLoading ? (
                    <><Loader2 size={14} className="animate-spin" /> Activation en cours…</>
                  ) : (
                    <><Zap size={14} /> Accéder à mon espace</>
                  )}
                </button>
              ) : (
                <Link to="/signup" className="btn-cta text-sm px-8 py-4 block text-center">
                  Créer mon compte gratuitement
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PAYMENT SCREEN ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full space-y-4">

          {/* Order summary */}
          <div className="card-surface p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-sm">Récapitulatif de commande</h2>
                <p className="text-xs text-muted-foreground">Paiement sécurisé par Stripe</p>
              </div>
            </div>

            {/* Product line */}
            <div className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 mb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground text-sm">WIINUP MAX — Entreprise</p>
                    {effectiveLaunchAvailable && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-semibold">
                        <Zap size={9} /> Offre Fondateur
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Accès complet · 1 an · Renouvellement annuel</p>
                  {quotaLoading && (
                    <div className="mt-1 h-3.5 w-40 animate-pulse rounded bg-muted" />
                  )}
                  {showSlotCounter && (
                    <p className="text-xs text-accent font-medium mt-1 flex items-center gap-1">
                      <Clock size={10} />
                      Plus que {effectiveSlotsRemaining} place{(effectiveSlotsRemaining ?? 0) > 1 ? "s" : ""} au tarif fondateur
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-2xl font-bold text-foreground">99 €</p>
                  <p className="text-xs text-muted-foreground">TTC / an</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-1.5 mb-5">
              {[
                "Introductions qualifiées illimitées",
                "Agents IA OpenClaw 24h/24",
                "ROI Dashboard complet",
                "Accès à La Mêlée (événements)",
                "Support prioritaire",
                "Réseau de Facilitateurs qualifiés",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 size={13} className="text-success shrink-0" />
                  {feature}
                </div>
              ))}
            </div>

            {/* Promo code field */}
            <div className="mb-5 p-4 rounded-xl border border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Tag size={13} className="text-muted-foreground" />
                <p className="text-xs font-medium text-foreground">Vous avez un code promo ?</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value.toUpperCase().replace(/\s/g, "")); setPromoStatus("idle"); }}
                  placeholder="Ex : VIP1AN-001-ALPHA"
                  className="flex-1 px-3 py-2.5 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  onKeyDown={(e) => e.key === "Enter" && checkPromo()}
                />
                <button
                  onClick={checkPromo}
                  disabled={!promoCode || promoLoading}
                  className="btn-primary px-4 py-2.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                >
                  {promoLoading ? <Loader2 size={12} className="animate-spin" /> : "Activer"}
                </button>
              </div>
              {promoStatus === "valid" && (
                <div className="flex items-start gap-2 mt-2 p-2.5 bg-success-light rounded-lg border border-success/20">
                  <CheckCircle2 size={13} className="text-success shrink-0 mt-0.5" />
                  <p className="text-xs text-success font-medium">{promoMessage}</p>
                </div>
              )}
              {promoStatus === "invalid" && (
                <div className="flex items-start gap-2 mt-2 p-2.5 bg-destructive/8 rounded-lg border border-destructive/20">
                  <AlertCircle size={13} className="text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">{promoMessage}</p>
                </div>
              )}
            </div>

            {checkoutError && (
              <div className="flex items-start gap-2 p-3 bg-destructive/8 rounded-xl border border-destructive/20 mb-4">
                <AlertCircle size={14} className="text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{checkoutError}</p>
              </div>
            )}

            <button
              onClick={handleStripeCheckout}
              disabled={checkoutLoading}
              className="w-full btn-cta text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {checkoutLoading ? (
                <><Loader2 size={14} className="animate-spin" /> Chargement…</>
              ) : (
                <>Payer 99 € TTC — Accès immédiat <ArrowRight size={14} /></>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-3">
              <Lock size={11} />
              Paiement 100% sécurisé par Stripe · Annulation libre à tout moment
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
