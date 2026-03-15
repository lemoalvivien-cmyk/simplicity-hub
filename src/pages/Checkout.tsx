import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import {
  CheckCircle2, ArrowRight, Loader2, AlertCircle, Zap, Clock,
  Gift, ShieldCheck, Lock, Tag, Star, Users, Flame, ChevronRight,
  BadgeCheck, CreditCard, Sparkles, CircleCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, isAccessActive } from "@/contexts/SubscriptionContext";
import { useFounderSlots } from "@/hooks/useFounderSlots";
import SlotCounter from "@/components/landing/SlotCounter";
import { trackEvent } from "@/lib/analytics";

type Step = 1 | 2 | 3;
type SuccessType = "promo" | "stripe_launch" | "stripe_standard";

// ─── Features list ────────────────────────────────────────────────────────────
const founderBenefits = [
  { icon: Zap, label: "Assistant IA qui prospecte pour vous", sub: "24h/24, sans intervention de votre part" },
  { icon: Users, label: "Réseau de facilitateurs qualifiés", sub: "Introductions certifiées et protégées" },
  { icon: Star, label: "Gains versés automatiquement", sub: "À chaque affaire signée, sur votre compte" },
  { icon: BadgeCheck, label: "Tableau de bord complet", sub: "Suivi, ROI, actions en temps réel" },
  { icon: ShieldCheck, label: "Support prioritaire inclus", sub: "Réponse sous 24h garantie" },
];

const reassuranceItems = [
  { icon: Lock, label: "Paiement 100 % sécurisé par Stripe" },
  { icon: ShieldCheck, label: "Données protégées · RGPD" },
  { icon: CircleCheck, label: "Facture envoyée immédiatement" },
  { icon: BadgeCheck, label: "30 jours satisfait ou remboursé" },
];

// ─── Sidebar Summary (desktop) ────────────────────────────────────────────────
function OrderSidebar({ slots }: { slots: number | null }) {
  return (
    <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
      {/* Product card */}
      <div
        className="rounded-2xl border-2 overflow-hidden"
        style={{
          borderColor: "hsl(var(--primary-glow) / 0.45)",
          background: "linear-gradient(145deg, hsl(218 72% 8%) 0%, hsl(218 65% 14%) 100%)",
        }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: "hsl(218 60% 22% / 0.5)" }}>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: "hsl(var(--accent) / 0.2)", border: "1px solid hsl(var(--accent) / 0.4)", color: "hsl(var(--accent))" }}
            >
              <Zap size={9} /> Founder Pass
            </span>
            <span className="text-white/40 text-xs">Entreprise</span>
          </div>
          <p className="text-white/70 text-xs uppercase tracking-wider font-bold mb-1">WIINUP MAX</p>
          <div className="flex items-end gap-2">
            <span className="font-display font-black text-white text-4xl leading-none">99 €</span>
            <span className="text-white/60 text-sm pb-1">/an TTC</span>
          </div>
          <p className="text-white/35 text-xs line-through mt-0.5">990 € après le lancement</p>
        </div>

        <div className="px-5 py-4 space-y-2.5">
          {founderBenefits.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              <CircleCheck size={13} style={{ color: "hsl(152 62% 52%)" }} className="shrink-0" />
              <span className="text-white/80 text-xs">{label}</span>
            </div>
          ))}
        </div>

        {slots !== null && (
          <div
            className="mx-4 mb-4 rounded-xl px-3 py-2.5 flex items-center gap-2"
            style={{ background: "hsl(var(--accent) / 0.12)", border: "1px solid hsl(var(--accent) / 0.3)" }}
          >
            <Flame size={13} style={{ color: "hsl(var(--accent))" }} />
            <p className="text-xs font-semibold" style={{ color: "hsl(var(--accent))" }}>
              Plus que {slots} place{slots > 1 ? "s" : ""} au tarif fondateur
            </p>
          </div>
        )}
      </div>

      {/* Garanties */}
      <div className="rounded-2xl border p-4 space-y-2.5" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Garanties</p>
        {reassuranceItems.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2.5">
            <Icon size={13} className="text-success shrink-0" />
            <span className="text-xs text-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Price guarantee */}
      <div
        className="rounded-2xl border p-4"
        style={{
          background: "hsl(38 95% 50% / 0.06)",
          borderColor: "hsl(38 95% 50% / 0.25)",
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <BadgeCheck size={14} style={{ color: "hsl(38 95% 55%)" }} />
          <p className="text-xs font-bold" style={{ color: "hsl(38 95% 55%)" }}>Prix garanti à vie</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Votre tarif de 99 €/an est <strong className="text-foreground">verrouillé à vie</strong> si vous vous inscrivez pendant le lancement.
        </p>
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1 as Step, label: "Votre offre" },
    { n: 2 as Step, label: "Code promo" },
    { n: 3 as Step, label: "Paiement" },
  ];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map(({ n, label }, i) => (
        <div key={n} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
              style={
                n < current
                  ? { background: "hsl(152 62% 34%)", color: "#fff" }
                  : n === current
                  ? { background: "linear-gradient(135deg, hsl(var(--accent)), hsl(38 100% 65%))", color: "#fff", boxShadow: "0 0 16px hsl(var(--accent) / 0.45)" }
                  : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
              }
            >
              {n < current ? <CheckCircle2 size={15} /> : n}
            </div>
            <span
              className="text-xs font-medium whitespace-nowrap"
              style={{ color: n === current ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="w-10 h-0.5 rounded-full mb-5 transition-all duration-300"
              style={{ background: n < current ? "hsl(152 62% 34%)" : "hsl(var(--border))" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1 — Récap & Confirmation ───────────────────────────────────────────
function StepRecap({
  slots,
  quotaLoading,
  onNext,
}: {
  slots: number | null;
  quotaLoading: boolean;
  onNext: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center mb-2">
        <h2 className="font-display text-xl font-bold text-foreground mb-1">Votre Founder Pass</h2>
        <p className="text-sm text-muted-foreground">Tout ce qui est inclus dans votre accès</p>
      </div>

      {/* Urgency banner */}
      {!quotaLoading && slots !== null && slots <= 30 && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 border"
          style={{
            background: "hsl(0 72% 51% / 0.07)",
            borderColor: "hsl(0 72% 51% / 0.3)",
          }}
        >
          <Flame size={15} style={{ color: "hsl(0 72% 65%)" }} className="shrink-0" />
          <p className="text-sm font-semibold" style={{ color: "hsl(0 72% 72%)" }}>
            🔥 Plus que {slots} place{slots > 1 ? "s" : ""} disponible{slots > 1 ? "s" : ""} au tarif fondateur
          </p>
        </div>
      )}

      {/* Product card */}
      <div
        className="rounded-2xl border-2 overflow-hidden"
        style={{
          borderColor: "hsl(var(--primary-glow) / 0.5)",
          background: "hsl(var(--card))",
        }}
      >
        {/* Card header */}
        <div
          className="px-6 py-5"
          style={{ background: "linear-gradient(135deg, hsl(218 72% 10%) 0%, hsl(218 65% 17%) 100%)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background: "hsl(var(--accent) / 0.2)", border: "1px solid hsl(var(--accent) / 0.45)", color: "hsl(var(--accent))" }}
                >
                  <Zap size={9} /> Offre Fondateur
                </span>
              </div>
              <p className="text-white/70 text-xs font-bold uppercase tracking-wider">WIINUP MAX — Entreprise</p>
              <p className="text-white/55 text-xs mt-0.5">Accès complet · 1 an · Renouvellement annuel</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-display font-black text-white text-3xl leading-none">99 €</p>
              <p className="text-white/60 text-xs mt-0.5">TTC / an</p>
              <p className="text-white/30 text-xs line-through">990 €</p>
            </div>
          </div>
          <div
            className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: "hsl(38 95% 50% / 0.12)", border: "1px solid hsl(38 95% 50% / 0.25)" }}
          >
            <Clock size={12} style={{ color: "hsl(38 95% 65%)" }} />
            <p className="text-xs font-semibold" style={{ color: "hsl(38 95% 65%)" }}>
              Prix garanti à vie si souscrit pendant le lancement · 100 places max
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="px-6 py-5 grid sm:grid-cols-2 gap-3">
          {founderBenefits.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "hsl(var(--primary-glow) / 0.12)" }}
              >
                <Icon size={14} style={{ color: "hsl(var(--primary-glow))" }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile slot counter */}
        {!quotaLoading && slots !== null && (
          <div className="lg:hidden mx-5 mb-5">
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ background: "hsl(var(--accent) / 0.1)", border: "1px solid hsl(var(--accent) / 0.25)" }}
            >
              <Flame size={12} style={{ color: "hsl(var(--accent))" }} />
              <p className="text-xs font-semibold" style={{ color: "hsl(var(--accent))" }}>
                {slots} place{slots > 1 ? "s" : ""} restante{slots > 1 ? "s" : ""} au tarif fondateur
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Reassurances (mobile only — sidebar handles desktop) */}
      <div
        className="lg:hidden rounded-2xl border p-4"
        style={{ background: "hsl(var(--muted) / 0.5)", borderColor: "hsl(var(--border))" }}
      >
        <div className="grid grid-cols-2 gap-2">
          {reassuranceItems.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={12} className="text-success shrink-0" />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        className="btn-cta w-full flex items-center justify-center gap-2.5 py-4 text-base font-bold"
      >
        Continuer vers le paiement
        <ArrowRight size={17} />
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Vous avez un compte ? <Link to="/login?redirect=/checkout" className="underline hover:text-foreground transition-colors">Connectez-vous d'abord</Link>
      </p>
    </div>
  );
}

// ─── Step 2 — Code promo ─────────────────────────────────────────────────────
type PromoStatus = "idle" | "valid" | "invalid" | "expired" | "used" | "disabled" | "loading";

const promoMessages: Record<string, string> = {
  expired: "Ce code est expiré. Passez à l'étape suivante.",
  used: "Ce code a déjà été utilisé. Chaque code est valable une seule fois.",
  disabled: "Ce code n'est plus actif. Contactez-nous si vous pensez que c'est une erreur.",
  invalid: "Code introuvable. Vérifiez la saisie ou passez cette étape.",
};

function StepPromo({
  onNext,
  onSkip,
  redeemPromo,
  user,
}: {
  onNext: () => void;
  onSkip: () => void;
  redeemPromo: (code: string) => Promise<{ valid: boolean; message: string }>;
  user: { id: string } | null;
}) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<PromoStatus>("idle");
  const [message, setMessage] = useState("");

  const handleApply = async () => {
    if (!code.trim()) return;
    if (!user) {
      window.location.href = `/signup?redirect=/checkout`;
      return;
    }
    setStatus("loading");
    try {
      const result = await redeemPromo(code.trim());
      if (result.valid) {
        setStatus("valid");
        setMessage(result.message || "Accès activé avec succès !");
        trackEvent("promo_redeemed", user?.id, { code: code.trim() });
        setTimeout(() => onNext(), 1600);
      } else {
        const msg = result.message?.toLowerCase() ?? "";
        if (msg.includes("expiré") || msg.includes("expired")) setStatus("expired");
        else if (msg.includes("déjà") || msg.includes("used")) setStatus("used");
        else if (msg.includes("désactivé") || msg.includes("disabled")) setStatus("disabled");
        else setStatus("invalid");
        setMessage(result.message || promoMessages.invalid);
      }
    } catch {
      setStatus("invalid");
      setMessage("Une erreur est survenue. Réessayez ou passez cette étape.");
    }
  };

  const statusConfig = {
    idle: null,
    loading: null,
    valid: { bg: "hsl(152 62% 34% / 0.08)", border: "hsl(152 62% 34% / 0.3)", icon: CheckCircle2, iconColor: "hsl(152 62% 40%)", textColor: "hsl(152 62% 35%)" },
    invalid: { bg: "hsl(0 72% 51% / 0.07)", border: "hsl(0 72% 51% / 0.3)", icon: AlertCircle, iconColor: "hsl(0 72% 60%)", textColor: "hsl(0 72% 50%)" },
    expired: { bg: "hsl(38 95% 50% / 0.08)", border: "hsl(38 95% 50% / 0.3)", icon: Clock, iconColor: "hsl(38 95% 55%)", textColor: "hsl(38 95% 45%)" },
    used: { bg: "hsl(0 72% 51% / 0.07)", border: "hsl(0 72% 51% / 0.3)", icon: AlertCircle, iconColor: "hsl(0 72% 60%)", textColor: "hsl(0 72% 50%)" },
    disabled: { bg: "hsl(218 15% 50% / 0.08)", border: "hsl(218 15% 50% / 0.25)", icon: AlertCircle, iconColor: "hsl(218 15% 55%)", textColor: "hsl(218 15% 50%)" },
  };

  const cfg = status !== "idle" && status !== "loading" ? statusConfig[status] : null;

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "hsl(var(--accent) / 0.1)", border: "1px solid hsl(var(--accent) / 0.25)" }}
        >
          <Gift size={26} style={{ color: "hsl(var(--accent))" }} />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground mb-1">Vous avez un code d'invitation ?</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Entrez votre code pour bénéficier d'un accès spécial. Sinon, passez directement au paiement.
        </p>
      </div>

      <div
        className="rounded-2xl border p-5"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
      >
        <label className="block text-sm font-semibold text-foreground mb-2">
          <Tag size={13} className="inline mr-1.5 opacity-70" />
          Code d'invitation
        </label>
        <div className="flex gap-2.5">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase().replace(/\s/g, ""));
              setStatus("idle");
            }}
            placeholder="Ex : VIP1AN-001-ALPHA"
            className="flex-1 px-4 py-3 rounded-xl border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            style={{ borderColor: status === "valid" ? "hsl(152 62% 34% / 0.5)" : undefined }}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            disabled={status === "valid" || status === "loading"}
          />
          <button
            onClick={handleApply}
            disabled={!code.trim() || status === "loading" || status === "valid"}
            className="btn-primary px-5 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0 rounded-xl"
          >
            {status === "loading" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : status === "valid" ? (
              <CheckCircle2 size={14} />
            ) : (
              "Appliquer"
            )}
          </button>
        </div>

        {/* Status feedback */}
        {cfg && (
          <div
            className="flex items-start gap-2.5 mt-3 p-3.5 rounded-xl border"
            style={{ background: cfg.bg, borderColor: cfg.border }}
          >
            <cfg.icon size={15} style={{ color: cfg.iconColor }} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium" style={{ color: cfg.textColor }}>
              {status === "valid" ? (message || "Accès activé avec succès ! Redirection…") : (promoMessages[status] || message)}
            </p>
          </div>
        )}
      </div>

      {/* Human help */}
      {(status === "invalid" || status === "expired" || status === "used" || status === "disabled") && (
        <div
          className="rounded-2xl border p-4 flex items-start gap-3"
          style={{ background: "hsl(var(--muted) / 0.5)", borderColor: "hsl(var(--border))" }}
        >
          <Sparkles size={15} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Vous avez reçu un code de notre part et ça ne fonctionne pas ?{" "}
            <a href="mailto:contact@wiinupmax.com" className="underline hover:text-foreground transition-colors">
              Contactez-nous
            </a>{" "}
            — on règle ça en 5 minutes.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onSkip}
          className="flex-1 py-3.5 rounded-xl border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-border transition-all duration-200 flex items-center justify-center gap-2"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          Passer cette étape
          <ChevronRight size={14} />
        </button>
        <button
          onClick={handleApply}
          disabled={!code.trim() || status === "loading" || status === "valid"}
          className="flex-1 btn-cta py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? <Loader2 size={14} className="animate-spin" /> : null}
          Appliquer et continuer
          {status !== "loading" && <ArrowRight size={14} />}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3 — Paiement Stripe ─────────────────────────────────────────────────
function StepPayment({
  user,
  startCheckout,
  onPromoSuccess,
}: {
  user: { id: string } | null;
  startCheckout: () => Promise<{ offer_type?: string }>;
  onPromoSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async () => {
    if (!user) {
      window.location.href = "/signup?redirect=/checkout";
      return;
    }
    if (loading) return;
    setLoading(true);
    setError("");
    trackEvent("checkout_start", user.id, { source: "checkout_step3" });
    try {
      await startCheckout();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Impossible d'ouvrir le paiement. Réessayez.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "hsl(var(--primary-glow) / 0.12)", border: "1px solid hsl(var(--primary-glow) / 0.3)" }}
        >
          <CreditCard size={26} style={{ color: "hsl(var(--primary-glow))" }} />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground mb-1">Finalisez votre commande</h2>
        <p className="text-sm text-muted-foreground">
          Vous allez être redirigé vers Stripe — paiement chiffré et sécurisé.
        </p>
      </div>

      {/* Order summary */}
      <div
        className="rounded-2xl border"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
          <div>
            <p className="font-semibold text-foreground text-sm">Founder Pass — WIINUP MAX Entreprise</p>
            <p className="text-xs text-muted-foreground mt-0.5">Accès complet · 1 an</p>
          </div>
          <div className="text-right">
            <p className="font-display font-black text-foreground text-2xl leading-none">99 €</p>
            <p className="text-xs text-muted-foreground">TTC / an</p>
          </div>
        </div>
        <div className="px-5 py-4 space-y-2">
          {[
            "Accès immédiat après paiement",
            "Prix garanti à vie — jamais réévalué",
            "Annulation possible à tout moment",
            "Facture émise et envoyée immédiatement",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5">
              <CheckCircle2 size={13} className="text-success shrink-0" />
              <span className="text-xs text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stripe security badges */}
      <div
        className="rounded-2xl border p-4"
        style={{ background: "hsl(var(--muted) / 0.5)", borderColor: "hsl(var(--border))" }}
      >
        <div className="grid grid-cols-2 gap-2.5">
          {reassuranceItems.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={12} className="text-success shrink-0" />
              <span className="text-xs text-muted-foreground leading-tight">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3 pt-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          Vos données bancaires ne transitent jamais par nos serveurs.
          Stripe est certifié PCI DSS niveau 1.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl border" style={{ background: "hsl(0 72% 51% / 0.07)", borderColor: "hsl(0 72% 51% / 0.3)" }}>
          <AlertCircle size={15} className="text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full btn-cta py-4 text-base font-bold flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Redirection vers Stripe…</>
        ) : (
          <>
            <Lock size={15} />
            Payer 99 € TTC — Accès immédiat
            <ArrowRight size={16} />
          </>
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        En cliquant, vous acceptez nos{" "}
        <Link to="/cgu" className="underline hover:text-foreground transition-colors">CGU</Link>{" "}
        et notre{" "}
        <Link to="/confidentialite" className="underline hover:text-foreground transition-colors">politique de confidentialité</Link>.
      </p>
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({
  successType,
  prenom,
  subLoading,
  status,
  navigate,
}: {
  successType: SuccessType;
  prenom: string | null;
  subLoading: boolean;
  status: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const isPromo = successType === "promo";
  const isActive = isAccessActive(status as Parameters<typeof isAccessActive>[0]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />
      <div className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="max-w-xl w-full">
          {/* Confetti header */}
          <div className="text-center mb-8">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
              style={
                isPromo
                  ? { background: "hsl(var(--accent) / 0.12)", border: "2px solid hsl(var(--accent) / 0.35)" }
                  : { background: "hsl(152 62% 34% / 0.1)", border: "2px solid hsl(152 62% 34% / 0.35)", boxShadow: "0 0 40px hsl(152 62% 34% / 0.15)" }
              }
            >
              {isPromo
                ? <Gift size={36} style={{ color: "hsl(var(--accent))" }} />
                : <CheckCircle2 size={36} style={{ color: "hsl(152 62% 48%)" }} />
              }
            </div>

            <h1 className="font-display text-3xl font-black text-foreground mb-2">
              {prenom ? `Bienvenue, ${prenom} ! 🎉` : "Bienvenue dans WiinupMax ! 🎉"}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto">
              {isPromo
                ? "Votre code d'invitation a bien été activé. Votre accès est prêt."
                : "Votre paiement a bien été reçu. Votre accès Founder Pass est maintenant actif."
              }
            </p>
          </div>

          {/* Activated badge */}
          {!isPromo && (
            <div
              className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl border mb-6 mx-auto w-fit"
              style={{
                background: "linear-gradient(135deg, hsl(218 72% 10%) 0%, hsl(218 65% 16%) 100%)",
                borderColor: "hsl(var(--primary-glow) / 0.4)",
              }}
            >
              <Zap size={15} style={{ color: "hsl(var(--accent))" }} />
              <span className="text-sm font-bold text-white">
                {successType === "stripe_launch" ? "🎯 Founder Pass activé — 99 € TTC/an" : "Accès Premium activé"}
              </span>
            </div>
          )}

          {/* Next steps card */}
          <div
            className="rounded-2xl border overflow-hidden mb-5"
            style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
          >
            <div className="px-6 py-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
              <p className="font-semibold text-foreground text-sm">Vos prochaines étapes</p>
            </div>
            <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
              {[
                {
                  n: 1,
                  title: "Configurez votre profil",
                  desc: "Décrivez votre activité et vos objectifs en 2 minutes.",
                  color: "hsl(var(--primary-glow))",
                },
                {
                  n: 2,
                  title: "Activez votre assistant IA",
                  desc: "Il commence à chercher des clients pour vous immédiatement.",
                  color: "hsl(var(--accent))",
                },
                {
                  n: 3,
                  title: "Accédez à votre tableau de bord",
                  desc: "Suivez vos opportunités, affaires et gains en temps réel.",
                  color: "hsl(152 62% 48%)",
                },
              ].map(({ n, title, desc, color }) => (
                <div key={n} className="flex items-start gap-4 px-6 py-4">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black"
                    style={{ background: `${color.replace(")", " / 0.12)")}`, color }}
                  >
                    {n}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate("/onboarding", { replace: true })}
            disabled={!isPromo && subLoading && !isActive}
            className="w-full btn-cta py-4 text-base font-bold flex items-center justify-center gap-2.5 disabled:opacity-70"
          >
            {!isPromo && subLoading && !isActive ? (
              <><Loader2 size={16} className="animate-spin" /> Activation en cours…</>
            ) : (
              <><Sparkles size={16} /> Démarrer mon onboarding<ArrowRight size={16} /></>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground mt-3">
            Votre facture vous a été envoyée par e-mail · Support : contact@wiinupmax.com
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { redeemPromo, startCheckout, refresh, status, loading: subLoading } = useSubscription();

  const [step, setStep] = useState<Step>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successType, setSuccessType] = useState<SuccessType>("stripe_launch");

  const [slots, setSlots] = useState<number | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(true);

  // Fetch quota
  const fetchQuota = useCallback(async (attempt = 0) => {
    try {
      setQuotaLoading(true);
      const { data, error } = await supabase.from("launch_quota").select("total_slots, used_slots").single();
      if (error || !data) throw new Error("quota fetch failed");
      setSlots(Math.max(0, data.total_slots - data.used_slots));
    } catch {
      if (attempt < 2) setTimeout(() => fetchQuota(attempt + 1), 1500 * (attempt + 1));
    } finally {
      setQuotaLoading(false);
    }
  }, []);

  // Handle Stripe return
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      const offerParam = searchParams.get("offer");
      const sType: SuccessType =
        offerParam === "launch" ? "stripe_launch" :
        offerParam === "standard" ? "stripe_standard" :
        "stripe_launch";
      setSuccessType(sType);
      setIsSuccess(true);
      trackEvent("checkout_success", user?.id, { offer_type: sType });
      refresh();
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        await refresh();
        if (attempts >= 8) clearInterval(poll);
      }, 2000);
      return () => clearInterval(poll);
    }
    fetchQuota();
  }, [searchParams, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Promo step: when promo succeeds → go to success
  const handlePromoSuccess = () => {
    setSuccessType("promo");
    setIsSuccess(true);
  };

  // Step 2 next: either promo success already handled above, or proceed to step 3
  const handleStep2Next = () => {
    setStep(3);
  };

  if (isSuccess) {
    return (
      <SuccessScreen
        successType={successType}
        prenom={profile?.prenom ?? null}
        subLoading={subLoading}
        status={status}
        navigate={navigate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      {/* Header */}
      <div
        className="pt-12 pb-6 text-center"
        style={{
          background: "linear-gradient(155deg, hsl(218 72% 4%) 0%, hsl(218 72% 8%) 60%, hsl(218 65% 11%) 100%)",
          borderBottom: "1px solid hsl(218 40% 18% / 0.6)",
        }}
      >
        <div className="container max-w-4xl">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4"
            style={{ background: "hsl(var(--accent) / 0.15)", border: "1px solid hsl(var(--accent) / 0.4)", color: "hsl(var(--accent))" }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(var(--accent))" }} />
            Founder Pass — 100 places max
          </div>
          <h1 className="font-display font-black text-white text-2xl md:text-3xl tracking-tight mb-2">
            Activez votre accès Founder Pass
          </h1>
          <p className="text-white/55 text-sm">
            Paiement sécurisé · Accès immédiat · Prix garanti à vie
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 py-10">
        <div className="container max-w-4xl">
          <div className="flex gap-8 items-start">
            {/* Main column */}
            <div className="flex-1 min-w-0">
              <StepIndicator current={step} />

              <div
                className="rounded-2xl border p-6 md:p-8"
                style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
              >
                {step === 1 && (
                  <StepRecap
                    slots={slots}
                    quotaLoading={quotaLoading}
                    onNext={() => setStep(2)}
                  />
                )}
                {step === 2 && (
                  <StepPromo
                    onNext={handleStep2Next}
                    onSkip={() => setStep(3)}
                    redeemPromo={async (code) => {
                      const result = await redeemPromo(code);
                      if (result.valid) {
                        setTimeout(() => handlePromoSuccess(), 1600);
                      }
                      return result;
                    }}
                    user={user}
                  />
                )}
                {step === 3 && (
                  <StepPayment
                    user={user}
                    startCheckout={startCheckout}
                    onPromoSuccess={handlePromoSuccess}
                  />
                )}
              </div>
            </div>

            {/* Desktop sidebar */}
            <OrderSidebar slots={slots} />
          </div>
        </div>
      </div>
    </div>
  );
}
