# EDGE FUNCTIONS MANIFEST
> Version: 2026-03-07 | Source: supabase/functions/ (audité fichier par fichier) + supabase/config.toml

---

## FONCTIONS DE PAIEMENT

### create-checkout
- **Chemin** : `supabase/functions/create-checkout/`
- **Rôle** : Crée une session Stripe Checkout
- **verify_jwt** : false
- **Appelé par** : `src/pages/Checkout.tsx`, `src/pages/Pricing.tsx`
- **Secrets requis** : `STRIPE_SECRET_KEY`
- **État** : Production

### check-subscription
- **Chemin** : `supabase/functions/check-subscription/`
- **Rôle** : Vérifie le statut d'abonnement Stripe de l'utilisateur
- **verify_jwt** : false
- **Appelé par** : `src/contexts/SubscriptionContext.tsx`
- **Secrets requis** : `STRIPE_SECRET_KEY`
- **État** : Production

### customer-portal
- **Chemin** : `supabase/functions/customer-portal/`
- **Rôle** : Accès au portail client Stripe (gestion abonnement)
- **verify_jwt** : false
- **Appelé par** : `src/pages/Account.tsx`
- **Secrets requis** : `STRIPE_SECRET_KEY`
- **État** : Production

### stripe-webhook
- **Chemin** : `supabase/functions/stripe-webhook/`
- **Rôle** : Reçoit et traite les webhooks Stripe (paiement, résiliation, etc.)
- **verify_jwt** : false
- **Appelé par** : Stripe (webhook externe)
- **Secrets requis** : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **État** : Production

### redeem-promo
- **Chemin** : `supabase/functions/redeem-promo/`
- **Rôle** : Valide et applique un code promotionnel
- **verify_jwt** : false
- **Appelé par** : `src/components/landing/PromoCodeSection.tsx`
- **Secrets requis** : —
- **État** : Production

---

## FONCTIONS IA & VOIX

### elevenlabs-voice-token
- **Chemin** : `supabase/functions/elevenlabs-voice-token/`
- **Rôle** : Génère un token temporaire ElevenLabs pour TTS/voix
- **verify_jwt** : false
- **Appelé par** : `src/components/ai/VoiceWelcome.tsx`
- **Secrets requis** : `ELEVENLABS_API_KEY`
- **État** : Production

### deal-radar-score
- **Chemin** : `supabase/functions/deal-radar-score/`
- **Rôle** : Score IA d'une opportunité Deal Radar
- **verify_jwt** : false
- **Appelé par** : `src/pages/Radar.tsx`
- **Secrets requis** : Lovable AI (pas de clé externe)
- **État** : Production

### track-click
- **Chemin** : `supabase/functions/track-click/`
- **Rôle** : Tracking clics sur liens de partage (offer_share_links)
- **verify_jwt** : false
- **Appelé par** : Links publics (externe)
- **Secrets requis** : —
- **État** : Production

---

## FONCTIONS OPENCLAW — ORCHESTRATION

### openclaw-scheduler
- **Chemin** : `supabase/functions/openclaw-scheduler/`
- **Rôle** : Batch scheduler : claim jobs en attente, dispatch vers job-executor, écriture heartbeat + scheduled_run
- **verify_jwt** : false
- **Appelé par** : pg_cron (jobid:4,5,6), smoke test, manuellement depuis UI
- **Secrets requis** : —
- **État** : Production — ACTIF (scheduler_tick observé toutes les 5min)

### openclaw-job-executor
- **Chemin** : `supabase/functions/openclaw-job-executor/`
- **Rôle** : Exécute un job spécifique de la queue (10 types métier)
- **verify_jwt** : false
- **Appelé par** : openclaw-scheduler
- **Secrets requis** : Lovable AI (models internes)
- **État** : Production

### openclaw-event-bus
- **Chemin** : `supabase/functions/openclaw-event-bus/`
- **Rôle** : Reçoit les events des triggers DB, enqueue les jobs correspondants
- **verify_jwt** : false
- **Appelé par** : DB triggers sur missions, offers, introductions, gains, disputes
- **Secrets requis** : —
- **État** : Production — triggers actifs

### openclaw-channel-probe
- **Chemin** : `supabase/functions/openclaw-channel-probe/`
- **Rôle** : Teste la santé d'un canal configuré, met à jour openclaw_channels.status
- **verify_jwt** : false
- **Appelé par** : `src/pages/Canaux.tsx`, `src/hooks/useOpenClawChannelActions.ts`
- **Secrets requis** : —
- **État** : Production

### openclaw-smoke-test
- **Chemin** : `supabase/functions/openclaw-smoke-test/`
- **Rôle** : Test end-to-end du mode autonome : force un cycle scheduler_tick, vérifie heartbeat + scheduled_run
- **verify_jwt** : false
- **Appelé par** : UI bouton dans `/war-room` et `/operations`
- **Secrets requis** : —
- **État** : Production

---

## FONCTIONS OPENCLAW — OPÉRATIONS

### openclaw-gateway
- **Chemin** : `supabase/functions/openclaw-gateway/`
- **Rôle** : Gateway vers infrastructure externe (si configurée par l'utilisateur)
- **verify_jwt** : false
- **Appelé par** : `src/hooks/useOpenClaw.ts` (si gateway_url configurée)
- **Secrets requis** : `gateway_url` + `gateway_secret` dans openclaw_config (par user)
- **État** : Production — **env-dépendant** (inactif sans config utilisateur)

### openclaw-healthcheck
- **Chemin** : `supabase/functions/openclaw-healthcheck/`
- **Rôle** : Healthcheck global OpenClaw, met à jour openclaw_config.healthcheck_status
- **verify_jwt** : false
- **Appelé par** : `src/pages/Agents.tsx`, `src/hooks/useOpenClaw.ts`
- **Secrets requis** : —
- **État** : Production

### openclaw-kill-switch
- **Chemin** : `supabase/functions/openclaw-kill-switch/`
- **Rôle** : Arrêt d'urgence global : kill_switch_global = true, stoppe tous les agents
- **verify_jwt** : false
- **Appelé par** : `src/pages/Agents.tsx` (bouton kill switch)
- **Secrets requis** : —
- **État** : Production

### openclaw-validate
- **Chemin** : `supabase/functions/openclaw-validate/`
- **Rôle** : Valide une action canal depuis la page /validations
- **verify_jwt** : false
- **Appelé par** : `src/pages/Validations.tsx`
- **Secrets requis** : —
- **État** : Production

### openclaw-status
- **Chemin** : `supabase/functions/openclaw-status/`
- **Rôle** : Retourne le statut runtime OpenClaw complet
- **verify_jwt** : false
- **Appelé par** : `src/hooks/useOpenClawRuntime.ts`
- **Secrets requis** : —
- **État** : Production

### openclaw-dossier-sync
- **Chemin** : `supabase/functions/openclaw-dossier-sync/`
- **Rôle** : Synchronise le dossier stratégique avec le moteur OpenClaw
- **verify_jwt** : false
- **Appelé par** : `src/pages/Dossier.tsx`
- **Secrets requis** : —
- **État** : Production

### openclaw-generate
- **Chemin** : `supabase/functions/openclaw-generate/`
- **Rôle** : Génération IA générique (briefs, actions, recommandations)
- **verify_jwt** : false
- **Appelé par** : openclaw-job-executor (jobs daily_brief_generate, next_best_action_generate)
- **Secrets requis** : Lovable AI
- **État** : Production

### openclaw-generate-packs
- **Chemin** : `supabase/functions/openclaw-generate-packs/`
- **Rôle** : Génération AI des packs messages multilingues pour offer_packs
- **verify_jwt** : false
- **Appelé par** : `src/pages/OffresEntreprise.tsx`, passive OS flow
- **Secrets requis** : Lovable AI
- **État** : Production

---

## RÉSUMÉ

| Catégorie | Nb | État |
|-----------|-----|------|
| Paiement (Stripe) | 5 | Production |
| IA & Voix | 3 | Production |
| OpenClaw orchestration | 5 | Production |
| OpenClaw opérations | 8 | Production (1 env-dépendant) |
| **Total** | **21** | — |
