import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

// Database connection only — kept separate from ./server.ts so tooling
// (drizzle-kit migrate, the seed script) can run with just the DB_* vars
// instead of the whole app environment.
export const env = createEnv({
  server: {
    DB_PASSWORD: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_NAME: z.string().min(1),
    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().positive().default(5432),
    // "false" for local Postgres without TLS; defaults to true (keep it on in production)
    DB_SSL: z
      .enum(["true", "false"])
      .default("true")
      .transform(value => value === "true"),
  },
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
