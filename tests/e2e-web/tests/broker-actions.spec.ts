import { test, expect } from '../fixtures/auth';
import type { Page } from '@playwright/test';

const corsHeaders = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': 'Authorization,Content-Type',
};

function toDateTimeLocal(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

type RequestItem = {
  id: string;
  region: string;
  title: string;
  description: string;
  preferredStartAt: string;
  preferredEndAt: string;
  budgetCents: number;
  status: string;
};

type SlotItem = {
  id: string;
  region: string;
  startAt: string;
  endAt: string;
  radiusMiles: number;
  isBooked?: boolean;
};

type OfferItem = {
  id: string;
  amountCents: number;
  status: string;
  slotId?: string;
  createdAt: string;
};

type BrokerSeed = {
  requests?: RequestItem[];
  slots?: SlotItem[];
  offers?: OfferItem[];
};

async function seedAuth(page: Page, role: 'operator' | 'broker' | 'driver' = 'broker') {
  await page.goto('/');
  await page.evaluate(({ seededRole }) => {
    const user = {
      id: `${seededRole}-user-seeded`,
      phone: '+15551234567',
      displayName: seededRole === 'broker' ? 'Test Broker' : 'Test User',
      primaryRole: seededRole,
    };
    localStorage.setItem('token', 'w2-seeded-token');
    localStorage.setItem('user', JSON.stringify(user));
  }, { seededRole: role });
}

async function stubBrokerDashboard(page: Page, seed: BrokerSeed = {}) {
  const state = {
    requests: [...(seed.requests || [])],
    slots: [...(seed.slots || [])],
    offers: [...(seed.offers || [])],
    requestPostPayload: null as Record<string, unknown> | null,
    requestPatchPayload: null as Record<string, unknown> | null,
    requestDeleteId: null as string | null,
    offerPostPayload: null as Record<string, unknown> | null,
    slotSearchUrls: [] as string[],
    requestOffersCalls: [] as string[],
    offersGetCount: 0,
  };

  await page.route(/\/requests(?:\/.*)?(?:\?.*)?$/, async (route) => {
    const method = route.request().method();
    const pathname = new URL(route.request().url()).pathname;
    const collectionPath = /\/requests\/?$/.test(pathname);
    const offersPath = /\/requests\/[^/]+\/offers\/?$/.test(pathname);
    const itemPath = /\/requests\/[^/]+\/?$/.test(pathname);

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    if (method === 'GET' && collectionPath) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify(state.requests),
      });
      return;
    }

    if (method === 'POST' && collectionPath) {
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      state.requestPostPayload = payload;
      const created: RequestItem = {
        id: `request-${state.requests.length + 1}`,
        region: String(payload.region || 'DFW'),
        title: String(payload.title || ''),
        description: String(payload.description || ''),
        preferredStartAt: String(payload.preferredStartAt || new Date().toISOString()),
        preferredEndAt: String(payload.preferredEndAt || new Date().toISOString()),
        budgetCents: Number(payload.budgetCents || 0),
        status: 'open',
      };
      state.requests.unshift(created);
      await route.fulfill({
        status: 201,
        headers: corsHeaders,
        body: JSON.stringify(created),
      });
      return;
    }

    if (method === 'GET' && offersPath) {
      state.requestOffersCalls.push(route.request().url());
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          offers: [
            {
              id: 'request-offer-1',
              amountCents: 111000,
              status: 'pending',
              slot: {
                id: 'slot-9',
                startAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
                truck: { nickname: 'Blue Beast' },
              },
            },
          ],
        }),
      });
      return;
    }

    if (method === 'PATCH' && itemPath) {
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      const id = pathname.split('/').filter(Boolean).pop() || '';
      state.requestPatchPayload = payload;
      state.requests = state.requests.map((request) =>
        request.id === id ? ({ ...request, ...payload } as RequestItem) : request
      );
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({ id, ...payload }),
      });
      return;
    }

    if (method === 'DELETE' && itemPath) {
      const id = pathname.split('/').filter(Boolean).pop() || '';
      state.requestDeleteId = id;
      state.requests = state.requests.filter((request) => request.id !== id);
      await route.fulfill({ status: 204, headers: corsHeaders, body: '' });
      return;
    }

    await route.continue();
  });

  await page.route('**/slots/search**', async (route) => {
    const method = route.request().method();
    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (method !== 'GET') {
      await route.continue();
      return;
    }

    state.slotSearchUrls.push(route.request().url());
    await route.fulfill({
      status: 200,
      headers: corsHeaders,
      body: JSON.stringify(state.slots),
    });
  });

  await page.route(/\/offers(?:\?.*)?$/, async (route) => {
    const method = route.request().method();

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    if (method === 'GET') {
      state.offersGetCount += 1;
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify(state.offers),
      });
      return;
    }

    if (method === 'POST') {
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      state.offerPostPayload = payload;
      const created: OfferItem = {
        id: `offer-${state.offers.length + 1}`,
        amountCents: Number(payload.amountCents || 0),
        status: 'pending',
        slotId: String(payload.slotId || ''),
        createdAt: new Date().toISOString(),
      };
      state.offers.unshift(created);
      await route.fulfill({
        status: 201,
        headers: corsHeaders,
        body: JSON.stringify(created),
      });
      return;
    }

    await route.continue();
  });

  return state;
}

test.describe('Broker Action Coverage', () => {
  test('BR-01 should create request and persist card', async ({ page }) => {
    await seedAuth(page, 'broker');
    const state = await stubBrokerDashboard(page, {
      requests: [],
      slots: [],
      offers: [],
    });

    await page.goto('/broker');
    await expect(page.getByRole('heading', { name: 'Broker Dashboard' })).toBeVisible();

    await page.getByRole('button', { name: 'Create Request' }).first().click();

    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const end = new Date(Date.now() + 30 * 60 * 60 * 1000);

    await page.getByTestId('request-title').fill('W1 Broker Request');
    await page.getByTestId('request-region').fill('DFW');
    await page.getByTestId('request-start').fill(toDateTimeLocal(start));
    await page.getByTestId('request-end').fill(toDateTimeLocal(end));
    await page.getByTestId('request-budget').fill('5000');
    await page.getByTestId('request-description').fill('Campaign launch in Dallas');
    await page.getByTestId('save-request-button').click();

    expect(state.requestPostPayload?.title).toBe('W1 Broker Request');
    expect(state.requests.some((request) => request.title === 'W1 Broker Request')).toBeTruthy();
    await expect(page.getByText('W1 Broker Request')).toBeVisible();
  });

  test('BR-02 should edit request through PATCH', async ({ page }) => {
    await seedAuth(page, 'broker');
    const requestSeed: RequestItem = {
      id: 'request-edit-1',
      title: 'W2 Edit Request',
      description: 'Original desc',
      region: 'DFW',
      preferredStartAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      preferredEndAt: new Date(Date.now() + 60 * 60 * 60 * 1000).toISOString(),
      budgetCents: 100000,
      status: 'open',
    };

    const state = await stubBrokerDashboard(page, { requests: [requestSeed] });

    await page.goto('/broker');
    const card = page.getByTestId('request-card').filter({ hasText: 'W2 Edit Request' }).first();
    await expect(card).toBeVisible();
    await card.getByTestId('edit-request-button').click();

    await page.getByTestId('request-title').fill('W2 Edited Request');
    await page.getByTestId('save-request-button').click();

    expect(state.requestPatchPayload?.title).toBe('W2 Edited Request');
    await expect(page.getByText('W2 Edited Request')).toBeVisible();
  });

  test('BR-03 should delete request and show empty state', async ({ page }) => {
    await seedAuth(page, 'broker');
    const requestSeed: RequestItem = {
      id: 'request-delete-1',
      title: 'W2 Delete Request',
      description: 'to be deleted',
      region: 'DFW',
      preferredStartAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      preferredEndAt: new Date(Date.now() + 60 * 60 * 60 * 1000).toISOString(),
      budgetCents: 90000,
      status: 'open',
    };

    const state = await stubBrokerDashboard(page, { requests: [requestSeed] });

    await page.goto('/broker');
    const card = page.getByTestId('request-card').filter({ hasText: 'W2 Delete Request' }).first();
    await expect(card).toBeVisible();

    page.once('dialog', async (dialog) => dialog.accept());
    await card.getByTestId('delete-request-button').click();

    await expect.poll(() => state.requestDeleteId).toBe('request-delete-1');
    await expect(page.getByTestId('request-empty-state')).toBeVisible();
  });

  test('BR-04 should send slot search filters in query params', async ({ page }) => {
    await seedAuth(page, 'broker');
    const state = await stubBrokerDashboard(page, {
      requests: [],
      slots: [],
      offers: [],
    });

    await page.goto('/broker');
    await page.getByRole('tab', { name: 'Available Slots' }).click();

    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const end = new Date(Date.now() + 72 * 60 * 60 * 1000);

    await page.getByTestId('slot-search-region').fill('Houston');
    await page.getByTestId('slot-search-start').fill(toDateTimeLocal(start));
    await page.getByTestId('slot-search-end').fill(toDateTimeLocal(end));
    await page.getByTestId('slot-search-submit').click();

    const lastSearch = state.slotSearchUrls[state.slotSearchUrls.length - 1] || '';
    expect(lastSearch).toContain('region=Houston');
    expect(lastSearch).toContain('startAt=');
    expect(lastSearch).toContain('endAt=');
  });

  test('BR-05 should make offer from slot', async ({ page }) => {
    await seedAuth(page, 'broker');
    const state = await stubBrokerDashboard(page, {
      requests: [],
      slots: [
        {
          id: 'slot-offer-1',
          region: 'DFW',
          startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endAt: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
          radiusMiles: 25,
          isBooked: false,
        },
      ],
      offers: [],
    });

    await page.goto('/broker');
    await page.getByRole('tab', { name: 'Available Slots' }).click();
    await page.getByTestId('make-offer-button').first().click();
    await page.getByTestId('offer-amount').fill('1200');
    await page.getByTestId('submit-offer-button').click();

    expect(state.offerPostPayload?.slotId).toBe('slot-offer-1');
    expect(state.offerPostPayload?.amountCents).toBe(120000);
  });

  test('BR-06 should open request offers modal and list offers', async ({ page }) => {
    await seedAuth(page, 'broker');
    await stubBrokerDashboard(page, {
      requests: [
        {
          id: 'request-offers-1',
          title: 'W2 Offers Request',
          description: 'show me offers',
          region: 'DFW',
          preferredStartAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          preferredEndAt: new Date(Date.now() + 60 * 60 * 60 * 1000).toISOString(),
          budgetCents: 150000,
          status: 'open',
        },
      ],
      slots: [],
      offers: [],
    });

    let requestOffersCalls = 0;
    await page.route('**/requests/*/offers**', async (route) => {
      const method = route.request().method();
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders });
        return;
      }
      if (method !== 'GET') {
        await route.continue();
        return;
      }

      requestOffersCalls += 1;
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          offers: [
            {
              id: 'request-offer-1',
              amountCents: 111000,
              status: 'pending',
              slot: {
                id: 'slot-9',
                startAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
                truck: { nickname: 'Blue Beast' },
              },
            },
          ],
        }),
      });
    });

    await page.goto('/broker');
    const card = page.getByTestId('request-card').filter({ hasText: 'W2 Offers Request' }).first();
    await expect(card).toBeVisible();
    await card.getByTestId('view-request-offers-button').click();
    await expect
      .poll(() => requestOffersCalls)
      .toBeGreaterThan(0);
    await expect(page.getByTestId('request-offer-card')).toHaveCount(1, {
      timeout: 10000,
    });
  });

  test('BR-07 should render sent offer statuses in offers tab', async ({ page }) => {
    await seedAuth(page, 'broker');
    const state = await stubBrokerDashboard(page, {
      requests: [],
      slots: [],
      offers: [
        {
          id: 'offer-status-1',
          amountCents: 100000,
          status: 'accepted',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'offer-status-2',
          amountCents: 90000,
          status: 'rejected',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'offer-status-3',
          amountCents: 80000,
          status: 'countered',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'offer-status-4',
          amountCents: 70000,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ],
    });

    await page.goto('/broker');
    await page.getByRole('tab', { name: 'My Sent Offers' }).click();

    expect(state.offersGetCount).toBeGreaterThan(0);
    await expect(page.getByText(/Status:\s*accepted/i)).toBeVisible();
    await expect(page.getByText(/Status:\s*rejected/i)).toBeVisible();
    await expect(page.getByText(/Status:\s*countered/i)).toBeVisible();
    await expect(page.getByText(/Status:\s*pending/i)).toBeVisible();
  });

  test('ERR-01 should surface broker page error when requests API fails', async ({ page }) => {
    await seedAuth(page, 'broker');
    await stubBrokerDashboard(page, {
      requests: [],
      slots: [],
      offers: [],
    });

    await page.unroute('**/requests**');
    await page.route('**/requests**', async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders });
        return;
      }
      if (method === 'GET' && !/\/requests\/[^/]+\/offers/.test(url)) {
        await route.fulfill({
          status: 500,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Requests service unavailable' }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto('/broker');
    await expect(page.getByTestId('broker-error')).toHaveText(
      /Some broker data failed to load: requests/
    );
  });
});
