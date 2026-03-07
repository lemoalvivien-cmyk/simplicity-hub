import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import LaunchQuotaBanner from "@/components/landing/LaunchQuotaBanner";
import { CheckCircle2, Tag, Building2, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const enterpriseIncludes = [
  "Accès complet à toutes les fonctionnalités",
  "Missions, contacts, campagnes, introductions",
  "Assistant JARVIS illimité",
  "Introductions reçues et vérifiées",
  "Support par e-mail inclus",
  "Mises à jour automatiques sans surcoût",
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      {/* Header */}
      <section className="py-14 text-center container max-w-2xl">
        <p className="pill-tag mb-4 mx-auto w-fit">Tarifs</p>
        <h1 className="font-display text-4xl font-bold text-foreground mb-3">
          Simple, honnête, transparent.
        </h1>
        <p className="text-muted-foreground text-base">
          Pas de frais cachés. Pas de version light frustrante.
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
                <p className="text-white/80 text-sm font-semibold uppercase tracking-wider">Entreprise</p>
              </div>

              {launchAvailable ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
                      <Zap size={10} />
                      Offre lancement — {slotsRemaining} places restantes
                    </span>
                  </div>
                  <div className="flex items-end gap-2 mt-2">
                    <span className="font-display font-bold text-5xl text-white">99 €</span>
                    <div className="pb-1">
                      <span className="text-white/60 text-sm">/an TTC</span>
                      <p className="text-white/40 text-xs line-through">490 € / an</p>
                    </div>
                  </div>
                  <p className="text-white/50 text-xs mt-2">Offre réservée aux 100 premières entreprises</p>
                </>
              ) : (
                <>
                  <div className="flex items-end gap-1.5 mt-2">
                    <span className="font-display font-bold text-5xl text-white">490 €</span>
                    <span className="text-white/60 text-sm pb-1">/an TTC</span>
                  </div>
                  <p className="text-white/50 text-xs mt-2">Abonnement annuel — sans engagement de durée</p>
                </>
              )}
            </div>
            <div className="p-7">
              <ul className="space-y-3 mb-7">
                {enterpriseIncludes.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={16} style={{ color: "hsl(var(--primary))" }} className="shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/checkout" className="btn-primary w-full text-center text-base py-4 block">
                {launchAvailable ? "Démarrer à 99 € / an →" : "Démarrer à 490 € / an →"}
              </Link>
              <div className="mt-4 p-3 rounded-lg border flex items-center gap-2" style={{ background: "hsl(218 72% 18% / 0.05)", borderColor: "hsl(218 72% 18% / 0.12)" }}>
                <Tag size={14} style={{ color: "hsl(var(--primary))" }} className="shrink-0" />
                <p className="text-xs text-foreground">
                  <strong>Code d'invitation ?</strong> Entrez-le à l'étape suivante pour activer 12 mois gratuits.
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
                <p className="text-white/90 text-sm font-semibold uppercase tracking-wider">Apporteur d'affaires</p>
              </div>
              <div className="flex items-end gap-1.5">
                <span className="font-display text-5xl font-bold text-white">Gratuit</span>
              </div>
              <p className="text-white/65 text-xs mt-2">Pour toujours · Sans carte bancaire requise</p>
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
                Créer mon compte gratuit →
              </Link>
            </div>
          </div>
        </div>

        {/* Reassurance */}
        <p className="text-center text-xs text-muted-foreground mt-7">
          Paiement sécurisé par Stripe · Données protégées · Aide disponible à tout moment
        </p>
      </div>

      {/* FAQ rapide */}
      <section className="border-t border-border py-16 bg-muted">
        <div className="container max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-foreground mb-8 text-center">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {[
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
            ].map(({ q, a }) => (
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
