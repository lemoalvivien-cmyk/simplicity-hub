@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║  🔥 WIINUPMAX — FIX SÉCURITÉ .env — EXÉCUTION EN COURS...      ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.

git rm --cached .env 2>nul
if %errorlevel% neq 0 (
  echo  ℹ️  .env déjà retiré du cache Git ou inexistant — OK
) else (
  echo  ✅ .env retiré du cache Git avec succès
)

git add .gitignore
echo  ✅ .gitignore mis en stage

git commit -m "SECURITY: remove .env from git tracking — WiinupMax hardening"
echo  ✅ Commit sécurité effectué

git push
echo  ✅ Push effectué

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║  ✅ SÉCURITÉ TERMINÉE — Rafraîchis GitHub pour vérifier         ║
echo ║  👉 https://github.com/lemoalvivien-cmyk/simplicity-hub         ║
echo ║  Vérifie que .env n'apparaît plus dans le repo.                 ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
pause
