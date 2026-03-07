# OPENCLAW TRUTH MANIFEST
> Version: 2026-03-07 | Source: audited from actual repo files.

---

## 1. PAGES OPENCLAW RÉELLES

| Page | Route | Statut |
|------|-------|--------|
| `src/pages/Agents.tsx` | `/agents` | Live — Agent OS, config autonomie, kill switch |
| `src/pages/Dossier.tsx` | `/dossier` | Live — Dossier stratégique AI, sync openclaw |
| `src/pages/Validations.tsx` | `/validations` | Live — Actions à valider, channel actions backlog |
| `src/pages/Operations.tsx` | `/operations` | Live — Runtime complet, queue, jobs, channels, heartbeats |
| `src/pages/WarRoom.tsx` | `/war-room` | Live — Centre de commandement, cron proof, smoke test |

---

## 2. HOOKS OPENCLAW RÉELS

| Hook | Fichier | Rôle |
|------|---------|------|
| useOpenClaw | `src/hooks/useOpenClaw.ts` | Config utilisateur, agents, kill switch global |
| useOpenClawRuntime | `src/hooks/useOpenClawRuntime.ts` | Runtime global : channels, agents, sessions, jobs actifs |
| useOpenClawRuns | `src/hooks/useOpenClawRuns.ts` | Sessions runtime, brain runs, metadata |
| useOpenClawExecutions | `src/hooks/useOpenClawExecutions.ts` | Job executions, output tracking |
| useOpenClawScheduler | `src/hooks/useOpenClawScheduler.ts` | Job queue (openclaw_job_queue), claim/complete |
| useOpenClawChannelActions | `src/hooks/useOpenClawChannelActions.ts` | Channel actions generées, approval flow |
| useOpenClawScheduledRuns | `src/hooks/useOpenClawScheduledRuns.ts` | Scheduled runs, heartbeats, SCHEDULE_PLAN, CRON_JOBS_PROOF |
| useOpenClawCronDiagnostic | `src/hooks/useOpenClawCronDiagnostic.ts` | Registre cron (CRON_REGISTRY), diagnostic cross repo/base |

---

## 3. EDGE FUNCTIONS OPENCLAW RÉELLES

| Fonction | Chemin | Rôle | verify_jwt |
|----------|--------|------|-----------|
| openclaw-scheduler | `supabase/functions/openclaw-scheduler/` | Batch scheduler : claim + dispatch jobs | false |
| openclaw-job-executor | `supabase/functions/openclaw-job-executor/` | Exécute un job de la queue | false |
| openclaw-event-bus | `supabase/functions/openclaw-event-bus/` | Reçoit events DB triggers, enqueue jobs | false |
| openclaw-channel-probe | `supabase/functions/openclaw-channel-probe/` | Probe santé des canaux | false |
| openclaw-gateway | `supabase/functions/openclaw-gateway/` | Gateway vers infra externe (config par user) | false |
| openclaw-healthcheck | `supabase/functions/openclaw-healthcheck/` | Healthcheck global | false |
| openclaw-kill-switch | `supabase/functions/openclaw-kill-switch/` | Arrêt d'urgence global | false |
| openclaw-validate | `supabase/functions/openclaw-validate/` | Validation actions canaux | false |
| openclaw-status | `supabase/functions/openclaw-status/` | Statut runtime | false |
| openclaw-dossier-sync | `supabase/functions/openclaw-dossier-sync/` | Sync dossier stratégique | false |
| openclaw-generate | `supabase/functions/openclaw-generate/` | Génération AI (briefs, actions) | false |
| openclaw-generate-packs | `supabase/functions/openclaw-generate-packs/` | Génération packs messages | false |
| openclaw-smoke-test | `supabase/functions/openclaw-smoke-test/` | Smoke test end-to-end autonomie | false |

---

## 4. TABLES OPENCLAW RÉELLES

| Table | Rôle | RLS |
|-------|------|-----|
| openclaw_agents | Agents autonomes par user | user_id = auth.uid() |
| openclaw_briefs | Briefs matinaux générés | user_id = auth.uid() |
| openclaw_channel_actions | Actions canaux préparées / validées | user_id = auth.uid() |
| openclaw_channels | Configuration canaux | user_id = auth.uid() |
| openclaw_config | Config autonomie, kill switch | user_id = auth.uid() |
| openclaw_cron_status | Vue diagnostic cron (VIEW read-only) | pas de RLS (vue) |
| openclaw_dossier | Dossier stratégique | user_id = auth.uid() |
| openclaw_job_executions | Exécutions jobs avec outputs | user_id = auth.uid() |
| openclaw_job_queue | File d'attente jobs (claim/complete) | user_id = auth.uid() |
| openclaw_scheduled_runs | Runs schedulés tracés | select public, insert public |
| openclaw_scheduler_heartbeats | Heartbeats scheduler global | insert public (user_id nullable) |

---

## 5. CE QUI EST LIVE RUNTIME

- **scheduler_tick** (pg_cron jobid:4, `*/5 * * * *`) → appelle `openclaw-scheduler` → écrit dans `openclaw_scheduled_runs` + `openclaw_scheduler_heartbeats`
- **Job queue** (`openclaw_job_queue`) → jobs en `pending` claimés par `openclaw-job-executor` → écriture dans `openclaw_job_executions`
- **Event bus triggers** (5 tables) → DB triggers appellent `openclaw-event-bus` → enqueue jobs automatiques
- **Channel probe** → `openclaw-channel-probe` → update `openclaw_channels.status`
- **Kill switch** → `openclaw_config.kill_switch_global` + `openclaw_agents.kill_switch` → stoppe tous les jobs

---

## 6. CE QUI EST CONFIG-ONLY (présent mais non encore observé)

- `daily_sweep` (pg_cron jobid:5, `0 7 * * *`) : configuré, pas encore observé hors fenêtre 7h UTC
- `weekly_sweep` (pg_cron jobid:6, `0 6 * * 1`) : configuré, jamais observé (lundi 6h UTC)
- `openclaw-generate` / `openclaw-generate-packs` : fonctions déployées, appelées dans offer pack flow, non encore testées en production sur volume réel

---

## 7. CE QUI EST MODE DÉGRADÉ

Si `openclaw_config.is_connected = false` ou `kill_switch_global = true` :
- Aucun job n'est dispatché
- Le scheduler tourne mais produit 0 jobs
- L'UI affiche l'état dégradé dans `/operations` et `/war-room`

---

## 8. CE QUI DÉPEND DU GATEWAY

`openclaw-gateway` est une edge function présente et déployée.  
Elle est activée uniquement si l'utilisateur a configuré `gateway_url` + `gateway_secret` dans sa table `openclaw_config`.  
Sans cette config, le mode autonome reste en mode interne (scheduler + job_executor directs).

---

## 9. CE QUI DÉPEND DE L'UTILISATEUR / AUTH / DATA RÉELLE

- `openclaw_dossier` : doit être rempli par l'utilisateur pour que les jobs métier soient pertinents
- `openclaw_channels` : doit avoir au moins 1 canal configuré + probed pour que le job `channel_action` produise des effets
- `openclaw_agents` : agents créés via `/agents`, activés manuellement
- Jobs métier (radar_scan, daily_brief_generate, etc.) : produisent des outputs uniquement si la data utilisateur (contacts, missions, introductions) est présente

---

## 10. TYPES DE JOBS MÉTIER SUPPORTÉS

1. `radar_scan` — Scan Deal Radar
2. `hot_opportunity_rescore` — Rescore opportunités chaudes
3. `daily_brief_generate` — Génération brief quotidien
4. `trust_recompute` — Recalcul scores de confiance
5. `approval_reminder` — Rappel actions en attente
6. `next_best_action_generate` — Génération prochaine action
7. `stuck_pipeline_recheck` — Détection pipeline bloqué
8. `facilitator_match_refresh` — Refresh matching facilitateurs
9. `passive_offer_refresh` — Refresh offres passives
10. `passive_alert_digest` — Digest alertes passif
