import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false, // Run tests sequentially for API tests
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1, // Single worker for API tests
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3010',
        trace: 'on-first-retry',
    },

    projects: [
        {
            name: 'api-tests',
            testMatch: '**/*.spec.ts',
        },
    ],

    // Run the API server before tests (only in local development)
    // In CI, the server is started manually in the workflow
    webServer: process.env.CI ? undefined : {
        command: 'pnpm dev',
        url: 'http://localhost:3010/api',
        reuseExistingServer: true,
        timeout: 120 * 1000,
    },
});
