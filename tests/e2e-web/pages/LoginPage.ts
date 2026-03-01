import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Login Page Object Model
 */
export class LoginPage extends BasePage {
  // Locators
  readonly phoneInput: Locator;
  readonly sendOtpButton: Locator;
  readonly otpInput: Locator;
  readonly verifyButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.phoneInput = page.getByLabel(/phone/i);
    this.sendOtpButton = page.getByRole('button', { name: /send otp/i });
    this.otpInput = page.getByLabel(/otp|code/i);
    this.verifyButton = page.getByRole('button', { name: /verify/i });
    this.errorMessage = page.getByTestId('error-message');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /**
   * Enter phone number
   */
  async enterPhone(phone: string): Promise<void> {
    await this.phoneInput.fill(phone);
  }

  /**
   * Click send OTP button
   */
  async clickSendOtp(): Promise<void> {
    await this.sendOtpButton.click();
  }

  /**
   * Enter OTP code
   */
  async enterOtp(otp: string): Promise<void> {
    await this.otpInput.fill(otp);
  }

  /**
   * Click verify button
   */
  async clickVerify(): Promise<void> {
    await this.verifyButton.click();
  }

  /**
   * Complete login flow
   */
  async login(phone: string, otp: string): Promise<void> {
    await this.enterPhone(phone);
    await this.clickSendOtp();
    await this.otpInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.enterOtp(otp);
    await Promise.all([
      this.page.waitForURL(/\/(operator|broker|driver)(\/.*)?$/, {
        timeout: 15000,
      }),
      this.clickVerify(),
    ]);
  }

  /**
   * Check if error is displayed
   */
  async hasError(): Promise<boolean> {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }
}
