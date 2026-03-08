/**
 * FEATURE REGISTRY — Source de vérité produit unique.
 * Foundation Lock v2 : chaque feature porte désormais :
 *   - confidence : "declared" | "code-verified" | "runtime-verified"
 *   - evidence   : preuves techniques pointables (table, edge fn, page)
 *
 * États :
 *   real    = branché à des données réelles, fonctionnel en production
 *   partial = partiellement câblé, logique incomplète ou données manquantes
 *   mock    = données simulées / comportement fake / façade UI
 *   dead    = page vide, lien vers nulle part, aucune valeur utilisateur
 *   env-dep = fonctionnel mais nécessite une config environnement externe
 *
 * Confidence :
 *   declared         = déclaré manuellement, pas encore vérifié en code
 *   code-verified    = code inspecté et confirmé branché à la vraie source
 *   runtime-verified = testé en exécution réelle (edge fn, DB, session)
 */

export type FeatureStatus     = "real" | "partial" | "mock" | "dead" | "env-dep";
export type FeatureConfidence = "declared" | "code-verified" | "runtime-verified";
export type OwnerArea =
  | "acquisition"
  | "onboarding"
  | "billing"
  | "contacts"
  | "campaigns"
  | "referral"
  | "passive_os"
  | "openclaw"
  | "admin"
  | "analytics"
  | "settings"
  | "infrastructure";

export interface FeatureEvidence {
  /** Tables Supabase utilisées */
  tables?: string[];
  /** Edge functions appelées */
  edgeFunctions?: string[];
  /** Hooks / fichiers clés côté client */
  codeFiles?: string[];
  /** Note sur la preuve */
  note?: string;
}

export interface FeatureEntry {
  id: string;
  label: string;
  status: FeatureStatus;
  /** Niveau de preuve de la déclaration */
  confidence: FeatureConfidence;
  area: OwnerArea;
  /** Page(s) ou composant(s) concerné(s) */
  pages: string[];
  /** Note interne honnête */
  note: string;
  /** Risque produit si présenté comme réel */
  risk: "high" | "medium" | "low" | "none";
  /** Preuves techniques pointables */
  evidence: FeatureEvidence;
}

export const FEATURE_REGISTRY: FeatureEntry[] = [
  // ── ACQUISITION ────────────────────────────────────────────────
  {
    id: "landing",
    label: "Landing page",
    status: "real",
    confidence: "code-verified",
    area: "acquisition",
    pages: ["/"],
    note: "Quota temps réel depuis launch_quota. Textes statiques — pas de mock.",
    risk: "none",
    evidence: { tables: ["launch_quota"], codeFiles: ["src/components/landing/LaunchQuotaBanner.tsx"] },
  },
  {
    id: "pricing_page",
    label: "Page Pricing",
    status: "real",
    confidence: "code-verified",
    area: "acquisition",
    pages: ["/pricing"],
    note: "Prix et quota depuis pricingConfig + launch_quota DB.",
    risk: "none",
    evidence: { tables: ["launch_quota"], codeFiles: ["src/lib/pricingConfig.ts", "src/pages/Pricing.tsx"] },
  },

  // ── ONBOARDING ─────────────────────────────────────────────────
  {
    id: "onboarding",
    label: "Onboarding",
    status: "real",
    confidence: "code-verified",
    area: "onboarding",
    pages: ["/onboarding"],
    note: "Branché Supabase, sauvegarde profil, rôle, dossier. Quelques options métier hardcodées FR.",
    risk: "low",
    evidence: { tables: ["profiles", "entreprise_profiles", "facilitateur_profiles"], codeFiles: ["src/pages/Onboarding.tsx"] },
  },

  // ── BILLING ────────────────────────────────────────────────────
  {
    id: "checkout",
    label: "Checkout Stripe",
    status: "real",
    confidence: "code-verified",
    area: "billing",
    pages: ["/checkout"],
    note: "create-checkout edge fn opérationnelle. Codes promo via redeem-promo.",
    risk: "none",
    evidence: { edgeFunctions: ["create-checkout", "redeem-promo"], codeFiles: ["src/pages/Checkout.tsx"] },
  },
  {
    id: "stripe_webhook",
    label: "Webhook Stripe",
    status: "env-dep",
    confidence: "code-verified",
    area: "billing",
    pages: ["supabase/functions/stripe-webhook"],
    note: "Edge fn déployée. STRIPE_WEBHOOK_SECRET doit être configuré pour vérification de signature.",
    risk: "medium",
    evidence: { edgeFunctions: ["stripe-webhook"], note: "Secret STRIPE_WEBHOOK_SECRET requis en production" },
  },
  {
    id: "customer_portal",
    label: "Portail client Stripe",
    status: "env-dep",
    confidence: "code-verified",
    area: "billing",
    pages: ["/account"],
    note: "Edge function customer-portal déployée et inspectée. Nécessite activation du Customer Portal dans le dashboard Stripe. Sans activation, la redirection échoue côté Stripe.",
    risk: "low",
    evidence: { edgeFunctions: ["customer-portal"], codeFiles: ["supabase/functions/customer-portal/index.ts"], note: "Activation Customer Portal requise dans Stripe dashboard" },
  },

  // ── CONTACTS ───────────────────────────────────────────────────
  {
    id: "contacts_list",
    label: "Liste contacts",
    status: "real",
    confidence: "code-verified",
    area: "contacts",
    pages: ["/contacts"],
    note: "CRUD complet branché Supabase avec RLS.",
    risk: "none",
    evidence: { tables: ["contacts"], codeFiles: ["src/pages/Contacts.tsx"] },
  },
  {
    id: "contact_import",
    label: "Import contacts CSV",
    status: "real",
    confidence: "code-verified",
    area: "contacts",
    pages: ["/contacts/import"],
    note: "Parser CSV client-side + insert batch Supabase. Rapport import: lignes lues/valides/ignorées/insérées/échouées. Excel .xlsx honnêtement refusé.",
    risk: "none",
    evidence: { tables: ["contacts"], codeFiles: ["src/pages/ContactImport.tsx"], note: "parseCSV() inspecté, déduplication email active" },
  },
  {
    id: "sources",
    label: "Sources contacts",
    status: "real",
    confidence: "code-verified",
    area: "contacts",
    pages: ["/sources"],
    note: "Compteurs réels depuis Supabase groupés par colonne `origine`.",
    risk: "none",
    evidence: { tables: ["contacts"], codeFiles: ["src/pages/Sources.tsx"] },
  },

  // ── CAMPAIGNS ──────────────────────────────────────────────────
  {
    id: "campaigns_list",
    label: "Liste campagnes",
    status: "real",
    confidence: "code-verified",
    area: "campaigns",
    pages: ["/campagnes"],
    note: "Lit la table campagnes avec RLS.",
    risk: "none",
    evidence: { tables: ["campagnes"], codeFiles: ["src/pages/Campagnes.tsx"] },
  },
  {
    id: "campaign_detail",
    label: "Détail campagne",
    status: "real",
    confidence: "code-verified",
    area: "campaigns",
    pages: ["/campagnes/:id"],
    note: "Charge par UUID valide. UUID invalide → redirect. 404 → redirect. Section séquences honnêtement absente.",
    risk: "none",
    evidence: { tables: ["campagnes"], codeFiles: ["src/pages/CampagneDetail.tsx"] },
  },
  {
    id: "campaign_create",
    label: "Créer campagne",
    status: "real",
    confidence: "code-verified",
    area: "campaigns",
    pages: ["/campagnes/nouvelle"],
    note: "Lit les vraies listes depuis DB. Insère en campagnes. Gère listes vides.",
    risk: "none",
    evidence: { tables: ["campagnes", "listes"], codeFiles: ["src/pages/CampagneNouvelle.tsx"] },
  },
  {
    id: "campaign_sequences",
    label: "Séquences d'étapes campagne",
    status: "dead",
    confidence: "code-verified",
    area: "campaigns",
    pages: ["/campagnes/:id"],
    note: "Pas de table de séquences en base. Section visible mais honnêtement marquée 'en développement'.",
    risk: "medium",
    evidence: { note: "Aucune table campaign_steps ou campaign_sequences dans le schéma actuel" },
  },
  {
    id: "messages_templates",
    label: "Modèles de messages",
    status: "partial",
    confidence: "code-verified",
    area: "campaigns",
    pages: ["/messages"],
    note: "Modèles statiques hardcodés côté client. Pas de persistance DB.",
    risk: "low",
    evidence: { codeFiles: ["src/pages/Messages.tsx"], note: "useState local uniquement" },
  },
  {
    id: "regles",
    label: "Règles d'automatisation",
    status: "mock",
    confidence: "code-verified",
    area: "campaigns",
    pages: ["/regles"],
    note: "UI toggle avec useState local uniquement. Aucune persistance. Les règles ne font rien.",
    risk: "medium",
    evidence: { codeFiles: ["src/pages/Regles.tsx"], note: "Aucune table de règles, aucun effet backend" },
  },
  {
    id: "studio",
    label: "Studio de prospection",
    status: "partial",
    confidence: "code-verified",
    area: "campaigns",
    pages: ["/studio"],
    note: "Hub de navigation fonctionnel. La progression 'etapesLancement' est hardcodée, non calculée depuis DB.",
    risk: "low",
    evidence: { codeFiles: ["src/pages/Studio.tsx"] },
  },

  // ── REFERRAL ───────────────────────────────────────────────────
  {
    id: "missions",
    label: "Missions d'apport",
    status: "real",
    confidence: "code-verified",
    area: "referral",
    pages: ["/missions", "/missions/:id", "/missions/nouvelle"],
    note: "CRUD complet, triggers SQL actifs (openclaw_business_event_trigger).",
    risk: "none",
    evidence: { tables: ["missions"], codeFiles: ["src/pages/Missions.tsx", "src/pages/MissionDetail.tsx"] },
  },
  {
    id: "introductions",
    label: "Introductions",
    status: "real",
    confidence: "code-verified",
    area: "referral",
    pages: ["/introductions", "/introductions/:id"],
    note: "Branché Supabase. Statuts réels. Triggers trust score actifs.",
    risk: "none",
    evidence: { tables: ["introductions", "trust_scores"], codeFiles: ["src/pages/Introductions.tsx"] },
  },
  {
    id: "gains",
    label: "Gains facilitateur",
    status: "real",
    confidence: "code-verified",
    area: "referral",
    pages: ["/gains"],
    note: "Table gains réelle avec statuts. Trigger on_gain_status_change actif.",
    risk: "none",
    evidence: { tables: ["gains"], codeFiles: ["src/pages/Gains.tsx"] },
  },
  {
    id: "facilitateurs_marketplace",
    label: "Marketplace facilitateurs",
    status: "real",
    confidence: "code-verified",
    area: "referral",
    pages: ["/facilitateurs", "/facilitateurs/:id"],
    note: "Lecture depuis facilitateur_profiles + reviews.",
    risk: "none",
    evidence: { tables: ["facilitateur_profiles", "facilitator_reviews"], codeFiles: ["src/pages/Facilitateurs.tsx"] },
  },

  // ── PASSIVE OS ─────────────────────────────────────────────────
  {
    id: "passive_os",
    label: "Passive OS",
    status: "real",
    confidence: "code-verified",
    area: "passive_os",
    pages: ["/passive"],
    note: "shared_offers, offer_share_links, link_events. Dépend de la data utilisateur.",
    risk: "none",
    evidence: { tables: ["shared_offers", "offer_share_links", "link_events"], codeFiles: ["src/pages/PassiveOS.tsx"] },
  },
  {
    id: "deal_radar",
    label: "Deal Radar",
    status: "real",
    confidence: "code-verified",
    area: "passive_os",
    pages: ["/radar"],
    note: "Lit signals + opportunities depuis DB via deal-radar-score edge fn.",
    risk: "none",
    evidence: { tables: ["opportunities"], edgeFunctions: ["deal-radar-score"], codeFiles: ["src/pages/Radar.tsx"] },
  },

  // ── OPENCLAW ───────────────────────────────────────────────────
  {
    id: "openclaw_agents",
    label: "Agents OpenClaw",
    status: "real",
    confidence: "code-verified",
    area: "openclaw",
    pages: ["/agents"],
    note: "Table openclaw_agents avec CRUD.",
    risk: "none",
    evidence: { tables: ["openclaw_agents"], codeFiles: ["src/pages/Agents.tsx"] },
  },
  {
    id: "openclaw_operations",
    label: "Operations runtime",
    status: "real",
    confidence: "code-verified",
    area: "openclaw",
    pages: ["/operations"],
    note: "Branché aux hooks runtime réels. Données réelles depuis DB.",
    risk: "none",
    evidence: { tables: ["openclaw_job_queue", "openclaw_job_executions", "openclaw_channels"], codeFiles: ["src/pages/Operations.tsx", "src/hooks/useOpenClawRuntime.ts"] },
  },
  {
    id: "openclaw_war_room",
    label: "War Room",
    status: "real",
    confidence: "code-verified",
    area: "openclaw",
    pages: ["/war-room"],
    note: "Runtime réel avec deliveries, heartbeats, channel actions.",
    risk: "none",
    evidence: { tables: ["openclaw_channel_actions", "openclaw_deliveries"], codeFiles: ["src/pages/WarRoom.tsx"] },
  },
  {
    id: "openclaw_gateway",
    label: "Gateway OpenClaw externe",
    status: "env-dep",
    confidence: "code-verified",
    area: "openclaw",
    pages: ["/agents"],
    note: "Nécessite gateway_url + gateway_secret configurés par l'utilisateur.",
    risk: "medium",
    evidence: { edgeFunctions: ["openclaw-gateway"], note: "Variables d'env gateway_url / gateway_secret requises" },
  },
  {
    id: "openclaw_scheduler",
    label: "Scheduler autonome (pg_cron)",
    status: "partial",
    confidence: "code-verified",
    area: "openclaw",
    pages: ["/operations", "/war-room"],
    note: "Edge fn + cron configuré. Non observé en production (DB souvent vide au lancement).",
    risk: "low",
    evidence: { edgeFunctions: ["openclaw-scheduler"], tables: ["openclaw_job_queue"], codeFiles: ["src/hooks/useOpenClawScheduler.ts"] },
  },

  // ── ADMIN ──────────────────────────────────────────────────────
  {
    id: "admin_overview",
    label: "Admin Overview",
    status: "real",
    confidence: "code-verified",
    area: "admin",
    pages: ["/admin"],
    note: "Métriques réelles depuis profiles, subscriptions, launch_quota.",
    risk: "none",
    evidence: { tables: ["profiles", "subscriptions", "launch_quota"], codeFiles: ["src/pages/admin/Overview.tsx"] },
  },
  {
    id: "admin_users",
    label: "Admin Users",
    status: "real",
    confidence: "code-verified",
    area: "admin",
    pages: ["/admin/users"],
    note: "Données réelles depuis profiles + subscriptions + promo_code_redemptions.",
    risk: "none",
    evidence: { tables: ["profiles", "subscriptions", "promo_code_redemptions"], codeFiles: ["src/pages/admin/Users.tsx"] },
  },
  {
    id: "admin_payments",
    label: "Admin Payments",
    status: "real",
    confidence: "code-verified",
    area: "admin",
    pages: ["/admin/payments"],
    note: "Données réelles. Transactions Stripe individuelles disponibles après config webhook.",
    risk: "none",
    evidence: { tables: ["billing_events", "subscriptions"], codeFiles: ["src/pages/admin/Payments.tsx"] },
  },
  {
    id: "admin_analytics",
    label: "Admin Analytics",
    status: "real",
    confidence: "code-verified",
    area: "admin",
    pages: ["/admin/analytics"],
    note: "12 métriques réelles DB. Visiteurs landing non mesurables sans tracker externe.",
    risk: "none",
    evidence: { tables: ["missions", "introductions", "gains", "profiles"], codeFiles: ["src/pages/admin/Analytics.tsx"] },
  },
  {
    id: "admin_revenue",
    label: "Admin Revenue",
    status: "real",
    confidence: "code-verified",
    area: "admin",
    pages: ["/admin/revenue"],
    note: "Toutes métriques réelles. Revenu estimé côté back-office (non Stripe temps réel).",
    risk: "none",
    evidence: { tables: ["subscriptions", "billing_events"], codeFiles: ["src/pages/admin/Revenue.tsx"] },
  },

  // ── ANALYTICS ──────────────────────────────────────────────────
  {
    id: "landing_analytics",
    label: "Analytics trafic landing",
    status: "dead",
    confidence: "declared",
    area: "analytics",
    pages: ["/admin/analytics"],
    note: "Non mesurable via DB Supabase native. Nécessite Plausible/GA/PostHog.",
    risk: "none",
    evidence: { note: "Aucun tracker externe configuré" },
  },

  // ── SETTINGS ───────────────────────────────────────────────────
  {
    id: "autonomie",
    label: "Autonomie & Voix",
    status: "real",
    confidence: "code-verified",
    area: "settings",
    pages: ["/autonomie"],
    note: "openclaw_config + agents lus depuis DB. Kill switch persisté.",
    risk: "none",
    evidence: { tables: ["openclaw_agents", "openclaw_config"], codeFiles: ["src/pages/Autonomie.tsx"] },
  },
  {
    id: "canaux_config",
    label: "Configuration canaux",
    status: "partial",
    confidence: "code-verified",
    area: "settings",
    pages: ["/canaux"],
    note: "Lecture openclaw_channel_capabilities depuis DB. WhatsApp/LinkedIn : préparation seulement, envoi réel nécessite gateway.",
    risk: "low",
    evidence: { tables: ["openclaw_channel_capabilities", "openclaw_channels"], codeFiles: ["src/pages/Canaux.tsx"] },
  },

  // ── INFRASTRUCTURE ─────────────────────────────────────────────
  {
    id: "pwa",
    label: "PWA installable",
    status: "real",
    confidence: "code-verified",
    area: "infrastructure",
    pages: ["/install"],
    note: "vite-plugin-pwa + manifest complet. Workbox limit 4MiB configuré.",
    risk: "none",
    evidence: { codeFiles: ["vite.config.ts"], note: "maximumFileSizeToCacheInBytes = 4MiB" },
  },
  {
    id: "i18n",
    label: "Internationalisation (fr/en/es/ar/he)",
    status: "partial",
    confidence: "code-verified",
    area: "infrastructure",
    pages: ["global"],
    note: "Parcours critiques internationalisés. Admin et pages complexes encore partiellement FR. hi/bn en fallback.",
    risk: "low",
    evidence: { codeFiles: ["src/lib/i18n.ts", "src/lib/formatLocale.ts", "src/components/LanguageSwitcher.tsx"] },
  },
  {
    id: "voice_elevenlabs",
    label: "Voix ElevenLabs",
    status: "env-dep",
    confidence: "code-verified",
    area: "infrastructure",
    pages: ["/autonomie", "global"],
    note: "ELEVENLABS_API_KEY configurée en secret. Fallback navigateur si absent.",
    risk: "none",
    evidence: { edgeFunctions: ["elevenlabs-voice-token"], codeFiles: ["src/components/ai/VoiceWelcome.tsx"] },
  },
];

/** Retourne les features par statut */
export function getFeaturesByStatus(status: FeatureStatus): FeatureEntry[] {
  return FEATURE_REGISTRY.filter(f => f.status === status);
}

/** Retourne les features par area */
export function getFeaturesByArea(area: OwnerArea): FeatureEntry[] {
  return FEATURE_REGISTRY.filter(f => f.area === area);
}

/** Features à risque élevé ou moyen */
export function getHighRiskFeatures(): FeatureEntry[] {
  return FEATURE_REGISTRY.filter(f => f.risk === "high" || f.risk === "medium");
}

/** Features "real" mais dépendantes d'env ou config externe */
export function getEnvBlockedFeatures(): FeatureEntry[] {
  return FEATURE_REGISTRY.filter(f => f.status === "env-dep");
}

/** Features déclarées sans preuve code */
export function getDeclaredOnlyFeatures(): FeatureEntry[] {
  return FEATURE_REGISTRY.filter(f => f.confidence === "declared");
}

export const STATUS_META: Record<FeatureStatus, { label: string; color: string; bg: string }> = {
  real:      { label: "Réel",         color: "hsl(var(--success))",         bg: "hsl(var(--success-light))" },
  partial:   { label: "Partiel",      color: "hsl(38 80% 30%)",             bg: "hsl(var(--accent-light))" },
  mock:      { label: "Mock",         color: "hsl(0 65% 40%)",              bg: "hsl(0 65% 95%)" },
  dead:      { label: "Non branché",  color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
  "env-dep": { label: "Dépend env",  color: "hsl(218 72% 55%)",            bg: "hsl(218 72% 95%)" },
};

export const CONFIDENCE_META: Record<FeatureConfidence, { label: string; color: string; bg: string; short: string }> = {
  declared:         { label: "Déclaré",          short: "D",  color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
  "code-verified":  { label: "Code vérifié",     short: "CV", color: "hsl(218 72% 55%)",            bg: "hsl(218 72% 95%)" },
  "runtime-verified":{ label: "Runtime vérifié", short: "RV", color: "hsl(var(--success))",         bg: "hsl(var(--success-light))" },
};
