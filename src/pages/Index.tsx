import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import { CheckCircle2, ArrowRight, Shield, Zap, Users, Star } from "lucide-react";

const benefits = [
  "Aucune compétence technique requise",
  "Résultats visibles dès le premier jour",
  "Support inclus à chaque étape",
  "Annulez à tout moment, sans condition",
];

const features = [
  {
    icon: Zap,
    title: "Simple dès le départ",
    desc: "Interface pensée pour des personnes comme vous. Pas de manuel d'utilisation.",
  },
  {
    icon: Shield,
    title: "Sécurisé et fiable",
    desc: "Vos données sont protégées. Disponibilité garantie 99,9%.",
  },
  {
    icon: Users,
    title: "Vous n'êtes pas seul",
    desc: "Notre assistant IA et notre équipe sont là si vous avez la moindre question.",
  },
];

const testimonials = [
  {
    name: "Marie D.",
    role: "Indépendante",
    text: "J'avais peur que ce soit compliqué. En 10 minutes j'étais opérationnelle. Vraiment.",
    stars: 5,
  },
  {
    name: "Julien M.",
    role: "Gérant de PME",
    text: "Enfin un outil qu'on comprend du premier coup. Ça change tout.",
    stars: 5,
  },
  {
    name: "Sophie L.",
    role: "Consultante",
    text: "Le support est réactif et l'assistant IA répond à toutes mes questions rapidement.",
    stars: 5,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      {/* HERO */}
      <section className="hero-bg py-20 md:py-28">
        <div className="container max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white/80 border border-white/15 mb-6">
            ✦ Lancement — 59 € / mois
          </span>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Votre outil professionnel,{" "}
            <span className="text-accent">enfin simple</span> à utiliser.
          </h1>
          <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto">
            Planify est fait pour vous — pas pour les techniciens.
            Configurez votre espace en 3 minutes, et commencez à travailler efficacement.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/pricing" className="btn-cta text-base px-8 py-4">
              Commencer maintenant →
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base text-white/80 border border-white/20 hover:bg-white/10 transition-colors"
            >
              J'ai déjà un compte
            </Link>
          </div>

          {/* Micro-preuve */}
          <div className="flex flex-wrap items-center justify-center gap-5 mt-10">
            {benefits.map((b) => (
              <span key={b} className="flex items-center gap-1.5 text-sm text-white/65">
                <CheckCircle2 size={14} className="text-accent shrink-0" />
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="py-20 bg-background">
        <div className="container max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              En 3 étapes, c'est lancé.
            </h2>
            <p className="text-muted-foreground text-lg">
              Pas besoin de guide. Vous comprendrez tout seul.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Créez votre compte", desc: "Votre e-mail + un mot de passe. C'est tout ce qu'on vous demande pour démarrer." },
              { step: "2", title: "Configurez votre espace", desc: "Notre assistant guidé vous pose 3 questions simples. Votre espace est prêt en 2 minutes." },
              { step: "3", title: "Travaillez sereinement", desc: "Tout est là, bien rangé, facile à retrouver. Et si vous avez une question, l'IA répond." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="card-surface p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-display font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 bg-muted">
        <div className="container max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Ce qui vous attend à l'intérieur
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card rounded-xl p-6 border border-border">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon size={22} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-base mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section className="py-20 bg-background">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-2">
              Ils l'utilisent déjà
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, text, stars }) => (
              <div key={name} className="card-surface p-6">
                <div className="flex mb-3">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} size={14} className="text-accent fill-accent" />
                  ))}
                </div>
                <p className="text-foreground text-sm leading-relaxed mb-4">"{text}"</p>
                <div>
                  <p className="font-semibold text-sm text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="hero-bg py-20">
        <div className="container max-w-2xl text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à démarrer ?
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Rejoignez les personnes qui ont simplifié leur quotidien professionnel.
          </p>
          <Link to="/pricing" className="btn-cta text-base px-8 py-4">
            Voir les tarifs — à partir de 59 € / mois →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="font-medium text-foreground">Planify</span>
          </div>
          <span>© 2024 Planify. Tous droits réservés.</span>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground transition-colors">CGU</a>
            <a href="#" className="hover:text-foreground transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
