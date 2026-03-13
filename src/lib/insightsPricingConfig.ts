/**
 * Eternal Insights API — Pricing Tiers
 * Single source of truth for all licensing references
 */

export const INSIGHTS_PRICING = {
  starter: {
    price_id:    "price_1TAXWgEG497aCUFxODxTJmJN",
    product_id:  "prod_U8pBch4zxAHopM",
    amount:      15000,
    label:       "15 000 € / mois",
    monthly_limit: 10_000,
    description: "Pour les fonds émergents et les banques régionales",
    signals: [
      "Probabilités de deals en temps réel",
      "Patterns sectoriels (25 signaux/requête)",
      "Timing de contact optimal",
      "API REST + Webhook basique",
    ],
    rate_limit: "120 req/min",
    sla: "99,5 %",
    tier_key: "starter" as const,
  },
  growth: {
    price_id:    "price_1TAXWrEG497aCUFx0RIcS86w",
    product_id:  "prod_U8pBP1dIGQGAQt",
    amount:      35000,
    label:       "35 000 € / mois",
    monthly_limit: 50_000,
    description: "Pour les banques d'affaires et corporates",
    signals: [
      "Tout Starter +",
      "Liens latents (hidden links) inter-réseaux",
      "Corridors cross-market & cross-sectoriels",
      "Prédictions 6-12 semaines haute précision",
      "50 signaux/requête · 50k req/mois",
    ],
    rate_limit: "300 req/min",
    sla: "99,8 %",
    tier_key: "growth" as const,
  },
  enterprise: {
    price_id:    "price_1TAXWsEG497aCUFxE8NuNGrU",
    product_id:  "prod_U8pBk3SdzwHuL9",
    amount:      75000,
    label:       "75 000 € / mois",
    monthly_limit: Infinity,
    description: "Pour les fonds souverains, grandes banques et hedge funds",
    signals: [
      "Tout Growth +",
      "Graph complet temps réel (illimité)",
      "Modèle LoRA dédié fine-tuné sur vos données",
      "Webhooks prioritaires + streaming",
      "SLA 99,9 % · Support dédié 24/7",
      "Intégration Bloomberg / Refinitiv sur demande",
    ],
    rate_limit: "Illimité",
    sla: "99,9 %",
    tier_key: "enterprise" as const,
  },
} as const;

export type InsightsTier = keyof typeof INSIGHTS_PRICING;
