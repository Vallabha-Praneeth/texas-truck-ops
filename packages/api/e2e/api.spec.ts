import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3010/api';

// Test data
let authToken: string;
let testOrgId: string;
let testTruckId: string;
let testSlotId: string;
let testRequestId: string;
let testOfferId: string;
let testBookingId: string;
const testPhone = '+12145551234';

test.describe('API E2E Tests', () => {
    test.describe.configure({ mode: 'serial' }); // Run tests in order

    test('1. Health Check - API should be running', async ({ request }) => {
        const response = await request.get(`${API_BASE}`);
        expect(response.ok()).toBeTruthy();
    });

    test('2. Auth - Send OTP', async ({ request }) => {
        const response = await request.post(`${API_BASE}/auth/send-otp`, {
            data: {
                phone: testPhone,
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.message).toBe('OTP sent successfully');
        expect(data.expiresIn).toBe(600);

        console.log('✅ OTP sent successfully');
    });

    test('3. Auth - Verify OTP (will fail without real OTP)', async ({ request }) => {
        // This test will likely fail in automated testing since we need the real OTP
        // In a real scenario, you'd mock the Redis service or use a test OTP
        test.skip(true, 'Skipping OTP verification - requires manual OTP from logs');

        const response = await request.post(`${API_BASE}/auth/verify-otp`, {
            data: {
                phone: testPhone,
                code: '123456', // This would need to be the actual OTP
            },
        });

        if (response.ok()) {
            const data = await response.json();
            authToken = data.token;
            expect(data.user.phone).toBe(testPhone);
            console.log('✅ OTP verified, token obtained');
        }
    });

    test('4. Create Organization', async ({ request }) => {
        // Skip if no auth token
        if (!authToken) {
            test.skip(true, 'Skipping - no auth token available');
            return;
        }

        const response = await request.post(`${API_BASE}/organizations`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
            data: {
                name: 'Test Operator Co',
                type: 'operator',
                contactPhone: '+12145555555',
                contactEmail: 'test@operator.com',
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        testOrgId = data.id;
        expect(data.name).toBe('Test Operator Co');
        expect(data.type).toBe('operator');

        console.log('✅ Organization created:', testOrgId);
    });

    test('5. List Organizations', async ({ request }) => {
        if (!authToken) {
            test.skip(true, 'Skipping - no auth token available');
            return;
        }

        const response = await request.get(`${API_BASE}/organizations`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(Array.isArray(data)).toBeTruthy();

        console.log('✅ Organizations listed:', data.length);
    });

    test('6. Create Truck', async ({ request }) => {
        if (!authToken || !testOrgId) {
            test.skip(true, 'Skipping - no auth token or org ID available');
            return;
        }

        const response = await request.post(`${API_BASE}/trucks`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
            data: {
                orgId: testOrgId,
                nickname: 'Test Truck 1',
                plateNumber: 'TX-TEST-123',
                screenSizeFt: '10x20',
                baseRegion: 'DFW',
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        testTruckId = data.id;
        expect(data.nickname).toBe('Test Truck 1');

        console.log('✅ Truck created:', testTruckId);
    });

    test('7. List Trucks', async ({ request }) => {
        if (!authToken) {
            test.skip(true, 'Skipping - no auth token available');
            return;
        }

        const response = await request.get(`${API_BASE}/trucks`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(Array.isArray(data)).toBeTruthy();

        console.log('✅ Trucks listed:', data.length);
    });

    test('8. Create Availability Slot', async ({ request }) => {
        if (!authToken || !testTruckId) {
            test.skip(true, 'Skipping - no auth token or truck ID available');
            return;
        }

        const startAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        const endAt = new Date(startAt.getTime() + 4 * 60 * 60 * 1000); // 4 hours later

        const response = await request.post(`${API_BASE}/slots`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
            data: {
                truckId: testTruckId,
                startAt: startAt.toISOString(),
                endAt: endAt.toISOString(),
                region: 'DFW',
                radiusMiles: 50,
                repositionAllowed: true,
                maxRepositionMiles: 20,
                notes: 'Test slot for E2E testing',
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        testSlotId = data.id;
        expect(data.region).toBe('DFW');

        console.log('✅ Slot created:', testSlotId);
    });

    test('9. Search Slots', async ({ request }) => {
        if (!authToken) {
            test.skip(true, 'Skipping - no auth token available');
            return;
        }

        const response = await request.get(`${API_BASE}/slots/search`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(Array.isArray(data)).toBeTruthy();

        console.log('✅ Slots searched:', data.length);
    });

    test('10. Create Request', async ({ request }) => {
        if (!authToken) {
            test.skip(true, 'Skipping - no auth token available');
            return;
        }

        const preferredStartAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const preferredEndAt = new Date(preferredStartAt.getTime() + 4 * 60 * 60 * 1000);

        const response = await request.post(`${API_BASE}/requests`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
            data: {
                region: 'DFW',
                title: 'E2E Test Request',
                description: 'Testing request creation via Playwright',
                preferredStartAt: preferredStartAt.toISOString(),
                preferredEndAt: preferredEndAt.toISOString(),
                budgetCents: 50000,
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        testRequestId = data.id;
        expect(data.title).toBe('E2E Test Request');

        console.log('✅ Request created:', testRequestId);
    });

    test('11. List Requests', async ({ request }) => {
        if (!authToken) {
            test.skip(true, 'Skipping - no auth token available');
            return;
        }

        const response = await request.get(`${API_BASE}/requests`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(Array.isArray(data)).toBeTruthy();

        console.log('✅ Requests listed:', data.length);
    });

    test('12. Get Request by ID', async ({ request }) => {
        if (!authToken || !testRequestId) {
            test.skip(true, 'Skipping - no auth token or request ID available');
            return;
        }

        const response = await request.get(`${API_BASE}/requests/${testRequestId}`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.id).toBe(testRequestId);
        expect(data.title).toBe('E2E Test Request');

        console.log('✅ Request retrieved:', data.id);
    });

    test('13. Unauthorized Access - Should fail without token', async ({ request }) => {
        const response = await request.get(`${API_BASE}/requests`);

        expect(response.status()).toBe(401);
        console.log('✅ Unauthorized access correctly blocked');
    });

    test('14. Swagger Documentation - Should be accessible', async ({ request }) => {
        const response = await request.get('http://localhost:3010/api/docs');

        expect(response.ok()).toBeTruthy();
        console.log('✅ Swagger documentation accessible');
    });
});
