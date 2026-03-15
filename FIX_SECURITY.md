# 🔥 URGENT - FIX SÉCURITÉ .env (2 minutes max, zéro connaissance technique requise)

Le fichier .env est encore visible sur GitHub → tes clés Stripe/Supabase/OpenAI sont publiques ! Danger.

## Fais ces 4 étapes simples dans VS Code :

1. Ouvre le projet WiinupMax dans VS Code

2. Dans l'explorateur à gauche : clique droit sur le fichier `.env` → "Delete" (supprime-le)

3. Ouvre le terminal en bas (Ctrl + `)

4. Colle ces 4 lignes **UNE PAR UNE** (appuie sur Entrée après chaque ligne) :

```bash
git rm --cached .env
git add .gitignore
git commit -m "SECURITY: remove .env from git history forever"
git push
```

Une fois fait, va sur https://github.com/lemoalvivien-cmyk/simplicity-hub et vérifie que `.env` a disparu.

**Fais-le MAINTENANT avant de continuer le développement.**

---

## 🔐 CRON_SECRET — Sécurité process-pending-payouts

La fonction `process-pending-payouts` n'accepte **aucun appel non authentifié**.
Deux chemins valides uniquement :

| Chemin | Header requis | Valeur |
|--------|--------------|--------|
| Admin humain | `Authorization` | `Bearer <JWT Supabase>` + rôle `admin` |
| pg_cron automatique | `x-cron-secret` | Valeur exacte du secret `CRON_SECRET` |

**Tout autre appel → 403 Forbidden immédiat. Aucune logique Stripe n'est atteinte.**

### Générer un CRON_SECRET sécurisé

```bash
openssl rand -hex 32
```

Copiez la valeur et ajoutez-la dans **Lovable Cloud > Secrets > CRON_SECRET**.

### Mettre à jour le cron pg_net avec le header

Dans le SQL editor de votre base Supabase :

```sql
-- Recréer le job avec le header x-cron-secret
SELECT cron.unschedule('payout-generation-daily');

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

**Ne jamais committer `YOUR_CRON_SECRET_VALUE` dans le repo.**
