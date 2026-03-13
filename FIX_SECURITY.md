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
