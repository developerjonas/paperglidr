// apps/web/src/lib/auth.ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { db } from "@/drizzle/db"
import * as schema from "@/drizzle/schema"

export const auth = betterAuth({
  // The URL your auth server is reachable at. Must match exactly what
  // the browser sees (including https), or requests get rejected as
  // an untrusted origin.
  baseURL: process.env.BETTER_AUTH_URL!,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),

  advanced: {
    database: {
      generateId: "uuid",
    },
    // Lets the same login session work across app.paperglidr.com,
    // www.paperglidr.com, etc. Only turn this on in production —
    // it needs a real domain to attach the cookie to.
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV === "production",
      domain: ".paperglidr.com",
    },
  },

  // Every domain allowed to call this auth server. If a request's
  // Origin header isn't in this list, Better Auth blocks it with a 403 —
  // so every real domain you serve the app from must be listed here.
  trustedOrigins: [
    "paperglidr://", // mobile app deep link
    "https://paperglidr.com",
    "https://www.paperglidr.com",
    "https://app.paperglidr.com", // <-- was missing, likely cause of the 403s
  ],

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  // Basic abuse protection. Most routes get 20 requests/minute;
  // sign-in and OAuth callbacks are tighter since those are the
  // routes bots/attackers hit hardest.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    storage: "memory",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-in/social": { window: 60, max: 5 },
      "/callback/google": { window: 60, max: 5 },
      "/callback/github": { window: 60, max: 5 },
      "/get-session": { window: 60, max: 100 },
    },
  },

  plugins: [nextCookies()],
})

export type Auth = typeof auth
export type Session = typeof auth.$Infer.Session
