import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    DB_PASSWORD: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_NAME: z.string().min(1),
    DB_HOST: z.string().min(1),
    CLERK_SECRET_KEY: z.string().min(1),
    CLERK_WEBHOOK_SECRET: z.string().min(1).optional(),
    ARCJET_KEY: z.string().min(1).optional(),
    TEST_IP_ADDRESS: z.string().min(1).optional(),
    STRIPE_PPP_50_COUPON_ID: z.string().min(1).optional(),
    STRIPE_PPP_40_COUPON_ID: z.string().min(1).optional(),
    STRIPE_PPP_30_COUPON_ID: z.string().min(1).optional(),
    STRIPE_PPP_20_COUPON_ID: z.string().min(1).optional(),
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  },
  // Pass runtimeEnv explicitly for server environments
  runtimeEnv: {
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME,
    DB_HOST: process.env.DB_HOST,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    ARCJET_KEY: process.env.ARCJET_KEY,
    TEST_IP_ADDRESS: process.env.TEST_IP_ADDRESS,
    STRIPE_PPP_50_COUPON_ID: process.env.STRIPE_PPP_50_COUPON_ID,
    STRIPE_PPP_40_COUPON_ID: process.env.STRIPE_PPP_40_COUPON_ID,
    STRIPE_PPP_30_COUPON_ID: process.env.STRIPE_PPP_30_COUPON_ID,
    STRIPE_PPP_20_COUPON_ID: process.env.STRIPE_PPP_20_COUPON_ID,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  },
  // Allows skipping validation during build steps if needed:
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
