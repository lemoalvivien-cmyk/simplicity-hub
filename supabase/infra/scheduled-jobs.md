# Scheduled Jobs — WIINUP MAX
> Version: 2026-03-09 | Statut: INFRA DOCUMENTÉE — NON PROUVÉE PAR EXÉCUTION EN BASE

---

## VÉRITÉ HONNÊTE

Ces jobs utilisent `pg_cron` + `pg_net`. Ils **ne peuvent pas être versionnés dans une migration standard**
car ils contiennent l'URL du projet et la clé anon (spécifiques à l'environnement).

Ils sont donc créés manuellement via le script ci-dessous et documentés ici.

**Statut de preuve par job :**

| Nom du job                        | Statut repo               | Exécuté en base ?                  |
|-----------------------------------|---------------------------|------------------------------------|
| `openclaw-scheduler-tick`         | ✅ Documenté + scriptable | ✅ Observé (jobid 4, runs prouvés) |
| `openclaw-daily-sweep`            | ✅ Documenté + scriptable | ⚠️ Configuré, jamais observé       |
| `openclaw-weekly-sweep`           | ✅ Documenté + scriptable | ⚠️ Configuré, jamais observé       |
| `reactivation-daily-scan`         | ✅ Documenté + scriptable | ❌ Pas encore créé en base          |
| `payout-generation-daily`         | ✅ Documenté + scriptable | ❌ Pas encore créé en base          |

**Catégorie de preuve (vocabulaire officiel) :**
- `openclaw-scheduler-tick` → **PROUVÉ PAR EXÉCUTION**
- `openclaw-daily-sweep` / `weekly-sweep` → **BRANCHÉ MAIS NON PROUVÉ**
- `reactivation-daily-scan` → **CRÉÉ MAIS NON BRANCHÉ** (script disponible, pas encore exécuté)
- `payout-generation-daily` → **CRÉÉ MAIS NON BRANCHÉ** (script disponible, pas encore exécuté)

---

## Extensions requises

```sql
-- Vérifier que les extensions sont actives avant de créer les jobs
SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('pg_cron', 'pg_net');
-- Attendu : pg_cron 1.6.4+, pg_net 0.19.5+
```

---

## Jobs OpenClaw (existants — voir cron-jobs.md pour détail)

Référence complète : `supabase/infra/cron-jobs.md`

---

## Job : reactivation-daily-scan

**Fonction appelée :** `scan_reactivation_candidates()`
**Schedule :** `0 3 * * *` (03:00 UTC chaque jour)
**Dépendances :** table `reactivation_jobs`, table `profiles`, `missions`, `introductions`
**Idempotence :** `ON CONFLICT DO NOTHING` dans la fonction DB

### Vérifier que le job n'existe pas déjà

```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'reactivation-daily-scan';
```

### Créer le job (idempotent)

**IMPORTANT :** Remplacer `YOUR_PROJECT_REF` et `YOUR_ANON_KEY` par les vraies valeurs.
Ne jamais committer ces valeurs dans le repo.

```sql
-- Supprimer si déjà présent (idempotence)
SELECT cron.unschedule('reactivation-daily-scan')
FROM cron.job
WHERE jobname = 'reactivation-daily-scan';

-- Créer le job
SELECT cron.schedule(
  'reactivation-daily-scan',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/openclaw-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"trigger_source": "cron", "run_key": "reactivation_scan"}'::jsonb
  ) AS request_id;
  $$
);
```

**Alternative — appel direct via SQL (sans edge function) :**

```sql
SELECT cron.schedule(
  'reactivation-daily-scan-direct',
  '0 3 * * *',
  $$ SELECT public.scan_reactivation_candidates(); $$
);
```

L'alternative SQL directe est plus simple mais ne laisse pas de trace dans `openclaw_scheduled_runs`.

---

## Job : payout-generation-daily

**Fonction appelée :** `generate_payouts_from_validated_gains()`
**Schedule :** `0 4 * * *` (04:00 UTC chaque jour, après le scan réactivation)
**Dépendances :** table `gains` (statut valide/recu), table `payouts`
**Idempotence :** `NOT EXISTS (SELECT 1 FROM payouts WHERE gain_id = g.id)` dans la fonction DB

### Vérifier que le job n'existe pas déjà

```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'payout-generation-daily';
```

### Créer le job (idempotent — appel SQL direct)

```sql
-- Supprimer si déjà présent (idempotence)
SELECT cron.unschedule('payout-generation-daily')
FROM cron.job
WHERE jobname = 'payout-generation-daily';

-- Créer le job — appel SQL direct (pas de dépendance edge function)
SELECT cron.schedule(
  'payout-generation-daily',
  '0 4 * * *',
  $$ SELECT public.generate_payouts_from_validated_gains(); $$
);
```

---

## Script de vérification (read-only, safe en prod)

```sql
-- Lister tous les jobs planifiés wiinup
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN (
  'openclaw-scheduler-tick',
  'openclaw-daily-sweep',
  'openclaw-weekly-sweep',
  'reactivation-daily-scan',
  'reactivation-daily-scan-direct',
  'payout-generation-daily'
)
ORDER BY jobid;
```

---

## Script de suppression complète (si reset nécessaire)

```sql
DO $$
DECLARE
  job_name text;
BEGIN
  FOREACH job_name IN ARRAY ARRAY[
    'openclaw-scheduler-tick',
    'openclaw-daily-sweep',
    'openclaw-weekly-sweep',
    'reactivation-daily-scan',
    'reactivation-daily-scan-direct',
    'payout-generation-daily'
  ] LOOP
    PERFORM cron.unschedule(job_name)
    FROM cron.job WHERE jobname = job_name;
  END LOOP;
END $$;
```

---

## Déclenchement manuel (sans cron)

Les deux fonctions peuvent être appelées manuellement :

**Via l'admin UI :**
- `/admin/reactivation` → bouton "Lancer le scan maintenant" → appelle `scan_reactivation_candidates()`
- `/admin/payout-ops` → bouton "Générer depuis gains validés" → appelle `generate_payouts_from_validated_gains()`

**Via SQL direct :**
```sql
-- Scan réactivation
SELECT public.scan_reactivation_candidates();

-- Génération payouts
SELECT public.generate_payouts_from_validated_gains();
```

---

## Limites honnêtes

1. Les jobs cron pour `reactivation` et `payout` ne sont pas encore créés en base de production.
   Ce document fournit les scripts pour les créer.
2. Le déclenchement via edge function (`openclaw-scheduler`) pour `reactivation_scan` n'a pas été
   testé — l'alternative SQL directe est recommandée pour ces deux jobs.
3. Sans cron actif, les deux fonctions doivent être déclenchées manuellement via l'UI admin ou SQL.
4. `payout-generation-daily` ne crée des lignes que s'il existe des gains `valide`/`recu` sans payout.
   Sur un environnement vide, il retourne 0 créations — c'est le comportement correct.

---

## État de reproductibilité

| Élément                                    | Versionné repo    | Actif en base                       |
|--------------------------------------------|-------------------|-------------------------------------|
| `openclaw-scheduler-tick` (5min)           | ✅ cron-jobs.md   | ✅ jobid:4 (observé)                |
| `openclaw-daily-sweep` (7h UTC)            | ✅ cron-jobs.md   | ⚠️ configuré, pas observé           |
| `openclaw-weekly-sweep` (lun 6h)           | ✅ cron-jobs.md   | ⚠️ configuré, jamais observé        |
| `reactivation-daily-scan` (3h UTC)         | ✅ ce fichier     | ❌ pas encore créé en base           |
| `payout-generation-daily` (4h UTC)         | ✅ ce fichier     | ❌ pas encore créé en base           |
| `scan_reactivation_candidates()` (RPC)     | ✅ migration DB   | ✅ appelable (UI + SQL)             |
| `generate_payouts_from_validated_gains()`  | ✅ migration DB   | ✅ appelable (UI + SQL)             |
