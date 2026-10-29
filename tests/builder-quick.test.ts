/**
 * BUILDER QUICK TEST - Verify builder loads
 * This doesn't test full auth flow, just that builder page structure exists
 */

import { test, expect } from '@playwright/test';

test.describe('Builder Structure', () => {
  test.skip('builder page exists (requires auth)', async ({ page }) => {
    // This would need authenticated session
    // Skipping for now - full E2E in template-verification.test.ts
    await page.goto('/builder/test');
  });
});

test.describe('API Health', () => {
  test('backend health check', async ({ request }) => {
    const response = await request.get('http://localhost:4000/health');
    expect(response.ok()).toBeTruthy();
  });

  test('backend status check', async ({ request }) => {
    const response = await request.get('http://localhost:4000/status');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('status');
  });
});
