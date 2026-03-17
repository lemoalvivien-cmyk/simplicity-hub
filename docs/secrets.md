# WiinupMax — Gestion des secrets

## Secrets requis (Supabase Dashboard → Edge Functions → Secrets)

| Nom | Description | Sensibilité |
|-----|-------------|-------------|
| STRIPE_SECRET_KEY | Clé secrète Stripe API | CRITIQUE |
| STRIPE_WEBHOOK_SECRET | Secret de signature webhook Stripe | CRITIQUE |
| STRIPE_PRICE_LAUNCH | Price ID du Founder Pass | NORMALE |
| INTERNAL_FUNCTION_SECRET | Secret inter-functions internes | HAUTE |
| CRON_SECRET | Secret pour le cron de réactivation | HAUTE |
| RESEND_API_KEY | Clé API Resend (emails transactionnels) | HAUTE |

## Variables d'environnement publiques (VITE_ — côté client uniquement)

| Nom | Description |
|-----|-------------|
| VITE_SUPABASE_URL | URL du projet Supabase |
| VITE_SUPABASE_PUBLISHABLE_KEY | Clé anon publique Supabase |

NE JAMAIS mettre un secret dans une variable VITE_.

## Procédure de rotation

1. Générer le nouveau secret dans le service (Stripe, Resend, etc.)
2. Ajouter le nouveau dans Supabase AVANT de révoquer l'ancien
3. Tester en staging
4. Révoquer l'ancien secret
5. Documenter la rotation avec la date dans ce fichier

## Accès production

Seul Vivien Le Moal (VLM Consulting) a accès aux secrets de production.
Authentification 2FA obligatoire sur le Supabase Dashboard.
