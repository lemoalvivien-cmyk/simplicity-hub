import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import LaunchQuotaBanner from "@/components/landing/LaunchQuotaBanner";
import { CheckCircle2, Tag, Building2, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { formatAmount } from "@/lib/formatLocale";

const moteur1Items = [
  "OpenClaw — cerveau central de la prospection",
  "Agent OS & Deal Radar",
  "Campagnes & messages préparés par l'IA",
  "Diffusion passive & liens traqués",
  "Ce qui chauffe · signaux d'intention",
  "Cockpit de pilotage & rapports",
];

const moteur2Items = [
  "Accès au réseau de facilitateurs",
  "Missions, introductions & validations",
  "Introductions protégées & tracées",
  "Gains et confiance — tableau de bord",
  "Assistant JARVIS IA illimité",
  "App mobile / PWA incluse",
];

const apporteurIncludes = [
  "Accès à toutes les missions publiées",
  "Envoi d'introductions illimité",
  "Suivi des validations en temps réel",
  "Tableau de bord des gains",
  "Assistant JARVIS inclus",
  "Aucune commission prélevée par la plateforme",
];

export default function Pricing() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [launchAvailable, setLaunchAvailable] = useState(true);
  const [slotsRemaining, setSlotsRemaining] = useState(100);

  useEffect(() => {
    supabase.from("launch_quota").select("total_slots, used_slots").single().then(({ data }) => {
      if (data) {
        const remaining = Math.max(0, data.total_slots - data.used_slots);
        setLaunchAvailable(remaining > 0);
        setSlotsRemaining(remaining);
      }
    });
  }, []);

  const faqItems = [
    {
      q: "C'est quoi l'offre de lancement ?",
      a: launchAvailable
        ? `Les ${slotsRemaining} premières entreprises bénéficient d'un accès à 99 € TTC pour la première année. Après les 100 premières places, le tarif standard est de 490 € TTC / an.`
        : "L'offre de lancement à 99 € est épuisée. Le tarif standard est de 490 € TTC par an.",
    },
    { q: "Puis-je annuler à tout moment ?", a: "Oui, sans condition ni préavis. Votre accès reste actif jusqu'à la fin de la période payée." },
    { q: "Qu'est-ce qu'un code d'invitation ?", a: "C'est un code unique qui vous donne 12 mois d'accès gratuit. Si vous en avez un, entrez-le au moment de l'activation." },
    { q: "L'apporteur d'affaires est vraiment gratuit ?", a: "Oui, entièrement et pour toujours. Aucune commission n'est prélevée par la plateforme sur vos gains." },
    { q: "Est-ce vraiment simple à utiliser ?", a: "C'est notre engagement numéro un. Si vous trouvez quelque chose de compliqué, contactez-nous et on l'améliore." },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      {/* Header */}
      <section className="py-14 text-center container max-w-2xl">
        <p className="pill-tag mb-4 mx-auto w-fit">Tarifs</p>
        <h1 className="font-display text-4xl font-bold text-foreground mb-3">
          {t("pricing_title")}
        </h1>
        <p className="text-muted-foreground text-base">
          {t("pricing_subtitle")}
        </p>
      </section>

      {/* Compteur de places */}
      <div className="container max-w-2xl mb-2">
        <LaunchQuotaBanner variant="pricing" />
      </div>

      {/* Pricing cards */}
      <div className="container max-w-4xl pb-16">
        <div className="grid md:grid-cols-2 gap-6">

          {/* Entreprise */}
          <div className="bg-card rounded-2xl overflow-hidden border-2 border-primary shadow-primary">
            <div className="p-7 border-b border-border" style={{ background: "var(--gradient-primary)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <Building2 size={18} className="text-white" />
                </div>
                <p className="text-white/80 text-sm font-semibold uppercase tracking-wider">
                  {t("pricing_enterprise_label")}
                </p>
              </div>

              {launchAvailable ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
                      <Zap size={10} />
                      {t("pricing_launch_badge", { slots: slotsRemaining })}
                    </span>
                  </div>
                  <div className="flex items-end gap-2 mt-2">
                    <span className="font-display font-bold text-5xl text-white">
                      {formatAmount(99, lang)}
                    </span>
                    <div className="pb-1">
                      <span className="text-white/60 text-sm">{t("pricing_per_year")}</span>
                      <p className="text-white/40 text-xs line-through">{formatAmount(490, lang)} / an</p>
                    </div>
                  </div>
                  <p className="text-white/50 text-xs mt-2">{t("pricing_launch_note")}</p>
                </>
              ) : (
                <>
                  <div className="flex items-end gap-1.5 mt-2">
                    <span className="font-display font-bold text-5xl text-white">
                      {formatAmount(490, lang)}
                    </span>
                    <span className="text-white/60 text-sm pb-1">{t("pricing_per_year")}</span>
                  </div>
                  <p className="text-white/50 text-xs mt-2">{t("pricing_standard_note")}</p>
                </>
              )}
            </div>
            <div className="p-7">
              {/* Moteur 1 */}
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--primary))" }}>
                {t("pricing_moteur1")}
              </p>
              <ul className="space-y-2 mb-4">
                {moteur1Items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={14} style={{ color: "hsl(var(--primary))" }} className="shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              {/* Moteur 2 */}
              <p className="text-xs font-bold uppercase tracking-wider mb-3 mt-5" style={{ color: "hsl(var(--accent))" }}>
                {t("pricing_moteur2")}
              </p>
              <ul className="space-y-2 mb-7">
                {moteur2Items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={14} style={{ color: "hsl(var(--accent))" }} className="shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/checkout" className="btn-primary w-full text-center text-base py-4 block">
                {launchAvailable ? t("pricing_cta_launch") : t("pricing_cta_standard")}
              </Link>
              <div className="mt-4 p-3 rounded-lg border flex items-center gap-2" style={{ background: "hsl(218 72% 18% / 0.05)", borderColor: "hsl(218 72% 18% / 0.12)" }}>
                <Tag size={14} style={{ color: "hsl(var(--primary))" }} className="shrink-0" />
                <p className="text-xs text-foreground">
                  <strong>{t("pricing_promo_label")}</strong> {t("pricing_promo_note")}
                </p>
              </div>
            </div>
          </div>

          {/* Apporteur */}
          <div className="bg-card rounded-2xl overflow-hidden border-2 border-accent">
            <div className="p-7 border-b border-border" style={{ background: "var(--gradient-accent)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users size={18} className="text-white" />
                </div>
                <p className="text-white/90 text-sm font-semibold uppercase tracking-wider">
                  {t("pricing_apporteur_label")}
                </p>
              </div>
              <div className="flex items-end gap-1.5">
                <span className="font-display text-5xl font-bold text-white">{t("pricing_free_label")}</span>
              </div>
              <p className="text-white/65 text-xs mt-2">{t("pricing_free_note")}</p>
            </div>
            <div className="p-7">
              <ul className="space-y-3 mb-7">
                {apporteurIncludes.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={16} style={{ color: "hsl(var(--accent))" }} className="shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="btn-cta w-full text-center text-base py-4 block">
                {t("pricing_cta_free")}
              </Link>
            </div>
          </div>
        </div>

        {/* Reassurance */}
        <p className="text-center text-xs text-muted-foreground mt-7">
          {t("pricing_reassurance")}
        </p>
      </div>

      {/* FAQ rapide */}
      <section className="border-t border-border py-16 bg-muted">
        <div className="container max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-foreground mb-8 text-center">
            {t("pricing_faq_title")}
          </h2>
          <div className="space-y-4">
            {faqItems.map(({ q, a }) => (
              <div key={q} className="bg-card rounded-xl p-5 border border-border">
                <p className="font-semibold text-sm text-foreground mb-2">{q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
