/**
 * E2E — Mission creation flow (authenticated)
 * Tests: dashboard → new mission → form → submit
 * Requires: TEST_USER_EMAIL + TEST_USER_PASSWORD env vars for a seeded account
 */
import { test, expect } from "@playwright/test";

const EMAIL = process.env.TEST_USER_EMAIL ?? "";
const PASSWORD = process.env.TEST_USER_PASSWORD ?? "";

// Skip if no test account configured
test.skip(!EMAIL || !PASSWORD, "Set TEST_USER_EMAIL + TEST_USER_PASSWORD to run authenticated tests");

test.describe("Mission creation flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login via UI
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole("button", { name: /connexion|se connecter/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 15_000 });
  });

  test("missions page loads", async ({ page }) => {
    await page.goto("/missions");
    await expect(page.getByRole("heading", { name: /mission/i })).toBeVisible();
  });

  test("new mission form renders", async ({ page }) => {
    await page.goto("/missions/nouvelle");
    await expect(
      page.getByRole("heading", { name: /nouvelle|créer/i })
        .or(page.locator('[data-testid="mission-form"]'))
    ).toBeVisible({ timeout: 8_000 });
  });

  test("create mission and see it in list", async ({ page }) => {
    await page.goto("/missions/nouvelle");

    const title = `Mission E2E ${Date.now()}`;
    const titleInput = page.getByLabel(/titre|intitulé/i).or(page.locator('input[name="titre"]')).first();
    await titleInput.fill(title);

    // Fill required fields (flexible selectors for robustness)
    const descInput = page.locator("textarea").first();
    if (await descInput.isVisible()) {
      await descInput.fill("Mission créée automatiquement par les tests E2E.");
    }

    const submitBtn = page.getByRole("button", { name: /créer|enregistrer|publier/i }).last();
    await submitBtn.click();

    // Should redirect back to missions list with the new mission visible
    await page.waitForURL(/missions(?!\/nouvelle)/, { timeout: 10_000 });
    await expect(page.getByText(title)).toBeVisible({ timeout: 8_000 });
  });
});
