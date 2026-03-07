import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Zap, Shield, Users } from "lucide-react";
import LaunchQuotaBanner from "@/components/landing/LaunchQuotaBanner";
import { useTranslation } from "react-i18next";

export default function HeroSection() {
  const { t } = useTranslation();

  const steps = [
    {
      num: "01",
      title: t("hero_step1_title"),
      desc: t("hero_step1_desc"),
      color: "hsl(218 72% 55%)",
      dot: "hsl(218 72% 55%)",
    },
    {
      num: "02",
      title: t("hero_step2_title"),
      desc: t("hero_step2_desc"),
      color: "hsl(152 62% 45%)",
      dot: "hsl(152 62% 45%)",
    },
    {
      num: "03",
      title: t("hero_step3_title"),
      desc: t("hero_step3_desc"),
      color: "hsl(24 100% 52%)",
      dot: "hsl(24 100% 52%)",
    },
  ];

  const trustItems = [
    { icon: CheckCircle2, label: t("hero_trust_1") },
    { icon: Shield,       label: t("hero_trust_2") },
    { icon: Zap,          label: t("hero_trust_3") },
  ];

  return (
    <>
      {/* ══ HERO PRINCIPAL ══════════════════════════════════════ */}
      <section className="hero-bg py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 30%, hsl(218 72% 30% / 0.25) 0%, transparent 70%)"
        }} />

        <div className="container max-w-3xl text-center relative z-10">
          {/* Bandeau urgence */}
          <LaunchQuotaBanner variant="hero" />

          {/* ACCROCHE PRINCIPALE */}
          <h1 className="font-display font-bold text-white leading-tight tracking-tight mb-5 mt-6">
            <span className="block text-4xl md:text-5xl lg:text-6xl" style={{
              background: "linear-gradient(135deg, hsl(24 100% 65%), hsl(38 100% 70%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              {t("hero_headline_1")}
            </span>
            <span className="block text-3xl md:text-4xl lg:text-5xl text-white mt-2">
              {t("hero_headline_2")}
            </span>
          </h1>

          {/* Sous-titre */}
          <p className="text-lg md:text-xl text-white/60 mb-8 max-w-xl mx-auto leading-relaxed font-light">
            {t("hero_subtitle")}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
            <Link to="/pricing" className="btn-cta text-base px-10 py-4 gap-2 w-full sm:w-auto">
              {t("hero_cta_entreprise")}
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white/65 border border-white/15 font-medium text-sm hover:bg-white/8 transition-colors w-full sm:w-auto"
            >
              <Users size={14} />
              {t("hero_cta_apporteur")}
            </Link>
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-white/35 text-xs">
            {trustItems.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon size={11} className="text-white/40" /> {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Mockup "comment ça marche" ── */}
        <div className="container max-w-3xl mt-14 px-4 relative z-10">
          <div className="rounded-2xl overflow-hidden border border-white/10" style={{
            boxShadow: "0 32px 80px hsl(218 72% 8% / 0.7), 0 0 0 1px hsl(218 72% 40% / 0.08)",
            background: "hsl(218 65% 12% / 0.95)"
          }}>
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/8" style={{ background: "hsl(218 72% 10% / 0.9)" }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: "hsl(0 70% 55%)" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "hsl(38 90% 55%)" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "hsl(120 55% 45%)" }} />
              </div>
              <div className="flex-1 mx-4 h-5 rounded flex items-center px-3" style={{ background: "hsl(218 50% 20% / 0.5)" }}>
                <span className="text-white/30 text-xs">wiinupmax.app</span>
              </div>
            </div>
            <div className="p-5 md:p-6 grid md:grid-cols-3 gap-3">
              {steps.map(({ num, title, desc, color, dot }) => (
                <div key={num} className="rounded-xl p-4" style={{ background: "hsl(218 50% 16% / 0.7)", border: `1px solid ${color}20` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: dot }} />
                    <span className="text-xs font-bold" style={{ color }}>{num}</span>
                  </div>
                  <p className="text-white/85 text-sm font-semibold mb-1">{title}</p>
                  <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
