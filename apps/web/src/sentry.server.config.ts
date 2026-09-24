// Sentry for the Node.js server runtime. Loaded from instrumentation.ts.
import * as Sentry from "@sentry/nextjs"
import { sentryOptions } from "@/lib/sentryOptions"

if (process.env.SENTRY_DSN) Sentry.init(sentryOptions(process.env.SENTRY_DSN))
