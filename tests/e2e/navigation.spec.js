/**
 * Navigation E2E Tests
 * Tests for page navigation and routing
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('userSession', JSON.stringify({
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      }));
    });
  });

  test('should navigate between main pages', async ({ page }) => {
    await page.goto('/user/dashboard');

    // Test navigation to trading page
    await page.click('text=Trading');
    await page.waitForURL('**/user/trade');
    await expect(page.getByText('Trading')).toBeVisible();

    // Test navigation to plans page
    await page.click('text=Investment Plans');
    await page.waitForURL('**/plans');
    await expect(page.getByText('Investment Plans')).toBeVisible();

    // Test navigation back to dashboard
    await page.click('text=Dashboard');
    await page.waitForURL('**/user/dashboard');
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('should handle admin navigation', async ({ page }) => {
    // Mock admin user
    await page.addInitScript(() => {
      localStorage.setItem('userSession', JSON.stringify({
        id: 'test-admin-123',
        email: 'admin@example.com',
        name: 'Test Admin',
        role: 'admin'
      }));
    });

    await page.goto('/admin/dashboard');

    // Should show admin dashboard
    await expect(page.getByText('Admin Dashboard')).toBeVisible();

    // Test navigation to admin users page
    await page.click('text=Users');
    await page.waitForURL('**/admin/users');
    await expect(page.getByText('Users')).toBeVisible();
  });

  test('should redirect unauthenticated users', async ({ page }) => {
    // Clear authentication
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/user/dashboard');

    // Should redirect to sign in
    await page.waitForURL('**/auth/signin**');
    await expect(page.getByText('Sign In')).toBeVisible();
  });

  test('should handle 404 pages', async ({ page }) => {
    await page.goto('/non-existent-page');

    // Should show 404 or redirect to dashboard
    await expect(page.getByText('404')).toBeVisible();
  });

  test('should maintain state during navigation', async ({ page }) => {
    await page.goto('/user/dashboard');

    // Wait for dashboard to load
    await expect(page.getByText('Dashboard')).toBeVisible();

    // Navigate to trading page
    await page.click('text=Trading');
    await page.waitForURL('**/user/trade');

    // Navigate back to dashboard
    await page.click('text=Dashboard');
    await page.waitForURL('**/user/dashboard');

    // Dashboard should still be loaded
    await expect(page.getByText('Dashboard')).toBeVisible();
  });
});
