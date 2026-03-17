import { test, expect } from '@playwright/test';

test.describe('Landing page — contenu critique', () => {
  test('landing affiche le titre H1', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 });
    const title = await page.locator('h1').first().textContent();
    expect(title).toContain('WIINUP');
  });

  test('CTA principal mène au signup', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: /s'inscrire|commencer|founder pass/i }).first();
    await expect(cta).toBeVisible({ timeout: 8000 });
    await cta.click();
    await expect(page).toHaveURL(/signup/);
  });
});

test.describe('Flows auth', () => {
  test('page signup charge correctement', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /s'inscrire|créer|inscription/i }).first()).toBeVisible();
  });

  test('login mauvaises credentials affiche une erreur', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"]').first().fill('nonexistent@test-wiinupmax.com');
    await page.locator('input[type="password"]').first().fill('WrongPassword999!');
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).first().click();
    await expect(page.getByText(/incorrect|invalide|erreur|wrong|invalid/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('mot de passe oublié : page et formulaire accessibles', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
  });
});

test.describe('Pages publiques critiques', () => {
  test('pricing affiche le tarif 99', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText(/99/)).toBeVisible({ timeout: 8000 });
  });

  test('page CGU charge', async ({ page }) => {
    await page.goto('/cgu');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 });
  });

  test('404 affiche page not found', async ({ page }) => {
    await page.goto('/route-xyz-inexistante-404');
    await expect(page.getByText(/404|introuvable|not found/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Sécurité : routes protégées', () => {
  test('dashboard sans auth redirige vers login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/login|signin/, { timeout: 8000 });
    expect(page.url()).toMatch(/login|signin/);
  });

  test('admin sans auth redirige vers login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL(/login|signin/, { timeout: 8000 });
    expect(page.url()).toMatch(/login|signin/);
  });
});
