import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for running against already-running Docker services.
 * Expects admin on :4000 and API on :4001 by default.
 */
export default defineConfig({
  testDir: './tests/e2e-web/tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
