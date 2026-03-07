/**
 * WIINUP MAX — Pricing Configuration
 * Single source of truth for all pricing references
 */

export const PRICING = {
  launch: {
    price_id: "price_1T8GOWEG497aCUFxjNjFjk4t",
    product_id: "prod_U6TLmOMlvvyvvQ",
    amount: 99,
    label: "99 € TTC",
    description: "Offre de lancement — 1 an d'accès",
    period: "/ an",
    slots: 100,
  },
  standard: {
    price_id: "price_1T8GR0EG497aCUFxNS9BV3ko",
    product_id: "prod_U6TNDHPiFFt1LM",
    amount: 490,
    label: "490 € TTC",
    description: "Abonnement annuel standard",
    period: "/ an",
  },
  apporteur: {
    amount: 0,
    label: "Gratuit",
    description: "Pour les apporteurs d'affaires — toujours gratuit",
    period: "",
  },
} as const;

export type PricingTier = keyof typeof PRICING;
