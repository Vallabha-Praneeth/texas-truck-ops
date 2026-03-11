const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const reactPath = path.dirname(require.resolve('react/package.json'));
const reactNativePath = path.dirname(require.resolve('react-native/package.json'));
const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  axios: path.resolve(projectRoot, 'node_modules/axios/dist/browser/axios.cjs'),
  react: reactPath,
  'react/jsx-runtime': path.join(reactPath, 'jsx-runtime.js'),
  'react/jsx-dev-runtime': path.join(reactPath, 'jsx-dev-runtime.js'),
  'react-native': reactNativePath,
};
// Keep hierarchical lookup enabled for pnpm's nested .pnpm/node_modules layout.
config.resolver.disableHierarchicalLookup = false;
// Metro 0.80 + Expo SDK 50 can pick Node export conditions for some packages
// (for example axios), which breaks React Native bundles.
config.resolver.unstable_enablePackageExports = false;
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
