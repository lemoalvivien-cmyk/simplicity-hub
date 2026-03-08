/**
 * FEATURE REGISTRY — Source de vérité produit unique.
 * Chaque fonctionnalité est classée selon son état réel.
 *
 * États :
 *   real    = branché à des données réelles, fonctionnel en production
 *   partial = partiellement câblé, logique incomplète ou données manquantes
 *   mock    = données simulées / comportement fake / façade UI
 *   dead    = page vide, lien vers nulle part, aucune valeur utilisateur
 *   env-dep = fonctionnel mais nécessite une config environnement externe
 */

export type FeatureStatus = "real" | "partial" | "mock" | "dead" | "env-dep";
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

export interface FeatureEntry {
  id: string;
  label: string;
  status: FeatureStatus;
  area: OwnerArea;
  /** Page(s) ou composant(s) concerné(s) */
  pages: string[];
  /** Note interne honnête */
  note: string;
  /** Risque produit si présenté comme réel */
  risk: "high" | "medium" | "low" | "none";
}

export const FEATURE_REGISTRY: FeatureEntry[] = [
  // ── ACQUISITION ────────────────────────────────────────────────
  {
    id: "landing",
    label: "Landing page",
    status: "real",
    area: "acquisition",
    pages: ["/"],
    note: "Quota temps réel depuis launch_quota. Textes statiques — pas de mock.",
    risk: "none",
  },
  {
    id: "pricing_page",
    label: "Page Pricing",
    status: "real",
    area: "acquisition",
    pages: ["/pricing"],
    note: "Prix et quota depuis pricingConfig + launch_quota DB.",
    risk: "none",
  },

  // ── ONBOARDING ─────────────────────────────────────────────────
  {
    id: "onboarding",
    label: "Onboarding",
    status: "real",
    area: "onboarding",
    pages: ["/onboarding"],
    note: "Branché Supabase, sauvegarde profil, rôle, dossier. Quelques options métier (secteurs) encore hardcodées FR.",
    risk: "low",
  },

  // ── BILLING ────────────────────────────────────────────────────
  {
    id: "checkout",
    label: "Checkout Stripe",
    status: "real",
    area: "billing",
    pages: ["/checkout"],
    note: "create-checkout edge fn opérationnelle. Codes promo via redeem-promo.",
    risk: "none",
  },
  {
    id: "stripe_webhook",
    label: "Webhook Stripe",
    status: "env-dep",
    area: "billing",
    pages: ["supabase/functions/stripe-webhook"],
    note: "Edge fn déployée. STRIPE_WEBHOOK_SECRET doit être configuré pour vérification de signature.",
    risk: "medium",
  },
  {
    id: "customer_portal",
    label: "Portail client Stripe",
    status: "env-dep",
    area: "billing",
    pages: ["/account"],
    note: "Nécessite activation du Customer Portal dans le dashboard Stripe.",
    risk: "low",
  },

  // ── CONTACTS ───────────────────────────────────────────────────
  {
    id: "contacts_list",
    label: "Liste contacts",
    status: "real",
    area: "contacts",
    pages: ["/contacts"],
    note: "CRUD complet branché Supabase avec RLS.",
    risk: "none",
  },
  {
    id: "contact_import",
    label: "Import contacts CSV",
    status: "real",
    area: "contacts",
    pages: ["/contacts/import"],
    note: "Parser CSV client-side réel + insert batch Supabase. Excel .xlsx non supporté (honnêtement indiqué).",
    risk: "none",
  },
  {
    id: "sources",
    label: "Sources contacts",
    status: "real",
    area: "contacts",
    pages: ["/sources"],
    note: "Compteurs réels depuis Supabase groupés par origine.",
    risk: "none",
  },

  // ── CAMPAIGNS ──────────────────────────────────────────────────
  {
    id: "campaigns_list",
    label: "Liste campagnes",
    status: "real",
    area: "campaigns",
    pages: ["/campagnes"],
    note: "Lit la table campagnes avec RLS.",
    risk: "none",
  },
  {
    id: "campaign_detail",
    label: "Détail campagne",
    status: "real",
    area: "campaigns",
    pages: ["/campagnes/:id"],
    note: "Charge la campagne réelle par UUID. Section 'étapes de séquence' marquée honnêtement comme non disponible.",
    risk: "none",
  },
  {
    id: "campaign_create",
    label: "Créer campagne",
    status: "real",
    area: "campaigns",
    pages: ["/campagnes/nouvelle"],
    note: "Lit les vraies listes, insère en DB. Plus de LISTES_MOCK.",
    risk: "none",
  },
  {
    id: "campaign_sequences",
    label: "Séquences d'étapes campagne",
    status: "dead",
    area: "campaigns",
    pages: ["/campagnes/:id"],
    note: "Pas de table de séquences en base. Section visible mais honnêtement marquée 'en développement'.",
    risk: "medium",
  },
  {
    id: "messages_templates",
    label: "Modèles de messages",
    status: "partial",
    area: "campaigns",
    pages: ["/messages"],
    note: "Modèles statiques hardcodés côté client. Pas de persistance DB. Acceptable comme point de départ mais non personnalisable.",
    risk: "low",
  },
  {
    id: "regles",
    label: "Règles d'automatisation",
    status: "mock",
    area: "campaigns",
    pages: ["/regles"],
    note: "UI toggle avec useState local uniquement. Aucune persistance. Les règles ne font rien en pratique.",
    risk: "medium",
  },
  {
    id: "studio",
    label: "Studio de prospection",
    status: "partial",
    area: "campaigns",
    pages: ["/studio"],
    note: "Hub de navigation fonctionnel. La progression 'etapesLancement' est hardcodée (pas calculée depuis DB).",
    risk: "low",
  },

  // ── REFERRAL ───────────────────────────────────────────────────
  {
    id: "missions",
    label: "Missions d'apport",
    status: "real",
    area: "referral",
    pages: ["/missions", "/missions/:id", "/missions/nouvelle"],
    note: "CRUD complet, triggers SQL actifs.",
    risk: "none",
  },
  {
    id: "introductions",
    label: "Introductions",
    status: "real",
    area: "referral",
    pages: ["/introductions", "/introductions/:id"],
    note: "Branché Supabase. Statuts réels.",
    risk: "none",
  },
  {
    id: "gains",
    label: "Gains facilitateur",
    status: "real",
    area: "referral",
    pages: ["/gains"],
    note: "Table gains réelle avec statuts.",
    risk: "none",
  },
  {
    id: "facilitateurs_marketplace",
    label: "Marketplace facilitateurs",
    status: "real",
    area: "referral",
    pages: ["/facilitateurs", "/facilitateurs/:id"],
    note: "Lecture depuis facilitateur_profiles + reviews.",
    risk: "none",
  },

  // ── PASSIVE OS ─────────────────────────────────────────────────
  {
    id: "passive_os",
    label: "Passive OS",
    status: "real",
    area: "passive_os",
    pages: ["/passive"],
    note: "shared_offers, offer_share_links, link_events. Dépend de la data utilisateur.",
    risk: "none",
  },
  {
    id: "deal_radar",
    label: "Deal Radar",
    status: "real",
    area: "passive_os",
    pages: ["/radar"],
    note: "Lit signals + opportunities depuis DB via deal-radar-score edge fn.",
    risk: "none",
  },

  // ── OPENCLAW ───────────────────────────────────────────────────
  {
    id: "openclaw_agents",
    label: "Agents OpenClaw",
    status: "real",
    area: "openclaw",
    pages: ["/agents"],
    note: "Table openclaw_agents avec CRUD.",
    risk: "none",
  },
  {
    id: "openclaw_operations",
    label: "Operations runtime",
    status: "real",
    area: "openclaw",
    pages: ["/operations"],
    note: "Branché aux hooks runtime réels. Données réelles depuis DB.",
    risk: "none",
  },
  {
    id: "openclaw_war_room",
    label: "War Room",
    status: "real",
    area: "openclaw",
    pages: ["/war-room"],
    note: "Runtime réel avec deliveries, heartbeats, channel actions.",
    risk: "none",
  },
  {
    id: "openclaw_gateway",
    label: "Gateway OpenClaw externe",
    status: "env-dep",
    area: "openclaw",
    pages: ["/agents"],
    note: "Nécessite gateway_url + gateway_secret configurés par l'utilisateur.",
    risk: "medium",
  },
  {
    id: "openclaw_scheduler",
    label: "Scheduler autonome (pg_cron)",
    status: "partial",
    area: "openclaw",
    pages: ["/operations", "/war-room"],
    note: "Edge fn + cron configuré. Non observé en production (DB vide au lancement).",
    risk: "low",
  },

  // ── ADMIN ──────────────────────────────────────────────────────
  {
    id: "admin_overview",
    label: "Admin Overview",
    status: "real",
    area: "admin",
    pages: ["/admin"],
    note: "Métriques réelles depuis profiles, subscriptions, launch_quota.",
    risk: "none",
  },
  {
    id: "admin_users",
    label: "Admin Users",
    status: "real",
    area: "admin",
    pages: ["/admin/users"],
    note: "Données réelles depuis profiles + subscriptions + promo_code_redemptions.",
    risk: "none",
  },
  {
    id: "admin_payments",
    label: "Admin Payments",
    status: "real",
    area: "admin",
    pages: ["/admin/payments"],
    note: "Données réelles. Transactions Stripe individuelles disponibles après config webhook.",
    risk: "none",
  },
  {
    id: "admin_analytics",
    label: "Admin Analytics",
    status: "real",
    area: "admin",
    pages: ["/admin/analytics"],
    note: "12 métriques réelles DB. Visiteurs landing non mesurables sans tracker externe.",
    risk: "none",
  },
  {
    id: "admin_revenue",
    label: "Admin Revenue",
    status: "real",
    area: "admin",
    pages: ["/admin/revenue"],
    note: "Toutes métriques réelles. Revenu estimé côté back-office (non Stripe temps réel).",
    risk: "none",
  },

  // ── ANALYTICS ──────────────────────────────────────────────────
  {
    id: "landing_analytics",
    label: "Analytics trafic landing",
    status: "dead",
    area: "analytics",
    pages: ["/admin/analytics"],
    note: "Non mesurable via DB Supabase native. Nécessite Plausible/GA/PostHog.",
    risk: "none",
  },

  // ── SETTINGS ───────────────────────────────────────────────────
  {
    id: "autonomie",
    label: "Autonomie & Voix",
    status: "real",
    area: "settings",
    pages: ["/autonomie"],
    note: "openclaw_config + agents lus depuis DB. Kill switch persisté.",
    risk: "none",
  },
  {
    id: "canaux_config",
    label: "Configuration canaux",
    status: "partial",
    area: "settings",
    pages: ["/canaux"],
    note: "Lecture openclaw_channel_capabilities depuis DB. WhatsApp/LinkedIn : préparation seulement, envoi réel nécessite gateway.",
    risk: "low",
  },

  // ── INFRASTRUCTURE ─────────────────────────────────────────────
  {
    id: "pwa",
    label: "PWA installable",
    status: "real",
    area: "infrastructure",
    pages: ["/install"],
    note: "vite-plugin-pwa + manifest complet.",
    risk: "none",
  },
  {
    id: "i18n",
    label: "Internationalisation (fr/en/es/ar/he)",
    status: "partial",
    area: "infrastructure",
    pages: ["global"],
    note: "Parcours critiques internationalisés. Admin et pages complexes encore partiellement FR. hi/bn en fallback.",
    risk: "low",
  },
  {
    id: "voice_elevenlabs",
    label: "Voix ElevenLabs",
    status: "env-dep",
    area: "infrastructure",
    pages: ["/autonomie", "global"],
    note: "ELEVENLABS_API_KEY configurée en secret. Fallback navigateur si absent.",
    risk: "none",
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

/** Features à risque élevé */
export function getHighRiskFeatures(): FeatureEntry[] {
  return FEATURE_REGISTRY.filter(f => f.risk === "high" || f.risk === "medium");
}

export const STATUS_META: Record<FeatureStatus, { label: string; color: string; bg: string }> = {
  real:    { label: "Réel",         color: "hsl(var(--success))",           bg: "hsl(var(--success-light))" },
  partial: { label: "Partiel",      color: "hsl(38 80% 30%)",               bg: "hsl(var(--accent-light))" },
  mock:    { label: "Mock",         color: "hsl(0 65% 40%)",                bg: "hsl(0 65% 95%)" },
  dead:    { label: "Non branché",  color: "hsl(var(--muted-foreground))",   bg: "hsl(var(--muted))" },
  "env-dep": { label: "Dépend env", color: "hsl(218 72% 55%)",              bg: "hsl(218 72% 95%)" },
};
