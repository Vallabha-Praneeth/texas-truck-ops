import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const cwd = process.cwd();
const defaultApiHealthUrl = 'http://localhost:8081/api/health';
const defaultMetroPort = '8082';
const metroBundlePath =
  '/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&lazy=true&minify=false&app=com.ledbillboard.marketplace&modulesOnly=false&runModule=true';

const appPath = path.resolve(
  cwd,
  process.env.IOS_APP_PATH ||
    '../../apps/mobile/ios/build/Build/Products/Debug-iphonesimulator/LEDBillboardMarketplace.app'
);
const apiHealthUrl = process.env.MOBILE_API_HEALTH_URL || defaultApiHealthUrl;
const metroPort = process.env.MOBILE_METRO_PORT || defaultMetroPort;

const errors = [];

if (!existsSync(appPath)) {
  errors.push(
    [
      `iOS app bundle not found: ${appPath}`,
      'Build it with:',
      '  cd apps/mobile',
      '  pnpm exec expo prebuild --platform ios',
      '  cd ios',
      '  xcodebuild -workspace LEDBillboardMarketplace.xcworkspace \\',
      '    -scheme LEDBillboardMarketplace \\',
      '    -configuration Debug \\',
      '    -sdk iphonesimulator \\',
      '    -derivedDataPath build',
    ].join('\n')
  );
}

const xcrunCheck = spawnSync('xcrun', ['simctl', 'list', 'devices', 'available'], {
  encoding: 'utf8',
});

if (xcrunCheck.status !== 0) {
  errors.push(
    [
      'Unable to query iOS simulators using xcrun.',
      'Install Xcode + command line tools and ensure simulators are available.',
      xcrunCheck.stderr || xcrunCheck.stdout,
    ].join('\n')
  );
}

if (errors.length > 0) {
  console.error('\n[preflight] iOS E2E setup is incomplete:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error('');
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

  const minBundleBytes = 1000;
  if (body.length < minBundleBytes) {
    console.error(
      `\n[preflight] Metro bundle response is suspiciously small (${body.length} bytes < ${minBundleBytes}).\n` +
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

console.log(`[preflight] iOS app: ${appPath}`);
console.log(`[preflight] API health: ${apiHealthUrl}`);
console.log(`[preflight] Metro status: http://localhost:${metroPort}/status`);
console.log(
  `[preflight] Metro bundle: http://localhost:${metroPort}${metroBundlePath}`
);
