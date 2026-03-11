import { LoginPage } from '../pages/LoginPage';

describe('Authentication Flow', () => {
  let loginPage: LoginPage;

  beforeEach(async () => {
    loginPage = new LoginPage();
    await loginPage.ensureOnAuthScreen();
  });

  it('should display login screen', async () => {
    const phoneInput = await loginPage.getByTestId('phone-input');
    await expect(phoneInput).toBeDisplayed();

    const sendButton = await loginPage.getByTestId('send-otp-button');
    await expect(sendButton).toBeDisplayed();
  });

  it('should validate phone number format', async () => {
    await loginPage.enterPhone('+123');
    await loginPage.clickSendOtp();

    // Invalid phone should keep user on the phone-entry screen.
    const otpInput = await loginPage.getByTestId('otp-input');
    const movedToOtp = await otpInput.isDisplayed().catch(() => false);
    expect(movedToOtp).toBe(false);

    const phoneInput = await loginPage.getByTestId('phone-input');
    await expect(phoneInput).toBeDisplayed();
  });

  it('should move to OTP screen for a valid phone number', async () => {
    await loginPage.enterPhone('+15551234567');
    await loginPage.clickSendOtp();

    const otpInput = await loginPage.getByTestId('otp-input');
    await otpInput.waitForDisplayed({ timeout: 15000 });
  });
});
