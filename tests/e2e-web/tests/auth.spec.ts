import { test, expect } from '../fixtures/auth';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('should display login form', async ({ loginPage }) => {
    await expect(loginPage.phoneInput).toBeVisible();
    await expect(loginPage.sendOtpButton).toBeVisible();
  });

  test('should validate phone number format', async ({ loginPage }) => {
    await loginPage.enterPhone('invalid');
    await loginPage.clickSendOtp();

    // Check for validation error
    const hasError = await loginPage.hasError();
    expect(hasError).toBeTruthy();
  });

  test('should send OTP successfully', async ({ loginPage }) => {
    await loginPage.enterPhone('+15551234567');
    await loginPage.clickSendOtp();

    // Should show OTP input (allow extra time for API response)
    await expect(loginPage.otpInput).toBeVisible({ timeout: 20000 });
  });

  test('should complete login flow', async ({ loginPage, page }) => {
    await loginPage.login('+15551234567', '123456');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/(operator|dashboard)/);
  });

  test('should reject invalid OTP', async ({ loginPage }) => {
    await loginPage.enterPhone('+15551234567');
    await loginPage.clickSendOtp();
    await loginPage.enterOtp('000000');
    await loginPage.clickVerify();

    // Should show error
    const hasError = await loginPage.hasError();
    expect(hasError).toBeTruthy();
  });

  test('should persist session after refresh', async ({ loginPage, page }) => {
    await loginPage.login('+15551234567', '123456');
    await page.waitForURL(/\/(operator|dashboard)/);

    // Refresh page
    await page.reload();

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/\/(operator|dashboard)/);
  });
});
