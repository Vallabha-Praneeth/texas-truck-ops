import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { swipeLeft, swipeRight } from '../helpers/gestures';

describe('Gesture Interactions', () => {
  let dashboardPage: DashboardPage;

  before(async () => {
    // Login
    const loginPage = new LoginPage();
    await loginPage.ensureAuthenticated('+15551234567', '123456');

    dashboardPage = new DashboardPage();
    await dashboardPage.waitForLoad();
  });

  it('should pull to refresh', async () => {
    await dashboardPage.pullToRefresh();
    await dashboardPage.waitForLoad();
    expect(await dashboardPage.hasSection('Upcoming Slots')).toBe(true);
  });

  it('should handle horizontal swipes without crashing', async () => {
    await swipeLeft();
    await dashboardPage.pause(500);
    await swipeRight();
    await dashboardPage.pause(500);
    await dashboardPage.waitForLoad();
    expect(await dashboardPage.hasSection('Live Data Source')).toBe(true);
  });
});
