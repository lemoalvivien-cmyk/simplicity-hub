import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import { LegalFooter } from "@/components/layout/PublicNav";

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />
      <main className="container max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">Mentions Légales</h1>
        <p className="text-sm text-muted-foreground mb-10">Conformément à l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN)</p>

        <section className="space-y-10 text-sm leading-relaxed text-foreground/80">

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Éditeur du site</h2>
            <ul className="space-y-1 list-none pl-0">
              <li><strong>Raison sociale :</strong> VLM Consulting</li>
              <li><strong>Statut juridique :</strong> Auto-entrepreneur (entreprise individuelle)</li>
              <li><strong>SIRET :</strong> 83512508900028</li>
              <li><strong>Adresse du siège :</strong> 295 rue Verte, 59170 Croix, France</li>
              <li><strong>Email :</strong> <a href="mailto:contact@vlmconsulting.fr" className="text-primary underline">contact@vlmconsulting.fr</a></li>
              <li><strong>Directeur de publication :</strong> Vivien Le Moal</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Hébergement</h2>
            <p>La plateforme Wiinup Max est hébergée par les prestataires suivants :</p>
            <div className="mt-3 space-y-4">
              <div>
                <p className="font-medium text-foreground">Frontend (application web)</p>
                <ul className="mt-1 space-y-1 list-none pl-0 text-muted-foreground">
                  <li><strong>Hébergeur :</strong> Lovable (Builder.io Inc.)</li>
                  <li><strong>Adresse :</strong> 353 Sacramento St Suite 2000, San Francisco, CA 94111, USA</li>
                  <li><strong>Site :</strong> <a href="https://lovable.dev" target="_blank" rel="noopener noreferrer" className="text-primary underline">lovable.dev</a></li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground">Backend (base de données, fonctions, authentification)</p>
                <ul className="mt-1 space-y-1 list-none pl-0 text-muted-foreground">
                  <li><strong>Hébergeur :</strong> Supabase Inc.</li>
                  <li><strong>Adresse :</strong> 970 Toa Payoh North #07-04, Singapore 318992</li>
                  <li><strong>Infrastructure :</strong> Amazon Web Services (AWS), région US-East-1</li>
                  <li><strong>Site :</strong> <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">supabase.com</a></li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground">Paiements</p>
                <ul className="mt-1 space-y-1 list-none pl-0 text-muted-foreground">
                  <li><strong>Prestataire :</strong> Stripe Payments Europe, Ltd.</li>
                  <li><strong>Adresse :</strong> 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, Irlande</li>
                  <li><strong>Site :</strong> <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">stripe.com</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu de ce site (textes, visuels, logos, interfaces, code source, algorithmes) est la
              propriété exclusive de VLM Consulting ou de ses ayants droit. Toute reproduction, distribution,
              modification ou utilisation sans autorisation écrite préalable est strictement interdite et constitue une
              contrefaçon sanctionnée par les articles L. 335-2 et suivants du Code de la propriété intellectuelle.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Données personnelles</h2>
            <p>
              Le traitement des données personnelles des utilisateurs est décrit dans notre{" "}
              <Link to="/confidentialite" className="text-primary underline">Politique de Confidentialité</Link>.
              Conformément au RGPD et à la loi Informatique et Libertés, vous pouvez exercer vos droits en contactant :{" "}
              <a href="mailto:contact@vlmconsulting.fr" className="text-primary underline">contact@vlmconsulting.fr</a>.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Liens hypertextes</h2>
            <p>
              La plateforme peut contenir des liens vers des sites tiers. VLM Consulting n'est pas responsable du contenu
              de ces sites externes et ne saurait être tenu responsable des dommages pouvant résulter de leur consultation.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Droit applicable</h2>
            <p>
              Les présentes mentions légales sont soumises au droit français. Tout litige relatif à l'utilisation du site
              sera soumis à la compétence exclusive des tribunaux de <strong>Lille (59)</strong>.
            </p>
          </div>

        </section>

        <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to="/cgu" className="hover:text-foreground transition-colors">CGU</Link>
          <Link to="/confidentialite" className="hover:text-foreground transition-colors">Politique de confidentialité</Link>
          <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
        </div>
      </main>
      <LegalFooter />
    </div>
  );
}
