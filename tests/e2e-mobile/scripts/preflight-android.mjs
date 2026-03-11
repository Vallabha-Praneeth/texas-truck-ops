import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import path from 'node:path';
import process from 'node:process';

const cwd = process.cwd();
const defaultSdkPath = path.join(homedir(), 'Library/Android/sdk');
const defaultApiHealthUrl = 'http://localhost:8081/api/health';
const defaultMetroPort = '8082';
const metroBundlePath =
  '/.expo/.virtual-metro-entry.bundle?platform=android&dev=true&lazy=true&minify=false&app=com.ledbillboard.marketplace&modulesOnly=false&runModule=true';

const sdkPath =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  (existsSync(defaultSdkPath) ? defaultSdkPath : '');

const appPath = path.resolve(
  cwd,
  process.env.ANDROID_APP_PATH ||
  '../../apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk'
);

const apiHealthUrl = process.env.MOBILE_API_HEALTH_URL || defaultApiHealthUrl;
const metroPort = process.env.MOBILE_METRO_PORT || defaultMetroPort;

let apiPort = '8081';
try {
  apiPort = String(new URL(apiHealthUrl).port || '80');
} catch {
  // Keep default API port when URL parsing fails.
}

const errors = [];

if (!sdkPath) {
  errors.push(
    'Android SDK path not found. Set ANDROID_HOME or ANDROID_SDK_ROOT.'
  );
}

const adbPath = sdkPath ? path.join(sdkPath, 'platform-tools/adb') : '';
if (sdkPath && !existsSync(adbPath)) {
  errors.push(`adb not found at expected path: ${adbPath}`);
}

if (!existsSync(appPath)) {
  errors.push(
    [
      `Android APK not found: ${appPath}`,
      'Build it with:',
      '  cd apps/mobile/android && ./gradlew assembleDebug',
    ].join('\n')
  );
}

if (errors.length > 0) {
  console.error('\n[preflight] Android E2E setup is incomplete:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error('');
  process.exit(1);
}

const env = {
  ...process.env,
  ANDROID_HOME: process.env.ANDROID_HOME || sdkPath,
  ANDROID_SDK_ROOT: process.env.ANDROID_SDK_ROOT || sdkPath,
};

const adbDevices = spawnSync(adbPath, ['devices'], {
  encoding: 'utf8',
  env,
});

if (adbDevices.status !== 0) {
  console.error('\n[preflight] Unable to query devices via adb.\n');
  console.error(adbDevices.stderr || adbDevices.stdout);
  process.exit(1);
}

const connectedDevices = adbDevices.stdout
  .split('\n')
  .map((line) => line.trim())
  .filter(
    (line) =>
      line && !line.startsWith('List of devices') && /\s+device$/.test(line)
  )
  .map((line) => line.split(/\s+/)[0]);

if (connectedDevices.length === 0) {
  const emulatorPath = path.join(sdkPath, 'emulator', 'emulator');
  console.error(
    '\n[preflight] No connected Android emulator/device detected.\n'
  );
  if (existsSync(emulatorPath)) {
    const avdList = spawnSync(emulatorPath, ['-list-avds'], {
      encoding: 'utf8',
    });
    if (avdList.status === 0 && avdList.stdout.trim().length > 0) {
      console.error('Available AVDs:');
      for (const avd of avdList.stdout.split('\n').filter(Boolean)) {
        console.error(`- ${avd}`);
      }
      const firstAvd = avdList.stdout.split('\n').find((line) => line.trim());
      if (firstAvd) {
        console.error('\nStart one with:');
        console.error(
          `  ${emulatorPath} -avd ${firstAvd.trim()} -netdelay none -netspeed full`
        );
      }
    }
  }
  console.error(
    `\nThen wait for boot:\n  ${adbPath} wait-for-device\n  ${adbPath} devices`
  );
  console.error('');
  process.exit(1);
}

// Ensure emulator localhost can reach host API localhost:${apiPort}.
const adbReverse = spawnSync(
  adbPath,
  ['reverse', `tcp:${apiPort}`, `tcp:${apiPort}`],
  {
    encoding: 'utf8',
    env,
  }
);

if (adbReverse.status !== 0) {
  console.error(
    `\n[preflight] Failed to configure adb reverse tcp:${apiPort} -> tcp:${apiPort}.\n`
  );
  console.error(adbReverse.stderr || adbReverse.stdout);
  process.exit(1);
}

// Ensure emulator localhost can reach host Metro dev server localhost:${metroPort}.
const adbReverseMetro = spawnSync(
  adbPath,
  ['reverse', `tcp:${metroPort}`, `tcp:${metroPort}`],
  {
    encoding: 'utf8',
    env,
  }
);

if (adbReverseMetro.status !== 0) {
  console.error(
    `\n[preflight] Failed to configure adb reverse tcp:${metroPort} -> tcp:${metroPort}.\n`
  );
  console.error(adbReverseMetro.stderr || adbReverseMetro.stdout);
  process.exit(1);
}

try {
  const response = await fetch(apiHealthUrl, { method: 'GET' });
  if (!response.ok) {
    console.error(
      `\n[preflight] API health check failed at ${apiHealthUrl} (status: ${response.status}).\n`
    );
    console.error('Start API in test mode first:');
    console.error('  ./start-api.sh');
    console.error('');
    process.exit(1);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n[preflight] API health check failed at ${apiHealthUrl}.\n`);
  console.error(`Reason: ${message}`);
  console.error('Start API in test mode first:');
  console.error('  ./start-api.sh');
  console.error('');
  process.exit(1);
}

try {
  const metroStatusUrl = `http://localhost:${metroPort}/status`;
  const metroResponse = await fetch(metroStatusUrl, {
    method: 'GET',
  });
  const metroStatus = metroResponse.ok ? await metroResponse.text() : '';
  if (!metroResponse.ok || !metroStatus.includes('packager-status:running')) {
    console.error(`\n[preflight] Metro is not running at ${metroStatusUrl}.\n`);
    console.error('Start Metro first:');
    console.error('  pnpm --filter @led-billboard/mobile dev');
    console.error('');
    process.exit(1);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    `\n[preflight] Metro status check failed at http://localhost:${metroPort}/status.\n`
  );
  console.error(`Reason: ${message}`);
  console.error('Start Metro first:');
  console.error('  pnpm --filter @led-billboard/mobile dev');
  console.error('');
  process.exit(1);
}

try {
  const metroBundleUrl = `http://localhost:${metroPort}${metroBundlePath}`;
  const bundleResponse = await fetch(metroBundleUrl, {
    method: 'GET',
  });

  const body = await bundleResponse.text();

  if (!bundleResponse.ok) {
    console.error(
      `\n[preflight] Metro bundle endpoint failed at ${metroBundleUrl} (status: ${bundleResponse.status}).\n`
    );
    console.error('Bundle error response (first 400 chars):');
    console.error(body.slice(0, 400));
    console.error('');
    process.exit(1);
  }

  // A 200 response with a tiny body means Metro returned an error page instead
  // of a real JS bundle (which will always be several hundred kB).
  const MIN_BUNDLE_BYTES = 1000;
  if (body.length < MIN_BUNDLE_BYTES) {
    console.error(
      `\n[preflight] Metro bundle response is suspiciously small (${body.length} bytes < ${MIN_BUNDLE_BYTES}).\n` +
      'Metro likely returned an error page instead of a real bundle.\n'
    );
    console.error('First 400 chars of response:');
    console.error(body.slice(0, 400));
    console.error('');
    console.error('Fix the Metro error above, then re-run preflight.');
    console.error('');
    process.exit(1);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    `\n[preflight] Metro bundle request failed at http://localhost:${metroPort}${metroBundlePath}.\n`
  );
  console.error(`Reason: ${message}`);
  console.error('');
  process.exit(1);
}

console.log(`[preflight] Android SDK: ${sdkPath}`);
console.log(`[preflight] Android app: ${appPath}`);
console.log(`[preflight] Connected devices: ${connectedDevices.join(', ')}`);
console.log(`[preflight] adb reverse: tcp:${apiPort} -> tcp:${apiPort}`);
console.log(`[preflight] adb reverse: tcp:${metroPort} -> tcp:${metroPort}`);
console.log(`[preflight] API health: ${apiHealthUrl}`);
console.log(`[preflight] Metro status: http://localhost:${metroPort}/status`);
console.log(
  `[preflight] Metro bundle: http://localhost:${metroPort}${metroBundlePath}`
);
