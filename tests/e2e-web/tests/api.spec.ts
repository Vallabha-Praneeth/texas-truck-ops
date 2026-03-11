import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_URL || 'http://localhost:8002/api';

test.describe('API Endpoints', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { phone: '+15551234567' },
    });
    expect(loginResponse.ok()).toBeTruthy();

    const otpResponse = await request.post(`${API_BASE_URL}/auth/verify-otp`, {
      data: { phone: '+15551234567', code: '123456' },
    });
    expect(otpResponse.ok()).toBeTruthy();

    const data = await otpResponse.json();
    authToken = data.token;
  });

  test('GET /api/slots/search - should return slots list', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/slots/search`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('POST /api/requests - should create a request', async ({ request }) => {
    const requestData = {
      region: 'DFW',
      title: 'API E2E Request',
      description: 'Created by Playwright API test',
      preferredStartAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      preferredEndAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      budgetCents: 500000,
    };

    const response = await request.post(`${API_BASE_URL}/requests`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: requestData,
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data.title).toBe(requestData.title);
  });

  test('GET /api/offers - should return offers list', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/offers`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('GET /api/requests - should return requests list', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/requests`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('GET /api/trucks - should return trucks list', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/trucks`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('should reject unauthorized requests', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/slots/search`);

    expect(response.status()).toBe(401);
  });

  test('should handle invalid token', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/slots/search`, {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    expect(response.status()).toBe(401);
  });
});
