import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:8001',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:8001',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      JWT_SECRET: process.env.JWT_SECRET ?? 'dev-secret-key-change-in-production',
      DEV_ONLY: 'true',
      NEXT_PUBLIC_API_URL: 'http://localhost:3001/api',
    },
  },
});
