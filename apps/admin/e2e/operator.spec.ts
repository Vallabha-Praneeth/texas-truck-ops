import { test, expect } from '@playwright/test';
import { loginAs, mockBackendEmpty } from './helpers/auth';

test.describe('Operator dashboard', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/operator');
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('phone-input')).toBeVisible();
  });

  test('renders dashboard after authentication', async ({ page }) => {
    await mockBackendEmpty(page);
    await loginAs(page, 'operator');
    await page.goto('/operator');

    await expect(page.getByTestId('operator-dashboard')).toBeVisible();
    await expect(page.getByTestId('logout-button')).toBeVisible();
  });

  test('shows four KPI cards', async ({ page }) => {
    await mockBackendEmpty(page);
    await loginAs(page, 'operator');
    await page.goto('/operator');

    await expect(page.getByTestId('operator-dashboard')).toBeVisible();
    const kpiCards = page.getByTestId('kpi-card');
    await expect(kpiCards).toHaveCount(4);
  });

  test('shows empty states when backend returns no data', async ({ page }) => {
    await mockBackendEmpty(page);
    await loginAs(page, 'operator');
    await page.goto('/operator');

    await expect(page.getByTestId('operator-dashboard')).toBeVisible();
    await expect(page.getByTestId('empty-pending-offers')).toBeVisible();
    await expect(page.getByTestId('empty-trucks')).toBeVisible();
    await expect(page.getByTestId('empty-bookings')).toBeVisible();
  });
});
