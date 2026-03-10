/**
 * FEATURE REGISTRY — Source de vérité produit unique.
 * Périmètre MVP : routes actives dans App.tsx uniquement.
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
  | "referral"
  | "admin"
  | "settings"
  | "infrastructure";

export interface FeatureEvidence {
  tables?: string[];
  edgeFunctions?: string[];
  codeFiles?: string[];
  note?: string;
}

export interface FeatureEntry {
  id: string;
  label: string;
  status: FeatureStatus;
  confidence: FeatureConfidence;
  area: OwnerArea;
  pages: string[];
  note: string;
  risk: "high" | "medium" | "low" | "none";
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
    note: "Branché Supabase, sauvegarde profil, rôle, dossier.",
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
    note: "Edge function customer-portal déployée. Nécessite activation du Customer Portal dans le dashboard Stripe.",
    risk: "low",
    evidence: { edgeFunctions: ["customer-portal"], codeFiles: ["supabase/functions/customer-portal/index.ts"] },
  },

  // ── CONTACTS ───────────────────────────────────────────────────
  {
    id: "contacts_list",
    label: "Liste contacts",
    status: "real",
    confidence: "code-verified",
    area: "contacts",
    pages: ["/contacts", "/contacts/:id"],
    note: "CRUD complet branché Supabase avec RLS.",
    risk: "none",
    evidence: { tables: ["contacts"], codeFiles: ["src/pages/Contacts.tsx", "src/pages/ContactDetail.tsx"] },
  },
  {
    id: "contact_import",
    label: "Import contacts CSV",
    status: "real",
    confidence: "code-verified",
    area: "contacts",
    pages: ["/contacts/import"],
    note: "Parser CSV client-side + insert batch Supabase. Déduplication email active.",
    risk: "none",
    evidence: { tables: ["contacts"], codeFiles: ["src/pages/ContactImport.tsx"] },
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
    evidence: { tables: ["missions"], codeFiles: ["src/pages/Missions.tsx", "src/pages/MissionDetail.tsx", "src/pages/MissionNouvelle.tsx"] },
  },
  {
    id: "introductions",
    label: "Introductions",
    status: "real",
    confidence: "code-verified",
    area: "referral",
    pages: ["/introductions", "/introductions/:id", "/entreprise/introductions"],
    note: "Branché Supabase. Statuts réels. Triggers trust score actifs.",
    risk: "none",
    evidence: { tables: ["introductions", "trust_scores"], codeFiles: ["src/pages/Introductions.tsx", "src/pages/IntroductionDetail.tsx", "src/pages/IntroductionsEntreprise.tsx"] },
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
    evidence: { tables: ["facilitateur_profiles", "facilitator_reviews"], codeFiles: ["src/pages/Facilitateurs.tsx", "src/pages/FacilitateurDetail.tsx"] },
  },
  {
    id: "actions",
    label: "Actions",
    status: "real",
    confidence: "code-verified",
    area: "referral",
    pages: ["/actions"],
    note: "CRUD actions branché Supabase avec RLS.",
    risk: "none",
    evidence: { tables: ["actions"], codeFiles: ["src/pages/Actions.tsx"] },
  },
  {
    id: "pilotage",
    label: "Pilotage",
    status: "real",
    confidence: "code-verified",
    area: "referral",
    pages: ["/pilotage"],
    note: "Vue métriques pipeline réelles depuis DB.",
    risk: "none",
    evidence: { tables: ["missions", "introductions", "gains"], codeFiles: ["src/pages/Pilotage.tsx"] },
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
    note: "Données réelles. Transactions Stripe disponibles après config webhook.",
    risk: "none",
    evidence: { tables: ["billing_events", "subscriptions"], codeFiles: ["src/pages/admin/Payments.tsx"] },
  },
  {
    id: "admin_promo_codes",
    label: "Admin Promo Codes",
    status: "real",
    confidence: "code-verified",
    area: "admin",
    pages: ["/admin/promo-codes"],
    note: "CRUD codes promo branché DB.",
    risk: "none",
    evidence: { tables: ["promo_codes", "promo_code_redemptions"], codeFiles: ["src/pages/admin/PromoCodes.tsx"] },
  },

  // ── SETTINGS ───────────────────────────────────────────────────
  {
    id: "account",
    label: "Mon compte",
    status: "real",
    confidence: "code-verified",
    area: "settings",
    pages: ["/account"],
    note: "Profil utilisateur + portail Stripe.",
    risk: "none",
    evidence: { tables: ["profiles"], codeFiles: ["src/pages/Account.tsx"] },
  },
  {
    id: "profil_facilitateur",
    label: "Profil facilitateur",
    status: "real",
    confidence: "code-verified",
    area: "settings",
    pages: ["/profil/facilitateur"],
    note: "CRUD facilitateur_profiles avec RLS.",
    risk: "none",
    evidence: { tables: ["facilitateur_profiles"], codeFiles: ["src/pages/ProfilFacilitateur.tsx"] },
  },
  {
    id: "profil_entreprise",
    label: "Profil entreprise",
    status: "real",
    confidence: "code-verified",
    area: "settings",
    pages: ["/profil/entreprise"],
    note: "CRUD entreprise_profiles avec RLS.",
    risk: "none",
    evidence: { tables: ["entreprise_profiles"], codeFiles: ["src/pages/ProfilEntreprise.tsx"] },
  },

  // ── INFRASTRUCTURE ─────────────────────────────────────────────
  {
    id: "assistant",
    label: "Assistant IA",
    status: "real",
    confidence: "code-verified",
    area: "infrastructure",
    pages: ["/assistant"],
    note: "Chat IA via Lovable AI models.",
    risk: "none",
    evidence: { edgeFunctions: ["ai-jarvis"], codeFiles: ["src/pages/Assistant.tsx"] },
  },
  {
    id: "pwa",
    label: "PWA installable",
    status: "real",
    confidence: "code-verified",
    area: "infrastructure",
    pages: ["global"],
    note: "vite-plugin-pwa + manifest complet. Workbox limit 4MiB configuré.",
    risk: "none",
    evidence: { codeFiles: ["vite.config.ts"] },
  },
  {
    id: "voice_elevenlabs",
    label: "Voix ElevenLabs",
    status: "env-dep",
    confidence: "code-verified",
    area: "infrastructure",
    pages: ["global"],
    note: "ELEVENLABS_API_KEY configurée en secret. Fallback navigateur si absent.",
    risk: "none",
    evidence: { edgeFunctions: ["elevenlabs-voice-token", "elevenlabs-tts"], codeFiles: ["src/components/ai/VoiceWelcome.tsx"] },
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
  declared:           { label: "Déclaré",          short: "D",  color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
  "code-verified":    { label: "Code vérifié",     short: "CV", color: "hsl(218 72% 55%)",            bg: "hsl(218 72% 95%)" },
  "runtime-verified": { label: "Runtime vérifié",  short: "RV", color: "hsl(var(--success))",         bg: "hsl(var(--success-light))" },
};
