import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import { CheckCircle2, Tag, Building2, Users } from "lucide-react";

const enterpriseIncludes = [
  "Accès complet à toutes les fonctionnalités",
  "Pilotage, campagnes, contacts, missions",
  "Assistant JARVIS illimité",
  "Introductions reçues et vérifiées",
  "Support par e-mail inclus",
  "Mises à jour automatiques sans surcoût",
];

const apporteurIncludes = [
  "Accès complet à toutes les missions",
  "Envoi d'introductions illimité",
  "Suivi des validations en temps réel",
  "Tableau de bord des gains",
  "Assistant JARVIS inclus",
  "Aucune commission prélevée",
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      {/* Header */}
      <section className="py-16 text-center container max-w-2xl">
        <p className="pill-tag mb-4 mx-auto w-fit">Tarifs</p>
        <h1 className="font-display text-4xl font-bold text-foreground mb-3">
          Simple, honnête, transparent.
        </h1>
        <p className="text-muted-foreground text-lg">
          Pas de frais cachés. Pas de version light frustrante.
          Entreprises à 29 €. Apporteurs gratuits.
        </p>
      </section>

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
              <div className="flex items-end gap-1.5">
                <span className="font-display text-5xl font-bold text-white">29 €</span>
                <span className="text-white/60 text-sm pb-1">/mois TTC</span>
              </div>
              <p className="text-white/50 text-xs mt-2">Sans engagement — résiliez quand vous voulez</p>
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
                Démarrer à 29 € / mois →
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
          <div className="bg-card rounded-2xl overflow-hidden border-2 border-accent shadow-accent">
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
