import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import { allowedImageHosts } from "./src/lib/imageHosts";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@repo/password-policy", "@repo/video-embeds"],
  experimental: {
    // dynamicIO: true,
    // authInterrupts: true,
    useCache: true,
  },
  images: {
    // Only known hosts — "**" turned /_next/image into an open proxy.
    // Add hosts via NEXT_PUBLIC_IMAGE_HOSTS; see src/lib/imageHosts.ts.
    remotePatterns: allowedImageHosts.map(hostname => ({
      protocol: "https" as const,
      hostname,
    })),
  },
};

// Sentry (docs/OBSERVABILITY.md). Everything is optional: with no DSN the
// SDK is never initialised, and with no SENTRY_AUTH_TOKEN source maps are
// not uploaded, so the app builds and runs with Sentry unset.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  silent: !process.env.CI,
  telemetry: false,
});
