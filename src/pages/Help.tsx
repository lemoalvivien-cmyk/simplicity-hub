import { useState } from "react";
import UserLayout from "@/components/layout/UserLayout";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, MessageCircle, Search } from "lucide-react";

const categories = [
  {
    label: "Mon compte",
    items: [
      { q: "Comment modifier mon e-mail ou mon mot de passe ?", a: "Rendez-vous dans **Mon compte** (en haut à droite). Vous pouvez y modifier votre e-mail, votre mot de passe, et vos informations personnelles. Un e-mail de confirmation vous sera envoyé pour valider le changement." },
      { q: "Comment annuler mon abonnement ?", a: "Dans **Mon compte → Abonnement**, cliquez sur « Annuler mon abonnement ». Votre accès restera actif jusqu'à la fin de la période déjà payée. Aucun remboursement partiel n'est effectué." },
      { q: "Mon accès a expiré, que faire ?", a: "Si votre accès a expiré, vous pouvez le renouveler directement depuis la page **Tarifs**. Si vous avez un code d'invitation, vous pouvez l'utiliser pour activer 12 mois gratuits supplémentaires." },
    ],
  },
  {
    label: "Codes d'invitation",
    items: [
      { q: "Qu'est-ce qu'un code d'invitation ?", a: "Un code d'invitation est un code unique qui vous donne **12 mois d'accès gratuit** à Planify. Chaque code est à usage unique — il ne peut être utilisé qu'une seule fois par une seule personne." },
      { q: "Comment utiliser mon code d'invitation ?", a: "Sur la page de **Checkout**, choisissez l'option « J'ai un code d'invitation », entrez votre code et cliquez sur Vérifier. S'il est valide, votre accès sera activé immédiatement." },
      { q: "Mon code ne fonctionne pas, pourquoi ?", a: "Un code peut ne pas fonctionner s'il a déjà été utilisé par quelqu'un d'autre, s'il a expiré, ou s'il a été désactivé. Contactez notre support avec votre code et nous vérifierons." },
    ],
  },
  {
    label: "Paiement",
    items: [
      { q: "Quels modes de paiement acceptez-vous ?", a: "Nous acceptons toutes les cartes bancaires courantes (Visa, Mastercard, American Express) via Stripe. Les paiements sont sécurisés et chiffrés." },
      { q: "Quand suis-je facturé ?", a: "Vous êtes facturé le jour de l'activation, puis à la même date chaque mois. Vous recevez une facture par e-mail à chaque renouvellement." },
      { q: "Puis-je obtenir une facture TVA ?", a: "Oui. Depuis **Mon compte → Facturation**, vous pouvez télécharger toutes vos factures. Pour ajouter votre numéro de TVA, contactez notre support." },
    ],
  },
  {
    label: "Utilisation",
    items: [
      { q: "Comment accéder à l'assistant IA ?", a: "L'assistant IA est accessible depuis le menu **Aide** ou directement via la page **Assistant**. Il est disponible 24h/24, 7j/7 et répond en quelques secondes." },
      { q: "Mes données sont-elles sécurisées ?", a: "Oui. Vos données sont hébergées en Europe, chiffrées en transit et au repos. Nous ne vendons ni ne partageons vos données avec des tiers." },
      { q: "Y a-t-il une limite d'utilisation ?", a: "Non. L'abonnement Premium vous donne un accès illimité à toutes les fonctionnalités, sans quota ni restriction." },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 py-4 text-left text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        <span>{q}</span>
        {open ? <ChevronUp size={16} className="shrink-0 text-muted-foreground" /> : <ChevronDown size={16} className="shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <div className="pb-4 text-sm text-muted-foreground leading-relaxed animate-fade-in">
          {a.split("**").map((part, i) =>
            i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : <span key={i}>{part}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function Help() {
  const [search, setSearch] = useState("");

  const filtered = categories.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Comment pouvons-nous vous aider ?
          </h1>
          <p className="text-muted-foreground">
            Trouvez une réponse ou posez votre question à l'assistant.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Recherchez une question..."
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
        </div>

        {/* FAQ */}
        {filtered.length > 0 ? (
          <div className="space-y-5">
            {filtered.map((cat) => (
              <div key={cat.label} className="card-surface p-5">
                <h2 className="font-semibold text-foreground text-sm uppercase tracking-wider text-muted-foreground mb-3">
                  {cat.label}
                </h2>
                {cat.items.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Aucun résultat pour « {search} ».</p>
          </div>
        )}

        {/* Escalade */}
        <div className="mt-8 bg-primary rounded-xl p-6 text-primary-foreground text-center">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
            <MessageCircle size={20} />
          </div>
          <h3 className="font-semibold mb-1">Vous n'avez pas trouvé votre réponse ?</h3>
          <p className="text-sm text-primary-foreground/70 mb-4">
            Notre assistant IA peut vous aider instantanément.
          </p>
          <Link
            to="/assistant"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary font-semibold text-sm hover:bg-white/90 transition-colors"
          >
            Parler à l'assistant →
          </Link>
        </div>
      </div>
    </UserLayout>
  );
}
