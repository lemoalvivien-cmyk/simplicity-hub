#!/usr/bin/env node
/**
 * scripts/pre-publish-guard.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Vérificateur anti-régression LÉGER — à lancer avant chaque publish Lovable.
 * Aucune dépendance externe. Node pur. Lit les fichiers source en texte brut.
 *
 * Usage :  node scripts/pre-publish-guard.mjs
 * Exit 0  → tout est bon, safe to publish
 * Exit 1  → au moins une règle cassée (détail affiché)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/** Lit un fichier depuis la racine du projet */
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf-8");

let failures = 0;
let checks   = 0;

function pass(label) {
  checks++;
  console.log(`  ✅  ${label}`);
}

function fail(label, detail) {
  checks++;
  failures++;
  console.error(`  ❌  ${label}`);
  if (detail) console.error(`       → ${detail}`);
}

console.log("\n🔒  WiinupMax — Anti-Regression Guard\n");

// ── RÈGLE 1 : BrowserRouter au-dessus de AuthProvider ─────────────────────
{
  const app = read("src/App.tsx");
  const posRouter = app.indexOf("<BrowserRouter");
  const posAuth   = app.indexOf("<AuthProvider");
  if (posRouter > 0 && posAuth > posRouter) {
    pass("R1 · BrowserRouter enveloppe AuthProvider");
  } else {
    fail(
      "R1 · BrowserRouter doit être AVANT AuthProvider dans src/App.tsx",
      `posRouter=${posRouter}, posAuth=${posAuth}`
    );
  }
}

// ── RÈGLE 2 : Route publique /creer-emploi ────────────────────────────────
{
  const app = read("src/App.tsx");
  if (/path="\/creer-emploi"\s+element=\{<CreerEmploiPage/.test(app)) {
    pass("R2 · Route publique /creer-emploi déclarée");
  } else {
    fail(
      "R2 · Route /creer-emploi manquante ou déplacée dans ProtectedRoute",
      "Cherche : path=\"/creer-emploi\" element={<CreerEmploiPage"
    );
  }
}

// ── RÈGLE 3a : wrapper #section-creer-emploi présent ─────────────────────
{
  const index = read("src/pages/Index.tsx");
  const hasId        = /id="section-creer-emploi"/.test(index);
  const hasProtected = /data-protected="business-critical"/.test(index);
  const hasNeverRm   = /data-never-remove="true"/.test(index);
  if (hasId && hasProtected && hasNeverRm) {
    pass("R3a · Wrapper #section-creer-emploi présent avec tous ses attributs");
  } else {
    fail(
      "R3a · Wrapper #section-creer-emploi incomplet ou absent dans Index.tsx",
      `id=${hasId} protected=${hasProtected} never-remove=${hasNeverRm}`
    );
  }
}

// ── RÈGLE 3b : position logique (avant ProblemSection dans le JSX) ────────
{
  const index   = read("src/pages/Index.tsx");
  const returnPos = index.indexOf("return (");
  const jsx       = index.slice(returnPos);
  const posEmploi  = jsx.indexOf("section-creer-emploi");
  const posProbleme = jsx.indexOf("<ProblemSection");
  if (posEmploi > 0 && posProbleme > 0 && posEmploi < posProbleme) {
    pass("R3b · section-creer-emploi positionnée AVANT <ProblemSection> dans le JSX");
  } else {
    fail(
      "R3b · section-creer-emploi doit apparaître AVANT <ProblemSection> dans le JSX",
      `posEmploi=${posEmploi}, posProbleme=${posProbleme}`
    );
  }
}

// ── RÈGLE 3c : import direct (non-lazy) ──────────────────────────────────
{
  const index = read("src/pages/Index.tsx");
  const hasDirectImport = /^import CreerEmploiCTASection from/m.test(index);
  const hasLazy         = /lazy\(.*CreerEmploiCTASection/.test(index);
  if (hasDirectImport && !hasLazy) {
    pass("R3c · CreerEmploiCTASection importée en direct (non-lazy)");
  } else {
    fail(
      "R3c · CreerEmploiCTASection doit être un import direct, pas lazy()",
      `directImport=${hasDirectImport}, isLazy=${hasLazy}`
    );
  }
}

// ── RÈGLE 4 : VitePWA désactivé ───────────────────────────────────────────
{
  const config = read("vite.config.ts");
  const activeImport = /^import\s+\{[^}]*VitePWA[^}]*\}/m.test(config);
  if (!activeImport) {
    pass("R4 · VitePWA non importé activement dans vite.config.ts");
  } else {
    fail(
      "R4 · VitePWA est importé dans vite.config.ts — NE PAS réactiver sans validation explicite",
      "Supprime ou commente l'import VitePWA"
    );
  }
}

// ── RÈGLE 5 : Désinscription SW dans main.tsx ────────────────────────────
{
  const main = read("src/main.tsx");
  const hasGetRegs  = /serviceWorker.*getRegistrations/.test(main);
  const hasUnreg    = /registration\.unregister\(\)/.test(main);
  if (hasGetRegs && hasUnreg) {
    pass("R5 · Bloc de désinscription Service Worker présent dans main.tsx");
  } else {
    fail(
      "R5 · Bloc SW unregister manquant dans main.tsx — risque d'écran blanc en prod",
      `getRegistrations=${hasGetRegs}, unregister=${hasUnreg}`
    );
  }
}

// ── RÈGLE 6 : CSP sans hash sha256 obsolète ──────────────────────────────
{
  const html = read("index.html");
  const hasObsoleteHash = /sha256-[A-Za-z0-9+/=]{40,}/.test(html);
  if (!hasObsoleteHash) {
    pass("R6 · Aucun hash sha256 obsolète dans la CSP");
  } else {
    fail(
      "R6 · Un hash sha256 dans la CSP bloque le bundle JS après rebuild",
      "Supprime tous les 'sha256-...' de la meta CSP dans index.html"
    );
  }
}

// ── Résumé ────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(52)}`);
if (failures === 0) {
  console.log(`\n✅  ${checks}/${checks} règles OK — SAFE TO PUBLISH\n`);
  process.exit(0);
} else {
  console.error(`\n❌  ${failures}/${checks} règles ÉCHOUÉES — PUBLISH BLOQUÉ\n`);
  process.exit(1);
}
