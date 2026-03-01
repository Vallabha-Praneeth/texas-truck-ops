import { BasePage } from './BasePage';
import { selectors, containsText, text } from '../helpers/selectors';
import { swipeDown } from '../helpers/gestures';

/**
 * Dashboard Page Object (Operator Dashboard)
 */
export class DashboardPage extends BasePage {
  async waitForLoad() {
    await this.waitForAnyDisplayed(
      [selectors.dashboardReady, selectors.dashboard],
      45000
    );
  }

  /**
   * Pull to refresh
   */
  async pullToRefresh() {
    await swipeDown(300);
    await this.pause(1000);
  }

  /**
   * Check if a section title is visible.
   */
  async hasSection(title: string): Promise<boolean> {
    const exactTextSelector = text(title);

    if (await this.isVisible(exactTextSelector)) {
      return true;
    }

    if (driver.isAndroid) {
      try {
        const scrolled = await $(
          `android=new UiScrollable(new UiSelector().scrollable(true)).scrollTextIntoView("${title}")`
        );
        return await scrolled.isDisplayed();
      } catch {
        // Fallback to generic swipe scrolling below.
      }
    }

    const partialTextSelector = containsText(title);

    try {
      await this.scrollTo(partialTextSelector, 4);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Logout from operator dashboard.
   */
  async logout() {
    await this.waitForLoad();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const logoutCandidates = await $$('~logout-button');

      if (logoutCandidates.length > 0 && (await logoutCandidates[0].isDisplayed())) {
        await this.tap(logoutCandidates[0] as unknown as WebdriverIO.Element);
        return;
      }

      try {
        const logoutByText = await this.getByText('Log Out');
        if (await logoutByText.isDisplayed()) {
          await this.tap(logoutByText);
          return;
        }
      } catch {
        // Keep trying with scroll gestures.
      }

      await swipeDown(300);
      await this.pause(300);
    }

    throw new Error('logout-button not found on dashboard after scrolling');
  }
}
