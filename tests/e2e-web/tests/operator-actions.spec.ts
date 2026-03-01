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

type Slot = {
  id: string;
  truckId: string;
  startAt: string;
  endAt: string;
  region: string;
  radiusMiles: number;
  repositionAllowed: boolean;
  maxRepositionMiles: number;
  notes?: string;
  isBooked: boolean;
};

type Offer = {
  id: string;
  amountCents: number;
  slotId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';
  createdAt: string;
};

type Truck = {
  id: string;
  nickname: string;
  plateNumber: string;
  screenSizeFt: string;
  baseRegion: string;
};

type Booking = {
  id: string;
  status: string;
  amountCents: number;
  depositCents: number;
  createdAt: string;
  slot: {
    id: string;
    startAt: string;
    endAt: string;
    region: string;
    truck: {
      id: string;
      nickname: string;
      plateNumber: string;
    };
  };
};

type OperatorSeed = {
  slots?: Slot[];
  offers?: Offer[];
  trucks?: Truck[];
  bookings?: Booking[];
};

async function seedAuth(page: Page, role: 'operator' | 'broker' | 'driver' = 'operator') {
  await page.goto('/');
  await page.evaluate(({ seededRole }) => {
    const user = {
      id: `${seededRole}-user-seeded`,
      phone: '+15551234567',
      displayName: seededRole === 'operator' ? 'Test Operator' : 'Test User',
      primaryRole: seededRole,
    };
    localStorage.setItem('token', 'w2-seeded-token');
    localStorage.setItem('user', JSON.stringify(user));
  }, { seededRole: role });
}

async function stubOperatorDashboard(page: Page, seed: OperatorSeed = {}) {
  const state = {
    slots: [...(seed.slots || [])],
    offers: [...(seed.offers || [])],
    trucks: [...(seed.trucks || [])],
    bookings: [...(seed.bookings || [])],
    slotPostPayload: null as Record<string, unknown> | null,
    slotPatchPayload: null as Record<string, unknown> | null,
    slotDeleteId: null as string | null,
    offerPatchStatuses: [] as string[],
    slotsGetCount: 0,
  };

  await page.route(/\/slots\/search(?:\?.*)?$/, async (route) => {
    const method = route.request().method();
    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (method !== 'GET') {
      await route.continue();
      return;
    }

    state.slotsGetCount += 1;
    await route.fulfill({
      status: 200,
      headers: corsHeaders,
      body: JSON.stringify(state.slots),
    });
  });

  await page.route(/\/slots(?:\?.*)?$/, async (route) => {
    const method = route.request().method();
    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (method !== 'POST') {
      await route.continue();
      return;
    }

    const payload = route.request().postDataJSON() as Record<string, unknown>;
    state.slotPostPayload = payload;
    const created: Slot = {
      id: `slot-created-${state.slots.length + 1}`,
      truckId: String(payload.truckId || ''),
      startAt: String(payload.startAt || new Date().toISOString()),
      endAt: String(payload.endAt || new Date().toISOString()),
      region: String(payload.region || 'DFW'),
      radiusMiles: Number(payload.radiusMiles || 1),
      repositionAllowed: Boolean(payload.repositionAllowed),
      maxRepositionMiles: Number(payload.maxRepositionMiles || 0),
      notes: typeof payload.notes === 'string' ? payload.notes : '',
      isBooked: false,
    };
    state.slots.unshift(created);

    await route.fulfill({
      status: 201,
      headers: corsHeaders,
      body: JSON.stringify(created),
    });
  });

  await page.route(/\/slots\/(?!search(?:\?|$))[^/?]+(?:\?.*)?$/, async (route) => {
    const method = route.request().method();
    const id = route.request().url().split('/').pop() || '';

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    if (method === 'PATCH') {
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      state.slotPatchPayload = payload;
      state.slots = state.slots.map((slot) =>
        slot.id === id ? { ...slot, ...payload } : slot
      );
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({ id, ...payload }),
      });
      return;
    }

    if (method === 'DELETE') {
      state.slotDeleteId = id;
      state.slots = state.slots.filter((slot) => slot.id !== id);
      await route.fulfill({ status: 204, headers: corsHeaders, body: '' });
      return;
    }

    await route.continue();
  });

  await page.route('**/offers**', async (route) => {
    const method = route.request().method();
    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (method !== 'GET') {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      headers: corsHeaders,
      body: JSON.stringify(state.offers),
    });
  });

  await page.route('**/offers/*', async (route) => {
    const method = route.request().method();
    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (method !== 'PATCH') {
      await route.continue();
      return;
    }

    const id = route.request().url().split('/').pop() || '';
    const payload = route.request().postDataJSON() as { status: string };
    state.offerPatchStatuses.push(payload.status);
    state.offers = state.offers.map((offer) =>
      offer.id === id ? { ...offer, status: payload.status as Offer['status'] } : offer
    );

    await route.fulfill({
      status: 200,
      headers: corsHeaders,
      body: JSON.stringify({ id, status: payload.status }),
    });
  });

  await page.route('**/trucks**', async (route) => {
    const method = route.request().method();
    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (method !== 'GET') {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      headers: corsHeaders,
      body: JSON.stringify(state.trucks),
    });
  });

  await page.route('**/bookings**', async (route) => {
    const method = route.request().method();
    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (method !== 'GET') {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      headers: corsHeaders,
      body: JSON.stringify(state.bookings),
    });
  });

  return state;
}

test.describe('Operator Action Coverage', () => {
  test('OP-02 should create slot successfully and render seeded state', async ({
    page,
  }) => {
    await seedAuth(page, 'operator');
    const state = await stubOperatorDashboard(page, {
      slots: [],
      offers: [],
      trucks: [],
      bookings: [],
    });

    await page.goto('/operator');
    await expect(page.getByRole('heading', { name: 'Operator Dashboard' })).toBeVisible();

    await page.getByTestId('add-slot-button').click();
    const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endAt = new Date(Date.now() + 26 * 60 * 60 * 1000);

    await page.getByTestId('slot-truckId').fill('truck-123');
    await page.getByTestId('slot-startAt').fill(toDateTimeLocal(startAt));
    await page.getByTestId('slot-endAt').fill(toDateTimeLocal(endAt));
    await page.getByTestId('slot-radiusMiles').fill('25');
    await page.getByTestId('create-slot-submit').click();

    expect(state.slotPostPayload?.truckId).toBe('truck-123');
    expect(state.slots.some((slot) => slot.truckId === 'truck-123')).toBeTruthy();
    expect(state.slotsGetCount).toBeGreaterThan(0);
  });

  test('OP-02/ERR-01 should show slot save error when API fails', async ({
    page,
  }) => {
    await seedAuth(page, 'operator');
    await stubOperatorDashboard(page, { slots: [] });

    await page.route('**/slots', async (route) => {
      const method = route.request().method();
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders });
        return;
      }
      if (method !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Overlapping slot window' }),
      });
    });

    await page.goto('/operator');
    await page.getByTestId('add-slot-button').click();

    const startAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const endAt = new Date(Date.now() + 50 * 60 * 60 * 1000);
    await page.getByTestId('slot-truckId').fill('truck-123');
    await page.getByTestId('slot-startAt').fill(toDateTimeLocal(startAt));
    await page.getByTestId('slot-endAt').fill(toDateTimeLocal(endAt));
    await page.getByTestId('create-slot-submit').click();

    await expect(page.getByTestId('error-message')).toHaveText(/Overlapping slot window/);
  });

  test('OP-03 should edit an existing slot via PATCH', async ({ page }) => {
    await seedAuth(page, 'operator');
    const editSeed: Slot = {
      id: 'slot-edit-1',
      truckId: 'truck-edit-1',
      startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      region: 'DFW',
      radiusMiles: 10,
      repositionAllowed: false,
      maxRepositionMiles: 0,
      notes: 'w2-edit-note',
      isBooked: false,
    };

    const state = await stubOperatorDashboard(page, {
      slots: [editSeed],
      offers: [],
      trucks: [],
      bookings: [],
    });

    await page.goto('/operator');

    const targetCard = page.getByTestId('slot-card').filter({ hasText: 'w2-edit-note' }).first();
    await expect(targetCard).toBeVisible();
    await targetCard.getByRole('button', { name: 'Edit' }).click();

    const patchedStartAt = new Date(Date.now() + 30 * 60 * 60 * 1000);
    const patchedEndAt = new Date(Date.now() + 32 * 60 * 60 * 1000);
    await page.getByTestId('slot-startAt').fill(toDateTimeLocal(patchedStartAt));
    await page.getByTestId('slot-endAt').fill(toDateTimeLocal(patchedEndAt));
    await page.getByTestId('slot-radiusMiles').fill('30');
    await page.getByTestId('create-slot-submit').click();

    await expect.poll(() => state.slotPatchPayload?.radiusMiles).toBe(30);
    expect(state.slots.find((slot) => slot.id === editSeed.id)?.radiusMiles).toBe(30);
  });

  test('OP-04 should delete a target slot', async ({ page }) => {
    await seedAuth(page, 'operator');
    const deleteSeed: Slot = {
      id: 'slot-delete-1',
      truckId: 'truck-delete-1',
      startAt: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 27 * 60 * 60 * 1000).toISOString(),
      region: 'DFW',
      radiusMiles: 10,
      repositionAllowed: false,
      maxRepositionMiles: 0,
      notes: 'w2-delete-note',
      isBooked: false,
    };

    const state = await stubOperatorDashboard(page, {
      slots: [deleteSeed],
      offers: [],
      trucks: [],
      bookings: [],
    });

    await page.goto('/operator');
    const targetCard = page.getByTestId('slot-card').filter({ hasText: 'w2-delete-note' }).first();
    await expect(targetCard).toBeVisible();

    page.once('dialog', async (dialog) => dialog.accept());
    await targetCard.getByRole('button', { name: 'Delete' }).click();

    await expect.poll(() => state.slotDeleteId).toBe(deleteSeed.id);
    await expect.poll(() => state.slots.some((slot) => slot.id === deleteSeed.id)).toBeFalsy();
  });

  test('OP-05/OP-06 should send accepted and rejected statuses', async ({
    page,
  }) => {
    await seedAuth(page, 'operator');
    const state = await stubOperatorDashboard(page, {
      slots: [],
      offers: [
        {
          id: 'offer-a',
          amountCents: 11100,
          slotId: 'slot-offer-a',
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'offer-b',
          amountCents: 22200,
          slotId: 'slot-offer-b',
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ],
      trucks: [],
      bookings: [],
    });

    await page.goto('/operator');

    const firstOffer = page.locator('div.rounded-lg.border.p-4').filter({ hasText: 'slot-offer-a' }).first();
    const secondOffer = page.locator('div.rounded-lg.border.p-4').filter({ hasText: 'slot-offer-b' }).first();

    await expect(firstOffer).toBeVisible();
    await firstOffer.getByRole('button', { name: 'Accept' }).click();

    await expect(secondOffer).toBeVisible();
    await secondOffer.getByRole('button', { name: 'Reject' }).click();

    await expect.poll(() => state.offerPatchStatuses.length).toBeGreaterThanOrEqual(2);
    expect(state.offerPatchStatuses).toEqual(expect.arrayContaining(['accepted', 'rejected']));
  });

  test('OP-07/OP-08 should render trucks/bookings and then empty states', async ({
    page,
  }) => {
    await seedAuth(page, 'operator');
    await stubOperatorDashboard(page, {
      slots: [],
      offers: [],
      trucks: [
        {
          id: 'truck-1',
          nickname: 'Truck W2 Unique',
          plateNumber: 'TX-W2-001',
          screenSizeFt: '10x20',
          baseRegion: 'DFW',
        },
      ],
      bookings: [
        {
          id: 'booking-w2-1',
          status: 'confirmed',
          amountCents: 321000,
          depositCents: 50000,
          createdAt: new Date().toISOString(),
          slot: {
            id: 'slot-b-1',
            startAt: new Date().toISOString(),
            endAt: new Date().toISOString(),
            region: 'DFW',
            truck: {
              id: 'truck-1',
              nickname: 'Truck W2 Unique',
              plateNumber: 'TX-W2-001',
            },
          },
        },
      ],
    });

    await page.goto('/operator');
    await expect(page.getByText('Truck W2 Unique')).toBeVisible();
    await expect(
      page.getByTestId('booking-card').first().getByText('$3210.00')
    ).toBeVisible();

    await page.unroute('**/trucks**');
    await page.unroute('**/bookings**');

    await page.route('**/trucks**', async (route) => {
      const method = route.request().method();
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders });
        return;
      }
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify([]),
      });
    });

    await page.route('**/bookings**', async (route) => {
      const method = route.request().method();
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders });
        return;
      }
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify([]),
      });
    });

    await page.reload();
    await expect(page.getByTestId('empty-trucks')).toBeVisible();
    await expect(page.getByTestId('empty-bookings')).toBeVisible();
  });
});
