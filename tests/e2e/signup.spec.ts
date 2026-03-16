/**
 * E2E — Signup flow
 * Tests: page loads → form fills → submit → redirect to onboarding
 */
import { test, expect } from "@playwright/test";

const TEST_EMAIL = `e2e+signup+${Date.now()}@wiinupmax.com`;
const TEST_PASSWORD = "TestE2E@2026!";

test.describe("Signup flow", () => {
  test("renders signup page", async ({ page }) => {
    await page.goto("/signup");
    await expect(page).toHaveTitle(/wiinup/i);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/signup");
    const submitBtn = page.getByRole("button", { name: /créer|s'inscrire|commencer/i });
    await submitBtn.click();
    // At least one error message should appear
    const errors = page.locator("[role=alert], .text-destructive, [aria-invalid=true]");
    await expect(errors.first()).toBeVisible({ timeout: 5_000 });
  });

  test("fills form and submits", async ({ page }) => {
    await page.goto("/signup");

    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]')).first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);

    const submitBtn = page.getByRole("button", { name: /créer|s'inscrire|commencer/i });
    await submitBtn.click();

    // Expect either onboarding redirect or email confirmation message
    await expect(
      page.getByText(/onboarding|confirmer|vérifi/i).or(page.locator('[data-testid="email-confirm"]'))
    ).toBeVisible({ timeout: 10_000 });
  });
});
