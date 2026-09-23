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
    // Extra next/image hosts for creator-supplied product/instructor images,
    // comma-separated hostnames. Consumed by src/lib/imageHosts.ts (which
    // reads process.env directly so next.config.ts can use it); declared
    // here so a malformed value fails validation.
    NEXT_PUBLIC_IMAGE_HOSTS: z
      .string()
      .optional()
      .refine(
        value =>
          value == null ||
          value
            .split(",")
            .map(host => host.trim())
            .filter(Boolean)
            .every(host => /^[a-z0-9.-]+$/i.test(host)),
        "Comma-separated hostnames only, e.g. images.paperglidr.com,res.cloudinary.com",
      ),
  },
  // Next.js only inlines NEXT_PUBLIC_* when referenced literally
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    NEXT_PUBLIC_IMAGE_HOSTS: process.env.NEXT_PUBLIC_IMAGE_HOSTS,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
