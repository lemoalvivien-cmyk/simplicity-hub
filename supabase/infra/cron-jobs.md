# OpenClaw — Cron Jobs Infra Documentation
> Version: 2026-03-15 | Status: ACTIVE IN PRODUCTION

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

## Script de re-création idempotent — OpenClaw

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

---

## 🔐 process-pending-payouts — Authentification obligatoire

> **BREAKING CHANGE (2026-03-15)**: La fonction `process-pending-payouts` n'accepte plus
> les appels sans authentification. Tout appel anonyme reçoit un **403 Forbidden immédiat**.
> Le code `isCron` qui bypassait la vérification a été **supprimé définitivement**.

### Deux chemins d'authentification valides

| Chemin | Qui | Header obligatoire | Valeur |
|--------|-----|--------------------|--------|
| Admin humain | Utilisateur admin | `Authorization` | `Bearer <JWT>` |
| pg_cron automatique | pg_net | `x-cron-secret` | Secret `CRON_SECRET` |

### Créer le cron payout avec le header x-cron-secret

```sql
-- IMPORTANT: Remplacer YOUR_PROJECT_REF et YOUR_CRON_SECRET_VALUE
-- YOUR_CRON_SECRET_VALUE = valeur configurée dans Lovable Cloud > Secrets > CRON_SECRET
-- NE JAMAIS committer cette valeur dans le repo.

SELECT cron.unschedule('payout-generation-daily')
FROM cron.job
WHERE jobname = 'payout-generation-daily';

SELECT cron.schedule(
  'payout-generation-daily',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-pending-payouts',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "YOUR_CRON_SECRET_VALUE"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

### Ce qui se passe en cas d'appel non authentifié

```
HTTP 403 Forbidden
{"error": "Forbidden — authentication required"}
```

**Aucune logique Stripe n'est atteinte. Zéro fail-open.**

### Audit log pré-transfer

Avant chaque `stripe.transfers.create()`, un enregistrement `payout_audit_log` est inséré avec :
- `action: "transfer_initiated"`
- `actor_id` : UUID de l'admin ou `"cron"`
- `note` : chemin d'auth utilisé (`admin_jwt` ou `cron_secret`), montant, destination

---

## Preuve d'exécution réelle (2026-03-07)

Les runs suivants ont été observés en base (`openclaw_scheduled_runs`) :

| run_key         | trigger_source | status | started_at (UTC)          |
|-----------------|----------------|--------|---------------------------|
| scheduler_tick  | cron           | done   | 2026-03-07 20:05:04       |
| scheduler_tick  | cron           | done   | 2026-03-07 20:00:13       |
| scheduler_tick  | cron           | done   | 2026-03-07 19:55:05       |
| smoke_test      | manual         | done   | 2026-03-07 19:56:57       |

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
| payout-generation-daily (4h UTC) | ✅ ce fichier  | ⚠️ recréer avec x-cron-secret |
| openclaw_scheduled_runs (table)  | ✅ migration   | ✅            |
| openclaw_scheduler_heartbeats    | ✅ migration   | ✅            |
| openclaw-scheduler (function)    | ✅ /functions  | ✅ déployé    |
| process-pending-payouts          | ✅ /functions  | ✅ déployé — auth obligatoire |

## Limites honnêtes

- Les cron jobs contiennent la clé anon dans leur commande SQL stockée en base.
  Elle est publique (anon key) mais ne doit pas être committée en dur dans les migrations.
  C'est pourquoi ce fichier utilise des placeholders.
- Le `CRON_SECRET` pour `process-pending-payouts` est un secret **privé** — ne jamais le mettre dans ce fichier avec sa vraie valeur.
- Sans redéploiement manuel via le script ci-dessus, les cron jobs ne se recréent pas automatiquement sur un nouveau projet.
