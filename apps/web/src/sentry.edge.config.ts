// Sentry for the edge runtime (middleware). Loaded from instrumentation.ts.
import * as Sentry from "@sentry/nextjs"
import { sentryOptions } from "@/lib/sentryOptions"

if (process.env.SENTRY_DSN) Sentry.init(sentryOptions(process.env.SENTRY_DSN))
