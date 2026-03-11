import { BasePage } from './BasePage';
import { selectors } from '../helpers/selectors';

type EntryState = 'phone' | 'otp' | 'dashboard';

/**
 * Login Page Object
 */
export class LoginPage extends BasePage {
  async waitForLoad(
    selector: string = selectors.phoneInput,
    timeout: number = 30000
  ) {
    await super.waitForLoad(selector, timeout);
  }

  async waitForEntryState(timeout: number = 60000): Promise<EntryState> {
    const match = await this.waitForAnyDisplayed(
      [
        selectors.phoneInput,
        selectors.otpInput,
        selectors.dashboardReady,
        selectors.dashboard,
      ],
      timeout
    );

    if (match === selectors.phoneInput) {
      return 'phone';
    }

    if (match === selectors.otpInput) {
      return 'otp';
    }

    return 'dashboard';
  }

  /**
   * Enter phone number
   */
  async enterPhone(phone: string) {
    const phoneInput = await this.getByTestId('phone-input');
    await this.fillInput(phoneInput, phone);
  }

  /**
   * Click send OTP button
   */
  async clickSendOtp() {
    const button = await this.getByTestId('send-otp-button');
    await this.tap(button);
  }

  /**
   * Enter OTP
   */
  async enterOtp(otp: string) {
    const otpInput = await this.getByTestId('otp-input');
    await this.fillInput(otpInput, otp);
  }

  /**
   * Click verify button
   */
  async clickVerify() {
    const button = await this.getByTestId('verify-button');
    await this.tap(button);
  }

  /**
   * Complete login flow
   */
  async login(phone: string, otp: string) {
    await this.enterPhone(phone);
    await this.clickSendOtp();
    await this.waitForLoad(selectors.otpInput, 15000);
    await this.enterOtp(otp);
    await this.clickVerify();
  }

  /**
   * Ensure the user is authenticated and on dashboard regardless of initial app state.
   */
  async ensureAuthenticated(phone: string, otp: string) {
    const state = await this.waitForEntryState();

    if (state === 'phone') {
      await this.enterPhone(phone);
      await this.clickSendOtp();
      await this.waitForLoad(selectors.otpInput, 20000);
      await this.enterOtp(otp);
      await this.clickVerify();
    } else if (state === 'otp') {
      await this.enterOtp(otp);
      await this.clickVerify();
    }

    await this.waitForAnyDisplayed(
      [selectors.dashboardReady, selectors.dashboard],
      45000
    );
  }

  /**
   * Ensure auth tests start on phone input screen.
   */
  async ensureOnAuthScreen() {
    const state = await this.waitForEntryState();

    if (state === 'dashboard') {
      const logoutButton = await this.getByTestId('logout-button');
      await this.tap(logoutButton);
    } else if (state === 'otp') {
      const useDifferentNumberButton = await this.getByTestId(
        'use-different-number-button'
      );
      await this.tap(useDifferentNumberButton);
    }

    await this.waitForLoad(selectors.phoneInput, 20000);
  }

  /**
   * Check if error is shown
   */
  async hasError(timeout: number = 4000): Promise<boolean> {
    try {
      const errorMessage = await $(selectors.errorMessage);
      await errorMessage.waitForDisplayed({ timeout });
      return true;
    } catch {
      return false;
    }
  }
}
