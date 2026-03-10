import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import { LegalFooter } from "@/components/layout/PublicNav";

export default function CGU() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />
      <main className="container max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-sm text-muted-foreground mb-10">Date d'entrée en vigueur : 1er mars 2025 — Dernière mise à jour : 8 mars 2026</p>

        <section className="space-y-10 text-sm leading-relaxed text-foreground/80">

          {/* 1. Éditeur */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Éditeur de la plateforme</h2>
            <p>La plateforme <strong>Wiinup Max</strong> est éditée par :</p>
            <ul className="mt-2 space-y-1 list-none pl-0">
              <li><strong>Raison sociale :</strong> VLM Consulting</li>
              <li><strong>Statut :</strong> Auto-entrepreneur</li>
              <li><strong>SIRET :</strong> 83512508900028</li>
              <li><strong>Adresse :</strong> 295 rue Verte, 59170 Croix, France</li>
              <li><strong>Contact :</strong> <a href="mailto:contact@vlmconsulting.fr" className="text-primary underline">contact@vlmconsulting.fr</a></li>
              <li><strong>Directeur de publication :</strong> Vivien Le Moal</li>
            </ul>
          </div>

          {/* 2. Objet */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Objet du service</h2>
            <p>
              Wiinup Max est une plateforme SaaS B2B de mise en relation commerciale et de prospection assistée par
              intelligence artificielle. Elle permet aux entreprises de trouver des apporteurs d'affaires qualifiés
              (« facilitateurs ») et aux facilitateurs de valoriser leur réseau professionnel en proposant des
              introductions commerciales rémunérées.
            </p>
            <p className="mt-2">
              Les fonctionnalités principales comprennent : gestion des missions commerciales, suivi des introductions,
              messagerie automatisée, moteur de scoring IA, tableaux de bord analytiques et système de gains.
            </p>
          </div>

          {/* 3. Inscription */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Conditions d'inscription</h2>
            <p>L'accès à la plateforme est réservé aux professionnels (personnes morales ou physiques agissant dans un cadre professionnel) âgés d'au moins 18 ans.</p>
            <p className="mt-2">L'inscription requiert la fourniture d'une adresse email valide, d'un prénom et d'un mot de passe sécurisé. L'utilisateur s'engage à fournir des informations exactes et à les maintenir à jour.</p>
            <p className="mt-2">Un compte ne peut être créé qu'après validation de l'adresse email par un lien de confirmation. Tout compte créé avec de fausses informations pourra être suspendu sans préavis.</p>
          </div>

          {/* 4. Utilisation */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Conditions d'utilisation</h2>
            <p>L'utilisateur s'engage à utiliser la plateforme conformément aux lois en vigueur et aux présentes CGU. Il est notamment interdit de :</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li>Transmettre des contenus illicites, trompeurs ou diffamatoires ;</li>
              <li>Utiliser la plateforme à des fins de spam, de phishing ou de fraude ;</li>
              <li>Tenter de contourner les mesures de sécurité techniques ;</li>
              <li>Extraire ou scraper les données de la plateforme sans autorisation écrite ;</li>
              <li>Partager ses identifiants de connexion avec des tiers.</li>
            </ul>
          </div>

          {/* 5. Clause de non-circumvention */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Clause de non-circumvention</h2>
            <p>
              Pendant toute la durée de l'utilisation de la plateforme et pendant une période de <strong>24 mois</strong> suivant
              la cessation de l'abonnement, les entreprises s'interdisent de contacter directement les contacts
              introduits par un facilitateur identifié via la plateforme, en dehors du cadre contractualisé sur Wiinup Max,
              sans verser la rémunération prévue audit facilitateur.
            </p>
            <p className="mt-2">
              Tout manquement à cette clause est constitutif d'un préjudice commercial et expose l'entreprise à une
              action en dommages et intérêts devant les juridictions compétentes.
            </p>
          </div>

          {/* 6. Responsabilités */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Responsabilités</h2>
            <p><strong>Responsabilité de l'éditeur :</strong> VLM Consulting s'engage à assurer la disponibilité de la plateforme dans la limite du possible et à mettre en œuvre les mesures de sécurité appropriées. L'éditeur ne saurait être tenu responsable des interruptions de service dues à des causes extérieures (force majeure, défaillance des sous-traitants techniques, etc.).</p>
            <p className="mt-2"><strong>Responsabilité de l'utilisateur :</strong> L'utilisateur est seul responsable de l'usage qu'il fait de la plateforme, des contenus qu'il publie et des engagements contractuels qu'il prend envers d'autres utilisateurs. L'éditeur ne garantit pas les résultats commerciaux obtenus via la plateforme.</p>
          </div>

          {/* 7. Propriété intellectuelle */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Propriété intellectuelle</h2>
            <p>
              L'ensemble des éléments constituant la plateforme (interface, code source, marques, logos, algorithmes,
              contenus éditoriaux) sont la propriété exclusive de VLM Consulting et sont protégés par le droit de
              la propriété intellectuelle. Toute reproduction, représentation ou exploitation non autorisée est interdite.
            </p>
            <p className="mt-2">
              L'utilisateur conserve la propriété des données qu'il saisit sur la plateforme et accorde à VLM Consulting
              une licence non exclusive d'hébergement et de traitement de ces données aux fins de fourniture du service.
            </p>
          </div>

          {/* 8. Données personnelles */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Données personnelles</h2>
            <p>
              Le traitement des données personnelles est détaillé dans notre{" "}
              <Link to="/confidentialite" className="text-primary underline">Politique de Confidentialité</Link>.
              En utilisant la plateforme, l'utilisateur reconnaît avoir pris connaissance de cette politique.
            </p>
          </div>

          {/* 9. Tarification et paiement */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Tarification et conditions de paiement</h2>
            <p>Le tarif en vigueur est affiché sur la page <Link to="/pricing" className="text-primary underline">Tarifs</Link>.</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li><strong>Accès Entreprise :</strong> 99 € TTC/an.</li>
            </ul>
            <p className="mt-2">
              Le paiement est effectué en ligne via Stripe. L'abonnement est annuel et se renouvelle automatiquement sauf
              résiliation au moins 30 jours avant l'échéance. Les prix sont indiqués toutes taxes comprises.
            </p>
            <p className="mt-2">
              Conformément à l'article L.221-28 du Code de la consommation (services numériques), le droit de
              rétractation de 14 jours ne s'applique pas dès lors que l'accès au service a été activé avec l'accord
              exprès de l'utilisateur.
            </p>
          </div>

          {/* 10. Résiliation */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Résiliation</h2>
            <p>
              L'utilisateur peut résilier son abonnement à tout moment depuis son espace compte ou en contactant
              <a href="mailto:contact@vlmconsulting.fr" className="text-primary underline ml-1">contact@vlmconsulting.fr</a>.
              La résiliation prend effet à la fin de la période d'abonnement en cours.
            </p>
            <p className="mt-2">
              VLM Consulting se réserve le droit de suspendre ou résilier tout compte ne respectant pas les présentes
              CGU, sans remboursement de la période restante.
            </p>
          </div>

          {/* 11. Droit applicable */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">11. Droit applicable et juridiction compétente</h2>
            <p>
              Les présentes CGU sont soumises au droit français. En cas de litige non résolu à l'amiable, les tribunaux
              du ressort de <strong>Lille (59)</strong> seront seuls compétents, sauf disposition légale contraire.
            </p>
          </div>

          {/* 12. Modifications */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">12. Modifications des CGU</h2>
            <p>
              VLM Consulting se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront
              informés par email de toute modification substantielle. La poursuite de l'utilisation de la plateforme
              après notification vaut acceptation des nouvelles conditions.
            </p>
          </div>

        </section>

        {/* Footer nav */}
        <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to="/confidentialite" className="hover:text-foreground transition-colors">Politique de confidentialité</Link>
          <Link to="/mentions-legales" className="hover:text-foreground transition-colors">Mentions légales</Link>
          <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
        </div>
      </main>
    </div>
  );
}
