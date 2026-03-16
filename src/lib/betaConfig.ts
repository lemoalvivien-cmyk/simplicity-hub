/**
 * ═══════════════════════════════════════════════════════════════
 *  WIINUP MAX — BÊTA PRIVÉE / LANCEMENT PUBLIC
 *  Fichier de configuration unique pour basculer entre les modes.
 * ═══════════════════════════════════════════════════════════════
 *
 *  ┌─────────────────────────────────────────────────────────┐
 *  │  👉 OUVRIR AU PUBLIC — CHANGE ICI                       │
 *  │                                                         │
 *  │  CLOSED_BETA = true   → bêta privée (liste d'attente)  │
 *  │  CLOSED_BETA = false  → site public (CTAs actifs)       │
 *  │                                                         │
 *  │  Après avoir mis false :                                │
 *  │  1. Vérifier launch_quota.total_slots = 100 en DB       │
 *  │  2. Publier via Lovable → Update                        │
 *  └─────────────────────────────────────────────────────────┘
 */

// ── TOGGLE PRINCIPAL ────────────────────────────────────────────
export const CLOSED_BETA = true; // 👈 OUVRIR AU PUBLIC : mettre false ici

// ── Paramètres bêta ─────────────────────────────────────────────
/** Places max en bêta privée (indépendant du quota public 100) */
export const BETA_MAX_SLOTS = 50;

/** Nombre total de places au lancement public */
export const PUBLIC_MAX_SLOTS = 100;

// ── Textes affichés en mode bêta ────────────────────────────────
export const BETA_MESSAGE = {
  headline: "Accès fermé — Bêta privée en cours",
  body: "Nous accueillons nos 50 premiers membres en privé. Laissez votre email pour être prévenu dès l'ouverture.",
  cta: "Me prévenir à l'ouverture",
  confirmation: "C'est noté — vous serez parmi les premiers prévenus !",
  disclaimer: "Aucun spam. Désabonnement en un clic.",
} as const;
