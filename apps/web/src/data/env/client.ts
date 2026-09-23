import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

// Public variables — inlined into the client bundle at build time, so each
// must be listed in turbo.json build.env or it is stripped (strict env mode).
// Safe to import from both server and client code.
export const env = createEnv({
  client: {
    // Public URL of this web app, e.g. https://app.paperglidr.com (no trailing slash)
    NEXT_PUBLIC_APP_URL: z.string().url(),
    // Better Auth endpoint the browser talks to — normally the same as NEXT_PUBLIC_APP_URL
    NEXT_PUBLIC_BETTER_AUTH_URL: z.string().url(),
    // Marketing/legal site, e.g. https://paperglidr.com
    NEXT_PUBLIC_LANDING_URL: z.string().url(),
  },
  // Next.js only inlines NEXT_PUBLIC_* when referenced literally
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    NEXT_PUBLIC_LANDING_URL: process.env.NEXT_PUBLIC_LANDING_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
