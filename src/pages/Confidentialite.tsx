import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import { LegalFooter } from "@/components/layout/PublicNav";

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />
      <main className="container max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">Politique de Confidentialité</h1>
        <p className="text-sm text-muted-foreground mb-10">Dernière mise à jour : 8 mars 2026 — Conforme au RGPD (Règlement UE 2016/679)</p>

        <section className="space-y-10 text-sm leading-relaxed text-foreground/80">

          {/* 1. Responsable */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Responsable du traitement</h2>
            <ul className="space-y-1 list-none pl-0">
              <li><strong>Responsable :</strong> Vivien Le Moal</li>
              <li><strong>Structure :</strong> VLM Consulting, auto-entrepreneur</li>
              <li><strong>SIRET :</strong> 83512508900028</li>
              <li><strong>Adresse :</strong> 295 rue Verte, 59170 Croix, France</li>
              <li><strong>Contact DPO / exercice des droits :</strong>{" "}
                <a href="mailto:contact@vlmconsulting.fr" className="text-primary underline">contact@vlmconsulting.fr</a>
              </li>
            </ul>
          </div>

          {/* 2. Données collectées */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Données collectées</h2>
            <p>Nous collectons les catégories de données suivantes :</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li><strong>Données d'identification :</strong> adresse email, prénom, rôle (entreprise ou facilitateur) ;</li>
              <li><strong>Données d'activité :</strong> missions, introductions, contacts professionnels renseignés, campagnes, gains ;</li>
              <li><strong>Données de prospection :</strong> noms, emails et téléphones de contacts tiers saisis par l'utilisateur ;</li>
              <li><strong>Données de navigation :</strong> logs de connexion, adresse IP, type de navigateur ;</li>
              <li><strong>Données de paiement :</strong> traitées directement par Stripe (nous ne stockons pas les données de carte bancaire).</li>
            </ul>
          </div>

          {/* 3. Bases légales */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Bases légales des traitements</h2>
            <ul className="mt-2 space-y-2 list-disc pl-5">
              <li><strong>Exécution contractuelle (art. 6.1.b RGPD) :</strong> création et gestion du compte, fourniture des fonctionnalités de la plateforme, gestion des abonnements et des paiements ;</li>
              <li><strong>Intérêt légitime (art. 6.1.f RGPD) :</strong> amélioration du service, prévention de la fraude, sécurité technique ;</li>
              <li><strong>Consentement (art. 6.1.a RGPD) :</strong> communications marketing optionnelles, si applicable ;</li>
              <li><strong>Obligation légale (art. 6.1.c RGPD) :</strong> conservation des données de facturation conformément aux obligations comptables.</li>
            </ul>
          </div>

          {/* 4. Finalités */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Finalités des traitements</h2>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li>Création et gestion des comptes utilisateurs ;</li>
              <li>Fourniture des fonctionnalités de la plateforme (matching, pipeline, IA) ;</li>
              <li>Traitement et suivi des paiements ;</li>
              <li>Envoi de notifications transactionnelles (confirmation d'inscription, alertes) ;</li>
              <li>Amélioration et personnalisation de l'expérience utilisateur ;</li>
              <li>Prévention de la fraude et sécurisation de la plateforme ;</li>
              <li>Respect des obligations légales et réglementaires.</li>
            </ul>
          </div>

          {/* 5. Destinataires */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Destinataires des données</h2>
            <p>Vos données peuvent être transmises aux sous-traitants techniques suivants, dans le cadre strict de la fourniture du service :</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-foreground font-semibold">Sous-traitant</th>
                    <th className="text-left py-2 pr-4 text-foreground font-semibold">Rôle</th>
                    <th className="text-left py-2 text-foreground font-semibold">Localisation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr><td className="py-2 pr-4">Supabase Inc.</td><td className="py-2 pr-4">Hébergement de la base de données et authentification</td><td className="py-2">États-Unis (AWS US-East)</td></tr>
                  <tr><td className="py-2 pr-4">Stripe Inc.</td><td className="py-2 pr-4">Traitement des paiements</td><td className="py-2">États-Unis / Irlande</td></tr>
                  <tr><td className="py-2 pr-4">OpenAI / Anthropic</td><td className="py-2 pr-4">Moteur d'intelligence artificielle générative</td><td className="py-2">États-Unis</td></tr>
                  <tr><td className="py-2 pr-4">ElevenLabs</td><td className="py-2 pr-4">Synthèse vocale (fonctionnalité optionnelle)</td><td className="py-2">États-Unis</td></tr>
                  <tr><td className="py-2 pr-4">Lovable / Builder.io</td><td className="py-2 pr-4">Infrastructure d'hébergement frontend</td><td className="py-2">États-Unis</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. Transferts hors UE */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Transferts hors Union européenne</h2>
            <p>
              Certains de nos sous-traitants sont établis aux États-Unis. Ces transferts sont encadrés par les{" "}
              <strong>Clauses Contractuelles Types (CCT)</strong> adoptées par la Commission européenne, ou par l'adhésion
              au cadre <strong>EU-US Data Privacy Framework</strong> lorsque applicable. Ces garanties assurent un niveau
              de protection adéquat conformément à l'article 46 du RGPD.
            </p>
          </div>

          {/* 7. Durée de conservation */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Durée de conservation</h2>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li><strong>Données de compte actif :</strong> pendant toute la durée de l'abonnement + 3 ans après résiliation ;</li>
              <li><strong>Données de facturation :</strong> 10 ans (obligation comptable légale) ;</li>
              <li><strong>Logs de connexion :</strong> 12 mois ;</li>
              <li><strong>Données de prospection saisies par l'utilisateur :</strong> jusqu'à suppression par l'utilisateur ou résiliation du compte.</li>
            </ul>
          </div>

          {/* 8. Droits RGPD */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li><strong>Droit d'accès (art. 15) :</strong> obtenir une copie de vos données ;</li>
              <li><strong>Droit de rectification (art. 16) :</strong> corriger des données inexactes ;</li>
              <li><strong>Droit à l'effacement (art. 17) :</strong> demander la suppression de vos données ;</li>
              <li><strong>Droit à la portabilité (art. 20) :</strong> recevoir vos données dans un format structuré ;</li>
              <li><strong>Droit d'opposition (art. 21) :</strong> vous opposer à certains traitements ;</li>
              <li><strong>Droit à la limitation (art. 18) :</strong> limiter temporairement le traitement.</li>
            </ul>
            <p className="mt-3">
              Pour exercer vos droits, contactez-nous à :{" "}
              <a href="mailto:contact@vlmconsulting.fr" className="text-primary underline">contact@vlmconsulting.fr</a>.
              Nous répondrons dans un délai d'un mois. Vous avez également le droit d'introduire une réclamation auprès
              de la <strong>CNIL</strong> (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline">www.cnil.fr</a>).
            </p>
          </div>

          {/* 9. Cookies */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Cookies et traceurs</h2>
            <p>
              La plateforme utilise uniquement des <strong>cookies fonctionnels et techniques</strong> nécessaires au
              fonctionnement du service (session d'authentification, préférences d'interface). Aucun cookie publicitaire,
              de tracking comportemental ou de réseaux sociaux tiers n'est déposé. Aucun consentement supplémentaire n'est
              requis pour ces cookies strictement nécessaires.
            </p>
          </div>

          {/* 10. Sécurité */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Sécurité des données</h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles adaptées pour protéger vos données :
              chiffrement des données en transit (TLS 1.3), chiffrement au repos, contrôle d'accès par rôle (RLS),
              authentification sécurisée, et journalisation des accès.
            </p>
          </div>

        </section>

        <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to="/cgu" className="hover:text-foreground transition-colors">CGU</Link>
          <Link to="/mentions-legales" className="hover:text-foreground transition-colors">Mentions légales</Link>
          <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
        </div>
      </main>
      <LegalFooter />
    </div>
  );
}
