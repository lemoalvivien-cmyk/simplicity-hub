# OpenClaw — Cron Jobs Infra Documentation
> Version: 2026-03-07 | Status: ACTIVE IN PRODUCTION

## Vérité de déploiement

Les cron jobs OpenClaw sont enregistrés via `pg_cron` + `pg_net` dans la base Supabase.
Ils **ne peuvent pas être versionnés dans une migration standard** car ils contiennent l'URL
et la clé anon du projet (spécifiques à l'environnement).

Ils sont donc créés via `supabase--insert` (conforme aux règles du projet) et documentés ici.

## Extensions requises

```sql
-- Vérifier que les extensions sont actives
SELECT extname, extversion FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
-- Résultat attendu: pg_cron 1.6.4+, pg_net 0.19.5+
```

## Cron Jobs actifs (jobid prouvés)

| jobid | jobname                   | schedule       | run_key          | trigger_source | status |
|-------|---------------------------|----------------|------------------|----------------|--------|
| 4     | openclaw-scheduler-tick   | `*/5 * * * *`  | scheduler_tick   | cron           | ACTIVE |
| 5     | openclaw-daily-sweep      | `0 7 * * *`    | daily_sweep      | cron           | ACTIVE |
| 6     | openclaw-weekly-sweep     | `0 6 * * 1`    | weekly_sweep     | cron           | ACTIVE |

## Script de vérification (read-only, safe en prod)

```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname LIKE 'openclaw%'
ORDER BY jobid;
```

## Script de re-création idempotent

**IMPORTANT**: Remplacer `YOUR_PROJECT_REF` et `YOUR_ANON_KEY` par les vraies valeurs.
Ne jamais committer les vraies valeurs dans le repo.

```sql
-- Désactiver les doublons avant re-création
SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname IN (
  'openclaw-scheduler-tick',
  'openclaw-daily-sweep',
  'openclaw-weekly-sweep'
);

-- Tick autonome: toutes les 5 minutes
SELECT cron.schedule(
  'openclaw-scheduler-tick',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/openclaw-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"trigger_source": "cron", "run_key": "scheduler_tick"}'::jsonb
  ) AS request_id;
  $$
);

-- Sweep quotidien: tous les jours à 7h UTC
SELECT cron.schedule(
  'openclaw-daily-sweep',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/openclaw-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"trigger_source": "cron", "run_key": "daily_sweep", "max_jobs": 20}'::jsonb
  ) AS request_id;
  $$
);

-- Sweep hebdomadaire: chaque lundi à 6h UTC
SELECT cron.schedule(
  'openclaw-weekly-sweep',
  '0 6 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/openclaw-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"trigger_source": "cron", "run_key": "weekly_sweep", "max_jobs": 50}'::jsonb
  ) AS request_id;
  $$
);
```

## Preuve d'exécution réelle (2026-03-07)

Les runs suivants ont été observés en base (`openclaw_scheduled_runs`) :

| run_key         | trigger_source | status | started_at (UTC)          |
|-----------------|----------------|--------|---------------------------|
| scheduler_tick  | cron           | done   | 2026-03-07 20:05:04       |
| scheduler_tick  | cron           | done   | 2026-03-07 20:00:13       |
| scheduler_tick  | cron           | done   | 2026-03-07 19:55:05       |
| smoke_test      | manual         | done   | 2026-03-07 19:56:57       |

Ces runs prouvent que le cron **a réellement tourné** (pas seulement configuré).

## Distinction cron / manual / event

Chaque run dans `openclaw_scheduled_runs` porte :
- `trigger_source = 'cron'` → déclenché par pg_cron
- `trigger_source = 'manual'` → déclenché depuis l'UI
- `trigger_source = 'event'` → déclenché par un trigger DB

## État de reproductibilité

| Élément                          | Versionné repo | Actif en base |
|----------------------------------|----------------|---------------|
| openclaw-scheduler-tick (5min)   | ✅ ce fichier  | ✅ jobid:4    |
| openclaw-daily-sweep (7h UTC)    | ✅ ce fichier  | ✅ jobid:5    |
| openclaw-weekly-sweep (lun 6h)   | ✅ ce fichier  | ✅ jobid:6    |
| openclaw_scheduled_runs (table)  | ✅ migration   | ✅            |
| openclaw_scheduler_heartbeats    | ✅ migration   | ✅            |
| openclaw-scheduler (function)    | ✅ /functions  | ✅ déployé    |
| openclaw-smoke-test (function)   | ✅ /functions  | ✅ déployé    |
| triggers business (5 tables)     | ✅ migration   | ✅ actifs     |
| enqueue_job / claim_next_job     | ✅ migration   | ✅ actifs     |

## Limites honnêtes

- Les cron jobs contiennent la clé anon dans leur commande SQL stockée en base.
  Elle est publique (anon key) mais ne doit pas être committée en dur dans les migrations.
  C'est pourquoi ce fichier utilise des placeholders.
- Sans redéploiement manuel via le script ci-dessus, les cron jobs ne se recréent pas automatiquement sur un nouveau projet.
- Le `daily_sweep` et `weekly_sweep` n'ont pas encore tourné de façon autonome (pas observé en base)
  car ils sont à 7h UTC et lundi 6h UTC.
