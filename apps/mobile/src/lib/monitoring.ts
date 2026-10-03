import * as Sentry from '@sentry/react-native';

/**
 * Crash and error reporting to GlitchTip (project "Chiyali Expo App"),
 * which speaks Sentry's protocol. On only when EXPO_PUBLIC_SENTRY_DSN is
 * set, which eas.json does for preview and production builds; local
 * development reports nothing.
 *
 * GlitchTip has no release-health sessions, so session tracking is off.
 * No personal data is attached: no IP, no user, no request headers.
 */
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? (__DEV__ ? 'development' : 'production'),
  enableAutoSessionTracking: false,
  // Errors only; no performance tracing.
  tracesSampleRate: 0,
  sendDefaultPii: false,
  beforeSend(event) {
    if (event.request) {
      delete event.request.headers;
      delete event.request.cookies;
      delete event.request.data;
    }
    return event;
  },
});

export { Sentry };
