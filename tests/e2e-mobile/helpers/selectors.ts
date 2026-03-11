/**
 * Platform-specific selectors
 */

const isIOS = driver.isIOS;
const isAndroid = driver.isAndroid;

/**
 * Get selector for iOS or Android
 */
export function selector(ios: string, android: string): string {
  return isIOS ? ios : android;
}

/**
 * Get accessibility ID (testID in React Native)
 */
export function accessibilityId(id: string): string {
  return `~${id}`;
}

/**
 * Get text selector
 */
export function text(text: string): string {
  if (isIOS) {
    return `-ios predicate string:label == "${text}" OR name == "${text}" OR value == "${text}"`;
  }
  return `android=new UiSelector().text("${text}")`;
}

/**
 * Get contains text selector
 */
export function containsText(text: string): string {
  if (isIOS) {
    return `-ios predicate string:label CONTAINS "${text}" OR name CONTAINS "${text}" OR value CONTAINS "${text}"`;
  }
  return `android=new UiSelector().textContains("${text}")`;
}

/**
 * Get class name selector
 */
export function className(name: string): string {
  if (isIOS) {
    return `-ios class chain:**/${name}`;
  }
  return `android=new UiSelector().className("${name}")`;
}

/**
 * Common element selectors for the app
 */
export const selectors = {
  // Auth screens
  phoneInput: accessibilityId('phone-input'),
  sendOtpButton: accessibilityId('send-otp-button'),
  otpInput: accessibilityId('otp-input'),
  verifyButton: accessibilityId('verify-button'),

  // Dashboard
  dashboard: accessibilityId('operator-dashboard'),
  dashboardReady: accessibilityId('operator-dashboard-ready'),
  dashboardLoading: accessibilityId('operator-dashboard-loading'),
  kpiCard: accessibilityId('kpi-card'),
  slotCard: accessibilityId('slot-card'),
  addSlotButton: accessibilityId('add-slot-button'),
  notificationBadge: accessibilityId('notification-badge'),

  // Slots
  slotList: accessibilityId('slot-list'),
  slotDetail: accessibilityId('slot-detail'),
  createSlotForm: accessibilityId('create-slot-form'),

  // Common
  backButton: isIOS
    ? '-ios predicate string:name == "Back"'
    : 'android=new UiSelector().description("Navigate up")',
  loadingSpinner: accessibilityId('loading-spinner'),
  errorMessage: accessibilityId('error-message'),
};
