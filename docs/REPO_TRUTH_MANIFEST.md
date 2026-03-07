# REPO TRUTH MANIFEST
> Version: 2026-03-07 | Build: WIINUP-MAX-20260307-001  
> Source: audited from actual repo files. No marketing. No assumption.

---

## 1. PAGES RÉELLEMENT PRÉSENTES (`src/pages/`)

| Fichier | Route | Rôle |
|---------|-------|------|
| Index.tsx | `/` | Landing page publique |
| Pricing.tsx | `/pricing` | Tarification |
| Checkout.tsx | `/checkout` | Paiement Stripe |
| Login.tsx | `/login` | Authentification |
| Signup.tsx | `/signup` | Inscription |
| Onboarding.tsx | `/onboarding` | First-run flow |
| Dashboard.tsx | `/dashboard` | Alias → facilitateur |
| DashboardFacilitateur.tsx | `/dashboard/facilitateur` | Dashboard apporteur |
| DashboardEntreprise.tsx | `/dashboard/entreprise` | Dashboard entreprise |
| Pilotage.tsx | `/pilotage` | Vue globale pilotage |
| Studio.tsx | `/studio` | Builder campagnes |
| Sources.tsx | `/sources` | Sources prospection |
| Messages.tsx | `/messages` | Modèles messages |
| Regles.tsx | `/regles` | Règles automatisation |
| Canaux.tsx | `/canaux` | Configuration canaux |
| Opportunites.tsx | `/opportunites` | Pipeline opportunités |
| Contacts.tsx | `/contacts` | Liste contacts |
| ContactImport.tsx | `/contacts/import` | Import CSV contacts |
| ContactDetail.tsx | `/contacts/:id` | Détail contact |
| Listes.tsx | `/listes` | Listes de contacts |
| Campagnes.tsx | `/campagnes` | Campagnes |
| CampagneDetail.tsx | `/campagnes/:id` | Détail campagne |
| CampagneNouvelle.tsx | `/campagnes/nouvelle` | Créer campagne |
| Actions.tsx | `/actions` | Tâches à faire |
| Missions.tsx | `/missions` | Missions d'apport |
| MissionDetail.tsx | `/missions/:id` | Détail mission |
| MissionNouvelle.tsx | `/missions/nouvelle` | Créer mission |
| Introductions.tsx | `/introductions` | Introductions facilitateur |
| IntroductionDetail.tsx | `/introductions/:id` | Détail introduction |
| IntroductionsEntreprise.tsx | `/entreprise/introductions` | Introductions entreprise |
| Gains.tsx | `/gains` | Gains facilitateur |
| ProfilFacilitateur.tsx | `/profil/facilitateur` | Profil apporteur |
| ProfilEntreprise.tsx | `/profil/entreprise` | Profil entreprise |
| Agents.tsx | `/agents` | OpenClaw Agent OS |
| Dossier.tsx | `/dossier` | Dossier stratégique AI |
| Validations.tsx | `/validations` | Actions à valider |
| Operations.tsx | `/operations` | Runtime OpenClaw |
| WarRoom.tsx | `/war-room` | Centre de commandement |
| Radar.tsx | `/radar` | Deal Radar |
| Facilitateurs.tsx | `/facilitateurs` | Marketplace facilitateurs |
| FacilitateurDetail.tsx | `/facilitateurs/:id` | Profil public facilitateur |
| Signalement.tsx | `/signalement` | Signalement |
| Reseau.tsx | `/reseau` | Business graph |
| PassiveOS.tsx | `/passive` | Mode passif |
| ImportReseau.tsx | `/import-reseau` | Import réseau |
| Offres.tsx | `/offres` | Offres à partager (facilitateur) |
| OffresEntreprise.tsx | `/offres/entreprise` | Offres entreprise |
| Chaud.tsx | `/chaud` | Ce qui chauffe |
| Trust.tsx | `/trust` | Trust Engine |
| Assistant.tsx | `/assistant` | Copilot IA |
| Help.tsx | `/help` | Aide |
| Account.tsx | `/account` | Compte utilisateur |
| Install.tsx | `/install` | PWA install guide |
| Autonomie.tsx | `/autonomie` | Niveau d'autonomie |
| SystemProof.tsx | `/system-proof` | Source of truth UI |
| admin/Overview.tsx | `/admin` | Admin overview |
| admin/Users.tsx | `/admin/users` | Admin utilisateurs |
| admin/PromoCodes.tsx | `/admin/promo-codes` | Admin codes promo |
| admin/Payments.tsx | `/admin/payments` | Admin paiements |
| admin/HelpContent.tsx | `/admin/help` | Admin contenu aide |
| admin/Analytics.tsx | `/admin/analytics` | Admin analytics |
| NotFound.tsx | `*` | 404 |

---

## 2. ROUTES RÉELLEMENT DÉFINIES DANS `src/App.tsx`

Toutes les routes ci-dessus sont définies dans `src/App.tsx`.  
Routes protégées : tout sauf `/`, `/pricing`, `/checkout`, `/login`, `/signup`.  
Routes admin (adminOnly prop) : `/admin`, `/admin/users`, `/admin/promo-codes`, `/admin/payments`, `/admin/help`, `/admin/analytics`.

---

## 3. HOOKS RÉELLEMENT PRÉSENTS (`src/hooks/`)

| Fichier | Rôle |
|---------|------|
| use-mobile.tsx | Détection mobile |
| use-toast.ts | Toast notifications |
| useActivation.ts | Checklist activation first-run |
| useOpenClaw.ts | Config + agents OpenClaw |
| useOpenClawChannelActions.ts | Actions canaux (queue validation) |
| useOpenClawCronDiagnostic.ts | Registre cron + diagnostic UI |
| useOpenClawExecutions.ts | Job executions tracker |
| useOpenClawRuns.ts | Sessions runtime runs |
| useOpenClawRuntime.ts | Runtime global + channels + agents |
| useOpenClawScheduledRuns.ts | Scheduled runs + heartbeats |
| useOpenClawScheduler.ts | Job queue + scheduler |

---

## 4. EDGE FUNCTIONS RÉELLEMENT PRÉSENTES (`supabase/functions/`)

Voir `docs/EDGE_FUNCTIONS_MANIFEST.md` pour le détail.

21 fonctions présentes :
check-subscription, create-checkout, customer-portal, deal-radar-score,  
elevenlabs-voice-token, openclaw-channel-probe, openclaw-dossier-sync,  
openclaw-event-bus, openclaw-gateway, openclaw-generate-packs,  
openclaw-generate, openclaw-healthcheck, openclaw-job-executor,  
openclaw-kill-switch, openclaw-scheduler, openclaw-smoke-test,  
openclaw-status, openclaw-validate, redeem-promo, stripe-webhook, track-click.

---

## 5. TABLES CRITIQUES RÉELLEMENT PRÉSENTES (via `src/integrations/supabase/types.ts`)

| Table | Usage |
|-------|-------|
| actions | Tâches à faire |
| anti_circumvention_flags | Trust engine flags |
| billing_events | Stripe events log |
| campagnes | Campagnes prospection |
| companies | Entités entreprises |
| company_aliases | Déduplication entreprises |
| contacts | Contacts prospection |
| disputes | Litiges trust |
| entreprise_profiles | Profils entreprise |
| facilitateur_profiles | Profils facilitateur |
| facilitator_favorites | Favoris marketplace |
| facilitator_requests | Demandes entreprise→facilitateur |
| facilitator_reviews | Avis marketplace |
| gains | Gains apporteur |
| graph_edges | Business graph |
| intro_escrow | Protection introductions |
| introduction_proofs | Proof Ledger |
| introductions | Introductions |
| launch_quota | Quota lancement |
| link_events | Tracking liens |
| liste_contacts | Table de jonction listes↔contacts |
| listes | Listes de contacts |
| missions | Missions d'apport |
| offer_packs | Packs messages générés AI |
| offer_share_links | Liens de partage trackés |
| offers | Offres entreprise |
| openclaw_agents | Agents autonomes |
| openclaw_briefs | Briefs matinaux AI |
| openclaw_channel_actions | Actions canaux générées |
| openclaw_channels | Configuration canaux |
| openclaw_config | Config autonomie utilisateur |
| openclaw_cron_status | Vue diagnostic cron (VIEW) |
| openclaw_dossier | Dossier stratégique AI |
| openclaw_job_executions | Exécutions jobs |
| openclaw_job_queue | File d'attente jobs |
| openclaw_scheduled_runs | Runs schedulés tracés |
| openclaw_scheduler_heartbeats | Heartbeats scheduler |
| openclaw_sessions | Sessions runtime |
| opportunities | Pipeline opportunités |
| profiles | Profils utilisateurs |
| promo_codes | Codes promotionnels |
| shared_offers | Offres partagées passive OS |
| subscriptions | Abonnements Stripe |
| trust_scores | Scores de confiance |
| user_roles | Rôles utilisateurs (séparé de profiles) |

---

## 6. MIGRATIONS CRITIQUES (dans `supabase/migrations/`)

Les migrations ne peuvent pas être listées exhaustivement ici (elles sont en read-only).  
Les éléments créés par migration incluent :
- Toutes les tables listées ci-dessus
- RLS policies sur chaque table
- Fonctions SQL : `enqueue_job`, `claim_next_job`, `complete_queue_job`
- Triggers business sur : missions, offers, introductions, gains, disputes
- Vue `openclaw_cron_status`

---

## 7. CRON JOBS DÉFINIS DANS LE REPO

Voir `docs/CRON_RUNTIME_MANIFEST.md` pour le détail complet.  
Les 3 jobs sont documentés dans `supabase/infra/cron-jobs.md`.  
Ils ne peuvent PAS être versionnés dans des migrations standard (contiennent URL+anon key spécifiques à l'environnement).

---

## 8. CE QUI DÉPEND ENCORE DE L'ENVIRONNEMENT

- Les cron jobs pg_cron existent en base distante mais doivent être recréés manuellement sur un nouveau projet (script dans `supabase/infra/cron-jobs.md`)
- `openclaw-gateway` : nécessite que l'utilisateur configure `gateway_url` + `gateway_secret` dans son profil
- Secrets Stripe (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) : configurés dans Lovable Cloud secrets
- Secret ElevenLabs (ELEVENLABS_API_KEY) : configuré dans Lovable Cloud secrets

---

## 9. CE QUI EST PRÉPARÉ MAIS PAS ENCORE PLEINEMENT BRANCHÉ

- `/autonomie` : page existe, logique de niveau en cours de finalisation
- `openclaw-generate` + `openclaw-generate-packs` : edge functions présentes, appelées depuis le flow offer packs
- `daily_sweep` et `weekly_sweep` : jobs cron configurés, pas encore observés car dépendent des fenêtres horaires (7h UTC / lundi 6h UTC)
