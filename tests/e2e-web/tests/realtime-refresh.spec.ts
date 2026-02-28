import { expect, test } from '@playwright/test';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';
const INTERNAL_SERVICE_KEY =
  process.env.INTERNAL_SERVICE_KEY || 'dev-internal-service-key';
const TEST_PHONE = process.env.TEST_PHONE || '+15551234567';

test.describe('Operator Dashboard Realtime Refresh', () => {
  test('refreshes pending offers KPI after realtime event', async ({
    page,
    request,
  }) => {
    const sendOtpResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { phone: TEST_PHONE },
    });
    expect(sendOtpResponse.ok()).toBeTruthy();

    const verifyOtpResponse = await request.post(
      `${API_BASE_URL}/auth/verify-otp`,
      {
        data: { phone: TEST_PHONE, code: '123456' },
      }
    );
    expect(verifyOtpResponse.ok()).toBeTruthy();
    const auth = await verifyOtpResponse.json();
    const user = auth.user as {
      id: string;
      phone: string;
      displayName: string;
      primaryRole: string;
    };
    const token = auth.token as string;
    expect(user?.id).toBeTruthy();
    expect(token).toBeTruthy();

    await page.goto('/');
    await page.evaluate(
      ({ authToken, authUser }) => {
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(authUser));
      },
      { authToken: token, authUser: user }
    );
    const storedAuth = await page.evaluate(() => ({
      token: localStorage.getItem('token'),
      user: localStorage.getItem('user'),
    }));
    expect(storedAuth.token).toBeTruthy();
    expect(storedAuth.user).toBeTruthy();

    let slotsRequestCount = 0;
    let offersRequestCount = 0;
    await page.route('**/api/slots/search', async (route) => {
      const method = route.request().method();

      if (method === 'OPTIONS') {
        await route.fulfill({
          status: 204,
          headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'GET,OPTIONS',
            'access-control-allow-headers': 'Authorization,Content-Type',
          },
        });
        return;
      }

      if (method !== 'GET') {
        await route.continue();
        return;
      }

      slotsRequestCount += 1;
      await route.fulfill({
        status: 200,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/offers', async (route) => {
      const method = route.request().method();

      if (method === 'OPTIONS') {
        await route.fulfill({
          status: 204,
          headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'GET,OPTIONS',
            'access-control-allow-headers': 'Authorization,Content-Type',
          },
        });
        return;
      }

      if (method !== 'GET') {
        await route.continue();
        return;
      }

      offersRequestCount += 1;

      const payload =
        offersRequestCount === 1
          ? []
          : [
              {
                id: 'offer-realtime-1',
                amountCents: 12345,
                slotId: 'slot-realtime-1',
                status: 'pending',
                createdAt: new Date().toISOString(),
              },
            ];

      await route.fulfill({
        status: 200,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify(payload),
      });
    });

    await page.goto('/operator');
    const operatorStoredAuth = await page.evaluate(() => ({
      token: localStorage.getItem('token'),
      user: localStorage.getItem('user'),
    }));
    expect(operatorStoredAuth.token).toBeTruthy();
    expect(operatorStoredAuth.user).toBeTruthy();

    const pendingOffersValue = page.locator(
      '[data-testid="kpi-card"]:has-text("Pending Offers") [data-testid="kpi-value"]'
    );

    await expect.poll(() => slotsRequestCount, { timeout: 15000 }).toBeGreaterThan(0);
    await expect.poll(() => offersRequestCount, { timeout: 15000 }).toBeGreaterThan(0);
    await expect(pendingOffersValue).toHaveText('0', { timeout: 15000 });
    await expect(page.getByText('Connected with JWT')).toBeVisible({
      timeout: 15000,
    });

    const emitResponse = await request.post(
      `${API_BASE_URL}/realtime/internal/emit`,
      {
        headers: {
          'x-internal-key': INTERNAL_SERVICE_KEY,
        },
        data: {
          channel: `user:${user.id}`,
          event: 'booking:status_changed',
          payload: {
            bookingId: 'booking-realtime-1',
          },
        },
      }
    );
    expect(emitResponse.ok()).toBeTruthy();

    await expect
      .poll(async () => (await pendingOffersValue.textContent())?.trim(), {
        timeout: 12000,
      })
      .toBe('1');

    expect(offersRequestCount).toBeGreaterThan(1);
  });
});
