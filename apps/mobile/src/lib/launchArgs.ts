/**
 * Thin wrapper around the RNLaunchArguments native module.
 *
 * iOS launch arguments passed as -UI_TEST_<KEY> <value> pairs are exposed as
 * read-only constants in NativeModules.RNLaunchArguments.  This file extracts
 * the values we care about so the rest of the app can import a typed constant
 * rather than reaching into NativeModules directly.
 *
 * On platforms / environments where the native module is absent (e.g. during
 * unit tests or when the module has not been linked yet) every export is
 * undefined, which is the safe no-op default.
 */
import { NativeModules } from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const args: Record<string, string> = (NativeModules.RNLaunchArguments as any) ?? {};

/** When "YES", clear any stored session on startup so the app launches logged out. */
export const UI_TEST_RESET_SESSION: string | undefined = args['UI_TEST_RESET_SESSION'];

/** Pre-fill the phone number field with these 10 digits (no country code). */
export const UI_TEST_PHONE_DIGITS: string | undefined = args['UI_TEST_PHONE_DIGITS'];

/** Pre-fill the OTP code field (used by the local-auth E2E lane). */
export const UI_TEST_OTP_CODE: string | undefined = args['UI_TEST_OTP_CODE'];

/**
 * When "YES", tapping "Send OTP" immediately transitions to the OTP-entry
 * screen without making a real network call.
 */
export const UI_TEST_BYPASS_SEND_OTP: string | undefined = args['UI_TEST_BYPASS_SEND_OTP'];

/** Pre-fill the username / email field in password-login mode. */
export const UI_TEST_USERNAME: string | undefined = args['UI_TEST_USERNAME'];

/** Pre-fill the password field in password-login mode. */
export const UI_TEST_PASSWORD: string | undefined = args['UI_TEST_PASSWORD'];

/**
 * When "YES", any auth attempt (OTP verify or password login) immediately
 * succeeds with a hardcoded fake operator session — no real API calls made.
 */
export const UI_TEST_FAKE_AUTH: string | undefined = args['UI_TEST_FAKE_AUTH'];

/**
 * When "YES", the operator dashboard permanently shows an error state even if
 * the API calls succeed.  Used by LocalAuthE2E tests to exercise error UI
 * without needing the API to fail.
 */
export const UI_TEST_FORCE_DASHBOARD_ERROR: string | undefined =
  args['UI_TEST_FORCE_DASHBOARD_ERROR'];

/**
 * When "YES", the operator dashboard shows an error state on the first render,
 * then recovers after the user taps Retry.  Used by LocalAuthE2E tests to
 * verify that the retry flow works correctly.
 */
export const UI_TEST_FORCE_DASHBOARD_ERROR_ONCE: string | undefined =
  args['UI_TEST_FORCE_DASHBOARD_ERROR_ONCE'];
