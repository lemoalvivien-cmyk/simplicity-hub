/**
 * /success — Page de confirmation post-paiement
 * Redirige intelligemment selon l'état onboarding + rôle de l'utilisateur.
 * - onboarding_done = true  → /dashboard
 * - onboarding_done = false → /onboarding?role=entreprise (rôle pré-sélectionné)
 *
 * Accessible via :
 *   - Stripe success_url redirect → /success?session_id=...&offer=launch
 *   - Navigation directe post-paiement
 */
import { useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, isAccessActive } from "@/contexts/SubscriptionContext";
import {
  CheckCircle2, Zap, Sparkles, ArrowRight, Loader2,
  ShieldCheck, BadgeCheck, Gift, Lock, Star,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const nextSteps = [
  {
    n: "01",
    title: "Configurez votre profil entreprise",
    desc: "Secteur, cible clients, zone géographique — 2 minutes chrono.",
    color: "hsl(var(--primary-glow))",
  },
  {
    n: "02",
    title: "Publiez votre première mission",
    desc: "Décrivez le client idéal que vous cherchez. En 2 minutes, votre réseau d'apporteurs peut vous envoyer des introductions.",
    color: "hsl(var(--accent))",
  },
  {
    n: "03",
    title: "Votre réseau se construit tout seul",
    desc: "Les facilitateurs commencent à vous apporter des introductions qualifiées.",
    color: "hsl(152 62% 48%)",
  },
];

const guarantees = [
  { icon: ShieldCheck, label: "Accès immédiat" },
  { icon: BadgeCheck, label: "Prix garanti à vie" },
  { icon: Gift, label: "30j satisfait ou remboursé" },
];

export default function Success() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { status, loading: subLoading, refresh } = useSubscription();

  const prenom = profile?.prenom ?? null;
  const isActive = isAccessActive(status);
  // Read offer param from Stripe redirect (?offer=launch) for analytics
  const offerParam = searchParams.get("offer") ?? "launch";

  // Poll subscription after Stripe redirect
  useEffect(() => {
    trackEvent("success_view", user?.id ?? null, { source: "post_payment", offer: offerParam });
    refresh();
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      await refresh();
      if (attempts >= 10) clearInterval(poll);
    }, 2000);
    return () => clearInterval(poll);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContinue = () => {
    if (profile?.onboarding_done) {
      navigate("/dashboard", { replace: true });
    } else {
      // Pre-select "entreprise" role — user just paid for Founder Pass
      navigate("/onboarding?role=entreprise", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />
      <div className="flex-1 flex items-center justify-center p-6 py-16">
        <div className="max-w-lg w-full">

          {/* ── Success hero ──────────────────────────────────────────── */}
          <div className="text-center mb-8">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
              style={{
                background: "hsl(152 62% 34% / 0.1)",
                border: "2px solid hsl(152 62% 34% / 0.35)",
                boxShadow: "0 0 60px hsl(152 62% 34% / 0.12)",
              }}
            >
              <CheckCircle2 size={44} style={{ color: "hsl(152 62% 48%)" }} />
            </div>

            {/* Activated badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-5"
              style={{
                background: "linear-gradient(135deg, hsl(218 72% 10%) 0%, hsl(218 65% 16%) 100%)",
                borderColor: "hsl(var(--primary-glow) / 0.4)",
              }}
            >
              <Zap size={13} style={{ color: "hsl(var(--accent))" }} />
              <span className="text-sm font-bold text-white">🎯 Founder Pass activé — 99 € TTC/an</span>
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-black text-foreground mb-3">
              {prenom ? `Bienvenue, ${prenom} ! 🎉` : "Bienvenue dans WiinupMax ! 🎉"}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto">
              Votre paiement a bien été reçu. Votre accès Founder Pass est actif pour un an entier.
            </p>
          </div>

          {/* ── Prochaines étapes ─────────────────────────────────────── */}
          <div
            className="rounded-2xl border overflow-hidden mb-5"
            style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
          >
            <div
              className="px-6 py-4"
              style={{
                background: "linear-gradient(135deg, hsl(218 72% 10%) 0%, hsl(218 65% 16%) 100%)",
                borderBottom: "1px solid hsl(218 40% 22% / 0.5)",
              }}
            >
              <p className="text-sm font-bold text-white">Ce qui vous attend ✨</p>
            </div>
            <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
              {nextSteps.map(({ n, title, desc, color }) => (
                <div key={n} className="flex items-start gap-4 px-6 py-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-black font-display"
                    style={{
                      background: color.replace("hsl(", "hsl(").replace(")", " / 0.12)"),
                      color,
                    }}
                  >
                    {n}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Garanties strip ──────────────────────────────────────── */}
          <div
            className="rounded-2xl border p-4 grid grid-cols-3 gap-3 mb-5"
            style={{ background: "hsl(var(--muted) / 0.5)", borderColor: "hsl(var(--border))" }}
          >
            {guarantees.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                <Icon size={16} className="text-success" />
                <span className="text-xs text-muted-foreground leading-tight">{label}</span>
              </div>
            ))}
          </div>

          {/* ── Prix verrouillé à vie ─────────────────────────────────── */}
          <div
            className="rounded-2xl border p-4 flex items-start gap-3 mb-5"
            style={{
              background: "hsl(38 95% 50% / 0.06)",
              borderColor: "hsl(38 95% 50% / 0.2)",
            }}
          >
            <Star size={15} style={{ color: "hsl(38 95% 55%)" }} className="shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground" style={{ color: "hsl(38 95% 55%)" }}>Prix garanti à vie :</strong>{" "}
              Votre tarif de 99 €/an est verrouillé définitivement. Il ne sera jamais réévalué, même quand le prix passe à 990 €.
            </p>
          </div>

          {/* ── CTA ──────────────────────────────────────────────────── */}
          <button
            onClick={handleContinue}
            disabled={subLoading && !isActive}
            className="w-full btn-cta py-4 text-base font-bold flex items-center justify-center gap-2.5 disabled:opacity-70 mb-3"
          >
            {subLoading && !isActive ? (
              <><Loader2 size={16} className="animate-spin" /> Activation en cours…</>
            ) : (
              <>
                <Sparkles size={16} />
                {profile?.onboarding_done ? "Accéder à mon espace" : "Démarrer mon profil — 2 minutes"}
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Assurance anti-doute */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock size={11} />
            <span>
              Paiement sécurisé Stripe · Facture envoyée à{" "}
              <span className="text-foreground font-medium">{user?.email}</span>
            </span>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-2">
            <a href="mailto:contact@wiinupmax.com" className="underline hover:text-foreground transition-colors">
              Besoin d'aide ? On répond sous 24h.
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
