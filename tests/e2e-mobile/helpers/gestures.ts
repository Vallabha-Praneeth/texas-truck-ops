/**
 * Common gesture helpers for mobile testing
 */

const toInt = (value: number) => Math.round(value);

async function performSwipe(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  duration: number = 300
) {
  await driver.performActions([
    {
      type: 'pointer',
      id: 'finger1',
      parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x: toInt(startX), y: toInt(startY) },
        { type: 'pointerDown', button: 0 },
        { type: 'pause', duration: 100 },
        {
          type: 'pointerMove',
          duration,
          x: toInt(endX),
          y: toInt(endY),
        },
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

/**
 * Swipe down (pull to refresh)
 */
export async function swipeDown(distance: number = 300) {
  const { height, width } = await driver.getWindowSize();
  const startY = height * 0.2;
  const endY = startY + distance;
  const x = width / 2;

  await performSwipe(x, startY, x, endY);
}

/**
 * Swipe up (scroll down)
 */
export async function swipeUp(distance: number = 300) {
  const { height, width } = await driver.getWindowSize();
  const startY = height * 0.8;
  const endY = startY - distance;
  const x = width / 2;

  await performSwipe(x, startY, x, endY);
}

/**
 * Swipe left (navigate forward)
 */
export async function swipeLeft() {
  const { height, width } = await driver.getWindowSize();
  const y = height / 2;
  const startX = width * 0.8;
  const endX = width * 0.2;

  await performSwipe(startX, y, endX, y);
}

/**
 * Swipe right (navigate back)
 */
export async function swipeRight() {
  const { height, width } = await driver.getWindowSize();
  const y = height / 2;
  const startX = width * 0.2;
  const endX = width * 0.8;

  await performSwipe(startX, y, endX, y);
}

/**
 * Tap on element
 */
export async function tap(element: WebdriverIO.Element) {
  await element.click();
}

/**
 * Long press on element
 */
export async function longPress(element: WebdriverIO.Element, duration: number = 1000) {
  const { x, y } = await element.getLocation();
  const { width, height } = await element.getSize();

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  await driver.performActions([
    {
      type: 'pointer',
      id: 'finger1',
      parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x: toInt(centerX), y: toInt(centerY) },
        { type: 'pointerDown', button: 0 },
        { type: 'pause', duration },
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

/**
 * Scroll to element
 */
export async function scrollToElement(selector: string, maxScrolls: number = 5) {
  let scrollCount = 0;

  while (scrollCount < maxScrolls) {
    const element = await $(selector);

    if (await element.isDisplayed()) {
      return element;
    }

    await swipeUp(200);
    scrollCount++;
  }

  throw new Error(`Element ${selector} not found after ${maxScrolls} scrolls`);
}

/**
 * Wait for element to appear
 */
export async function waitForElement(selector: string, timeout: number = 10000) {
  const element = await $(selector);
  await element.waitForDisplayed({ timeout });
  return element;
}
