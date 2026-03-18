import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PublicNav, { LegalFooter } from "@/components/layout/PublicNav";
import {
  CheckCircle2, Zap, Users, ArrowRight,
  FileText, TrendingUp, Coins, Shield, ChevronDown, ChevronUp,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";

// ─── Feature blocks ────────────────────────────────────────────────────────
const founderFeatures = [
  {
    icon: FileText,
    color: "hsl(210 85% 62%)",
    category: "Missions et ciblage",
    items: [
      "Missions publiées en 2 minutes",
      "Visibles immédiatement par vos apporteurs",
      "Critères de ciblage précis par secteur et zone",
      "Vous gardez le contrôle total",
    ],
  },
  {
    icon: Users,
    color: "hsl(var(--primary-glow))",
    category: "Réseau et introductions",
    items: [
      "Introductions qualifiées par vos contacts de confiance",
      "Chaque mise en relation traçée et horodatée",
      "Validation en un clic, refus possible",
      "Tableau de suivi complet · Zéro intro perdue",
    ],
  },
  {
    icon: Coins,
    color: "hsl(var(--accent))",
    category: "Gains automatiques",
    items: [
      "Versement automatique à signature de contrat",
      "Commission définie à l'avance, transparente",
      "Gains enregistrés et protégés pour vos apporteurs",
      "Traçabilité totale · Aucune zone grise",
    ],
  },
  {
    icon: TrendingUp,
    color: "hsl(152 62% 52%)",
    category: "Suivi en temps réel",
    items: [
      "Pipeline clair et lisible à tout moment",
      "Réseau de confiance évolutif",
      "Attribution prouvée et vérifiable",
      "Score de réputation des facilitateurs",
    ],
  },
  {
    icon: Shield,
    color: "hsl(38 95% 52%)",
    category: "Réseau et sécurité",
    items: [
      "Facilitateurs qualifiés disponibles",
      "Chaque présentation vérifiée et protégée",
      "Protection contre les contournements",
      "Support inclus · Mises à jour incluses · Conforme RGPD",
    ],
  },
];

const facilitateurFeatures = [
  "Toutes les missions disponibles",
  "Introductions illimitées",
  "Suivi des gains en temps réel",
  "Protection de chaque introduction",
  "Score de confiance visible",
  "Aucune commission prélevée par la plateforme",
];

const faqItems = [
  {
    q: "À quoi servent les 99 € par an ?",
    a: "Ils donnent accès à tout : publier des missions, recevoir des introductions qualifiées de vos apporteurs, suivre votre pipeline et déclencher les versements automatiques. Tout inclus, sans frais cachés.",
  },
  {
    q: "Puis-je arrêter quand je veux ?",
    a: "Oui. Sans condition. Votre accès continue jusqu'à la fin de la période payée. Aucune pénalité, aucun engagement.",
  },
  {
    q: "Les facilitateurs paient-ils quelque chose ?",
    a: "Non. L'accès facilitateur est gratuit pour toujours. Aucune carte bancaire. Vous présentez des gens, vous êtes payé. On ne prend rien sur vos gains.",
  },
  {
    q: "Mon tarif de 99 € est-il garanti à vie ?",
    a: "Oui. Si vous vous inscrivez pendant la période de lancement, votre tarif reste à 99 €/an pour toujours. Aucune surprise.",
  },
];

// ─── Slot badge live ───────────────────────────────────────────────────────
function SlotBadge({ slots }: { slots: number }) {
  const pct = (slots / 100) * 100;
  const urgent = slots <= 20;
  return (
    <div
      className="rounded-2xl px-5 py-4 border flex flex-col gap-2"
      style={{
        background: urgent ? "hsl(0 72% 51% / 0.08)" : "hsl(var(--accent) / 0.08)",
        borderColor: urgent ? "hsl(0 72% 51% / 0.35)" : "hsl(var(--accent) / 0.35)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame size={15} style={{ color: urgent ? "hsl(0 72% 65%)" : "hsl(var(--accent))" }} />
          <span
            className="text-sm font-bold"
            style={{ color: urgent ? "hsl(0 72% 72%)" : "hsl(var(--accent))" }}
          >
            {urgent ? "🔥 Offre de lancement !" : "Offre Founder Pass exclusive"}
          </span>
        </div>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{
            background: urgent ? "hsl(0 72% 51% / 0.18)" : "hsl(var(--accent) / 0.18)",
            color: urgent ? "hsl(0 72% 72%)" : "hsl(var(--accent))",
          }}
        >
          Founder Pass — 99 €/an
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${100 - pct}%`,
            background: urgent
              ? "linear-gradient(90deg, hsl(0 72% 55%), hsl(0 72% 72%))"
              : "linear-gradient(90deg, hsl(var(--accent)), hsl(38 100% 72%))",
          }}
        />
      </div>
      <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
        99 € TTC/an au lieu de 990 € — Prix garanti à vie · Premier arrivé premier servi
      </p>
    </div>
  );
}

// ─── FAQ accordion item ────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl border overflow-hidden cursor-pointer"
      style={{
        background: "hsl(var(--card))",
        borderColor: open ? "hsl(var(--primary-glow) / 0.3)" : "hsl(var(--border))",
      }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <p className="font-semibold text-sm text-foreground">{q}</p>
        {open
          ? <ChevronUp size={15} className="shrink-0 text-muted-foreground" />
          : <ChevronDown size={15} className="shrink-0 text-muted-foreground" />
        }
      </div>
      {open && (
        <div className="px-5 pb-4 border-t border-border">
          <p className="text-sm text-muted-foreground leading-relaxed pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

// ─── CTA: Activer Founder Pass → /checkout ────────────────────────────────
function ActivateButton() {
  const handleClick = () => {
    trackEvent("cta_click", null, { source: "pricing_founder_pass" });
    window.location.href = "/checkout";
  };

  return (
    <button
      onClick={handleClick}
      className="btn-cta w-full flex items-center justify-center gap-2 py-4 text-base font-bold"
    >
      <Zap size={16} strokeWidth={2.5} />
      Activer Founder Pass — 99 € TTC/an
      <ArrowRight size={16} />
    </button>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function Pricing() {
  const { remaining, loading: slotsLoading } = useFounderSlots();
  const slotsRemaining = remaining ?? 100;

  useEffect(() => {
    trackEvent("pricing_view", null, { source: "direct" });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      {/* ── Hero header ─────────────────────────────────────────────── */}
      <section
        className="pt-20 pb-14 text-center relative overflow-hidden"
        style={{
          background: "linear-gradient(155deg, hsl(218 72% 4%) 0%, hsl(218 72% 9%) 55%, hsl(218 65% 13%) 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 20%, hsl(218 72% 28% / 0.4) 0%, transparent 65%)" }}
          aria-hidden="true"
        />
        <div className="container max-w-3xl relative z-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
            style={{
              background: "hsl(var(--accent) / 0.15)",
              border: "1px solid hsl(var(--accent) / 0.4)",
              color: "hsl(var(--accent))",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "hsl(var(--accent))" }}
            />
            Tarifs — Offre de lancement
          </div>

          <h1 className="font-display font-black text-white leading-tight tracking-tight mb-4" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
            WIINUP MAX
            <span
              className="block"
              style={{
                fontSize: "clamp(1.1rem, 2.8vw, 1.8rem)",
                fontWeight: 700,
                background: "linear-gradient(135deg, hsl(var(--accent)), hsl(38 100% 72%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginTop: "0.3rem",
              }}
            >
              Founder Pass 99 €/an
            </span>
          </h1>

          <p className="text-white/65 max-w-xl mx-auto leading-relaxed" style={{ fontSize: "clamp(0.9rem, 1.9vw, 1.05rem)" }}>
            Vos contacts vous envoient des introductions qualifiées.{" "}
            Vos <strong className="text-white/85">gains sont versés automatiquement</strong> à chaque affaire signée. Vous ne payez que si ça marche.
          </p>
        </div>
      </section>

      {/* ── Slot badge ──────────────────────────────────────────────── */}
      <div className="container max-w-4xl py-6">
        <SlotBadge slots={slotsRemaining} />
      </div>

      {/* ── Pricing cards ───────────────────────────────────────────── */}
      <div className="container max-w-4xl pb-16">
        <div className="grid lg:grid-cols-5 gap-6 items-start">

          {/* ── Founder Pass (3/5 width) ─────────────────────────── */}
          <div className="lg:col-span-3 rounded-2xl overflow-hidden border-2 flex flex-col" style={{ borderColor: "hsl(var(--primary-glow) / 0.5)", background: "hsl(var(--card))" }}>

            {/* Card header */}
            <div
              className="px-7 pt-7 pb-6"
              style={{ background: "linear-gradient(135deg, hsl(218 72% 14%) 0%, hsl(218 65% 20%) 100%)" }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: "hsl(var(--accent) / 0.2)", border: "1px solid hsl(var(--accent) / 0.45)", color: "hsl(var(--accent))" }}
                >
                  <Zap size={10} />
                  Offre en cours
                </span>
                <span className="text-white/40 text-xs">·</span>
                <span className="text-white/55 text-xs font-medium">Prix garanti à vie</span>
              </div>

              <p className="text-white/75 text-xs font-bold uppercase tracking-widest mb-2">Founder Pass — Entreprise</p>

              <div className="flex items-end gap-3 mb-2">
                <span className="font-display font-black text-white leading-none" style={{ fontSize: "clamp(2.8rem, 6vw, 3.8rem)" }}>
                  99 €
                </span>
                <div className="pb-1.5 flex flex-col gap-0.5">
                  <span className="text-white/85 text-sm font-semibold">/an TTC</span>
                  <span className="text-white/35 text-xs line-through">990 €</span>
                </div>
              </div>

              <p className="text-white/60 text-xs leading-relaxed max-w-sm">
                Prix garanti à vie · Facturation annuelle · Résiliation libre.
                Le tarif Founder Pass est garanti à vie.
              </p>
            </div>

            {/* Feature blocks */}
            <div className="px-6 py-6 flex flex-col flex-1 gap-5">
              {founderFeatures.map(({ icon: Icon, color, category, items }) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Icon size={13} style={{ color }} className="shrink-0" />
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                      {category}
                    </p>
                  </div>
                  <ul className="space-y-1.5 pl-[1.35rem]">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <CheckCircle2 size={12} style={{ color }} className="shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="px-7 pb-7 pt-2 flex flex-col gap-3">
              <ActivateButton />
              <p className="text-center text-xs text-muted-foreground">
                Accès immédiat après paiement · RGPD · Facture annuelle
              </p>
            </div>
          </div>

          {/* ── Facilitateur (2/5 width) ───────────────────────────── */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border-2 flex flex-col" style={{ borderColor: "hsl(var(--accent) / 0.45)", background: "hsl(var(--card))" }}>

            <div
              className="px-6 pt-6 pb-5"
              style={{ background: "linear-gradient(135deg, hsl(24 90% 22%) 0%, hsl(24 80% 30%) 100%)" }}
            >
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-4">
                <Users size={17} className="text-white" />
              </div>
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
                Facilitateur / Apporteur
              </p>
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="font-display font-black text-white" style={{ fontSize: "2.6rem" }}>
                  Gratuit
                </span>
              </div>
              <p className="text-white/55 text-xs leading-relaxed">
                Pour toujours · Sans carte bancaire<br />Zéro frais caché · Zéro commission
              </p>
            </div>

            <div className="px-6 py-6 flex flex-col flex-1">
              <ul className="space-y-3 mb-6 flex-1">
                {facilitateurFeatures.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 size={13} style={{ color: "hsl(var(--accent))" }} className="shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/signup"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold border-2 transition-all duration-200 hover:opacity-90"
                style={{ borderColor: "hsl(var(--accent))", color: "hsl(var(--accent))" }}
              >
                <Users size={14} />
                Créer mon accès — Gratuit
              </Link>

              {/* What you earn box */}
              <div
                className="mt-4 rounded-xl p-4 border"
                style={{ background: "hsl(var(--accent) / 0.06)", borderColor: "hsl(var(--accent) / 0.2)" }}
              >
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--accent))" }}>
                  Vous gagnez
                </p>
                <p className="text-sm text-foreground">
                  <strong>100 % des commissions</strong> sur chaque introduction validée.
                  Attribution prouvée on-chain. Paiement garanti.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reassurance row */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-xs text-muted-foreground">
          {[
            { icon: Shield, label: "Paiement sécurisé Stripe" },
            { icon: Shield, label: "Données protégées · RGPD" },
            { icon: Zap, label: "Accès immédiat après paiement" },
            { icon: CheckCircle2, label: "Tarif garanti à vie" },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <Icon size={11} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Comment ça marche pour vos gains ────────────────────────── */}
      <section className="border-t border-border py-14 bg-muted">
        <div className="container max-w-3xl text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-5"
            style={{ background: "hsl(var(--accent) / 0.12)", border: "1px solid hsl(var(--accent) / 0.35)", color: "hsl(var(--accent))" }}
          >
            <Coins size={11} />
            Vos gains — transparent et automatique
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
            Vos gains, versés automatiquement à chaque affaire signée
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-xl mx-auto">
            À chaque affaire conclue et signée, une part revient automatiquement à votre apporteur.
            Frais de plateforme transparents, traçabilité totale, aucune surprise.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            {[
              { label: "Frais plateforme", pct: "7 %", desc: "Financement de la plateforme, R&D et équipe", color: "hsl(var(--primary-glow))" },
              { label: "Commission apporteur", pct: "5 %+", desc: "Définie par vous lors de la création de mission", color: "hsl(var(--accent))" },
              { label: "Votre part", pct: "88 %", desc: "Versé automatiquement après chaque affaire signée", color: "hsl(152 62% 52%)" },
            ].map(({ label, pct, desc, color }) => (
              <div
                key={label}
                className="rounded-2xl p-5 border"
                style={{ background: "hsl(var(--card))", borderColor: `${color.replace(")", " / 0.25)")}` }}
              >
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color }}>
                  {label}
                </p>
                <p className="font-display font-black text-3xl mb-1.5" style={{ color }}>
                  {pct}
                </p>
                <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="border-t border-border py-14">
        <div className="container max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-foreground mb-8 text-center">
            Questions fréquentes
          </h2>
          <div className="space-y-3">
            {faqItems.map(({ q, a }) => (
              <FAQItem key={q} q={q} a={a} />
            ))}
          </div>
        </div>
      </section>

      <LegalFooter />
    </div>
  );
}
