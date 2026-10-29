/**
 * SMOKE TESTS - Quick verification that critical flows work
 * Run: npx playwright test tests/smoke.test.ts
 */

import { test, expect } from '@playwright/test';

test.describe('DV CARD - Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    const response = await page.goto('/');
    
    // Should load successfully
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/DV CARD/i);
  });

  test('template gallery accessible', async ({ page }) => {
    const response = await page.goto('/templates');
    
    // Should load successfully
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/templates/);
  });

  test('dashboard requires auth', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/login|auth/);
  });

  test('public card 404 for non-existent username', async ({ page }) => {
    const response = await page.goto('/card/this-user-does-not-exist-12345');
    
    // Should return 404 status or show error message
    expect(response?.status()).toBeGreaterThanOrEqual(400);
  });
});
