import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001/api';

test.describe('Login page', () => {
  test('renders phone form on first load', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('phone-input')).toBeVisible();
    await expect(page.getByTestId('send-otp-button')).toBeVisible();
    await expect(page.getByTestId('otp-input')).not.toBeVisible();
  });

  test('shows client-side validation error for bad phone format', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('phone-input').fill('12345');
    await page.getByTestId('send-otp-button').click();

    await expect(page.getByTestId('error-message')).toBeVisible();
    await expect(page.getByTestId('error-message')).toContainText('Invalid phone number format');
    // OTP step should NOT appear
    await expect(page.getByTestId('otp-input')).not.toBeVisible();
  });

  test('shows OTP form after successful send', async ({ page }) => {
    // Mock the NestJS /auth/login to return 200
    await page.route(`${API}/auth/login`, (route) =>
      route.fulfill({ status: 200, json: { message: 'OTP sent' } })
    );

    await page.goto('/');
    await page.getByTestId('phone-input').fill('+15551234567');
    await page.getByTestId('send-otp-button').click();

    await expect(page.getByTestId('otp-input')).toBeVisible();
    await expect(page.getByTestId('verify-button')).toBeVisible();
    // Phone form should be hidden
    await expect(page.getByTestId('send-otp-button')).not.toBeVisible();
  });

  test('shows error message on failed OTP verification', async ({ page }) => {
    // Mock send OTP success
    await page.route(`${API}/auth/login`, (route) =>
      route.fulfill({ status: 200, json: { message: 'OTP sent' } })
    );
    // Mock verify OTP failure
    await page.route(`${API}/auth/verify-otp`, (route) =>
      route.fulfill({ status: 401, json: { message: 'Invalid OTP' } })
    );

    await page.goto('/');
    await page.getByTestId('phone-input').fill('+15551234567');
    await page.getByTestId('send-otp-button').click();
    await expect(page.getByTestId('otp-input')).toBeVisible();

    await page.getByTestId('otp-input').fill('000000');
    await page.getByTestId('verify-button').click();

    await expect(page.getByTestId('error-message')).toBeVisible();
    await expect(page.getByTestId('error-message')).toContainText('Invalid OTP');
  });
});
