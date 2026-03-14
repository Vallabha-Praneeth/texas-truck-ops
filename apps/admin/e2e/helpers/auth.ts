import { Page } from '@playwright/test';

/**
 * Mint a JWT via the dev-only Next.js API endpoint and inject it into
 * localStorage so the dashboard pages treat the browser as authenticated.
 *
 * Requires the Next.js server to be running with:
 *   JWT_SECRET=dev-secret-key-change-in-production
 *   DEV_ONLY=true
 */
export async function loginAs(
  page: Page,
  role: 'operator' | 'broker' | 'admin',
  sub = 'test-user-id'
) {
  // Mint a real JWT from the dev endpoint (no NestJS backend required)
  const res = await page.request.post('/api/v1/dev/mint-token', {
    data: { sub, role },
  });

  if (!res.ok()) {
    throw new Error(
      `mint-token failed: ${res.status()} ${await res.text()}`
    );
  }

  const { token } = await res.json() as { token: string };

  // Inject token + minimal user object into localStorage before navigation
  await page.addInitScript(
    ({ token, role, sub }: { token: string; role: string; sub: string }) => {
      localStorage.setItem('token', token);
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: sub,
          phone: '+15550000001',
          displayName: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          primaryRole: role,
        })
      );
    },
    { token, role, sub }
  );
}

/**
 * Mock all NestJS backend API calls with empty-but-valid responses so that
 * dashboard pages render their empty-state UI without a real backend.
 */
export async function mockBackendEmpty(page: Page) {
  const API = 'http://localhost:3001/api';

  await page.route(`${API}/slots/search`, (route) =>
    route.fulfill({ json: [] })
  );
  await page.route(`${API}/offers`, (route) =>
    route.fulfill({ json: [] })
  );
  await page.route(`${API}/trucks`, (route) =>
    route.fulfill({ json: [] })
  );
  await page.route(`${API}/bookings`, (route) =>
    route.fulfill({ json: [] })
  );
  await page.route(`${API}/requests`, (route) =>
    route.fulfill({ json: [] })
  );
  await page.route(`${API}/requests/**`, (route) =>
    route.fulfill({ json: [] })
  );
  await page.route(`${API}/realtime/**`, (route) =>
    route.abort()
  );
}
