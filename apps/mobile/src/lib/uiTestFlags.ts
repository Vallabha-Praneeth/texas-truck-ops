import { NativeModules, Settings } from 'react-native';

const truthyValues = new Set(['1', 'true', 'yes']);
const initialUiTestFlags: Record<string, unknown> = {};
const nativeUiTestFlags = (NativeModules.LEDUiTestFlags ??
  {}) as Record<string, unknown>;

export const initializeUiTestFlags = (
  values: Record<string, unknown> | null | undefined
): void => {
  Object.keys(initialUiTestFlags).forEach((key) => {
    delete initialUiTestFlags[key];
  });

  if (!values) {
    return;
  }

  Object.assign(initialUiTestFlags, values);
};

const readSetting = (key: string) => {
  if (key in initialUiTestFlags) {
    return initialUiTestFlags[key];
  }

  if (key in nativeUiTestFlags) {
    return nativeUiTestFlags[key];
  }

  return Settings.get(key);
};

export const getUiTestFlag = (key: string): boolean => {
  const value = readSetting(key);

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    return truthyValues.has(value.trim().toLowerCase());
  }

  return false;
};

export const getUiTestString = (key: string): string | null => {
  const value = readSetting(key);

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
};

export const getUiTestLane = (): string | null => {
  if (!__DEV__) {
    return null;
  }

  return getUiTestString('XCODE_TEST_LANE');
};

export const isUiTestResetSessionEnabled = (): boolean => {
  return __DEV__ && getUiTestFlag('UI_TEST_RESET_SESSION');
};

export const isUiTestFakeAuthEnabled = (): boolean => {
  return __DEV__ && getUiTestFlag('UI_TEST_FAKE_AUTH');
};

export const isUiTestBypassSendOtpEnabled = (): boolean => {
  return __DEV__ && getUiTestFlag('UI_TEST_BYPASS_SEND_OTP');
};

export const isUiTestForceDashboardErrorEnabled = (): boolean => {
  return __DEV__ && getUiTestFlag('UI_TEST_FORCE_DASHBOARD_ERROR');
};

export const isUiTestForceDashboardErrorOnceEnabled = (): boolean => {
  return __DEV__ && getUiTestFlag('UI_TEST_FORCE_DASHBOARD_ERROR_ONCE');
};

export const getUiTestPhoneDigits = (): string | null => {
  return __DEV__ ? getUiTestString('UI_TEST_PHONE_DIGITS') : null;
};

export const getUiTestOtpCode = (): string | null => {
  return __DEV__ ? getUiTestString('UI_TEST_OTP_CODE') : null;
};

export const getUiTestUsername = (): string | null => {
  return __DEV__ ? getUiTestString('UI_TEST_USERNAME') : null;
};

export const getUiTestPassword = (): string | null => {
  return __DEV__ ? getUiTestString('UI_TEST_PASSWORD') : null;
};
