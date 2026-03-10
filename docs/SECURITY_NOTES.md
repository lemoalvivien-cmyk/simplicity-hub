# SECURITY NOTES — WIINUP MAX
> Créé le : 2026-03-10 | Auteur : Security audit — zéro fiction

---

## 1. Fichier .gitignore — Contrainte Plateforme

### Statut : NON MODIFIABLE (read-only, plateforme Lovable)

Le fichier `.gitignore` est géré exclusivement par la plateforme Lovable et ne peut pas être modifié
dans le cadre d'un projet hébergé sur Lovable Cloud.

**Ce que cela implique :**

| Fichier | Contenu réel | Risque |
|---------|-------------|--------|
| `.env` | `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` uniquement | **NUL** — clés publiques (anon key), délibérément exposées côté client |
| `.env.example` | Template sans valeurs — documentaire uniquement | Aucun |

**Ce que ce projet ne stocke JAMAIS dans `.env` :**
- `STRIPE_SECRET_KEY` → stocké dans Lovable Cloud Secrets (edge functions uniquement)
- `STRIPE_WEBHOOK_SECRET` → stocké dans Lovable Cloud Secrets
- `SUPABASE_SERVICE_ROLE_KEY` → auto-injecté par Lovable Cloud dans les edge functions, jamais dans `.env`
- `RESEND_API_KEY` → stocké dans Lovable Cloud Secrets
- `ELEVENLABS_API_KEY` → stocké dans Lovable Cloud Secrets

**Conclusion :** L'absence de `.env` dans `.gitignore` ne constitue PAS un risque de sécurité pour ce projet,
car le `.env` exposé ne contient que des clés publiques (publishable keys) conçues pour être visibles
côté client.

**Recommandation pour migration hors Lovable :** Si ce projet est exporté et hébergé sur une autre
infrastructure, ajouter immédiatement ces lignes dans `.gitignore` :
```
.env
.env.local
.env.*.local
.env.production
*.pem
*.key
```

---

## 2. CORS — Politique par type d'endpoint

### 2.1 Endpoints orientés client (browser → edge function)

Fonctions : `create-checkout`, `check-subscription`, `customer-portal`, `redeem-promo`,
`ai-prospection`, `ai-lead-scoring`, `ai-matching`, `ai-opportunity-analysis`

**Politique appliquée :**
- `Access-Control-Allow-Origin` est **dynamique** — autorise uniquement les origines connues du projet
- Origines autorisées : `https://wiinupmax.com`, `https://wiinupmax.lovable.app`,
  preview Lovable, `http://localhost:*`
- Toute autre origine reçoit une réponse sans header `Access-Control-Allow-Origin` (bloquée par le navigateur)

### 2.2 Endpoint server-to-server (Stripe → edge function)

Fonction : `stripe-webhook`

**Politique appliquée :**
- CORS **entièrement supprimé** — ce endpoint est appelé par les serveurs Stripe, pas par un navigateur
- Les requêtes `OPTIONS` reçoivent une réponse `405 Method Not Allowed`
- La sécurité est assurée par la vérification de signature HMAC (`stripe-signature` header)

---

## 3. TypeScript strictNullChecks

### Statut : ACTIVÉ depuis 2026-03-10

`strictNullChecks: true` est activé dans `tsconfig.app.json`.

Les 10 erreurs critiques identifiées ont été corrigées (voir `tsconfig.app.json` commentaires).
Les erreurs restantes de faible criticité sont listées en TODO dans les fichiers concernés.

**Impact :** Prévention des erreurs de type `Cannot read properties of null/undefined` au runtime.

---

## 4. Variables d'environnement — Architecture des secrets

```
┌─────────────────────────────────────────────────────┐
│  CÔTÉ CLIENT (navigateur)                            │
│  .env → VITE_SUPABASE_URL (public)                   │
│       → VITE_SUPABASE_PUBLISHABLE_KEY (public)       │
│  Ces valeurs sont DÉLIBÉRÉMENT publiques.            │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  EDGE FUNCTIONS (Lovable Cloud — serveur isolé)      │
│  Secrets injectés par la plateforme :                │
│  → STRIPE_SECRET_KEY           (privé)               │
│  → STRIPE_WEBHOOK_SECRET       (privé)               │
│  → SUPABASE_SERVICE_ROLE_KEY   (privé, auto-injecté) │
│  → RESEND_API_KEY              (privé)               │
│  → ELEVENLABS_API_KEY          (privé)               │
│  → LOVABLE_API_KEY             (privé, auto-injecté) │
│  Ces valeurs ne quittent JAMAIS le serveur.          │
└─────────────────────────────────────────────────────┘
```

---

*Dernière mise à jour : 2026-03-10*
*Ce document est la source de vérité pour les contraintes de sécurité liées à la plateforme.*
