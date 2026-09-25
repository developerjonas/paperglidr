import Constants from 'expo-constants';

const PRODUCTION_URL = 'https://chiyali.com';
const DEV_WEB_PORT = 3000;

/**
 * Where the web app (and its /api/v1) lives.
 *
 * 1. EXPO_PUBLIC_API_URL, if set (e.g. a staging URL, or a tunnel).
 * 2. In development: the web dev server on the same machine as the Expo dev
 *    server — its LAN address comes from the Expo host, so a real phone on
 *    the same Wi-Fi reaches `pnpm dev` without any config.
 * 3. Otherwise: production.
 */
function resolveApiUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  if (__DEV__) {
    const host = Constants.expoConfig?.hostUri?.split(':')[0];
    if (host) return `http://${host}:${DEV_WEB_PORT}`;
    return `http://localhost:${DEV_WEB_PORT}`;
  }
  return PRODUCTION_URL;
}

export const API_URL = resolveApiUrl();
