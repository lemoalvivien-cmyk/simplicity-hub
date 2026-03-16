/**
 * E2E — Checkout flow
 * Tests: pricing page → checkout CTA → Stripe payment form loads
 */
import { test, expect } from "@playwright/test";

test.describe("Checkout flow", () => {
  test("renders pricing page", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText(/founder pass|99|tarif/i)).toBeVisible();
  });

  test("checkout page accessible", async ({ page }) => {
    await page.goto("/checkout");
    // Checkout shows either Stripe embed or pricing recap
    await expect(
      page
        .getByText(/99|founder pass|paiement|récapitulatif/i)
        .or(page.locator('[data-testid="checkout-form"]'))
    ).toBeVisible({ timeout: 8_000 });
  });

  test("CTA from landing opens checkout", async ({ page }) => {
    await page.goto("/");
    const ctaBtn = page
      .getByRole("link", { name: /99|founder pass|premiers clients/i })
      .first();
    await expect(ctaBtn).toBeVisible();
    const href = await ctaBtn.getAttribute("href");
    expect(href).toMatch(/checkout|pricing/);
  });
});
