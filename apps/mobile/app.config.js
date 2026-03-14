// Dynamic Expo config — wraps app.json and overrides extra.apiUrl so that
// production release builds can point to a real backend via EXPO_PUBLIC_API_URL.
//
// Local dev:  falls back to the value in app.json (http://localhost:8081/api)
// CI release: set EXPO_PUBLIC_API_URL as a GitHub Secret (or env var)

const baseConfig = require('./app.json');

module.exports = {
  ...baseConfig,
  expo: {
    ...baseConfig.expo,
    extra: {
      ...baseConfig.expo.extra,
      apiUrl: process.env.EXPO_PUBLIC_API_URL || baseConfig.expo.extra.apiUrl,
    },
  },
};
