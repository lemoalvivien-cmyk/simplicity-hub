# CRON RUNTIME MANIFEST
> Version: 2026-03-07 | Source: supabase/infra/cron-jobs.md + base distante

---

## VÉRITÉ HONNÊTE SUR LES CRON JOBS

### Ce qui est versionné dans le repo

`supabase/infra/cron-jobs.md` contient :
- Le script SQL idempotent de re-création des 3 jobs
- La documentation des jobids prouvés
- Les preuves d'exécution réelles observées en base

### Ce qui N'EST PAS dans les migrations standard

Les cron jobs NE PEUVENT PAS être dans `supabase/migrations/` car :
- Ils contiennent l'URL du projet (`https://usnrikl...supabase.co`)
- Ils contiennent la clé anon (publique mais spécifique à l'environnement)
- Ces valeurs ne doivent pas être committées en dur

**Conséquence honnête** : sur un nouveau projet, les cron jobs doivent être recréés manuellement via le script de `supabase/infra/cron-jobs.md`.

---

## JOBS ACTIFS

### 1. openclaw-scheduler-tick

| Propriété | Valeur |
|-----------|--------|
| Nom | `openclaw-scheduler-tick` |
| jobid | 4 (prouvé en base) |
| Schedule | `*/5 * * * *` (toutes les 5 minutes) |
| Fonction appelée | `openclaw-scheduler` |
| run_key | `scheduler_tick` |
| trigger_source | `cron` |
| Défini dans repo | ✅ `supabase/infra/cron-jobs.md` |
| Observé en base | ✅ `openclaw_scheduled_runs` (multiple runs prouvés) |
| Statut | **ACTIF ET OBSERVÉ** |
| Dépendances | `openclaw_scheduler_heartbeats`, `openclaw_scheduled_runs`, `openclaw_job_queue` |

### 2. openclaw-daily-sweep

| Propriété | Valeur |
|-----------|--------|
| Nom | `openclaw-daily-sweep` |
| jobid | 5 (prouvé en base) |
| Schedule | `0 7 * * *` (tous les jours à 07:00 UTC) |
| Fonction appelée | `openclaw-scheduler` |
| run_key | `daily_sweep` |
| trigger_source | `cron` |
| max_jobs | 20 |
| Défini dans repo | ✅ `supabase/infra/cron-jobs.md` |
| Observé en base | ⚠️ Configuré, pas encore observé (fenêtre 7h UTC) |
| Statut | **CONFIGURÉ — NON ENCORE OBSERVÉ** |

### 3. openclaw-weekly-sweep

| Propriété | Valeur |
|-----------|--------|
| Nom | `openclaw-weekly-sweep` |
| jobid | 6 (prouvé en base) |
| Schedule | `0 6 * * 1` (chaque lundi à 06:00 UTC) |
| Fonction appelée | `openclaw-scheduler` |
| run_key | `weekly_sweep` |
| trigger_source | `cron` |
| max_jobs | 50 |
| Défini dans repo | ✅ `supabase/infra/cron-jobs.md` |
| Observé en base | ⚠️ Configuré, jamais observé (lundi 6h UTC uniquement) |
| Statut | **CONFIGURÉ — JAMAIS OBSERVÉ** |

---

## DISTINCTION DES TRIGGER SOURCES

Chaque run dans `openclaw_scheduled_runs` porte un `trigger_source` :

| Valeur | Signification |
|--------|--------------|
| `cron` | Déclenché par pg_cron automatiquement |
| `manual` | Déclenché depuis l'UI par l'utilisateur |
| `event` | Déclenché par un trigger DB (missions, offers, introductions, gains, disputes) |
| `smoke_test` | Déclenché par le smoke test |

---

## EXTENSIONS REQUISES

```sql
SELECT extname, extversion FROM pg_extension 
WHERE extname IN ('pg_cron', 'pg_net');
-- Attendu: pg_cron 1.6.4+, pg_net 0.19.5+
```

---

## SCRIPT DE RE-CRÉATION IDEMPOTENT

Voir `supabase/infra/cron-jobs.md` section "Script de re-création idempotent".  
Remplacer `YOUR_PROJECT_REF` et `YOUR_ANON_KEY` par les valeurs réelles.

---

## CE QUI RESTE DÉPENDANT DE L'ENVIRONNEMENT

1. Les cron jobs sont dans la base distante Supabase (`usnriklfiagazpffsqew`)
2. Sur un fork / nouveau projet, ils doivent être recréés manuellement
3. Le `daily_sweep` et `weekly_sweep` ne peuvent être prouvés que lors de leurs fenêtres horaires respectives
