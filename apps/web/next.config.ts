import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import { allowedImageHosts } from "./src/lib/imageHosts";

// Sent with every response. The CSP only restricts what can't break the
// site: no framing of Chiyali (clickjacking), no plugins, no <base>
// hijacking, https only. Scripts, frames and connections aren't
// allow-listed: YouTube, Bunny, eSewa and GlitchTip all load from
// elsewhere. Referrer: Bunny's referrer check needs the origin.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@repo/brand", "@repo/password-policy", "@repo/video-embeds"],
  experimental: {
    // dynamicIO: true,
    // authInterrupts: true,
    useCache: true,
  },
  // The link-preview images read Inter from the brand package at runtime.
  outputFileTracingIncludes: {
    "/**/opengraph-image*": ["../../packages/brand/fonts/*.ttf"],
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

// Sentry/GlitchTip (docs/SETUP.md, "Monitoring"). Everything is optional: with no DSN the
// SDK is never initialised, and with no SENTRY_AUTH_TOKEN source maps are
// not uploaded, so the app builds and runs with Sentry unset.
export default withSentryConfig(nextConfig, {
  // Error reporting goes to GlitchTip (Sentry-compatible): its URL, org
  // and project slugs, and an auth token for source map upload.
  sentryUrl: process.env.SENTRY_URL,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  silent: !process.env.CI,
  telemetry: false,
});
