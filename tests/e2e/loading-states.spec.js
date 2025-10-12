/**
 * Loading States E2E Tests
 * End-to-end tests for loading states and infinite loops
 */

import { test, expect } from '@playwright/test';

test.describe('Loading States', () => {
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

  test('dashboard should load without infinite spinner', async ({ page }) => {
    // Mock API responses
    await page.route('**/api/wallet/balance**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          usdBalance: 1000.00,
          bnxBalance: 500.00,
          bnxPrice: 0.0035
        })
      });
    });

    await page.goto('/user/dashboard');

    // Should show loading initially
    await expect(page.getByText('Loading dashboard...')).toBeVisible();

    // Should hide loading and show content
    await expect(page.getByText('Loading dashboard...')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('$1000.00')).toBeVisible();
  });

  test('trade page should load market data without infinite loading', async ({ page }) => {
    // Mock API responses
    await page.route('**/api/price**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          price: 0.0035,
          change24h: 0.05,
          volume24h: 1000000
        })
      });
    });

    await page.goto('/user/trade');

    // Should show loading initially
    await expect(page.getByText('Loading market data...')).toBeVisible();

    // Should hide loading and show trading interface
    await expect(page.getByText('Loading market data...')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Trading')).toBeVisible();
  });

  test('plans page should load investment plans without infinite loading', async ({ page }) => {
    // Mock API responses
    await page.route('**/api/investment-plans**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          plans: [
            {
              id: 'plan-1',
              planName: 'Basic Plan',
              minimumInvestment: 100,
              maximumInvestment: 1000,
              profitPercentage: 5,
              duration: 30,
              isActive: true
            }
          ]
        })
      });
    });

    await page.goto('/plans');

    // Should show loading initially
    await expect(page.getByText('Loading...')).toBeVisible();

    // Should hide loading and show plans
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Investment Plans')).toBeVisible();
    await expect(page.getByText('Basic Plan')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/wallet/balance**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error'
        })
      });
    });

    await page.goto('/user/dashboard');

    // Should show loading initially
    await expect(page.getByText('Loading dashboard...')).toBeVisible();

    // Should hide loading even after error
    await expect(page.getByText('Loading dashboard...')).not.toBeVisible({ timeout: 5000 });
  });

  test('should not show loading spinner after page navigation', async ({ page }) => {
    await page.goto('/user/dashboard');

    // Wait for dashboard to load
    await expect(page.getByText('Dashboard')).toBeVisible();

    // Navigate to trade page
    await page.click('text=Trading');
    await page.waitForURL('**/user/trade');

    // Should not show loading spinner on navigation
    await expect(page.getByText('Loading...')).not.toBeVisible();
  });

  test('should handle slow API responses', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/wallet/balance**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          usdBalance: 1000.00,
          bnxBalance: 500.00,
          bnxPrice: 0.0035
        })
      });
    });

    await page.goto('/user/dashboard');

    // Should show loading for a while
    await expect(page.getByText('Loading dashboard...')).toBeVisible();

    // Should eventually hide loading
    await expect(page.getByText('Loading dashboard...')).not.toBeVisible({ timeout: 10000 });
  });

  test('should prevent infinite loading on form submission', async ({ page }) => {
    await page.goto('/user/dashboard');

    // Wait for dashboard to load
    await expect(page.getByText('Dashboard')).toBeVisible();

    // Mock trading API
    await page.route('**/api/trading/buy-bnx**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          tokensBought: 28571.43,
          price: 0.0035
        })
      });
    });

    // Fill trading form
    await page.fill('input[name="amount"]', '100');
    await page.click('button[type="submit"]');

    // Should not show loading spinner after form submission
    await expect(page.getByText('Loading...')).not.toBeVisible();
  });
});
