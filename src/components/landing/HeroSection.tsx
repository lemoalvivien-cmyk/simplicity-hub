import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="hero-bg py-20 md:py-28">
      <div className="container max-w-3xl text-center">
        {/* Badge */}
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white/80 border border-white/15 mb-8">
          ✦ Offre de lancement — 99 € TTC / an pour les 100 premières entreprises
        </span>

        {/* Title */}
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
          Gérez votre activité.{" "}
          <span className="text-accent">Sans vous compliquer la vie.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-white/70 mb-10 max-w-xl mx-auto leading-relaxed">
          Planify est l'outil qui fait le travail compliqué à votre place.
          Vous n'avez besoin d'aucune compétence technique pour démarrer.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            to="/pricing"
            className="btn-cta text-base px-8 py-4 flex items-center gap-2"
          >
            Commencer maintenant
            <ArrowRight size={18} />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base text-white/80 border border-white/20 hover:bg-white/10 transition-colors"
          >
            <Play size={16} />
            Voir comment ça marche
          </a>
        </div>

        {/* Trust bar */}
        <p className="mt-8 text-sm text-white/45">
          Offre lancement 99 € / an · Apporteurs gratuits · Annulation libre · Aide incluse
        </p>
      </div>

      {/* Product mock */}
      <div className="container max-w-4xl mt-16 px-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {/* Fake browser bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
            <div className="w-3 h-3 rounded-full bg-white/20" />
            <div className="w-3 h-3 rounded-full bg-white/20" />
            <div className="w-3 h-3 rounded-full bg-white/20" />
            <div className="flex-1 mx-4 h-6 bg-white/10 rounded-md" />
          </div>
          {/* Dashboard preview */}
          <div className="p-6 md:p-8 grid md:grid-cols-3 gap-4">
            {[
              { label: "Tâches du jour", val: "4", color: "bg-accent/20 text-accent" },
              { label: "Dossiers actifs", val: "12", color: "bg-primary/20 text-primary-foreground/60" },
              { label: "Messages non lus", val: "2", color: "bg-white/10 text-white/60" },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-white/5 rounded-xl p-4">
                <p className="text-white/50 text-xs mb-2">{label}</p>
                <p className={`font-display font-bold text-3xl ${color}`}>{val}</p>
              </div>
            ))}
            <div className="md:col-span-3 bg-white/5 rounded-xl p-4">
              <p className="text-white/50 text-xs mb-3">Vos dernières actions</p>
              <div className="space-y-2">
                {["Dossier client mis à jour", "Rappel automatique envoyé", "Facture générée"].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
                    <span className="text-white/60 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
