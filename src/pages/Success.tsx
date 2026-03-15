/**
 * /success — Page de confirmation post-paiement
 * Redirige intelligemment selon l'état onboarding de l'utilisateur
 */
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, isAccessActive } from "@/contexts/SubscriptionContext";
import {
  CheckCircle2, Zap, Sparkles, ArrowRight, Loader2,
  ShieldCheck, BadgeCheck, Gift,
} from "lucide-react";

export default function Success() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { status, loading: subLoading, refresh } = useSubscription();

  const prenom = profile?.prenom ?? null;
  const isActive = isAccessActive(status);

  // Poll subscription status after landing here directly
  useEffect(() => {
    refresh();
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      await refresh();
      if (attempts >= 8) clearInterval(poll);
    }, 2000);
    return () => clearInterval(poll);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContinue = () => {
    if (profile?.onboarding_done) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/onboarding", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />
      <div className="flex-1 flex items-center justify-center p-6 py-16">
        <div className="max-w-lg w-full">

          {/* Success icon */}
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

            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-5"
              style={{
                background: "linear-gradient(135deg, hsl(218 72% 10%) 0%, hsl(218 65% 16%) 100%)",
                borderColor: "hsl(var(--primary-glow) / 0.4)",
              }}
            >
              <Zap size={13} style={{ color: "hsl(var(--accent))" }} />
              <span className="text-sm font-bold text-white">🎯 Founder Pass activé</span>
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-black text-foreground mb-3">
              {prenom ? `Bienvenue, ${prenom} ! 🎉` : "Bienvenue dans WiinupMax ! 🎉"}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto">
              Votre paiement a bien été reçu. Votre accès Founder Pass est maintenant actif pour un an.
            </p>
          </div>

          {/* What's included */}
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
              {[
                {
                  n: "01",
                  title: "Configurez votre profil entreprise",
                  desc: "Secteur, cible clients, zone géographique — 2 minutes chrono.",
                  color: "hsl(var(--primary-glow))",
                },
                {
                  n: "02",
                  title: "Votre assistant IA s'active",
                  desc: "Il commence à identifier des opportunités pour vous immédiatement.",
                  color: "hsl(var(--accent))",
                },
                {
                  n: "03",
                  title: "Votre réseau se construit",
                  desc: "Les facilitateurs commencent à vous apporter des introductions qualifiées.",
                  color: "hsl(152 62% 48%)",
                },
              ].map(({ n, title, desc, color }) => (
                <div key={n} className="flex items-start gap-4 px-6 py-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-black font-display"
                    style={{ background: `${color.replace("hsl(", "hsl(").replace(")", " / 0.12)")}`, color }}
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

          {/* Guarantees strip */}
          <div
            className="rounded-2xl border p-4 grid grid-cols-3 gap-3 mb-5"
            style={{ background: "hsl(var(--muted) / 0.5)", borderColor: "hsl(var(--border))" }}
          >
            {[
              { icon: ShieldCheck, label: "Accès immédiat" },
              { icon: BadgeCheck, label: "Prix garanti à vie" },
              { icon: Gift, label: "30j remboursé si insatisfait" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                <Icon size={16} className="text-success" />
                <span className="text-xs text-muted-foreground leading-tight">{label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
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
                {profile?.onboarding_done ? "Accéder à mon espace" : "Démarrer mon onboarding"}
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Votre facture a été envoyée à{" "}
            <span className="text-foreground font-medium">{user?.email}</span>
            {" "}·{" "}
            <a href="mailto:contact@wiinupmax.com" className="underline hover:text-foreground transition-colors">
              Besoin d'aide ?
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
