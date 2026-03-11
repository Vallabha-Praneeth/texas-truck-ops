import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { Options } from '@wdio/types';

const repoRoot = path.resolve(process.cwd(), '../..');
const defaultAndroidSdkPath = path.join(os.homedir(), 'Library/Android/sdk');
const defaultIosAppPath = path.resolve(
  repoRoot,
  'apps/mobile/ios/build/Build/Products/Debug-iphonesimulator/LEDBillboardMarketplace.app'
);
const defaultAndroidAppPath = path.resolve(
  repoRoot,
  'apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk'
);
const appiumHost = process.env.APPIUM_HOST || '127.0.0.1';
const appiumPort = Number.parseInt(process.env.APPIUM_PORT || '4723', 10);
const appiumPath = process.env.APPIUM_PATH || '/';
const androidUdid = process.env.ANDROID_UDID;
const androidPlatformVersion = process.env.ANDROID_PLATFORM_VERSION;
const iosDeviceName = process.env.IOS_DEVICE_NAME || 'iPhone 17 Pro';
const iosPlatformVersion = process.env.IOS_PLATFORM_VERSION || '26.2';
const iosMetroHost = process.env.IOS_METRO_HOST || '127.0.0.1';
const iosMetroPort = process.env.IOS_METRO_PORT || '8082';

if (!process.env.ANDROID_HOME && fs.existsSync(defaultAndroidSdkPath)) {
  process.env.ANDROID_HOME = defaultAndroidSdkPath;
}

if (!process.env.ANDROID_SDK_ROOT && fs.existsSync(defaultAndroidSdkPath)) {
  process.env.ANDROID_SDK_ROOT = defaultAndroidSdkPath;
}

const baseConfig = {
  //
  // ====================
  // Runner Configuration
  // ====================
  runner: 'local',

  //
  // ==================
  // Specify Test Files
  // ==================
  specs: ['./tests/**/*.spec.ts'],

  suites: {
    ios: ['./tests/**/*.spec.ts'],
    android: ['./tests/**/*.spec.ts'],
  },

  // Patterns to exclude
  exclude: [],

  //
  // ============
  // Capabilities
  // ============
  capabilities: [],

  //
  // ===================
  // Test Configurations
  // ===================
  logLevel: 'info',
  bail: 0,
  maxInstances: 1,
  hostname: appiumHost,
  port: appiumPort,
  path: appiumPath,
  protocol: 'http',
  waitforTimeout: 10000,
  // iOS first-session startup (WDA compile + simulator boot) can exceed 2 min.
  connectionRetryTimeout: 600000,
  connectionRetryCount: 3,

  services: [
    [
      'appium',
      {
        args: {
          address: appiumHost,
          port: appiumPort,
          basePath: appiumPath,
          relaxedSecurity: true,
        },
        logPath: './',
      },
    ],
  ],

  framework: 'mocha',
  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },

  //
  // =====
  // Hooks
  // =====
  beforeSession: function () {
    // Nothing needed here; RedBox detection is in before().
  },

  before: async function () {
    // --- RedBox / Metro bundle failure detection ---
    // After app launches, give Metro 5 s to either load the bundle or show a
    // crash screen. If a React Native RedBox ("Unable to resolve module …") is
    // visible we surface it immediately as an INFRA error instead of letting
    // every selector time-out silently for 45 s.
    await driver.pause(5000);

    let pageSource = '';
    try {
      pageSource = await driver.getPageSource();
    } catch {
      // If we can't get page source the session itself is broken; proceed and
      // let the test fail naturally with its own error.
      return;
    }

    const redBoxPatterns = [
      'Unable to resolve module',
      'RCTRedBox',
      'Application has not been registered',
      'Metro Bundler',
      'bundling failed',
    ];

    const matchedPattern = redBoxPatterns.find((p) => pageSource.includes(p));

    if (matchedPattern) {
      const artifactsDir = './artifacts';
      fs.mkdirSync(artifactsDir, { recursive: true });

      const ts = Date.now();
      const xmlPath = `${artifactsDir}/redbox-source-${ts}.xml`;
      const imgPath = `${artifactsDir}/redbox-screenshot-${ts}.png`;

      try {
        fs.writeFileSync(xmlPath, pageSource, 'utf8');
      } catch { /* ignore */ }

      try {
        await driver.saveScreenshot(imgPath);
      } catch { /* ignore */ }

      throw new Error(
        [
          `INFRA: React Native RedBox detected (matched: "${matchedPattern}").`,
          'Metro bundle failed to load – fix the bundle error before running tests.',
          `Page source saved to: ${xmlPath}`,
          `Screenshot saved to: ${imgPath}`,
        ].join('\n')
      );
    }
  },

  afterTest: async function (
    test: { title: string },
    _context: unknown,
    { passed }: { passed: boolean }
  ) {
    // Take screenshot on test failure
    if (!passed) {
      fs.mkdirSync('./screenshots', { recursive: true });
      await driver.saveScreenshot(
        `./screenshots/${test.title.replace(/ /g, '_')}.png`
      );
    }
  },
};

//
// =========
// iOS Setup
// =========
const iosConfig = {
  ...baseConfig,
  capabilities: [
    {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:deviceName': iosDeviceName,
      'appium:platformVersion': iosPlatformVersion,
      'appium:app': process.env.IOS_APP_PATH || defaultIosAppPath,
      'appium:noReset': false,
      'appium:newCommandTimeout': 240,
      // Keep WDA boot/session creation from timing out on cold-start.
      'appium:wdaLaunchTimeout': 240000,
      'appium:wdaConnectionTimeout': 240000,
      'appium:simulatorStartupTimeout': 300000,
      'appium:processArguments': {
        env: {
          RCT_METRO_HOST: iosMetroHost,
          RCT_METRO_PORT: iosMetroPort,
        },
      },
    },
  ],
};

//
// =============
// Android Setup
// =============
const androidConfig = {
  ...baseConfig,
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': 'Android Emulator',
      'appium:appPackage': 'com.ledbillboard.marketplace',
      'appium:appActivity': 'com.ledbillboard.marketplace.MainActivity',
      'appium:app': process.env.ANDROID_APP_PATH || defaultAndroidAppPath,
      'appium:noReset': false,
      // Ensure latest APK is always installed; avoids stale builds with old Metro config.
      'appium:enforceAppInstall': true,
      'appium:newCommandTimeout': 240,
      ...(androidPlatformVersion
        ? { 'appium:platformVersion': androidPlatformVersion }
        : {}),
      ...(androidUdid ? { 'appium:udid': androidUdid } : {}),
    },
  ],
};

// Export based on suite argument/environment.
const suiteArgIndex = process.argv.indexOf('--suite');
const suiteFromArg =
  suiteArgIndex >= 0 ? process.argv[suiteArgIndex + 1] : undefined;
const suite = process.env.SUITE || suiteFromArg || 'ios';

export const config = (
  suite === 'android' ? androidConfig : iosConfig
) as Options.Testrunner;
