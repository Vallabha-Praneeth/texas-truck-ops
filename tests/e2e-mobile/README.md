# Appium E2E Tests for Mobile App

End-to-end tests for the LED Billboard Marketplace React Native mobile app using Appium and WebdriverIO.

## 📁 Structure

```
tests/e2e-mobile/
├── helpers/
│   ├── gestures.ts       # Common gestures (swipe, tap, etc.)
│   └── selectors.ts      # Platform-specific selectors
├── pages/
│   ├── BasePage.ts       # Base page object
│   ├── LoginPage.ts      # Login page object
│   └── DashboardPage.ts  # Dashboard page object
├── tests/
│   ├── auth.spec.ts      # Authentication tests
│   ├── dashboard.spec.ts # Dashboard tests
│   └── gestures.spec.ts  # Gesture interaction tests
├── wdio.conf.ts          # WebdriverIO configuration
├── scripts/
│   └── preflight-android.mjs  # Android SDK/APK/device checks
├── tsconfig.json
├── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

1. **Install Appium**
   ```bash
   npm install -g appium
   ```

2. **Install Appium Drivers**
   ```bash
   # iOS
   appium driver install xcuitest

   # Android
   appium driver install uiautomator2
   ```

3. **Setup iOS (macOS only)**
   - Install Xcode
   - Install Xcode Command Line Tools
   - Install ios-deploy: `brew install ios-deploy`

4. **Setup Android**
   - Install Android Studio
   - Setup Android SDK
   - Create an emulator or connect a device
   - Export SDK vars:
     ```bash
     export ANDROID_HOME="$HOME/Library/Android/sdk"
     export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
     ```

### Install Dependencies

```bash
cd tests/e2e-mobile
pnpm install
```

### Build the App

**iOS:**
```bash
cd apps/mobile
npx expo prebuild --platform ios
cd ios
xcodebuild -workspace LEDBillboard.xcworkspace \
  -scheme LEDBillboard \
  -configuration Debug \
  -sdk iphonesimulator \
  -derivedDataPath build
```

**Android:**
```bash
cd apps/mobile
pnpm exec expo prebuild --platform android
cd android
./gradlew assembleDebug
```
If prebuild fails with `ENOTFOUND registry.npmjs.org`, restore network/proxy access or use a local Expo template tarball.

### Run Tests

**iOS:**
```bash
# From project root
pnpm test:e2e:mobile:ios

# Or from tests/e2e-mobile
pnpm test:ios
```

**Android:**
```bash
# In one terminal (Metro, pinned to 8082)
pnpm --filter @led-billboard/mobile dev

# In another terminal (API test mode)
./start-api.sh

# From project root
pnpm test:e2e:mobile:android

# Or from tests/e2e-mobile
pnpm test:android
```

`test:android` now runs a preflight check before WDIO:
- Android SDK path is available
- Debug APK exists at `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`
- At least one Android emulator/device is connected
- `adb reverse tcp:<api-port> tcp:<api-port>` is configured for emulator -> host API access (default `8081`)
- `adb reverse tcp:<metro-port> tcp:<metro-port>` is configured for emulator -> host Metro access (default `8082`)
- API health is reachable at `http://localhost:8081/api/health` (override with `MOBILE_API_HEALTH_URL`)
- Metro status is reachable at `http://localhost:8082/status` (override with `MOBILE_METRO_PORT`)

**Run Specific Test:**
```bash
pnpm test:ios -- --spec tests/auth.spec.ts
```

## 📝 Writing Tests

### Page Object Model

Use Page Objects for clean, maintainable tests:

```typescript
import { DashboardPage } from '../pages/DashboardPage';

describe('My Test', () => {
  let dashboardPage: DashboardPage;

  before(async () => {
    dashboardPage = new DashboardPage();
    await dashboardPage.waitForLoad();
  });

  it('should display slots', async () => {
    const count = await dashboardPage.getSlotCount();
    expect(count).toBeGreaterThan(0);
  });
});
```

### Using Gestures

```typescript
import { swipeDown, swipeUp, tap, longPress } from '../helpers/gestures';

it('should pull to refresh', async () => {
  await swipeDown(300);
  await driver.pause(1000);
});

it('should scroll', async () => {
  await swipeUp(200);
});
```

### Platform-Specific Selectors

```typescript
import { selector, accessibilityId, text } from '../helpers/selectors';

// Cross-platform
const button = await $(accessibilityId('my-button'));

// Platform-specific
const element = await $(selector(
  '-ios predicate string:label == "Submit"',  // iOS
  'android=new UiSelector().text("Submit")'   // Android
));
```

## 🧪 Test Scenarios

### ✅ Authentication (`auth.spec.ts`)
- Display login screen
- Validate phone format
- Send OTP
- Complete login
- Reject invalid OTP

### ✅ Dashboard (`dashboard.spec.ts`)
- Display dashboard
- Show KPI cards
- Show availability slots
- Navigate to slot detail
- Add new slot
- Pull to refresh
- Notifications

### ✅ Gestures (`gestures.spec.ts`)
- Pull to refresh
- Swipe navigation
- Long press
- Tap interactions

## 🔧 Configuration

### Environment Variables

Create a `.env` file in `tests/e2e-mobile/`:

```bash
# iOS
IOS_APP_PATH=../../apps/mobile/ios/build/Build/Products/Debug-iphonesimulator/LEDBillboard.app

# Android
ANDROID_APP_PATH=../../apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
ANDROID_PLATFORM_VERSION=15  # optional; leave unset to auto-target connected device
ANDROID_UDID=emulator-5554   # optional
MOBILE_API_HEALTH_URL=http://localhost:8081/api/health  # optional
MOBILE_METRO_PORT=8082                                  # optional

# Appium Server
APPIUM_HOST=localhost
APPIUM_PORT=4723
```

### Device Configuration

Edit `wdio.conf.ts` to change device settings:

```typescript
// iOS
'appium:deviceName': 'iPhone 14',
'appium:platformVersion': '16.0',

// Android
'appium:deviceName': 'Pixel_5_API_33',
'appium:platformVersion': '13',
```

## 📱 Running on Real Devices

### iOS Real Device

1. **Configure provisioning profile**
2. **Update wdio.conf.ts:**
   ```typescript
   'appium:udid': 'YOUR-DEVICE-UDID',
   'appium:xcodeOrgId': 'YOUR-ORG-ID',
   'appium:xcodeSigningId': 'iPhone Developer',
   ```

### Android Real Device

1. **Enable USB debugging**
2. **Connect device via USB**
3. **Get device ID:** `adb devices`
4. **Update wdio.conf.ts:**
   ```typescript
   'appium:udid': 'YOUR-DEVICE-ID',
   ```

## 🐛 Debugging

### Start Appium Manually

```bash
# Start Appium server
appium --relaxed-security

# In another terminal, run tests
pnpm test:ios
```

### Appium Inspector

1. **Install:** `npm install -g appium-inspector`
2. **Run:** `appium-inspector`
3. **Connect to your device/simulator**
4. **Inspect elements and test selectors**

### View Logs

```bash
# iOS
tail -f appium.log

# Android
adb logcat | grep -i appium
```

### Screenshots

Failed tests automatically capture screenshots to `./screenshots/`

## 🏃 CI/CD Integration

### GitHub Actions Example

```yaml
name: Mobile E2E Tests

on: [push, pull_request]

jobs:
  test-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: pnpm install

      - name: Build iOS app
        run: |
          cd apps/mobile
          npx expo prebuild --platform ios
          cd ios
          xcodebuild -workspace LEDBillboard.xcworkspace \
            -scheme LEDBillboard \
            -configuration Debug \
            -sdk iphonesimulator \
            -derivedDataPath build

      - name: Install Appium
        run: |
          npm install -g appium
          appium driver install xcuitest

      - name: Run tests
        run: pnpm test:e2e:mobile:ios

  test-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2

      - name: Setup Android SDK
        uses: android-actions/setup-android@v2

      - name: Build Android app
        run: |
          cd apps/mobile
          npx expo prebuild --platform android
          cd android
          ./gradlew assembleDebug

      - name: Install Appium
        run: |
          npm install -g appium
          appium driver install uiautomator2

      - name: Run tests
        run: pnpm test:e2e:mobile:android
```

## 📊 Best Practices

1. **Use testID Prop** - Add `testID` to React Native components
   ```tsx
   <View testID="my-component">
   ```

2. **Avoid Hardcoded Waits** - Use `waitForDisplayed()` instead
   ```typescript
   await element.waitForDisplayed({ timeout: 5000 });
   ```

3. **Keep Tests Independent** - Each test should be runnable in isolation

4. **Use Page Objects** - Encapsulate screen interactions

5. **Test on Both Platforms** - iOS and Android may behave differently

6. **Clean State** - Reset app state between tests if needed
   ```typescript
   'appium:noReset': false, // Reset app before each session
   ```

## 🔗 Resources

- [Appium Docs](https://appium.io/docs/en/latest/)
- [WebdriverIO Docs](https://webdriver.io/)
- [Appium Inspector](https://github.com/appium/appium-inspector)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)

## 🆘 Troubleshooting

### "Could not find device"
- Check simulator/emulator is running
- Verify device name matches config

### "App not installed"
- Rebuild the app
- Check app path is correct
- Ensure build succeeded

### "Element not found"
- Use Appium Inspector to verify selector
- Add testID to React Native component
- Increase timeout

### "Connection refused"
- Check Appium server is running
- Verify port is not in use
- Check firewall settings
