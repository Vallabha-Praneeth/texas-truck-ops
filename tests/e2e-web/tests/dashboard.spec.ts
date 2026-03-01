import { test, expect } from '../fixtures/auth';

test.describe('Operator Dashboard', () => {
  test.beforeEach(async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login('+15551234567', '123456');
    await page.goto('/operator');
    await expect(
      page.getByRole('heading', { name: 'Operator Dashboard' })
    ).toBeVisible({ timeout: 15000 });
  });

  test('should display dashboard header', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Operator Dashboard' })
    ).toBeVisible();
  });

  test('should display KPI cards and active slots metric', async ({ page }) => {
    await expect(page.getByTestId('kpi-card')).toHaveCount(4);
    const activeSlots = page
      .locator('[data-testid="kpi-card"]:has-text("Active Slots") [data-testid="kpi-value"]')
      .first();
    await expect(activeSlots).toHaveText(/\d+/);
  });

  test('should open create slot modal from add slot button', async ({ page }) => {
    await page.getByRole('button', { name: /add slot/i }).click();
    await expect(page.getByText('Create Availability Slot')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
  });

  test('should render quick actions', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Manage Trucks/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /View Offers/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Calendar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Wallet/i })).toBeVisible();
  });

  test('should show slots list or empty state', async ({ page }) => {
    const slotCards = page.getByTestId('slot-card');
    const emptyState = page.getByText(/No availability slots yet/i);
    const count = await slotCards.count();
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
      return;
    }
    await expect(emptyState).toBeVisible();
  });

  test('should show empty state when slots API returns empty list', async ({ page }) => {
    await page.route('**/api/slots/search', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify([]),
      });
    });

    await page.reload();
    await expect(page.getByText(/No availability slots yet/i)).toBeVisible();
  });

  test('should refresh data on page reload', async ({ page }) => {
    await page.reload();
    await expect(page).toHaveURL(/\/operator/);
  });

  test('should show realtime panel status', async ({ page }) => {
    await expect(page.getByText('Realtime Events Example')).toBeVisible();
    await expect(page.getByText('Connected with JWT')).toBeVisible();
  });
});
