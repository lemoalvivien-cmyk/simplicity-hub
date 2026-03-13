/**
 * Eternal Insights API — Pricing Tiers
 * Single source of truth — Stripe products créés en production
 * Starter  : prod_U8rcPj1zosK0Il / price_1TAZtcEG497aCUFxwh0VeybE
 * Growth   : prod_U8pBP1dIGQGAQt / price_1TAXWrEG497aCUFx0RIcS86w
 * Enterprise: prod_U8rc4bW6nlPiOm / price_1TAZtdEG497aCUFx4zXpjBs0
 */

export const INSIGHTS_PRICING = {
  starter: {
    price_id:      "price_1TAZtcEG497aCUFxwh0VeybE",
    product_id:    "prod_U8rcPj1zosK0Il",
    amount:        15000,
    label:         "15 000 € / mois",
    monthly_limit: 10_000,
    description:   "Pour les fonds émergents et les banques régionales",
    signals: [
      "Probabilités de deals en temps réel",
      "Patterns sectoriels (25 signaux/requête)",
      "Timing de contact optimal",
      "API REST + Webhook basique",
    ],
    rate_limit: "120 req/min",
    sla:        "99,5 %",
    tier_key:   "starter" as const,
  },
  growth: {
    // Growth conserve les IDs précédents (produit existant)
    price_id:      "price_1TAXWrEG497aCUFx0RIcS86w",
    product_id:    "prod_U8pBP1dIGQGAQt",
    amount:        35000,
    label:         "35 000 € / mois",
    monthly_limit: 50_000,
    description:   "Pour les banques d'affaires et corporates",
    signals: [
      "Tout Starter +",
      "Liens latents (hidden links) inter-réseaux",
      "Corridors cross-market & cross-sectoriels",
      "Prédictions 6-12 semaines haute précision",
      "50 signaux/requête · 50k req/mois",
    ],
    rate_limit: "300 req/min",
    sla:        "99,8 %",
    tier_key:   "growth" as const,
  },
  enterprise: {
    price_id:      "price_1TAZtdEG497aCUFx4zXpjBs0",
    product_id:    "prod_U8rc4bW6nlPiOm",
    amount:        75000,
    label:         "75 000 € / mois",
    monthly_limit: Infinity,
    description:   "Pour les fonds souverains, grandes banques et hedge funds",
    signals: [
      "Tout Growth +",
      "Graph complet temps réel (illimité)",
      "Modèle LoRA dédié fine-tuné sur vos données",
      "Webhooks prioritaires + streaming",
      "SLA 99,9 % · Support dédié 24/7",
      "Intégration Bloomberg / Refinitiv sur demande",
    ],
    rate_limit: "Illimité",
    sla:        "99,9 %",
    tier_key:   "enterprise" as const,
  },
} as const;

export type InsightsTier = keyof typeof INSIGHTS_PRICING;
