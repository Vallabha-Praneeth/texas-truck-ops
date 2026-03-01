import * as fs from 'node:fs';

/**
 * Base Page Object for mobile screens
 */
export class BasePage {
  private async swipeVertical(startYRatio: number, endYRatio: number) {
    const { height, width } = await driver.getWindowSize();
    const x = Math.round(width / 2);
    const startY = Math.round(height * startYRatio);
    const endY = Math.round(height * endYRatio);

    await driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x, y: startY },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration: 100 },
          { type: 'pointerMove', duration: 300, x, y: endY },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ]);

    try {
      await driver.releaseActions();
    } catch {
      // Some drivers may auto-release actions.
    }
  }

  private async captureWaitTimeoutDebug(selectorLabel: string, error: unknown) {
    const safeSelector = selectorLabel.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const timestamp = Date.now();
    const artifactsDir = './artifacts';
    const sourcePath = `${artifactsDir}/wait-timeout-${safeSelector}-${timestamp}.xml`;
    const screenshotPath = `${artifactsDir}/wait-timeout-${safeSelector}-${timestamp}.png`;

    fs.mkdirSync(artifactsDir, { recursive: true });

    try {
      const source = await driver.getPageSource();
      fs.writeFileSync(sourcePath, source, 'utf8');
    } catch {
      // Ignore source capture errors and keep original test failure context.
    }

    try {
      await driver.saveScreenshot(screenshotPath);
    } catch {
      // Ignore screenshot capture errors and keep original test failure context.
    }

    const reason = error instanceof Error ? error.message : String(error);

    return {
      reason,
      sourcePath,
      screenshotPath,
    };
  }

  /**
   * Wait for screen to load
   */
  async waitForLoad(selector: string, timeout: number = 30000) {
    const element = await $(selector);
    try {
      await element.waitForDisplayed({ timeout });
    } catch (error) {
      const { reason, sourcePath, screenshotPath } =
        await this.captureWaitTimeoutDebug(selector, error);

      throw new Error(
        [
          `element ("${selector}") still not displayed after ${timeout}ms`,
          `debug source: ${sourcePath}`,
          `debug screenshot: ${screenshotPath}`,
          `original error: ${reason}`,
        ].join('\n')
      );
    }
  }

  /**
   * Wait until any selector is visible and return the matched selector.
   */
  async waitForAnyDisplayed(
    selectors: string[],
    timeout: number = 30000,
    pollMs: number = 300
  ): Promise<string> {
    const endAt = Date.now() + timeout;
    const normalized = selectors.filter(Boolean);
    const selectorLabel = normalized.join(' | ');

    while (Date.now() < endAt) {
      for (const candidate of normalized) {
        try {
          const element = await $(candidate);
          if (await element.isDisplayed()) {
            return candidate;
          }
        } catch {
          // Ignore transient lookup errors and keep polling.
        }
      }

      await driver.pause(pollMs);
    }

    const { reason, sourcePath, screenshotPath } =
      await this.captureWaitTimeoutDebug(selectorLabel, `timeout ${timeout}ms`);

    throw new Error(
      [
        `none of selectors displayed after ${timeout}ms`,
        `selectors: ${selectorLabel}`,
        `debug source: ${sourcePath}`,
        `debug screenshot: ${screenshotPath}`,
        `original error: ${reason}`,
      ].join('\n')
    );
  }

  /**
   * Get element by accessibility ID (testID)
   */
  async getByTestId(testId: string): Promise<WebdriverIO.Element> {
    return (await $(`~${testId}`)) as unknown as WebdriverIO.Element;
  }

  /**
   * Get element by text
   */
  async getByText(text: string): Promise<WebdriverIO.Element> {
    if (driver.isIOS) {
      return (await $(
        `-ios predicate string:label == "${text}"`
      )) as unknown as WebdriverIO.Element;
    }
    return (await $(
      `android=new UiSelector().text("${text}")`
    )) as unknown as WebdriverIO.Element;
  }

  /**
   * Tap on element
   */
  async tap(element: WebdriverIO.Element) {
    await element.click();
  }

  /**
   * Fill input field
   */
  async fillInput(element: WebdriverIO.Element, text: string) {
    await element.clearValue();
    await element.setValue(text);
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      const element = await $(selector);
      return await element.isDisplayed();
    } catch {
      return false;
    }
  }

  /**
   * Scroll to element
   */
  async scrollTo(selector: string, maxScrolls: number = 5) {
    let scrollCount = 0;

    while (scrollCount < maxScrolls) {
      const element = await $(selector);

      if (await element.isDisplayed()) {
        return element;
      }

      await this.swipeVertical(0.8, 0.2);

      scrollCount++;
    }

    throw new Error(
      `Element ${selector} not found after ${maxScrolls} scrolls`
    );
  }

  /**
   * Take screenshot
   */
  async screenshot(name: string) {
    await driver.saveScreenshot(`./screenshots/${name}.png`);
  }

  /**
   * Wait for specific time
   */
  async pause(ms: number) {
    await driver.pause(ms);
  }

  /**
   * Go back
   */
  async goBack() {
    if (driver.isIOS) {
      await driver.back();
    } else {
      await driver.pressKeyCode(4); // Android back button
    }
  }
}
