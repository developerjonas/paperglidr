/** The production site (and its /api/v1). The canonical host: chiyali.com redirects here. */
const PRODUCTION_URL = 'https://www.chiyali.com';

/**
 * Where the web app (and its /api/v1) lives: production, unless
 * EXPO_PUBLIC_API_URL says otherwise — in dev builds and release builds
 * alike. To run against a local `pnpm dev`, set it to your computer's LAN
 * address, e.g. EXPO_PUBLIC_API_URL=http://192.168.1.10:3000 (a phone can't
 * reach "localhost"). Metro caches it: restart with `npx expo start --clear`.
 *
 * Always the canonical host: a redirect (chiyali.com → www) can drop the
 * Authorization header, which signs the user out of every request.
 */
function resolveApiUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  return (fromEnv || PRODUCTION_URL).replace(/\/+$/, '');
}

export const API_URL = resolveApiUrl();
