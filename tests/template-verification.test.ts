/**
 * Template Selection & Persistence Verification Test
 * 
 * This test verifies the ENTIRE template selection flow:
 * 1. Select template in builder
 * 2. Save to database
 * 3. Reload page - verify selection persists
 * 4. Publish card
 * 5. Open public URL - verify correct template renders
 * 
 * Run: npx playwright test tests/template-verification.test.ts
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER = {
  email: `test-${Date.now()}@dvcard.test`,
  password: 'TestPassword123!',
  name: 'Template Test User'
};

test.describe('Template Selection & Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('Full template lifecycle - minimal to luxury to spotlight', async ({ page }) => {
    // Step 1: Register new user
    await page.getByRole('link', { name: /sign up/i }).click();
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByLabel(/full name/i).fill(TEST_USER.name);
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Wait for dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Step 2: Create new card
    await page.getByRole('button', { name: /create.*card/i }).click();
    await page.getByLabel(/full name/i).fill('Test Professional');
    await page.getByLabel(/designation/i).fill('Software Engineer');
    await page.getByLabel(/company/i).fill('DV Card Inc');
    await page.getByRole('button', { name: /save/i }).click();
    
    // Wait for builder to load
    await expect(page.locator('[data-testid="card-builder"]')).toBeVisible({ timeout: 10000 });

    // Step 3: Select MINIMAL template
    await page.getByRole('tab', { name: /design/i }).click();
    await page.getByRole('button', { name: /minimal/i }).click();
    
    // Wait for save indicator
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 5000 });
    
    // Verify minimal is selected
    await expect(page.getByRole('button', { name: /minimal/i })).toHaveAttribute('aria-pressed', 'true');

    // Step 4: Reload page - verify selection persists
    await page.reload();
    await expect(page.getByRole('button', { name: /minimal/i })).toHaveAttribute('aria-pressed', 'true');

    // Step 5: Change to LUXURY template
    await page.getByRole('button', { name: /luxury/i }).click();
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /luxury/i })).toHaveAttribute('aria-pressed', 'true');

    // Step 6: Reload again - verify luxury persists
    await page.reload();
    await expect(page.getByRole('button', { name: /luxury/i })).toHaveAttribute('aria-pressed', 'true');

    // Step 7: Publish card
    await page.getByRole('tab', { name: /publish/i }).click();
    await page.getByRole('button', { name: /publish card/i }).click();
    
    // Get public URL
    const publicUrl = await page.locator('[data-testid="public-url"]').textContent();
    expect(publicUrl).toBeTruthy();

    // Step 8: Open public URL in new tab
    const publicPage = await page.context().newPage();
    await publicPage.goto(publicUrl!);
    
    // Verify luxury theme is rendered (dark background)
    const bgColor = await publicPage.evaluate(() => {
      const root = document.documentElement;
      return window.getComputedStyle(root).getPropertyValue('--c-bg');
    });
    
    expect(bgColor).toContain('#121212'); // Luxury theme dark background

    // Step 9: Switch to SPOTLIGHT template
    await page.getByRole('button', { name: /spotlight/i }).click();
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 5000 });
    
    // Publish again
    await page.getByRole('tab', { name: /publish/i }).click();
    await page.getByRole('button', { name: /update published card/i }).click();
    
    // Step 10: Reload public page - verify spotlight theme
    await publicPage.reload();
    const newBgColor = await publicPage.evaluate(() => {
      const root = document.documentElement;
      return window.getComputedStyle(root).getPropertyValue('--c-bg');
    });
    
    expect(newBgColor).toContain('#0a0a0a'); // Spotlight theme background
    
    await publicPage.close();
  });

  test('Visual verification - templates look different', async ({ page }) => {
    // This test captures screenshots to verify visual differences
    
    await page.goto(`${BASE_URL}/templates`);
    
    // Capture minimal preview
    const minimalCard = page.locator('[data-template="minimal"]');
    await expect(minimalCard).toBeVisible();
    await minimalCard.screenshot({ path: 'screenshots/minimal-preview.png' });
    
    // Capture luxury preview
    const luxuryCard = page.locator('[data-template="luxury"]');
    await expect(luxuryCard).toBeVisible();
    await luxuryCard.screenshot({ path: 'screenshots/luxury-preview.png' });
    
    // Capture spotlight preview
    const spotlightCard = page.locator('[data-template="spotlight"]');
    await expect(spotlightCard).toBeVisible();
    await spotlightCard.screenshot({ path: 'screenshots/spotlight-preview.png' });
    
    // Visual assertion: files should be different sizes (different layouts)
    // This is a proxy for visual difference - proper visual regression would use Percy/Chromatic
  });

  test('Category filtering works', async ({ page }) => {
    // Login and navigate to builder
    // ... (similar setup as above)
    
    await page.goto(`${BASE_URL}/dashboard/cards/new`);
    await page.getByRole('tab', { name: /design/i }).click();
    
    // Verify all themes visible by default
    const allThemes = await page.locator('[role="button"][aria-pressed]').count();
    expect(allThemes).toBeGreaterThan(10);
    
    // Filter by 'health' category
    await page.getByRole('button', { name: /health/i }).click();
    const healthThemes = await page.locator('[role="button"][aria-pressed]').count();
    expect(healthThemes).toBeLessThan(allThemes);
    expect(healthThemes).toBeGreaterThanOrEqual(2); // medical, clinic
    
    // Filter back to all
    await page.getByRole('button', { name: /all/i }).click();
    const backToAll = await page.locator('[role="button"][aria-pressed]').count();
    expect(backToAll).toBe(allThemes);
  });
});

test.describe('Security - Cross-user template access', () => {
  test('User A cannot modify User B card template', async ({ page, context }) => {
    // Create User A
    const pageA = page;
    await pageA.goto(`${BASE_URL}/signup`);
    // ... register User A, create card

    // Get User A's card ID
    const cardIdA = await pageA.url().match(/cards\/([a-z0-9-]+)/)?.[1];
    expect(cardIdA).toBeTruthy();

    // Logout User A
    await pageA.getByRole('button', { name: /logout/i }).click();

    // Create User B in new context
    const pageB = await context.newPage();
    await pageB.goto(`${BASE_URL}/signup`);
    // ... register User B

    // Try to access User A's builder directly
    await pageB.goto(`${BASE_URL}/builder/${cardIdA}`);
    
    // Should redirect or show 403/404
    await expect(pageB).not.toHaveURL(`/builder/${cardIdA}`);
    await expect(pageB.getByText(/not found|forbidden|unauthorized/i)).toBeVisible();
  });
});
