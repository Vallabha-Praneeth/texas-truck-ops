import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { selectors } from '../helpers/selectors';

describe('Operator Dashboard', () => {
  let dashboardPage: DashboardPage;

  before(async () => {
    // Login first
    const loginPage = new LoginPage();
    await loginPage.ensureAuthenticated('+15551234567', '123456');

    dashboardPage = new DashboardPage();
    await dashboardPage.waitForLoad();
  });

  it('should display dashboard', async () => {
    await dashboardPage.waitForLoad();
    expect(await dashboardPage.hasSection('Upcoming Slots')).toBe(true);
  });

  it('should render core sections', async () => {
    expect(await dashboardPage.hasSection('Upcoming Slots')).toBe(true);
    expect(await dashboardPage.hasSection('Live Data Source')).toBe(true);
  });

  it('should refresh data on pull down without leaving dashboard', async () => {
    await dashboardPage.pullToRefresh();
    await dashboardPage.waitForLoad();
    expect(await dashboardPage.hasSection('Live Data Source')).toBe(true);
  });

  it('should allow logout back to auth screen', async () => {
    await dashboardPage.logout();
    const phoneInput = await $(selectors.phoneInput);
    await phoneInput.waitForDisplayed({ timeout: 15000 });
  });
});
