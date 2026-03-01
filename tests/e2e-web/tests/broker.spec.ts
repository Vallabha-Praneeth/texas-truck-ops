import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Broker Dashboard', () => {
  test('should open create request dialog', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('+15551234567', '123456');

    await page.goto('/broker');
    await expect(page.getByRole('heading', { name: 'Broker Dashboard' })).toBeVisible({
      timeout: 15000,
    });

    await page.getByText('Create Request').first().click();
    await expect(page.getByText('Create New Request')).toBeVisible();
    await expect(page.getByLabel('Title')).toBeVisible();
    await expect(page.getByLabel('Start Date')).toBeVisible();
    await expect(page.getByLabel('End Date')).toBeVisible();
  });
});
