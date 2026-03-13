import { useState } from "react";
import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import { LegalFooter } from "@/components/layout/PublicNav";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Mic,
  Phone,
  FileText,
  Lock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

const SECTIONS = [
  { id: "rgpd", label: "RGPD", icon: Shield },
  { id: "vocal", label: "Consentement Vocal", icon: Mic },
  { id: "bloctel", label: "Bloctel", icon: Phone },
  { id: "cgu", label: "CGU Résumé", icon: FileText },
  { id: "securite", label: "Sécurité", icon: Lock },
];

function StatusBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
      <CheckCircle2 className="w-3 h-3" /> Conforme
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted border border-border rounded-full px-2 py-0.5">
      <AlertTriangle className="w-3 h-3" /> En cours
    </span>
  );
}

export default function Legal() {
  const [activeTab, setActiveTab] = useState("rgpd");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />

      <main className="container max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-10">
          <Badge variant="outline" className="mb-3 text-xs font-mono">
            Mise à jour : 13 mars 2026
          </Badge>
          <h1 className="text-3xl font-bold mb-2">Centre de Conformité & Légal</h1>
          <p className="text-muted-foreground max-w-2xl">
            WiinupMax est conçu pour être 100 % conforme au droit français et européen.
            Ce centre regroupe nos engagements RGPD, notre protocole de consentement vocal,
            nos obligations Bloctel et notre architecture de sécurité.
          </p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "RGPD", ok: true },
            { label: "Stripe / PCI DSS", ok: true },
            { label: "Consentement vocal", ok: true },
            { label: "Bloctel API", ok: false },
          ].map((item) => (
            <div key={item.label} className="border border-border rounded-lg p-4 flex flex-col gap-2 bg-card">
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <StatusBadge ok={item.ok} />
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1 mb-8 bg-muted/50 p-1 rounded-lg">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <TabsTrigger key={id} value={id} className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── RGPD ─────────────────────────────────────────────────────────── */}
          <TabsContent value="rgpd" className="space-y-8 text-sm leading-relaxed text-foreground/80">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> Conformité RGPD (Règlement 2016/679)
              </h2>

              <h3 className="font-semibold text-foreground mb-2">Base légale des traitements</h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold text-foreground">Traitement</th>
                      <th className="text-left px-4 py-2 font-semibold text-foreground">Base légale</th>
                      <th className="text-left px-4 py-2 font-semibold text-foreground">Durée</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      ["Authentification", "Exécution du contrat (art. 6.1.b)", "Durée abonnement + 1 an"],
                      ["Données de profil", "Exécution du contrat (art. 6.1.b)", "Durée abonnement + 3 ans"],
                      ["Contacts B2B importés", "Intérêt légitime (art. 6.1.f)", "Jusqu'à suppression"],
                      ["Analytics anonymisés", "Intérêt légitime (art. 6.1.f)", "13 mois glissants"],
                      ["Facturation Stripe", "Obligation légale (art. 6.1.c)", "10 ans (comptabilité)"],
                      ["Consentement vocal ADA", "Consentement explicite (art. 6.1.a)", "Abonnement + 1 an"],
                      ["Logs d'audit", "Obligation légale + sécurité", "5 ans"],
                    ].map(([t, b, d]) => (
                      <tr key={t} className="hover:bg-muted/30">
                        <td className="px-4 py-2 font-medium text-foreground">{t}</td>
                        <td className="px-4 py-2">{b}</td>
                        <td className="px-4 py-2">{d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-3">Exercer vos droits</h3>
              <p className="mb-3">
                Conformément aux articles 15 à 22 du RGPD, vous disposez des droits suivants.
                Toute demande doit être envoyée à{" "}
                <a href="mailto:contact@wiinupmax.com" className="text-primary underline">
                  contact@wiinupmax.com
                </a>{" "}
                — réponse sous 30 jours.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  ["Accès (art. 15)", "Export complet de vos données sous 30 jours"],
                  ["Rectification (art. 16)", "Mise à jour directe dans votre profil"],
                  ["Effacement (art. 17)", "Suppression du compte + purge des données identifiantes"],
                  ["Portabilité (art. 20)", "Export JSON/CSV de vos contacts et missions"],
                  ["Opposition (art. 21)", "Opt-out des communications marketing"],
                  ["Réclamation", "CNIL — www.cnil.fr — 3 place de Fontenoy, 75007 Paris"],
                ].map(([titre, desc]) => (
                  <div key={titre} className="border border-border rounded-lg p-3 bg-card">
                    <p className="font-semibold text-foreground text-xs mb-1">{titre}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-3">Sous-traitants (art. 28)</h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold text-foreground">Sous-traitant</th>
                      <th className="text-left px-4 py-2 font-semibold text-foreground">Rôle</th>
                      <th className="text-left px-4 py-2 font-semibold text-foreground">Localisation</th>
                      <th className="text-left px-4 py-2 font-semibold text-foreground">Garanties</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      ["Supabase Inc.", "BDD, Auth, Functions", "US-East-1 (AWS)", "SCCs + DPA"],
                      ["Stripe Payments Europe", "Paiements", "Dublin, IE", "PCI DSS + DPA UE"],
                      ["ElevenLabs Inc.", "Synthèse vocale IA", "USA", "SCCs + DPA"],
                      ["Lovable / Builder.io", "Hébergement frontend", "USA", "SCCs + DPA"],
                    ].map(([n, r, l, g]) => (
                      <tr key={n} className="hover:bg-muted/30">
                        <td className="px-4 py-2 font-medium text-foreground">{n}</td>
                        <td className="px-4 py-2">{r}</td>
                        <td className="px-4 py-2">{l}</td>
                        <td className="px-4 py-2 text-primary font-medium">{g}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </TabsContent>

          {/* ── VOCAL ─────────────────────────────────────────────────────────── */}
          <TabsContent value="vocal" className="space-y-6 text-sm leading-relaxed text-foreground/80">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary" /> Protocole de Consentement Vocal ADA
              </h2>
              <div className="bg-muted border border-border rounded-lg p-4 mb-6">
                <p className="text-xs font-semibold text-foreground mb-1">⚠️ Cadre légal applicable</p>
                <p className="text-xs text-muted-foreground">
                  RGPD art. 6.1.a (consentement) + art. 9 si traitement biométrique de la voix.
                  Directive IA UE 2024/1689 (art. 50 — obligation de transparence pour agents IA vocaux).
                </p>
              </div>

              <h3 className="font-semibold text-foreground mb-3">Double opt-in obligatoire</h3>
              <ol className="space-y-4 list-none pl-0">
                {[
                  {
                    step: "1",
                    titre: "Consentement utilisateur (côté entreprise)",
                    desc: "Checkbox explicite avant activation ADA : « J'accepte que ma voix soit enregistrée et analysée par IA à des fins de closing commercial. Je peux retirer mon consentement à tout moment via mon compte. »",
                  },
                  {
                    step: "2",
                    titre: "Mention en début d'appel (côté prospect)",
                    desc: "Script obligatoire : « Bonjour, cet appel est réalisé par ADA, un agent commercial IA de [Nom Entreprise]. Cet appel peut être enregistré à des fins d'amélioration du service. Pour vous opposer, vous pouvez raccrocher à tout moment. »",
                  },
                  {
                    step: "3",
                    titre: "Enregistrement du consentement",
                    desc: "Chaque consentement est tracé dans ada_consent_logs avec : timestamp, session_id, ip_hash (SHA-256), user_agent_hash, texte exact du consentement.",
                  },
                ].map(({ step, titre, desc }) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                      {step}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">{titre}</p>
                      <p className="text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-6 border border-border rounded-lg p-4 bg-card">
                <p className="text-xs font-semibold text-foreground mb-2">Rétention des enregistrements vocaux</p>
                <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4">
                  <li>Enregistrements ElevenLabs : supprimés après <strong>90 jours</strong></li>
                  <li>Transcriptions anonymisées : conservées <strong>12 mois</strong> pour amélioration du modèle</li>
                  <li>Révocation du consentement : suppression sous <strong>72 heures</strong></li>
                  <li>Accès aux logs : uniquement admin + utilisateur propriétaire</li>
                </ul>
              </div>
            </section>
          </TabsContent>

          {/* ── BLOCTEL ───────────────────────────────────────────────────────── */}
          <TabsContent value="bloctel" className="space-y-6 text-sm leading-relaxed text-foreground/80">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" /> Conformité Bloctel
              </h2>

              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
                <p className="text-xs font-semibold text-destructive mb-1">🚨 Obligation légale — Loi Hamon (2014)</p>
                <p className="text-xs text-destructive/80">
                  Avant tout appel de prospection vers un particulier non-client, vérification obligatoire sur la liste Bloctel.
                  Amende jusqu'à <strong>75 000 €</strong> (personne physique) / <strong>375 000 €</strong> (personne morale).
                </p>
              </div>

              <h3 className="font-semibold text-foreground mb-3">Procédure WiinupMax</h3>
              <div className="space-y-3">
                {[
                  {
                    label: "Vérification systématique",
                    desc: "Avant tout appel ADA vers un prospect non-client : vérification via l'API Bloctel officielle. Rechargement de la liste au maximum tous les 30 jours.",
                    ok: false,
                  },
                  {
                    label: "Traçabilité",
                    desc: "Chaque vérification enregistrée dans ada_consent_logs avec consent_type = 'bloctel_check', date, numéro hashé SHA-256, résultat.",
                    ok: true,
                  },
                  {
                    label: "Exemptions documentées",
                    desc: "Prospects avec relation contractuelle préexistante + prospects inbound (demande explicite). Exemptions documentées avec preuve.",
                    ok: true,
                  },
                ].map(({ label, desc, ok }) => (
                  <div key={label} className="flex gap-3 items-start border border-border rounded-lg p-3 bg-card">
                    <StatusBadge ok={ok} />
                    <div>
                      <p className="font-semibold text-foreground text-xs">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 border border-border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-foreground mb-2">Actions requises avant appels sortants</p>
                <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4">
                  <li>Souscrire à l'API Bloctel Professionnel — <a href="https://www.bloctel.gouv.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline">bloctel.gouv.fr <ExternalLink className="inline w-3 h-3" /></a></li>
                  <li>Intégrer la vérification dans la Edge Function <code className="bg-muted px-1 rounded">ada-voice-call</code></li>
                  <li>Ajouter le secret <code className="bg-muted px-1 rounded">BLOCTEL_API_KEY</code> dans les variables d'environnement</li>
                </ul>
              </div>
            </section>
          </TabsContent>

          {/* ── CGU ───────────────────────────────────────────────────────────── */}
          <TabsContent value="cgu" className="space-y-6 text-sm leading-relaxed text-foreground/80">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Résumé des Conditions Générales
              </h2>
              <p className="text-muted-foreground mb-4">
                Résumé non-contractuel.{" "}
                <Link to="/cgu" className="text-primary underline">Consulter les CGU complètes →</Link>
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    titre: "Accès & Tarif",
                    items: [
                      "Entreprises : 99 € TTC/an (offre de lancement)",
                      "Facilitateurs : gratuit à vie",
                      "Abonnement annuel, renouvellement automatique",
                      "Résiliation possible 30 jours avant échéance",
                    ],
                  },
                  {
                    titre: "Clause de non-circumvention",
                    items: [
                      "Interdiction de contacter directement les contacts introduits hors plateforme",
                      "Durée : abonnement + 24 mois",
                      "Sanction : dommages et intérêts + suspension",
                    ],
                  },
                  {
                    titre: "Propriété intellectuelle",
                    items: [
                      "Plateforme, algorithmes, ETG : propriété VLM Consulting",
                      "Données utilisateur : propriété de l'utilisateur",
                      "Licence d'hébergement non exclusive accordée à VLM Consulting",
                    ],
                  },
                  {
                    titre: "Juridiction",
                    items: [
                      "Droit français applicable",
                      "Tribunaux de Lille (59) compétents",
                      "Médiation possible avant tout recours judiciaire",
                    ],
                  },
                ].map(({ titre, items }) => (
                  <div key={titre} className="border border-border rounded-lg p-4 bg-card">
                    <p className="font-semibold text-foreground mb-2">{titre}</p>
                    <ul className="space-y-1 text-xs text-muted-foreground list-disc pl-4">
                      {items.map((i) => <li key={i}>{i}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </TabsContent>

          {/* ── SÉCURITÉ ──────────────────────────────────────────────────────── */}
          <TabsContent value="securite" className="space-y-6 text-sm leading-relaxed text-foreground/80">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" /> Architecture de Sécurité
              </h2>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {[
                  { label: "RLS sur toutes les tables", ok: true },
                  { label: "JWT validation in-code", ok: true },
                  { label: "HMAC Stripe webhooks", ok: true },
                  { label: "CORS dynamique (pas de wildcard)", ok: true },
                  { label: "Rate limiting 100 req/min/user", ok: true },
                  { label: "Pen test externe", ok: false },
                  { label: "WAF Cloudflare", ok: false },
                  { label: "Audit logs centralisés", ok: true },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center justify-between border border-border rounded-lg px-4 py-3 bg-card">
                    <span className="text-xs text-foreground">{label}</span>
                    <StatusBadge ok={ok} />
                  </div>
                ))}
              </div>

              <h3 className="font-semibold text-foreground mb-3">Signaler une vulnérabilité</h3>
              <p className="text-muted-foreground text-xs">
                Responsible disclosure : envoyez votre rapport à{" "}
                <a href="mailto:security@wiinupmax.com" className="text-primary underline">
                  security@wiinupmax.com
                </a>{" "}
                avec le sujet <code className="bg-muted px-1 rounded">[SECURITY]</code>.
                Réponse sous 48h. Pas de poursuite pour les découvertes de bonne foi.
              </p>
            </section>
          </TabsContent>
        </Tabs>

        {/* Footer nav */}
        <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to="/cgu" className="hover:text-foreground transition-colors">CGU complètes</Link>
          <Link to="/confidentialite" className="hover:text-foreground transition-colors">Politique de confidentialité</Link>
          <Link to="/mentions-legales" className="hover:text-foreground transition-colors">Mentions légales</Link>
          <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
