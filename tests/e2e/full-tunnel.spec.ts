/**
 * E2E — Full conversion tunnel
 * Tests: landing CTA → checkout, signup validation, login form,
 *        pricing page, legal pages
 */
import { test, expect } from "@playwright/test";

test.describe("Full conversion tunnel", () => {
  test("landing → CTA → checkout page loads", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: /99|founder pass|premiers clients/i }).first();
    await expect(cta).toBeVisible();
    await cta.click();
    await page.waitForURL(/checkout/);
    await expect(page.getByText(/99|paiement|founder/i)).toBeVisible({ timeout: 8000 });
  });

  test("signup form validates and submits", async ({ page }) => {
    await page.goto("/signup");
    await page.fill('input[type="email"]', "test-e2e@mailtest.invalid");
    await page.fill('input[type="password"]', "TestPass123!");
    await page.fill('input[autocomplete="given-name"]', "TestUser");
    await page.click('button[type="submit"]');
    // Should show email confirmation or error (already registered)
    await expect(
      page.getByText(/verifiez|deja utilisee|confirmation/i)
    ).toBeVisible({ timeout: 8000 });
  });

  test("login page renders and accepts input", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText(/connecter|connexion/i)).toBeVisible();
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    // Just verify the form is interactive
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test("pricing page shows Founder Pass", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText(/99/)).toBeVisible();
    await expect(page.getByText(/founder pass/i)).toBeVisible();
    await expect(page.getByText(/facilitateur|gratuit/i)).toBeVisible();
  });

  test("legal pages load correctly", async ({ page }) => {
    for (const path of ["/cgu", "/confidentialite", "/mentions-legales"]) {
      await page.goto(path);
      await expect(page.locator("main")).toBeVisible({ timeout: 5000 });
    }
  });
});
