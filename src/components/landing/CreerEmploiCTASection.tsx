import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, TrendingUp, Clock, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { track } from "@/lib/landingTracking";

const benefits = [
  { icon: TrendingUp, text: "300 € à 2 000 € par introduction réussie" },
  { icon: Clock, text: "Moins de 8h par semaine, sans horaire imposé" },
  { icon: Shield, text: "Gains traçés et versés automatiquement" },
  { icon: Briefcase, text: "Compatible avec un emploi salarié" },
];

const EASE = { ease: [0.22, 1, 0.36, 1] as const, duration: 0.65 };

export default function CreerEmploiCTASection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(155deg, hsl(218 72% 4%) 0%, hsl(218 60% 10%) 50%, hsl(24 40% 12%) 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 70% 40%, hsl(var(--accent) / 0.12) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="container max-w-5xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left — text */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={EASE}
          >
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
              style={{
                background: "hsl(var(--accent) / 0.12)",
                color: "hsl(var(--accent))",
                border: "1px solid hsl(var(--accent) / 0.25)",
              }}
            >
              <Briefcase size={12} />
              Opportunité facilitateur
            </div>

            <h2
              className="font-display font-bold text-white leading-tight mb-5"
              style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}
            >
              Créez votre emploi ou complément de revenus{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, hsl(var(--accent)), hsl(38 100% 72%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                en moins de 8h par semaine
              </span>
            </h2>

            <p className="text-white/60 text-base leading-relaxed mb-8 max-w-lg">
              Vous avez un réseau professionnel ? Monétisez-le en présentant des prospects qualifiés
              aux entreprises qui en ont besoin. Aucun investissement. Aucune formation complexe.
              Vous êtes payé uniquement quand l'affaire est signée.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {benefits.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "hsl(var(--accent) / 0.12)" }}
                  >
                    <Icon size={13} style={{ color: "hsl(var(--accent))" }} />
                  </div>
                  <span className="text-white/75 text-sm leading-snug">{text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/creer-emploi"
                  className="btn-cta flex items-center justify-center gap-2 px-7 py-4 text-sm font-bold"
                  onClick={() => track("cta_landing_creer_emploi_section")}
                >
                  Découvrir comment ça marche
                  <ArrowRight size={15} />
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Right — visual proof card */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ ...EASE, delay: 0.15 }}
          >
            <div
              className="rounded-2xl p-6 md:p-8 border"
              style={{
                background: "hsl(218 55% 8% / 0.8)",
                borderColor: "hsl(var(--accent) / 0.2)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 20px 60px hsl(218 72% 4% / 0.6)",
              }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: "hsl(var(--accent))" }}>
                Exemple de gains facilitateur
              </p>

              <div className="space-y-4">
                {[
                  { month: "Mois 1", intros: "2 introductions", gain: "+800 €", opacity: 0.7 },
                  { month: "Mois 2", intros: "3 introductions", gain: "+1 400 €", opacity: 0.85 },
                  { month: "Mois 3", intros: "4 introductions", gain: "+2 200 €", opacity: 1 },
                ].map(({ month, intros, gain, opacity }) => (
                  <div
                    key={month}
                    className="flex items-center justify-between rounded-xl px-4 py-3 border"
                    style={{
                      background: "hsl(218 55% 12% / 0.5)",
                      borderColor: `hsl(var(--accent) / ${opacity * 0.15})`,
                      opacity,
                    }}
                  >
                    <div>
                      <p className="text-white font-semibold text-sm">{month}</p>
                      <p className="text-white/45 text-xs">{intros}</p>
                    </div>
                    <span className="font-display font-bold text-lg" style={{ color: "hsl(152 62% 52%)" }}>
                      {gain}
                    </span>
                  </div>
                ))}
              </div>

              <div
                className="mt-6 pt-4 flex items-center justify-between"
                style={{ borderTop: "1px solid hsl(218 30% 25% / 0.5)" }}
              >
                <span className="text-white/50 text-xs">Total sur 3 mois</span>
                <span className="font-display font-bold text-xl" style={{ color: "hsl(var(--accent))" }}>
                  +4 400 €
                </span>
              </div>

              <p className="text-white/30 text-[10px] mt-3 text-center">
                Estimations basées sur une commission moyenne de 400 € par introduction qualifiée validée.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
