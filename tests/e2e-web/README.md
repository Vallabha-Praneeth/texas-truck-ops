# Playwright E2E Tests

End-to-end tests for the LED Billboard Marketplace admin web app.

## 📁 Structure

```
tests/e2e-web/
├── fixtures/
│   └── auth.ts           # Auth fixtures and helpers
├── pages/
│   ├── BasePage.ts       # Base page object
│   ├── LoginPage.ts      # Login page object
│   └── DashboardPage.ts  # Dashboard page object
├── tests/
│   ├── auth.spec.ts      # Authentication tests
│   ├── dashboard.spec.ts # Dashboard tests
│   └── api.spec.ts       # API endpoint tests
└── README.md
```

## 🚀 Quick Start

### Install Dependencies
```bash
pnpm install
```

### Install Playwright Browsers
```bash
pnpm playwright install
```

### Run All Tests
```bash
pnpm test:e2e:web
```

### Run Specific Browser
```bash
pnpm test:e2e:web --project=chromium
pnpm test:e2e:web --project=firefox
pnpm test:e2e:web --project=webkit
```

### Run Specific Test File
```bash
pnpm test:e2e:web tests/e2e-web/tests/auth.spec.ts
```

### Run in UI Mode (Interactive)
```bash
pnpm playwright test --ui
```

### Run in Debug Mode
```bash
pnpm playwright test --debug
```

## 📝 Writing Tests

### Page Object Model

Use Page Objects to interact with UI elements:

```typescript
import { test, expect } from '../fixtures/auth';

test('my test', async ({ dashboardPage }) => {
  await dashboardPage.goto();
  await dashboardPage.clickAddSlot();
  expect(await dashboardPage.getSlotCount()).toBeGreaterThan(0);
});
```

### Authentication

Use the `authenticatedPage` fixture for tests that require login:

```typescript
test('authenticated test', async ({ authenticatedPage }) => {
  // Already logged in!
  await authenticatedPage.refresh();
});
```

### API Testing

Test API endpoints directly:

```typescript
test('API test', async ({ request }) => {
  const response = await request.get('/api/slots', {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(Array.isArray(data)).toBeTruthy();
});
```

## 🎯 Test Coverage

### ✅ Authentication (`auth.spec.ts`)
- Login form display
- Phone number validation
- OTP sending
- OTP verification
- Invalid credentials handling
- Session persistence

### ✅ Dashboard (`dashboard.spec.ts`)
- KPI cards display
- Slot list rendering
- Navigation to slot detail
- Add slot functionality
- Notification badge
- Quick actions
- Empty states
- Error handling
- Data refresh

### ✅ API Endpoints (`api.spec.ts`)
- GET /api/slots
- POST /api/slots
- GET /api/offers
- GET /api/bookings
- GET /api/trucks
- Authentication
- Authorization

## 📊 Reports

### HTML Report
```bash
pnpm playwright show-report
```

### JSON Report
Located at: `playwright-report/results.json`

### Screenshots & Videos
Failed tests automatically capture:
- Screenshots: `test-results/*/test-failed-*.png`
- Videos: `test-results/*/video.webm`

## 🔧 Configuration

Edit `playwright.config.ts` to customize:

- Base URL
- Timeouts
- Browsers
- Parallel execution
- Retry logic
- Screenshots/videos
- Reporters

## 🏃 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: pnpm playwright install --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e:web

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## 🐛 Debugging

### Debug Mode
```bash
pnpm playwright test --debug
```

### Headed Mode (See Browser)
```bash
pnpm playwright test --headed
```

### Slow Motion
```bash
pnpm playwright test --slow-mo=1000
```

### Inspector
```bash
pnpm playwright test --ui
```

### Trace Viewer
```bash
pnpm playwright show-trace test-results/*/trace.zip
```

## 📝 Best Practices

1. **Use Page Objects** - Encapsulate page interactions
2. **Use Test IDs** - Add `data-testid` attributes for reliable selectors
3. **Avoid Hardcoded Waits** - Use Playwright's auto-waiting
4. **Test User Flows** - Test complete workflows, not just individual features
5. **Keep Tests Independent** - Each test should be runnable in isolation
6. **Use Fixtures** - Share setup code with fixtures
7. **Mock External APIs** - Use `page.route()` for predictable tests

## 🔗 Resources

- [Playwright Docs](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-test)
