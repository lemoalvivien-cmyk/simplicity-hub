/**
 * ANTI-REGRESSION GUARD — v1.4.0
 * Vérifie que les invariants critiques de production ne régressent jamais.
 * Ce fichier NE DOIT PAS être modifié sans validation explicite.
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "../../");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf-8");

describe("GUARD — Route /creer-emploi", () => {
  it("est déclarée comme route publique dans App.tsx", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/path="\/creer-emploi"/);
    // Doit être publique (pas dans ProtectedRoute)
    expect(app).toMatch(/path="\/creer-emploi"\s+element=\{<CreerEmploiPage/);
  });

  it("CreerEmploi page existe et compile", async () => {
    const mod = await import("@/pages/CreerEmploi");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });
});

describe("GUARD — Section #section-creer-emploi dans Index.tsx", () => {
  it("le wrapper protégé est présent", () => {
    const index = read("src/pages/Index.tsx");
    expect(index).toMatch(/id="section-creer-emploi"/);
    expect(index).toMatch(/data-protected="business-critical"/);
    expect(index).toMatch(/data-never-remove="true"/);
  });

  it("CreerEmploiCTASection est importée en direct (pas lazy)", () => {
    const index = read("src/pages/Index.tsx");
    // Import direct (non lazy) obligatoire
    expect(index).toMatch(/import CreerEmploiCTASection from/);
    // Ne doit pas être dans un lazy()
    const lazyLine = index.match(/lazy\(.*CreerEmploiCTASection/);
    expect(lazyLine).toBeNull();
  });

  it("la section emploi est positionnée AVANT ProblemSection", () => {
    const index = read("src/pages/Index.tsx");
    const posEmploi = index.indexOf("section-creer-emploi");
    const posProbleme = index.indexOf("ProblemSection");
    expect(posEmploi).toBeGreaterThan(0);
    expect(posProbleme).toBeGreaterThan(0);
    expect(posEmploi).toBeLessThan(posProbleme);
  });
});

describe("GUARD — BrowserRouter au-dessus de AuthProvider", () => {
  it("BrowserRouter enveloppe AuthProvider dans App.tsx", () => {
    const app = read("src/App.tsx");
    const posRouter = app.indexOf("<BrowserRouter");
    const posAuth = app.indexOf("<AuthProvider");
    expect(posRouter).toBeGreaterThan(0);
    expect(posAuth).toBeGreaterThan(posRouter);
  });
});

describe("GUARD — VitePWA désactivé", () => {
  it("VitePWA n'est pas importé activement dans vite.config.ts", () => {
    const config = read("vite.config.ts");
    // L'import VitePWA doit être commenté
    const activeImport = config.match(/^import\s+\{.*VitePWA.*\}/m);
    expect(activeImport).toBeNull();
  });

  it("le bloc de désinscription SW est présent dans main.tsx", () => {
    const main = read("src/main.tsx");
    expect(main).toMatch(/serviceWorker.*getRegistrations/);
    expect(main).toMatch(/registration\.unregister\(\)/);
  });
});

describe("GUARD — CSP permissive (pas de hash obsolète)", () => {
  it("index.html ne contient pas de hash sha256 dans la CSP", () => {
    const html = read("index.html");
    // Les hash sha256 dans la CSP cassaient le bundle après rebuild
    expect(html).not.toMatch(/sha256-[A-Za-z0-9+/=]{40,}/);
  });

  it("la CSP contient unsafe-inline pour permettre le bundle Vite", () => {
    const html = read("index.html");
    expect(html).toMatch(/unsafe-inline/);
  });
});

describe("GUARD — /login est une route publique", () => {
  it("route /login n'est pas dans ProtectedRoute", () => {
    const app = read("src/App.tsx");
    // La route login doit être <Route path="/login" element={<Login />} /> sans ProtectedRoute
    expect(app).toMatch(/path="\/login"\s+element=\{<Login/);
  });
});
