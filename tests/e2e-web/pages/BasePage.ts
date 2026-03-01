import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object Model
 * Contains common functionality for all pages
 */
export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to the page
   */
  abstract goto(): Promise<void>;

  /**
   * Wait for page to be fully loaded
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take a screenshot
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Get element by test ID
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Get element by text
   */
  getByText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  /**
   * Get element by role
   */
  getByRole(role: 'button' | 'link' | 'textbox' | 'heading', options?: { name?: string | RegExp }): Locator {
    return this.page.getByRole(role, options);
  }

  /**
   * Wait for specific text to appear
   */
  async waitForText(text: string | RegExp): Promise<void> {
    await this.page.waitForSelector(`text=${text}`);
  }

  /**
   * Click and wait for navigation
   */
  async clickAndNavigate(selector: string): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click(selector),
    ]);
  }
}
