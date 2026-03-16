// AUDIT 16/03/2026 – BLOQUANTS LEVÉS
// Tous les modules IA / ETG / ADA / OpenClaw / War Caller / Insights / PSD2
// sont désactivés pour le lancement GTM.  Seul le cœur marketplace est actif.

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
 *   disabled = AUDIT 16/03/2026 — désactivé pour le lancement, ne pas réactiver sans validation produit
 *
 * Confidence :
 *   declared         = déclaré manuellement, pas encore vérifié en code
 *   code-verified    = code inspecté et confirmé branché à la vraie source
 *   runtime-verified = testé en exécution réelle (edge fn, DB, session)
 */

export type FeatureStatus     = "real" | "partial" | "mock" | "dead" | "env-dep" | "disabled";
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
  enabled: boolean;   // AUDIT 16/03/2026 — flag opérationnel : false = bloqué
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
    enabled: true,
    confidence: "code-verified",
    area: "acquisition",
    pages: ["/"],
    note: "Quota temps réel depuis launch_quota. Textes statiques — pas de mock.",
    risk: "none",
    evidence: { tables: ["launch_quota"], codeFiles: ["src/components/landing/LaunchQuotaBanner.tsx"] },
  },
  {
    id: "creer_emploi",
    label: "Page Créer son Emploi",
    status: "real",
    enabled: true,
    confidence: "code-verified",
    area: "acquisition",
    pages: ["/creer-emploi"],
    note: "Tunnel de vente Facilitateur. 7 audiences, 4 étapes, FAQ, mega CTA avec quota live.",
    risk: "none",
    evidence: { tables: ["launch_quota"], codeFiles: ["src/pages/CreerEmploi.tsx"] },
  },
  {
    id: "pricing_page",
    label: "Page Pricing",
    status: "real",
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
    confidence: "code-verified",
    area: "referral",
    pages: ["/missions", "/missions/:id", "/missions/nouvelle"],
    note: "CRUD complet, triggers SQL actifs.",
    risk: "none",
    evidence: { tables: ["missions"], codeFiles: ["src/pages/Missions.tsx", "src/pages/MissionDetail.tsx", "src/pages/MissionNouvelle.tsx"] },
  },
  {
    id: "introductions",
    label: "Introductions",
    status: "real",
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
    confidence: "code-verified",
    area: "settings",
    pages: ["/profil/entreprise"],
    note: "CRUD entreprise_profiles avec RLS.",
    risk: "none",
    evidence: { tables: ["entreprise_profiles"], codeFiles: ["src/pages/ProfilEntreprise.tsx"] },
  },

  // ── INFRASTRUCTURE ─────────────────────────────────────────────
  {
    id: "pwa",
    label: "PWA installable",
    status: "real",
    enabled: true,
    confidence: "code-verified",
    area: "infrastructure",
    pages: ["global"],
    note: "vite-plugin-pwa + manifest complet. Workbox limit 4MiB configuré.",
    risk: "none",
    evidence: { codeFiles: ["vite.config.ts"] },
  },

  // ── DÉSACTIVÉS POUR LE LANCEMENT — AUDIT 16/03/2026 ───────────
  // Ces features sont bloquées (enabled: false) jusqu'à validation produit.
  // Ne pas réactiver sans décision explicite du Product Owner.
  {
    id: "ai_assistant",
    label: "Assistant IA (Jarvis)",
    status: "disabled",
    enabled: false, // AUDIT 16/03/2026 – BLOQUANTS LEVÉS
    confidence: "code-verified",
    area: "infrastructure",
    pages: ["/assistant"],
    note: "Désactivé pour GTM. Route supprimée dans App.tsx.",
    risk: "high",
    evidence: { edgeFunctions: ["ai-jarvis"], codeFiles: ["src/pages/Assistant.tsx"] },
  },
  {
    id: "openclaw",
    label: "OpenClaw Swarm",
    status: "disabled",
    enabled: false, // AUDIT 16/03/2026 – BLOQUANTS LEVÉS
    confidence: "code-verified",
    area: "infrastructure",
    pages: [],
    note: "Désactivé pour GTM. 17 edge functions bloquées côté config + RLS.",
    risk: "high",
    evidence: { edgeFunctions: ["openclaw-*"], tables: [] },
  },
  {
    id: "ada",
    label: "ADA — Agent vocal IA",
    status: "disabled",
    enabled: false, // AUDIT 16/03/2026 – BLOQUANTS LEVÉS
    confidence: "code-verified",
    area: "infrastructure",
    pages: ["/ada", "/ada/model"],
    note: "Désactivé pour GTM. Routes supprimées dans App.tsx. Tables bloquées par RLS.",
    risk: "high",
    evidence: { edgeFunctions: ["ada-orchestrator", "ada-voice-call", "ada-training-pipeline"], tables: ["ada_sessions", "ada_training_runs", "ada_training_samples"] },
  },
  {
    id: "etg",
    label: "Eternal Trust Graph (ETG)",
    status: "disabled",
    enabled: false, // AUDIT 16/03/2026 – BLOQUANTS LEVÉS
    confidence: "code-verified",
    area: "infrastructure",
    pages: [],
    note: "Désactivé pour GTM. Edge functions etg-* bloquées. Tables etg_* inaccessibles.",
    risk: "high",
    evidence: { edgeFunctions: ["etg-aggregate", "etg-ingest", "etg-predict"], tables: ["etg_companies", "etg_persons", "etg_links", "etg_opportunities", "etg_hidden_links"] },
  },
  {
    id: "insights_api",
    label: "Insights API (Sales Intelligence)",
    status: "disabled",
    enabled: false, // AUDIT 16/03/2026 – BLOQUANTS LEVÉS
    confidence: "code-verified",
    area: "infrastructure",
    pages: ["/insights-sales"],
    note: "Désactivé pour GTM. Route supprimée dans App.tsx.",
    risk: "high",
    evidence: { edgeFunctions: ["insights-api"] },
  },
  {
    id: "war_caller",
    label: "War Caller",
    status: "disabled",
    enabled: false, // AUDIT 16/03/2026 – BLOQUANTS LEVÉS
    confidence: "code-verified",
    area: "infrastructure",
    pages: [],
    note: "Désactivé pour GTM. Composant UI masqué.",
    risk: "high",
    evidence: { codeFiles: ["src/components/ai/WarCaller.tsx"] },
  },
  {
    id: "god_mode",
    label: "God Mode Panel",
    status: "disabled",
    enabled: false, // AUDIT 16/03/2026 – BLOQUANTS LEVÉS
    confidence: "code-verified",
    area: "infrastructure",
    pages: [],
    note: "Désactivé pour GTM. Composant UI masqué.",
    risk: "high",
    evidence: { codeFiles: ["src/components/ai/GodModePanel.tsx"] },
  },
  {
    id: "voice_elevenlabs",
    label: "Voix ElevenLabs",
    status: "disabled",
    enabled: false, // AUDIT 16/03/2026 – BLOQUANTS LEVÉS
    confidence: "code-verified",
    area: "infrastructure",
    pages: [],
    note: "Désactivé pour GTM. Composant VoiceWelcome masqué.",
    risk: "medium",
    evidence: { edgeFunctions: ["elevenlabs-voice-token", "elevenlabs-tts"], codeFiles: ["src/components/ai/VoiceWelcome.tsx"] },
  },
  {
    id: "psd2_banking",
    label: "Connexion bancaire PSD2",
    status: "disabled",
    enabled: false, // AUDIT 16/03/2026 – BLOQUANTS LEVÉS
    confidence: "code-verified",
    area: "billing",
    pages: [],
    note: "Désactivé pour GTM. Edge function bank-webhook bloquée.",
    risk: "high",
    evidence: { edgeFunctions: ["bank-webhook"] },
  },
  {
    id: "live_cash_flow",
    label: "Live Cash Flow",
    status: "disabled",
    enabled: false, // AUDIT 16/03/2026 – BLOQUANTS LEVÉS
    confidence: "declared",
    area: "billing",
    pages: [],
    note: "Désactivé pour GTM. Jamais implémenté côté client.",
    risk: "high",
    evidence: {},
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

/** Features actives (enabled = true) */
export function getEnabledFeatures(): FeatureEntry[] {
  return FEATURE_REGISTRY.filter(f => f.enabled);
}

/** Features désactivées pour le GTM */
export function getDisabledFeatures(): FeatureEntry[] {
  return FEATURE_REGISTRY.filter(f => !f.enabled);
}

export const STATUS_META: Record<FeatureStatus, { label: string; color: string; bg: string }> = {
  real:      { label: "Réel",         color: "hsl(var(--success))",         bg: "hsl(var(--success-light))" },
  partial:   { label: "Partiel",      color: "hsl(38 80% 30%)",             bg: "hsl(var(--accent-light))" },
  mock:      { label: "Mock",         color: "hsl(0 65% 40%)",              bg: "hsl(0 65% 95%)" },
  dead:      { label: "Non branché",  color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
  "env-dep": { label: "Dépend env",  color: "hsl(218 72% 55%)",            bg: "hsl(218 72% 95%)" },
  disabled:  { label: "Désactivé",   color: "hsl(0 65% 40%)",              bg: "hsl(0 65% 95%)" },
};

export const CONFIDENCE_META: Record<FeatureConfidence, { label: string; color: string; bg: string; short: string }> = {
  declared:           { label: "Déclaré",          short: "D",  color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
  "code-verified":    { label: "Code vérifié",     short: "CV", color: "hsl(218 72% 55%)",            bg: "hsl(218 72% 95%)" },
  "runtime-verified": { label: "Runtime vérifié",  short: "RV", color: "hsl(var(--success))",         bg: "hsl(var(--success-light))" },
};
