// Expo's default Metro config (monorepo support included), with Sentry's
// additions so crash reports can be matched to source maps.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
