import { test, expect } from '@playwright/test';
import { loginAs, mockBackendEmpty } from './helpers/auth';

test.describe('Broker dashboard', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/broker');
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('phone-input')).toBeVisible();
  });

  test('renders dashboard after authentication', async ({ page }) => {
    await mockBackendEmpty(page);
    await loginAs(page, 'broker');
    await page.goto('/broker');

    await expect(page.getByTestId('broker-dashboard')).toBeVisible();
    await expect(page.getByTestId('logout-button')).toBeVisible();
  });

  test('shows three KPI cards', async ({ page }) => {
    await mockBackendEmpty(page);
    await loginAs(page, 'broker');
    await page.goto('/broker');

    await expect(page.getByTestId('broker-dashboard')).toBeVisible();
    const kpiCards = page.getByTestId('kpi-card');
    await expect(kpiCards).toHaveCount(3);
  });

  test('shows empty states when backend returns no data', async ({ page }) => {
    await mockBackendEmpty(page);
    await loginAs(page, 'broker');
    await page.goto('/broker');

    await expect(page.getByTestId('broker-dashboard')).toBeVisible();
    // Default tab: My Requests
    await expect(page.getByTestId('request-empty-state')).toBeVisible();
    // Switch to My Sent Offers tab to assert its empty state
    await page.getByRole('tab', { name: 'My Sent Offers' }).click();
    await expect(page.getByTestId('offers-empty-state')).toBeVisible();
  });
});
